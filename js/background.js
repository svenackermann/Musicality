/////////////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////////////

// The location of the JSON full of players and patterns, relative to html dir
var ALL_PLAYERS_JSON = "../json/all_players.json"

/////////////////////////////////////////////////////////////////////////////
// Member Variables
/////////////////////////////////////////////////////////////////////////////

// The id of the tab that was last seen currently playing music
var mLastPlayingTabId = null; // TODO -- This needs to be stored locally, not here

// The parsed ALL_PLAYERS_JSON
var mAllPlayers = null;

// A debug var for printing information to console
var mDebug = true;

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

// Find a tab that is currently playing music
function FindTabPlayingMusic(){

    if (mDebug){
        console.log("background.js::FindTabPlayingMusic(" + callback + ")");
    }
    
    // Cycle through each tab

    // TODO -- Look for a tab currently playing music
    // Use external json for patterns
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

    // We need to find a tab playing music
    mLastPlayingTabId = FindTabPlayingMusic();
    if (mLastPlayingTabId != null){
        // We've got one. Populate
        PopulateInformation(mLastPlayingTabId);
    }
}

// Populate the actual extension given the particular tab id
function PopulateInformation(tabId){
    // TODO
}

// Function to determine if a given tab is playing music
function IsPlayingMusic(tabId){
    // TODO
    return false;
}

// Function to load the values from external JSON
function LoadPlayersInformation(playerName){

    if (mDebug){
        console.log("background.js::LoadPlayersInformation(" + playerName + ")");
    }
    // TODO -- Load directly from JSON the patterns we need

    // TODO -- Load directly from JSON the div classes/ids for elements given the player

}


/////////////////////////////////////////////////////////////////////////////
// Execution Start
/////////////////////////////////////////////////////////////////////////////

// Once the document is ready, bind all of the functions.
$(document).ready(function(){

    // Immediately update our information
    UpdateInformation();
    
    // Deserialize the individual players JSON
    $.getJSON(ALL_PLAYERS_JSON, function(data) {
        mAllPlayers = data;

        if (mDebug){
            console.log(mAllPlayers);
        }

    });

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
