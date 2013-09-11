//Listen for messages and respond accordingly.
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.gimme == "play_state"){
        sendResponse({state: get_play_state()});
    }else if (request.gimme == "artist"){
        sendResponse({artist: get_artist()});
    }else if (request.gimme == "art"){
        sendResponse({art: get_album_art()});
    }else if (request.gimme == "track"){
        sendResponse({track: get_track()});
    }else if (request.gimme == "cur_time"){
        sendResponse({cur_time: get_cur_time()});
    }else if (request.gimme == "total_time"){
        sendResponse({total_time: get_total_time()});
    }else if (request.gimme == "shuffle_state"){
        sendResponse({state: get_shuffle_state()});
    }else if (request.gimme == "repeat_state"){
        sendResponse({state: get_repeat_state()});
    }else if (request.gimme == "thumbs_up_state"){
        sendResponse({state: get_thumbs_up_state()});
    }else if (request.gimme == "thumbs_down_state"){
        sendResponse({state: get_thumbs_down_state()});
    }else if (request.div && request.cmd){
        if(request.cmd == 'thumbsUp' || request.cmd == 'thumbsDown'){
            trigger_mouse(request.div)
        }else{      
            console.log("Got a request: request.div = " + request.div + " and request.cmd = " + request.cmd);
            var div = $("#" + request.div);
            console.log("our div is " + div);
            location.assign('javascript:SJBpost(\"' + request.cmd + '\", ' + div + ');');
        }
        sendResponse({});
    }else{
        sendResponse({}); // snub them.
    }
});

//Thank you antimatter15 for this nice contribution. I'm sure it will be used by other projects as well.
function trigger_mouse(in_element){
    $(in_element).trigger('click');
}


function get_play_state(){
    if($('*[data-id="play-pause"]').attr("title") == "Pause"){
        return "Pause";
    }else{
        return "Play";
    }
}

function get_shuffle_state(){
    if($('*[data-id="shuffle"]').attr("value") == "ALL_SHUFFLE"){
        return "On";
    }else{
        return "Off";
    }
}

function get_repeat_state(){
    var raw_state = $('*[data-id="repeat"]').attr("value");
    if(raw_state == "NO_REPEAT" || raw_state == "SINGLE_REPEAT_CLICKED"){
        return "Off";
    }else if(raw_state == "LIST_REPEAT" || raw_state == "NO_REPEAT_CLICKED"){
        return "All";
    }else if(raw_state == "SINGLE_REPEAT" || raw_state == "LIST_REPEAT_CLICKED"){
        return "One";
    }else
        return "Off";
}

function get_thumbs_up_state(){
    return $('*[data-rating="5"]').hasClass("selected") ? 'On': 'Off';
}

function get_thumbs_down_state(){
    return $('*[data-rating="1"]').hasClass("selected") ? 'On': 'Off';
}

function get_album_art(){
    return ("http:" + $("#playingAlbumArt").attr("src"));
}

function get_artist(){
    return $("#player-artist").text();
}

function get_track(){
    return $("#playerSongTitle").text();
}

function get_cur_time(){
    return $("#time_container_current").text();
}

function get_total_time(){
    return $("#time_container_duration").text();
}
