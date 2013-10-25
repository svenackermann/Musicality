// This script is responsible for constantly finding a page that's playing music,
// and keeping the variables internally up to date. These will be accessed by the
// popup script to display the relevant information to the user.

// TODO -- Move logic that doesn't deal with display to this script


// NOTE -- Variables can be accessed using chrome.extension.getBackgroundPage().variable_name
// Requires reloading the extension for changes in here to be reflected.


/////////////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////////////

// The location of the JSON full of players and patterns, relative to html dir
var ALL_PLAYERS_JSON = "/json/all_players.json"

/////////////////////////////////////////////////////////////////////////////
// Member Variables
/////////////////////////////////////////////////////////////////////////////

// Whether or not we should debug (lots of output!)
var mDebug = true;

// The id of the tab that was last seen currently playing music
var mLastPlayingTabId = -1;

// The parsed ALL_PLAYERS_JSON
var mAllPlayers = null;

// The contents of the actual players JSON (not ALL_PLAYERS_JSON)
var mPlayerDetails = null;

//// Variables containing information accessed by the popup ////

// Is playing
var mIsPlaying = false;

// The artist
var mArtist = null;

// The track
var mTrack = null;

// The art url
var mArtUrl = null

// The current time
var mCurrentTime = null;

// The total time
var mTotalTime = null;

// Is shuffled
var mIsShuffled = false;

// Is repeat 1
var mIsRepeatOne = false;

// Is repeat all
var mIsRepeatAll = false;

// Is repeat off
var mIsRepeatOff = false;

// Is thumbed up
var mIsThumbedUp = false;

// Is thumbed down
var mIsThumbedDown = false;

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

// Reset some members
function ResetMembers(){
    mIsPlaying = false;
    mArtist = null;
    mTrack = null;
    mArtUrl = null
    mCurrentTime = null;
    mTotalTime = null;
    mIsShuffled = false;
    mIsRepeatOne = false;
    mIsRepeatAll = false;
    mIsRepeatOff = false;
    mIsThumbedUp = false;
    mIsThumbedDown = false;
}

// Find a tab that is currently playing music
function FindTabPlayingMusic(callback){

    if (mDebug){
        console.log("background.js::FindTabPlayingMusic()");
    }

    // An array of tabs currently paused
    var pausedTabs = [];
    
    // Cycle through each tab
    chrome.windows.getAll({populate: true}, function(windows){
        var asyncsRunning = { "count" : 0 };
        for (var window=0; window<windows.length; window++){
            for (var i=0; i<windows[window].tabs.length; i++){
                var curTab = windows[window].tabs[i];

                // Now iterate through our patterns, checking if
                // this is a valid music player
                for (var curPlayer in mAllPlayers){
                    if (curTab.url.match(mAllPlayers[curPlayer]["pattern"])){
                        // We have found one of our players at this point
                        
                        // Save some information off
                        var curPlayer = mAllPlayers[curPlayer];

                        if (mDebug){
                            console.log("background.js::FindTabPlayingMusic -- Found " +
                                        curPlayer + " at tab " + curTab.id);
                        }

                        // We want some closure to preserve the tabId for all callbacks.
                        (function (tabId){
                            // Load the details for this player type into memory
                            $.getJSON(curPlayer.json_loc, function(playerDetails) {
                                if (mDebug){
                                    console.log("background.js::FindTabPlayingMusic() -- details = " + playerDetails);
                                }

                                // Increment the number of asyncs we have running
                                asyncsRunning.count++;

                                // A flag to see if we have already returned a player
                                var alreadyReturned = false;
                                
                                // Is it currently playing music?
                                IsPlayingMusic(tabId, playerDetails, function(isPlaying){
                                    if (isPlaying){
                                        // Sweet. Found one we wanted.
                                        if (!alreadyReturned){
                                            alreadyReturned = true;
                                            callback(tabId, playerDetails);
                                        }
                                    }else{
                                        // Check if this was the last tab we were looking at
                                        returnPausedTabHelper(asyncsRunning, pausedTabs, callback);
                                    }
                                });

                                // Again, increment the asyncs
                                asyncsRunning.count++;
                                
                                // Check if it was paused instead.
                                IsPaused(tabId, playerDetails, function(isPaused){
                                    if (isPaused){
                                        // Found a paused tab. Save it off
                                        pausedTabs.push({ "id" : tabId, "details" : playerDetails });

                                        // If everythings done, returned a paused tab
                                        returnPausedTabHelper(asyncsRunning, pausedTabs, callback);
                                    }else{
                                        // This tab wasn't paused, or playing. Check if all asyncs are done.
                                        returnPausedTabHelper(asyncsRunning, pausedTabs, callback);
                                    }
                                });
                            });
                        })(curTab.id)
                    }
                }
            }
        }
    });

    // We didn't find anything!
    callback(-1, null);
}

// A helper function to prevent code duplication
function returnPausedTabHelper(asyncsRunning, pausedTabs, callback){
    if (--asyncsRunning.count == 0){
        // All done with the asyncs. Check if there were any paused tabs
        if (pausedTabs.length > 0){
            pausedTabs.sort(pausedTabCompare); // We want consistent returns on which is selected
            callback(pausedTabs[0].id, pausedTabs[0].details);
        }
    }

}

// We need a compare function for sorting the paused tabs
function pausedTabCompare(tabA, tabB){
    if (tabA.id < tabB.id){
        return -1;
    }else if (tabA.id > tabB.id){
        return 1;
    }else{
        return 0;
    }
}

// Update the information displayed within the extension
function UpdateInformation(){

    if (mDebug){
        console.log("background.js::UpdateInformation()");
    }
    
    // Have we already found a tab playing music?
    if (mLastPlayingTabId != -1){
        // Is it still playing music?
        IsPlayingMusic(mLastPlayingTabId, mPlayerDetails, function(isPlaying){
            if (isPlaying){
                // Grab the different pieces from that tab, if we are displaying
                PopulateInformation(mLastPlayingTabId);
            }else{
                lookForPlayingTabHelper();
            }
        });
    }else{
        lookForPlayingTabHelper();
    }
}

// A helper function to prevent duplication of code in the UpdateInformation function
function lookForPlayingTabHelper(){
    // Start by resetting the focused player and player details
    mLastPlayingTabId = -1;
    mPlayerDetails = null;
    mLastPlayingTabId = -1;
    
    FindTabPlayingMusic(function(tabId, playerDetails){
        mLastPlayingTabId = tabId;
        mPlayerDetails = playerDetails;
        
        if (mLastPlayingTabId != null && mPlayerDetails != null){
            // We've got one. Populate if displayed
            PopulateInformation(mLastPlayingTabId);
        }else{
            // If we didn't find anything, nothing is populated.
            if (mDebug){
                console.log("background.js::UpdateInformation() -- No players playing");
            }

            // Reset the members
            ResetMembers();
        }
    });
}

// Populate the actual extension given the particular tab id
function PopulateInformation(tabId){

    // Request artist from the content script
    SendPlayerRequest(tabId, mPlayerDetails, "get_artist", function(artist){
        // Log it if we've found the artist
        if (mDebug){
            console.log("background.js::PopulateInfo -- artist: " + artist);
        }

        // Save the artist name for the popup
        mArtist = artist;

    });

    // Request the track from the content script
    SendPlayerRequest(tabId, mPlayerDetails, "get_track", function(track){
        // Log it if we've found the track
        if (mDebug){
            console.log("background.js::PopulateInfo -- track: " + track);
        }

        // Save the track for the popup
        mTrack = track;
    });

    // Make a request to the content script for the album art url
    SendPlayerRequest(tabId, mPlayerDetails, "get_album_art", function(art_url){
        // Log it if we've found the art
        if (mDebug){
            console.log("background.js::PopulateInfo -- art URL: " + art_url);
        }

        // Save the art for the popup
        mArtUrl = art_url;
    });

    if (mPlayerDetails.has_current_track_time){
        // Make a request to the content script for the current time    
        SendPlayerRequest(tabId, mPlayerDetails, "get_current_time", function(current_time){
            // Log it if we've found the current time
            if (mDebug){
                console.log("background.js::PopulateInfo -- current time: " + current_time);
            }

            // Save the current time for the popup
            mCurrentTime = current_time;
        });
    }

    if (mPlayerDetails.has_total_track_time){
        // Make a request to the content script for the total time
        SendPlayerRequest(tabId, mPlayerDetails, "get_total_time", function(total_time){
            // Log it if we've found the total time
            if (mDebug){
                console.log("background.js::PopulateInfo -- total time: " + total_time);
            }

            // Save the total time for the popup
            mTotalTime = total_time;
        });
    }else if (mPlayerDetails.has_remaining_track_time){
        // Make a request to the content script for the remaining time
        SendPlayerRequest(tabId, mPlayerDetails, "get_remaining_time", function(remaining_time){
            // Log it if we've found the remaining time
            if (mDebug){
                console.log("background.js::PopulateInfo -- remaining time: " + remaining_time);
            }

            // Do some math to get the actual total time instead
            
            mTotalTime = remaining_time;
        });
    }
    
    // Make a request to the content script for the play/pause state
    SendPlayerRequest(tabId, mPlayerDetails, "is_playing", function(playing){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is playing: " + playing);
        }

        // Save whether or not it's playing for the popup
        mIsPlaying = playing;
    });

    // Make a request to the content script for the shuffle state
    SendPlayerRequest(tabId, mPlayerDetails, "is_shuffled", function(shuffled){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is shuffled: " + shuffled);
        }

        // Save it off
        mIsShuffled = shuffled;
    });
    
    // Make a request to the content script for the repeat state
    SendPlayerRequest(tabId, mPlayerDetails, "is_repeat_off", function(repeat_off){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is repeat off: " + repeat_off);
        }

        // Save it off
        mIsRepeatOff = repeat_off;
    });
    
    // Make a request to the content script for the repeat state
    SendPlayerRequest(tabId, mPlayerDetails, "is_repeat_one", function(repeat_one){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is repeat one: " + repeat_one);
        }

        // Save it
        mIsRepeatOne = repeat_one;
    });
    
    // Make a request to the content script for the repeat state
    SendPlayerRequest(tabId, mPlayerDetails, "is_repeat_all", function(repeat_all){
        // Log whatever we have got
        if (mDebug){
            console.log("background.js::PopulateInfo -- is repeat all: " + repeat_all);
        }

        // Save it
        mIsRepeatAll = repeat_all;
    });

    if (mPlayerDetails.has_thumbs_up){
        // Make a request to the content script for the thumbs state
        SendPlayerRequest(tabId, mPlayerDetails, "is_thumbed_up", function(thumbed_up){
            // Log whatever we have got
            if (mDebug){
                console.log("background.js::PopulateInfo -- is thumbed up: " + thumbed_up);
            }

            // Save it
            mIsThumbedUp = thumbed_up;
        });
    }

    if (mPlayerDetails.has_thumbs_down){
        // Make a request to the content script for the thumbs state
        SendPlayerRequest(tabId, mPlayerDetails, "is_thumbed_down", function(thumbed_down){
            // Log whatever we have got
            if (mDebug){
                console.log("background.js::PopulateInfo -- is thumbed down: " + thumbed_down);
            }

            // Save it
            mIsThumbedDown = thumbed_down;
        });
    }

    // Finally, do some work for last.fm
    DoLastFmWork();
}

// A function to interact with the scrobbler
function DoLastFmWork(){
    // TODO -- Make sure the user wan't to scrobble! Check locally.
    
    // Make sure we are playing
    if (mIsPlaying){
        // Ensure we have a track and artist
        if (mTrack != null && mArtist != null){
            // Cool. Tell Last.fm we are playing
            RunLastFmQuery({method: "track.updateNowPlaying",
                            track: mTrack,
                            artist: mArtist}, false, null);

            // Check if we've played at least 30 seconds
            var splitCurrent = mCurrentTime.split(":");
            var curMins = parseInt(splitCurrent[0]);
            var curSeconds = parseInt(splitCurrent[1]) + (curMins*60);

            if (curSeconds > 30){
                // We could scrobble here. Check if it's halfway over, or greater than 4
                var splitTotal = mTotalTime.split(":");
                var totalMins = parseInt(splitTotal[0]);
                var totalSeconds = parseInt(splitTotal[1]) + (totalMins*60);
                
                if (curSeconds/totalSeconds >= 0.5 || curSeconds >= (240)){
                    // Scrobble!
                    RunLastFmQuery(
                        {
                            method: "track.scrobble",
                            track: mTrack,
                            artist: mArtist,
                            timestamp: Math.round((new Date()).getTime() / 1000)
                        }, false, function(result){
                            // TODO -- Double check the result
                        });
                }
            }
        }
    }

}

// Function to determine if a given tab is playing music
function IsPlayingMusic(tabId, playerDetails, callback){
    // Only check if the tabId > 0
    if (tabId > 0){
        // Send a request to the tab provided
        SendPlayerRequest(
            tabId,
            playerDetails,
            "is_playing",
            function(result){
                callback(result);
            }
        );
    }
}

// Function to determine if a given tab is paused, and could play music
function IsPaused(tabId, playerDetails, callback){
    // Only check if the tabId > 0
    if (tabId > 0){
        // Send a request to the tab provided
        SendPlayerRequest(
            tabId,
            playerDetails,
            "is_paused",
            function(result){
                callback(result);
            }
        );
    }
}

// Function to send a request to the player. Callback the response.
function SendPlayerRequest(tabId, playerDetails, whatIsNeeded, callback){
    // Check if we have the player details
    if (playerDetails != null){

        // Send the request to the tab provided
        chrome.tabs.sendRequest(
            tabId,
            {
                "playerDetails" : playerDetails,
                "scriptKey" : whatIsNeeded
            },
            function(result){
                console.log("background.js::SendPlayerRequest(" +
                            tabId + "," + whatIsNeeded + "," + result + ")");
                callback(result);
            }
        );
    }
}

// General method for dealing with a button in the background being clicked.
function ClickSomething(clickWhat){
    // First, ensure that something is playing
    if (mPlayerDetails != null && mLastPlayingTabId > 0){
        // Cool. Let's do it
        SendPlayerRequest(mLastPlayingTabId, mPlayerDetails, clickWhat, function(){
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
    
    // Update our information once every ten seconds.
    window.setInterval(function() {
        UpdateInformation();
    }, 10000)
});

