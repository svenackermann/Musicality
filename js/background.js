
/////////////////////////////////////////////////////////////////////////////
// Member Variables
/////////////////////////////////////////////////////////////////////////////

// The id of the tab that was last seen currently playing music
var mTabId = null;

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

// Find a tab that is currently playing music
function FindTabPlayingMusic(callback){

    // Cycle through each tab

    // TODO -- Look for a tab currently playing music
    // Use external json for patterns
}

// Update the information displayed within the extension
function UpdateInformation(){

    // TODO -- See if the tab we had before is still playing music
    // If it is, then get the information from it.
    // If it is not, then see if any other tabs are.
    //    Get information for whichever one is
    // If none are, then show the information of the tab we have

}

// Function to load the values from external JSON
function LoadPlayersInformation(){

    // TODO -- Load directly from JSON the patterns we need

    // TODO -- Load directly from JSON the div classes/ids for elements given the player

}


/////////////////////////////////////////////////////////////////////////////
// Execution Start
/////////////////////////////////////////////////////////////////////////////

// Once the document is ready, bind all of the functions.
$(document).ready(function(){

    // Deserialize the individual players JSON
    // TODO -- Load high level json into memory

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
       PrevTrack();
    });

    // Play/pause
    $("#play_pause").bind('click', function(){
        PlayPause();
    });

    // Next track
    $("#next_track").bind('click', function(){
        NextTrack();
    });

    // Thumbs up
    $("#thumbs_up_button").bind('click', function(){
        ThumbsUp();
    });

    // Thumbs down
    $("#thumbs_down_button").bind('click', function(){
        ThumbsDown();
    });

});
