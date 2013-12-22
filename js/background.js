// This script is responsible for constantly finding a page that's playing music,
// and keeping the variables internally up to date. These will be accessed by the
// popup script to display the relevant information to the user.

// Requires reloading the extension for changes in here to be reflected.

/////////////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////////////

// Constants reside in constants.js

/////////////////////////////////////////////////////////////////////////////
// Member Variables
/////////////////////////////////////////////////////////////////////////////

// Whether or not we should debug (lots of output!)
var mDebug = false;

// The id of the tab that was last seen currently playing music
var mLastPlayingTabId = -1;

// The parsed ALL_PLAYERS_JSON
var mAllPlayers = null;

// The contents of the actual players JSON (not ALL_PLAYERS_JSON)
var mPlayerDetails = null;

// A variable set if we actually have found a tab for a player
var mPlayerOpen = false;

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

// For songs with progress, we need to calculate some values
var mFirstUpdateProgress = 0.0;

// Timestamp of the last time we got the progress
var mFirstUpdateTimestamp = 0;

// Total milliseconds
var mTotalMilliseconds = 0;

// The last update track
var mLastUpdateTrack = null;

// The number of characters scrolled in the badge text
var mBadgeTextScroll = 0;

// The timestamp of the last time we scrolled
var mBadgeTextLastScrollTime = 0;

// The timestamp of the last time we looked in storage
var mBadgeTextLastStorageCheck = 0;

// The total amount of time to wait between scrolls
var mBadgeTextScrollTime = 250;

// A cached version of whether or not badge text is enabled
var mBadgeTextEnabled = true;

//// Last.fm variables ////

// Cache of songs to scrobble
var mScrobbleCache = [];

// Keep track of the last song scrobbled, so we don't double
var mLastScrobble = "";

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

                                // A flag to ensure we know we already have seen a player
                                mPlayerOpen = true;

                                // Is it currently playing music?
                                IsPlayingMusic(tabId, playerDetails, function(isPlaying){
                                    if (isPlaying){
                                        // Sweet. Found one we wanted.
                                        if (!alreadyReturned){
                                            alreadyReturned = true;
                                            console.log("mPlayerOpen = " + mPlayerOpen);
                                            callback(tabId, playerDetails);
                                            return;
                                        }
                                    }else{
                                        // Increment the number of asyncs we have running.
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

    // Nothing open. Callback -1 null
    mPlayerOpen = false;
    callback(-1, null);
    return;
}

// A helper function to prevent code duplication
function returnPausedTabHelper(asyncsRunning, pausedTabs, callback){
    if (--asyncsRunning.count == 0){
        // All done with the asyncs. Check if there were any paused tabs
        if (pausedTabs.length > 0){
            pausedTabs.sort(pausedTabCompare); // We want consistent returns on which is selected
            callback(pausedTabs[0].id, pausedTabs[0].details);
            return;
        }
    }
    mPlayerOpen = false;
    callback(-1, null);
    return;
}

// We need a compare function for sorting the paused tabs
function pausedTabCompare(tabA, tabB){
    if (tabA.id > tabB.id){
        return -1;
    }else if (tabA.id < tabB.id){
        return 1;
    }else{
        return 0;
    }
}

// A function used by the popup to open the default page if we want to
function OpenDefaultPlayer(){
    // Grab the value from storage, if it's there
    chrome.storage.local.get('default_open', function(data){
        // Check if it's set
        if (data.default_open){
            // Reset mPlayerOpen
            mPlayerOpen = false;
            // Check if we have a player
            FindTabPlayingMusic(function(tabId, playerDetails){
                if (!mPlayerOpen){
                    // Nothing open. Open one up
                    chrome.tabs.create({'url' : data.default_open});
                }
            });
        }
    });
}

// Update the information displayed within the extension
function UpdateInformation(){

    if (mDebug){
        console.log("background.js::UpdateInformation()");
    }
    
    // Have we already found a tab playing music?
    if (mLastPlayingTabId != -1){
        // Check if the tab still exists
        DoesTabExist(mLastPlayingTabId, function(exists){
            if (exists){
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
                // Need to look for a tab playing music
                lookForPlayingTabHelper();
            }
        });
    }else{
        lookForPlayingTabHelper();
    }
}

// Function to update the badge text
function UpdateBadgeText(){
    if (mIsPlaying){
        // Check if we scrolled within the last amount of time
        var curTime = Date.now();
        if ((curTime - mBadgeTextLastScrollTime) < (mBadgeTextScrollTime-5)){
            // Yikes. For some reason we scrolled too recently. Just don't scroll yet and wait.
            return;
        }

        // Save this time off as the last time we scrolled
        mBadgeTextLastScrollTime = curTime;
        
        // Build our badge text
        var badgeText = "        " + mArtist + " - " + mTrack + "        ";
        var badgeTextLength = badgeText.length;

        // Check if we need to reset our badge text scroll amount
        if (mBadgeTextScroll >= badgeTextLength - 8){
            mBadgeTextScroll = 0;
        }

        // Factor in any scrolling
        var scrolledBadgeText = badgeText.substring(mBadgeTextScroll);

        // Display it
        chrome.browserAction.setBadgeText({text: scrolledBadgeText});

        // Increment the scroll amount
        mBadgeTextScroll++;
    }else{
        // Clear the badge text
        chrome.browserAction.setBadgeText({text: ""});
    }
}

// Determine if a tab exists
function DoesTabExist(tabId, callback){
    // Use the chrome API to check
    chrome.tabs.get(tabId, function(tab){
        if (!tab){
            callback(false);
        }else{
            callback(true);
        }
    });
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

            // Check if the time is in ms for this player
            if (mPlayerDetails.has_time_in_ms){
                mCurrentTime = current_time;
            }else{
                // Save the current time for the popup
                mCurrentTime = GetMillisecondsFromTimeString(current_time);
            }
        });
    }

    if (mPlayerDetails.has_total_track_time){
      
        // Make a request to the content script for the total time
        SendPlayerRequest(tabId, mPlayerDetails, "get_total_time", function(total_time){
            // Log it if we've found the total time
            if (mDebug){
                console.log("background.js::PopulateInfo -- total time: " + total_time);
            }

            // Check if the time is in ms for this player
            if (mPlayerDetails.has_time_in_ms){
                mTotalTime = total_time;
            }else{
                // Save the total time for the popup
                mTotalTime = GetMillisecondsFromTimeString(total_time);
            }
        });
    }else if (mPlayerDetails.has_remaining_track_time){
       
        // Make a request to the content script for the remaining time
        SendPlayerRequest(tabId, mPlayerDetails, "get_remaining_time", function(remaining_time){
            // Log it if we've found the remaining time
            if (mDebug){
                console.log("background.js::PopulateInfo -- remaining time: " + remaining_time);
            }
            
            var remainingMillis = 0;
            
            // Check if the time is in ms for this player
            if (mPlayerDetails.has_time_in_ms){
                remainingMillis = remaining_time;
            }else{
                remainingMillis = GetMillisecondsFromTimeString(remaining_time);
            }
            
            // Remaining may or may not be a negative number.
            mTotalTime = mCurrentTime + Math.abs(remainingMillis);
        });
    }else if (mPlayerDetails.has_progress_percentage){
      
        // Get the progress from the player
        SendPlayerRequest(tabId, mPlayerDetails, "get_progress", function(currentProgress){
            // This player has a progress percentage, so let's calculate the times.
            if (mFirstUpdateProgress != null){
                // Get the current timestamp
                var currentTimestamp = Date.now();

                // Check if this is the same track that was playing last time we checked
                if (mTrack != mLastUpdateTrack || !mIsPlaying){
                    // Update the last update track and reset values
                    mLastUpdateTrack = mTrack;
                    mFirstUpdateTimestamp = currentTimestamp;
                    mFirstUpdateProgress = currentProgress;
                }

                if (mFirstUpdateTimestamp > 0){
                    // Calculate the difference from then to now
                    var changeInTimestamp = currentTimestamp - mFirstUpdateTimestamp;

                    // Calculate the difference in the currentProgress from the last update
                    var changeInProgress = currentProgress - mFirstUpdateProgress;

                    // Ensure we actually had a change
                    if (changeInProgress > 0){
                        // Calculate the total time
                        mTotalMilliseconds = changeInTimestamp/changeInProgress;

                        // Finally, build the string and save it off in the globals
                        mTotalTime = mTotalMilliseconds;
                    }

                    // Ensure the total time is at least 0
                    if (mTotalMilliseconds > 0 && mTotalTime != null){
                        // Calculate the current time
                        var currentTime = mTotalMilliseconds * currentProgress;

                        // Now, build the string
                        mCurrentTime = currentTime;
                    }else{
                        // Null out current time
                        mCurrentTime = null;
                    }
                }
            }else{
                // First time through, apparently. Update the timestamp
                mFirstUpdateTimestamp = Date.now();
            }
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
}

// A function to convert a millisecond value into a string
function GetTimeStringForMilliseconds(milliseconds){
    // Get the current time overall seconds
    var totalSeconds = milliseconds / 1000;

    var totalHours = Math.floor(totalSeconds/3600)
    var totalMins = Math.floor(totalSeconds/60) % 60;
    var totalSecs = totalSeconds % 60;

    // Construct the strings we need
    var sTotalSecs = "" + totalSecs;
    if (totalSecs < 10){
        sTotalSecs = "0" + totalSecs;
    }

    var sTotalMins = "" + totalMins;
    var sTotalHours = "";
    if (totalHours > 0) {                
        if (totalMins < 10){
            sTotalMins = "0" + totalMins;
        }
        sTotalHours = "" + totalHours + ":"
    }

    // Return the total time value
    return sTotalHours +  sTotalMins + ":" + sTotalSecs;
}

// A function to parse a time string into milliseconds
function GetMillisecondsFromTimeString(timeString) {

    // Get ints for the time and deal with the negative symbol
    // negative or not, the text will always be the last group,
    var splitNeg =  timeString.split("-");        
    var splitTime = splitNeg[splitNeg.length - 1].split(":");
    
    // The rightmost element as seconds
    var seconds = parseInt(splitTime[splitTime.length - 1]);
    
    // The next one from the right as minutes, only if it exists we'll add it.
    var minsText = splitTime[splitTime.length - 2];
    if (minsText) {
        seconds += parseInt(minsText) * 60;
       
       // And the next one from the right as hours, same thing.
        var hoursText = splitTime[splitTime.length - 3];
        if (hoursText) {
            seconds += parseInt(hoursText) * 3600;
        }
    }
    
    //Determine wether is negative or not
    var factor = 1;
    if (splitNeg.length > 1) {
        factor = -1;
    }
    
    return seconds * 1000 * factor;
}

// A function to interact with the scrobbler
function DoLastFmWork(){
    // Make sure we are playing
    if (mIsPlaying){
        // Ensure we have a track and artist
        if (mTrack != null && mArtist != null){
            // Cool. Tell Last.fm we are playing 
            RunLastFmQuery({method: "track.updateNowPlaying",
                            track: mTrack,
                            artist: mArtist}, false, null);
        }

        // Check if the current time is greater than 30 seconds
        if (mCurrentTime > 30 * 1000){
            // Determine if we've already scrobbled this song
            var curScrobble = mTrack + " " + mArtist;
            if (curScrobble != mLastScrobble){
                // Get the percentage
                var percentage = mCurrentTime/mTotalTime;                
                if ((percentage >= 0.5 && percentage < 1) || mCurrentTime >= (240 * 1000)){
                    // Mark the song as not new
                    mNewTrack = false;
                    
                    // Attempt to scrobble!
                    RunLastFmQuery(
                        {
                            method: "track.scrobble",
                            track: mTrack,
                            artist: mArtist,
                            timestamp: Math.round((new Date()).getTime() / 1000).toString()
                        }, false, function(result){
                            // We need to check if it's failed
                            if (result.message){
                                // TODO
                            }
                        });

                    // TODO -- Move this into the result.message block
                    // Save the scrobble as the last scrobble to prevent doing it again.
                    mLastScrobble = curScrobble;
                }
            }
        }
    }

    // Finally, iterate through any old failed requests and try to scrobble
    // TODO
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
        // Now ensure we have a content script already running
        chrome.tabs.sendMessage(tabId, { ping : "ping" }, function(response){
            if (response){
                // Tab has content script running. Send it the request.
                chrome.tabs.sendMessage(
                    tabId,
                    {
                        "playerDetails" : playerDetails,
                        "scriptKey" : whatIsNeeded
                    },
                    function(result){
                        if (mDebug){
                            console.log("background.js::SendPlayerRequest(" +
                                        tabId + "," + whatIsNeeded + "," + result + ")");
                        }
                        callback(result);
                    }
                );
            }else{
                // Need to re-inject everything. Either new install or update.

                if (mDebug){
                    console.log("background.js::No contentscript detected on tab " + tabId + ". Re-injecting...");
                }

                // Get the manifest
                chrome.manifest = chrome.app.getDetails();
                var scripts = chrome.manifest.content_scripts[0].js;
                for (var i = 0; i < scripts.length; i++){
                    if(mDebug){
                        console.log("background.js::Injecting " +
                                    scripts[i] + " into tab " + tabId);
                    }
                    
                    chrome.tabs.executeScript(tabId,
                        {
                            file: scripts[i],
                            allFrames: false,
                            runAt: "document_start"
                    });
                }
            }
        });
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

// A function to check if the badge text is enabled
function IsBadgeTextEnabled(callback){
    // Check if we've already looked in storage within the last 5 seconds
    var curTime = Date.now();
    if ((curTime - mBadgeTextLastStorageCheck) > 5000){
        // Update the last time we checked
        mBadgeTextLastStorageCheck = curTime;
        
        // Query the local storage for the value we are looking for
        chrome.storage.local.get('badge_text_enabled', function(data){
            // Save it off
            mBadgeTextEnabled = data.badge_text_enabled;
            
            // Callback with the value
            callback(mBadgeTextEnabled);
        });
    }else{
        // Callback with the cached value
        callback(mBadgeTextEnabled);
    }
}

// A function to do some processing if this is the first run
function ProcessFirstRun(){
    // Query local storage for an init value
    chrome.storage.local.get('init_complete', function(result){
        if (!result.init_complete){
            // Do some init processing
            chrome.storage.local.set({'scrobbling_enabled' : true,
                                      'badge_text_enabled' : true,
                                      'init_complete' : true}, function(){
                if (mDebug){
                    console.log("background.js::Init now completed");
                }
            });
        }else{
            // We're good.
            if (mDebug){
                console.log("background.js::Init already completed.");
            }
        }
    });
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

    // Set the bacground color for the badge
    chrome.browserAction.setBadgeBackgroundColor({color: "#000000"});
    
    // Update our information once every ten seconds.
    window.setInterval(function() {
        UpdateInformation();
    }, 10000);

    // Check if this is the first run
    ProcessFirstRun();

    // Update our badge text once every half second
    window.setInterval(function(){
        // Check if it's enabled
        IsBadgeTextEnabled(function(result){
            if (result){
                UpdateBadgeText();
            }else{
                chrome.browserAction.setBadgeText({text: ""});
            }
        });
    }, mBadgeTextScrollTime);

    // We want to update last.fm information once every 15 seconds
    window.setInterval(function() {
        // Check if the user wants us to do last.fm work first
        IsScrobblingEnabled(function(result){
            if(result){
                DoLastFmWork();
            }else{
                if(mDebug){
                    console.log("background.js::Scrobbling disabled. Not doing last.fm work for now.");
                }
            }
        });
    }, 15000);
});

