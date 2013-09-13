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

// The player we detected as playing or paused as seen by the ALL_PLAYERS_JSON object
var mFocusedPlayer = null;

// The contents of the actual players JSON (not ALL_PLAYERS_JSON)
var mPlayerDetails = null;

// A debug var for printing information to console
var mDebug = true;

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

// Find a tab that is currently playing music
function FindTabPlayingMusic(){

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

                        // Is it currently playing music?
                        if (IsPlayingMusic(curTabId)){
                            // This is what we wanted!

                            // Load the details for this player type into memory
                            $.getJSON(mFocusedPlayer.json_loc, function(data) {
                                mPlayerDetails = data;
                            });
                            
                            // Now return it's tab id
                            return curTabId;
                        }else if (IsPaused(curTabId)){
                            // This tab is paused. Save it in case we don't find anything.
                            aPausedTab = curTabId;
                        }
                    }
                }
            }
        }
    });

    // Ok. Didn't find any playing players. Use the last paused one, if it was there

    if (mFocusedPlayer != null){
        // Load the details of the player into memory from JSON
        $.getJSON(mFocusedPlayer.json_loc, function(data) {
            mPlayerDetails = data;
        });
    }

    // Return the tab id
    return aPausedTab;
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
    
    mLastPlayingTabId = FindTabPlayingMusic();
    if (mLastPlayingTabId != null){
        // We've got one. Populate
        PopulateInformation(mLastPlayingTabId);
    }

    // If we didn't find anything, nothing is populated.
}

// Populate the actual extension given the particular tab id
function PopulateInformation(tabId){
    // TODO
}

// Function to determine if a given tab is playing music
function IsPlayingMusic(tabId){
    // Send a request to the tab provided
    SendPlayerRequest(tabId, "is_playing",
        function(response){
            // Got a response back. Return it
            return response;            
        }
    );

    return false;
}

// Function to determine if a given tab is paused, and could play music
function IsPaused(tabId){
    // Send a request to the tab provided
    SendPlayerRequest(tabId, "is_paused",
        function(response){
            // Got a response back. Return it
            return response;            
        }
    );

    return false;
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
                gimme : whatIsNeeded
            },
            function(response){
                callback(response);
            }
        );
    }
    callback(null);
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
