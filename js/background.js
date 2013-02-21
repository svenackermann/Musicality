//Much of this code taken from here: https://code.google.com/p/music-beta-controller/  
//This implementation by Kyle Kamperschroer

var playing = false;
var able_to_play = false;
var repeat = false;
var repeat_1 = false;
var shuffle = false;
var thumbs_up = false;
var thumbs_down = false;

//Grabbed from music-beta-controller source
//Special thanks to Brad Lambeth for doing this!
function FindMusicBetaTab(callback) {
    chrome.windows.getAll({populate: true}, function(windows) {
    var pattern = 'https?\:\/\/play\.google\.com\/music\/listen.*';
    for (var window = 0; window < windows.length; window++) {
        for (var i = 0; i < windows[window].tabs.length; i++) {
            if (windows[window].tabs[i].url.match(pattern)) {
                callback(windows[window].tabs[i].id)
                return;
            }
        }
    }
    callback(null);
    });
}

// Send the given command to a tab showing Music Beta,
// or open one if non exists.
function sendCommand(command, divID) { //using divID was for thumbsUp and down stuff. Not currently used...
    FindMusicBetaTab(function(tab_id) {
        if (tab_id) {
          if (command == "foreground") {
            chrome.tabs.update(tab_id, {selected: true});
          } else {
            var div = null;
            if(divID){
                console.log("Doing special request...", divID);
                chrome.tabs.sendRequest(tab_id, {div: divID, cmd: command}, function(response){
                    //Ignore the response. SJBPost should have been done in contentscript
                });
            //chrome.tabs.sendRequest(tab_id, {click: command}, null);
            }else{
                chrome.tabs.executeScript(tab_id,
                    {
                      code: "location.assign('javascript:SJBpost(\"" + command +
                            "\", " + div + ");void 0');",
                      allFrames: true
                    });
            }
          }
        } else {
          chrome.tabs.create({url: 'https://play.google.com/music/listen',
                              selected: true});
        }
    });
    updateInformation(); //Update our information
}

// Update the Browser Action based on the provided Play/Pause/Other state.
function UpdateIcon(state) {
    if(playing == true && state == "Pause")
        return; //State hasn't changed. Who cares...
    if(playing == false && state == "Play")
        return; //Again, we don't care. No need to change images.

    if (state == "Pause"){
        $("#play_pause").attr("class", "pause");
        playing = true;
        //chrome.browserAction.setIcon({path: "pause-19x19.png"});
    }else if (state == "Play"){
        $("#play_pause").attr("class", "play");
        playing = false;
        //chrome.browserAction.setIcon({path: "play-19x19.png"});
    }else{
        $("#play_pause").attr("class", "pause");
        playing = true;
        //chrome.browserAction.setIcon({path: "logo-19x19.png"});
    }
}

function UpdateShuffle(state){
    if(state == "On"){
        shuffle = true;
        $("#shuffle_button").attr("class", "shuffle_on");
    }else{
        shuffle = false;
        $("#shuffle_button").attr("class", "shuffle_off");
    }
}

function UpdateRepeat(state){
    if(state == "All"){
        repeat = true;
        repeat_1 = false;
        $("#repeat_button").attr("class", "repeat_all");
    }else if(state == "One"){
        repeat = false;
        repeat_1 = true;
        $("#repeat_button").attr("class", "repeat_one");     
    }else{
        repeat = false;
        repeat_1 = false;
        $("#repeat_button").attr("class", "repeat_off");
    }
}
//Some day we will use Thumbs
function UpdateThumbsUp(state){
    if(state == "On"){
        thumbs_up = true;
        $("#thumbs_up_button").attr("class", "thumbs_up_on");
    }else{
        thumbs_up = false;
        $("#thumbs_up_button").attr("class", "thumbs_up_off");
    }
}

function UpdateThumbsDown(state){
    if(state == "On"){
        thumbs_down = true;
        $("#thumbs_down_button").attr("class", "thumbs_down_on");
    }else{
        thumbs_down = false;
        $("#thumbs_down_button").attr("class", "thumbs_down_off");        
    }
}

// Get the play state from a MusicBeta tab and call UpdateIcon with it.
function UpdateIconFromPageState() {
FindMusicBetaTab(function(tab_id) {
    if (tab_id){
        chrome.tabs.sendRequest(tab_id, {gimme: "play_state"}, function(response){
            UpdateIcon(response.state);    
        });
        chrome.tabs.sendRequest(tab_id, {gimme: "shuffle_state"}, function(response){
            UpdateShuffle(response.state);    
        });
        chrome.tabs.sendRequest(tab_id, {gimme: "repeat_state"}, function(response){
            UpdateRepeat(response.state);    
        });
        chrome.tabs.sendRequest(tab_id, {gimme: "thumbs_up_state"}, function(response){
            UpdateThumbsUp(response.state);    
        });
        chrome.tabs.sendRequest(tab_id, {gimme: "thumbs_down_state"}, function(response){
            UpdateThumbsDown(response.state);    
        });        
    }
  });
}

//Following functions are pretty self explanatory.
function playPause(){
    sendCommand("playPause");
    UpdateIconFromPageState();
}

function nextTrack(){
    sendCommand("nextSong");
}

function prevTrack(){
    sendCommand("prevSong");
}

function shuffleClick(){
    sendCommand("toggleShuffle");
    UpdateIconFromPageState();
}

function repeatClick(){
    sendCommand("toggleRepeat");
    UpdateIconFromPageState();
}

function thumbsUp(){
    sendCommand("thumbsUp", "thumbsUpPlayer");
    UpdateIconFromPageState();
}

function thumbsDown(){
    sendCommand("thumbsDown", "thumbsDownPlayer");
    UpdateIconFromPageState();
}

//Updates all track information and art.
function updateInformation(){
    UpdateIconFromPageState();
    FindMusicBetaTab(function(tab_id) {
        if (tab_id){
            chrome.tabs.sendRequest(tab_id, {gimme: "artist"}, function(response){   
                    if(response.artist){
                        var artist_element = $("#artist");
                        artist_element.text(response.artist);

                        // Check if we need to marquee it
                        if(artist_element.get(0).scrollWidth > artist_element.width()){
                            // Turn it into a marquee
                            artist_element.attr('direction', 'right');
                            artist_element.attr('scrollamount', '1');
                        }else{
                            artist_element.attr('scrollamount', '0');
                            artist_element.attr('direction', 'left');
                        }
                    }
                });
            chrome.tabs.sendRequest(tab_id, {gimme: "art"}, function(response){           
                    if(response.art != "http:undefined" && response.art != "http:default_album_med.png")
                        $("#art").attr("src", response.art);
                    else
                        $("#art").attr("src", "../images/empty.png");
                });
            chrome.tabs.sendRequest(tab_id, {gimme: "track"}, function(response){    
                    if(response.track){
                        var track_element = $("#track");
                        track_element.text(response.track);
                        $("#play_pause").css("opacity", "1");
                        $("#next_track").css("opacity", "1");
                        $("#previous_track").css("opacity", "1");   
                        $("#shuffle_button").css("opacity", ".85");   
                        $("#repeat_button").css("opacity", ".85");   
                        $("#thumbs_up_button").css("opacity", ".85");   
                        $("#thumbs_down_button").css("opacity", ".85");   
                         
                        // Check if we need to marquee it
                        if(track_element.get(0).scrollWidth > track_element.width()){
                            // Turn it into a marquee
                            track_element.attr('direction', 'right');
                            track_element.attr('scrollamount', '1');
                        }else{
                            track_element.attr('scrollamount', '0');
                            track_element.attr('direction', 'left');
                        }
                    }else{
                        ////////This is where we "disable" buttons if we don't get a response here....
                        $("#play_pause").css("opacity", ".1");
                        $("#next_track").css("opacity", ".1");
                        $("#previous_track").css("opacity", ".1");
                        $("#shuffle_button").css("opacity", ".1");   
                        $("#repeat_button").css("opacity", ".1");   
                        $("#thumbs_up_button").css("opacity", ".1");   
                        $("#thumbs_down_button").css("opacity", ".1"); 
                    }
                });
            chrome.tabs.sendRequest(tab_id, {gimme: "cur_time"}, function(response){            
                    if(response.cur_time.indexOf(":") != -1)
                        $("#cur_time").text(response.cur_time + "/");
                    else
                        $("#cur_time").text("");
                });
            chrome.tabs.sendRequest(tab_id, {gimme: "total_time"}, function(response){            
                    if(response.total_time)
                        $("#total_time").text(response.total_time);
                });
        }else{
            chrome.tabs.create({url: 'https://play.google.com/music/listen',
                              selected: true});
        }
    });
}

//Update our information once every second.
window.setInterval(function() {
    updateInformation();
}, 1000)

$(document).ready(function(){
   updateInformation(); //Update information right away.

    // Get the clickable elements ready!

    // Shuffle button
    $("#shuffle_button").bind('click', function(){
        shuffleClick();
    });

    // Repeat button
    $("#repeat_button").bind('click', function(){
        repeatClick();
    });
    
    // Previous track
    $("#previous_track").bind('click', function(){
        prevTrack();
    });

    // Play/pause
    $("#play_pause").bind('click', function(){
        playPause();
    });

    // Next track
    $("#next_track").bind('click', function(){
        nextTrack();
    });

    // Thumbs up
    $("#thumbs_up_button").bind('click', function(){
        thumbsUp();
    });

    // Thumbs down
    $("#thumbs_down_button").bind('click', function(){
        thumbsDown();
    });

});
