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
    if($(".playButton").attr("style") == "display: block;"){
        return "Play";
    }else{
        return "Pause";
    }
}

function get_shuffle_state(){
    // It's always off for pandora
    return "Off";
}

function get_repeat_state(){
    // It's always off for pandora
    return "Off";
}

function get_thumbs_up_state(){
    if ($(".thumbUpButton.indicator").length == 0){
        return 'Off';
    }else{
        return 'On';
    }
}

function get_thumbs_down_state(){
    if ($(".thumbDownButton.indicator").length == 0){
        return 'Off';
    }else{
        return 'On';
    }
}

function get_album_art(){
    return ($(".art")[1].src);
}

function get_artist(){
    return $(".artistSummary").text();
}

function get_track(){
    return $(".songTitle").text();
}

function get_cur_time(){
    return $(".elapsedTime").text();
}

function get_total_time(){
    return $(".remainingTime").text();
}
