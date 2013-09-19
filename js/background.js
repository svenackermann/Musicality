/////////////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////////////

// The location of the JSON full of players and patterns, relative to html dir
var ALL_PLAYERS_JSON = "/json/all_players.json"

/////////////////////////////////////////////////////////////////////////////
// Member Variables
/////////////////////////////////////////////////////////////////////////////

// The id of the tab that was last seen currently playing music
var mLastPlayingTabId = null; // TODO -- This needs to be stored locally, not here

// The parsed ALL_PLAYERS_JSON
var mAllPlayers = null;

// The player we detected as playing or paused as seen by the ALL_PLAYERS_JSON object
var mFocusedPlayer = null;

// The contents of the actual players JSON (not ALL_PLAYERS_JSON)
var mPlayerDetails = null;

// Keep track of whether or not music is currently playing
var mCurrentlyPlaying = false;

// A debug var for printing information to console
var mDebug = true;

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

// Find a tab that is currently playing music
function FindTabPlayingMusic(callback){

    if (mDebug){
        console.log("background.js::FindTabPlayingMusic()");
    }

    // An array of tabs currently paused
    var aPausedTab = null;
    
    // Cycle through each tab
    chrome.windows.getAll({populate: true}, function(windows){
        for (var window=0; window<windows.length; window++){
            for (var i=0; i<windows[window].tabs.length; i++){
                var curUrl = windows[window].tabs[i].url;

                // Now iterate through our patterns, checking if
                // this is a valid music player
                for (var curPlayer in mAllPlayers){
                    if (curUrl.match(mAllPlayers[curPlayer]["pattern"])){
                        // We have found one of our players at this point
                        
                        if (mDebug){
                            console.log("background.js::FindTabPlayingMusic -- Found " + curPlayer);
                        }

                        // Save some information off
                        var curTabId = windows[window].tabs[i].id;
                        mFocusedPlayer = mAllPlayers[curPlayer];

                        // Turn async off to load the JSON
                        $.ajaxSetup({ async : false });
                        
                        // Load the details for this player type into memory
                        $.getJSON(mFocusedPlayer.json_loc, function(data) {
                            if (mDebug){
                                console.log("background.js::FindTabPlayingMusic() -- data = " + data);
                            }
                            mPlayerDetails = data;
                        });

                        // Turn async back on
                        $.ajaxSetup({ async : true });

                        // Is it currently playing music?
                        IsPlayingMusic(curTabId, function(result){
                            if (result){
                                // Sweet. Found one we wanted.
                                callback(curTabId);
                            }
                        });
                        IsPaused(curTabId, function(result){
                            if (result){
                                // Found a paused tab. Save it off in case it's all we have
                                // TODO -- Figure this out
                                //aPausedTab = curTabId;
                                callback(curTabId);
                            }
                        });
                    }
                }
            }
        }
    });

    // Ok. Didn't find any playing players. Use the last paused one, if it was there

    if (mFocusedPlayer != null){
        // Turn off async, so we block while loading JSON documents
        $.ajaxSetup({ async : false });

        // Load the details of the player into memory from JSON
        $.getJSON(mFocusedPlayer.json_loc, function(data) {
            mPlayerDetails = data;
        });

        // Turn async back on
        $.ajaxSetup({ async : true });
    }

    // Return the tab id
    if (aPausedTab){
        callback(aPausedTab);
    }
}

// Update the information displayed within the extension
function UpdateInformation(){

    if (mDebug){
        console.log("background.js::UpdateInformation()");
    }

    // Have we already found a tab playing music?
    if (mLastPlayingTabId != null){
        // Is it still playing music?
        if (IsPlayingMusic(mLastPlayingTabId)){
            // Grab the different pieces from that tab
            PopulateInformation(mLastPlayingTabId);
            return;
        }
    }

    // We need to find a tab playing music!

    // Start by resetting the focused player and player details
    mFocusedPlayer = null;
    mPlayerDetails = null;
    mLastPlayingTabId = -1;
    mCurrentlyPlaying = false;
    
    FindTabPlayingMusic(function(tabId){
        mLastPlayingTabId = tabId;
        
        if (mLastPlayingTabId != null){
            // We've got one. Populate
            PopulateInformation(mLastPlayingTabId);
        }

        // If we didn't find anything, nothing is populated.
        if (mDebug){
            console.log("background.js::UpdateInformation() -- No players playing");
        }
    });
}

// Populate the actual extension given the particular tab id
function PopulateInformation(tabId){

    // Request artist from the content script
    SendPlayerRequest(tabId, "get_artist", function(artist){
        // Log it if we've found the artist
        if (mDebug){
            console.log("background.js::PopulateInfo -- artist: " + artist);
        }

        if (artist != null){
            var artistElement = $("#artist");
            artistElement.text(artist);

            // Check if we need to marquee it
            if(artistElement.get(0).scrollWidth > artistElement.width()){
                // Turn it into a marquee
                artistElement.attr('direction', 'right');
                artistElement.attr('scrollamount', '1');
            }else{
                artistElement.attr('scrollamount', '0');
                artistElement.attr('direction', 'left');
            }
        }
    });

    // Request the track from the content script
    var track = SendPlayerRequest(tabId, "get_track", function(track){
        // Log it if we've found the track
        if (mDebug){
            console.log("background.js::PopulateInfo -- track: " + track);
        }

        // Get handles to different elements we need
        var playPauseElement = $("#play_pause");
        var nextTrackElement = $("#next_track");
        var prevTrackElement = $("#previous_track");
        var shuffleButtonElement = $("#shuffle_button");
        var repeatButtonElement = $("#repeat_button");
        var thumbsUpButtonElement = $("#thumbs_up_button");
        var thumbsDownButtonElement = $("#thumbs_down_button");
        
        if (track != null){
            var trackElement = $("#track");
            trackElement.text(track);

            // Set the play/pause opacity
            if (mPlayerDetails.has_play_pause){
                playPauseElement.css("opacity", "1");
            }else{
                playPauseElement.css("opacity", "0");
            }

            // Set the next track opacity
            if (mPlayerDetails.has_next_track){
                nextTrackElement.css("opacity", "1");
            }else{
                nextTrackElement.css("opacity", "0");
            }

            // Set the prev track opacity
            if (mPlayerDetails.has_prev_track){
                prevTrackElement.css("opacity", "1");
            }else{
                prevTrackElement.css("opacity", "0");
            }

            // Set the shuffle button opacity
            if (mPlayerDetails.has_shuffle){
                shuffleButtonElement.css("opacity", ".85");
            }else{
                shuffleButtonElement.css("opacity", "0");
            }

            // Set the repeat button opacity
            if (mPlayerDetails.has_repeat){
                repeatButtonElement.css("opacity", ".85");
            }else{
                repeatButtonElement.css("opacity", "0");
            }

            // Set the thumbs up button opacity
            if (mPlayerDetails.has_thumbs_up){
                thumbsUpButtonElement.css("opacity", ".85");
            }else{
                thumbsUpButtonElement.css("opacity", "0");
            }

            // Set the thumbs down button opacity
            if (mPlayerDetails.has_thumbs_down){
                thumbsDownButtonElement.css("opacity", ".85");
            }else{
                thumbsDownButtonElement.css("opacity", "0");
            }                
            
            // Check if we need to marquee it
            if(trackElement.get(0).scrollWidth > trackElement.width()){
                // Turn it into a marquee
                trackElement.attr('direction', 'right');
                trackElement.attr('scrollamount', '1');
            }else{
                trackElement.attr('scrollamount', '0');
                trackElement.attr('direction', 'left');
            }
        }else{
            // Looks like we have to disable some buttons
            playPauseElement.css("opacity", ".1");
            nextTrackElement.css("opacity", ".1");
            prevTrackElement.css("opacity", ".1");
            shuffleButtonElement.css("opacity", ".1");   
            repeatButtonElement.css("opacity", ".1");   
            thumbsUpButtonElement.css("opacity", ".1");   
            thumbsDownButtonElement.css("opacity", ".1"); 
        }

    });

    // Make a request to the content script for the album art url
    SendPlayerRequest(tabId, "get_album_art", function(art_url){
        // Log it if we've found the art
        if (mDebug){
            console.log("background.js::PopulateInfo -- art URL: " + art_url);
        }

        var artElement = $("#art");
        
        if (art_url != null){
            // Update the art to display the now playing art
            artElement.attr("src", art_url);
        }else{
            // Not found, so revert it to the empty art
            $("#art").attr("src", "/images/empty.png");
        }
    });

    // Make a request to the content script for the current time    
    SendPlayerRequest(tabId, "get_current_time", function(current_time){
        // Log it if we've found the current time
        if (mDebug){
            console.log("background.js::PopulateInfo -- current time: " + current_time);
        }

        // Get the element in our extension
        var curTimeElement = $("#cur_time");

        if (current_time != null){
            curTimeElement.text(current_time + "/");
        }else{
            curTimeElement.text("");
        }
    });

    if (mPlayerDetails.has_total_track_time){
        // Make a request to the content script for the total time
        SendPlayerRequest(tabId, "get_total_time", function(total_time){
            // Log it if we've found the total time
            if (mDebug){
                console.log("background.js::PopulateInfo -- total time: " + total_time);
            }

            // Get the total time element
            var totalTimeElement = $("#total_time");

            // Update the info
            if (total_time != null){
                totalTimeElement.text(total_time);
            }else{
                totalTimeElement.text("");
            }
        });
    }else if (mPlayerDetails.has_remaining_track_time){
        // Make a request to the content script for the remaining time
        SendPlayerRequest(tabId, "get_remaining_time", function(remaining_time){
            // Log it if we've found the remaining time
            if (mDebug){
                console.log("background.js::PopulateInfo -- remaining time: " + remaining_time);
            }

            // Get the total time element
            var totalTimeElement = $("#total_time");

            // Update the info
            if (remaining_time != null){
                totalTimeElement.text(remaining_time);
            }else{
                totalTimeElement.text("");
            }
        });
    }
    
    // Make a request to the content script for the play/pause state
    SendPlayerRequest(tabId, "is_playing", function(playing){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is playing: " + playing);
        }

        // Get the element
        var playPauseElement = $("#play_pause");

        // Save off whether or not we are playing
        mCurrentlyPlaying = playing;
        
        if (playing){
            playPauseElement.attr("class", "pause");
        }else{
            playPauseElement.attr("class", "play");
        }
    });

    // Make a request to the content script for the shuffle state
    SendPlayerRequest(tabId, "is_shuffled", function(shuffled){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is shuffled: " + shuffled);
        }

        // Get the element
        var shuffleElement = $("#shuffle_button");

        if (shuffled){
            shuffleElement.attr("class", "shuffle_on");
        }else{
            shuffleElement.attr("class", "shuffle_off");
        }
        
    });
    
    // Make a request to the content script for the repeat state
    SendPlayerRequest(tabId, "is_repeat_off", function(repeat_off){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is repeat off: " + repeat_off);
        }

        // Get the element
        if (repeat_off){
            $("#repeat_button").attr("class", "repeat_off");
        }
    });
    
    // Make a request to the content script for the repeat state
    SendPlayerRequest(tabId, "is_repeat_one", function(repeat_one){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is repeat one: " + repeat_one);
        }

        // Get the element
        if (repeat_one){
            $("#repeat_button").attr("class", "repeat_one");
        }
    });
    
    // Make a request to the content script for the repeat state
    SendPlayerRequest(tabId, "is_repeat_all", function(repeat_all){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is repeat all: " + repeat_all);
        }

        // Get the element
        if (repeat_all){
            $("#repeat_button").attr("class", "repeat_all");
        }
    });
    
    // Make a request to the content script for the thumbs state
    SendPlayerRequest(tabId, "is_thumbed_up", function(thumbed_up){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is thumbed up: " + thumbed_up);
        }

        // Get the thumbs up element
        var thumbsUpElement = $("#thumbs_up_button");

        // Toggle it
        if (thumbed_up){
            thumbsUpElement.attr("class", "thumbs_up_on");
        }else{
            thumbsUpElement.attr("class", "thumbs_up_off");
        }
    });
    
    // Make a request to the content script for the thumbs state
    SendPlayerRequest(tabId, "is_thumbed_down", function(thumbed_down){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is thumbed down: " + thumbed_down);
        }

        // Get the thumbs up element
        var thumbsDownElement = $("#thumbs_down_button");

        // Toggle it
        if (thumbed_down){
            thumbsDownElement.attr("class", "thumbs_down_on");
        }else{
            thumbsDownElement.attr("class", "thumbs_down_off");
        }
    });
    
}

// Function to determine if a given tab is playing music
function IsPlayingMusic(tabId, callback){
    // Send a request to the tab provided
    var result = SendPlayerRequest(
        tabId,
        "is_playing",
        function(result){
            callback(result);
        }
    );

}

// Function to determine if a given tab is paused, and could play music
function IsPaused(tabId, callback){
    // Send a request to the tab provided
    SendPlayerRequest(
        tabId,
        "is_paused",
        function(result){
            callback(result);
        }
    );
}

// Function to send a request to the player. Callback the response.
function SendPlayerRequest(tabId, whatIsNeeded, callback){
    // Check if we have the player details
    if (mPlayerDetails != null){
        
        // Send the request to the tab provided
        chrome.tabs.sendRequest(
            tabId,
            {
                playerDetails : mPlayerDetails,
                scriptKey : whatIsNeeded
            },
            function(result){
                console.log("background.js::SendPlayerRequest() -- result = " + result);
                callback(result);
            }
        );
    }
}


//// Click Functions ////

// Method executed when extensions shuffle is clicked
function ShuffleClick(){
    // Call the master clicker
    ClickSomething("click_shuffle");
}

// Method executed when extensions repeat is clicked
function RepeatClick(){
    ClickSomething("click_repeat");
}

// Method executed when extensions prev track is clicked
function PrevTrackClick(){
    ClickSomething("click_prev_track");
}

// Method executed when extensions play is clicked
function PlayClick(){
    ClickSomething("click_play");
}

// Method executed when extensions pause is clicked
function PauseClick(){
    ClickSomething("click_pause");
}

// Method executed when extensions next track is clicked
function NextTrackClick(){
    ClickSomething("click_next_track");
}

// Method executed when extensions thumbs up is clicked
function ThumbsUpClick(){
    ClickSomething("click_thumbs_up");
}

// Method executed when extensions thumbs down is clicked
function ThumbsDownClick(){
    ClickSomething("click_thumbs_down");
}

// General method for dealing with clicking anything
function ClickSomething(clickWhat){
    // First, ensure that something is playing
    if (mPlayerDetails != null && mLastPlayingTabId > 0){
        // Cool. Let's do it
        SendPlayerRequest(mLastPlayingTabId, clickWhat, function(){
            UpdateInformation();
        });
    }
}

/////////////////////////////////////////////////////////////////////////////
// Execution Start
/////////////////////////////////////////////////////////////////////////////

// Once the document is ready, bind all of the functions.
$(document).ready(function(){

    // Immediately update our information
    UpdateInformation();
    
    // Turn async off to load the JSON
    $.ajaxSetup({ async : false });

    // Deserialize the individual players JSON
    $.getJSON(ALL_PLAYERS_JSON, function(data) {
        mAllPlayers = data;

        if (mDebug){
            console.log(mAllPlayers);
        }

    });

    // Turn async back on
    $.ajaxSetup({ async : true });
    
    //Update our information once every second.
    window.setInterval(function() {
        UpdateInformation();
    }, 1000)

    // Get the clickable elements ready!

    // Shuffle button
    $("#shuffle_button").bind('click', function(){
        ShuffleClick();
    });

    // Repeat button
    $("#repeat_button").bind('click', function(){
        RepeatClick();
    });
    
    // Previous track
    $("#previous_track").bind('click', function(){
       PrevTrackClick();
    });

    // Play/pause
    $("#play_pause").bind('click', function(handler){
        // Be smart about what we are clicking
        var className = handler.currentTarget.className;
        if (className == "play"){
            PlayClick();
        }else if (className == "pause"){
            PauseClick();
        }
    });

    // Next track
    $("#next_track").bind('click', function(){
        NextTrackClick();
    });

    // Thumbs up
    $("#thumbs_up_button").bind('click', function(){
        ThumbsUpClick();
    });

    // Thumbs down
    $("#thumbs_down_button").bind('click', function(){
        ThumbsDownClick();
    });

});
