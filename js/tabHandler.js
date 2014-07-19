/**
 * Copyright 2014 Kyle Kamperschroer (http://kylek.me)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
**/

/**
 * Class for handling finding a tab playing music (or paused)
 * as well as any other tab operations.
 * @param {Object} logger for logging
 */
function TabHandler(){
	this.logger = Logger.getInstance();
	this.lastPlayingWindowId = -1;
	this.lastPlayingTabId = -1;

	// Temporarily turn off async to load the JSON in
    $.ajaxSetup({ async : false });

    // Deserialize the individual players JSON
    $.getJSON(ALL_PLAYERS_JSON, function(data) {
        this.allPlayers = data;

        logger.log(allPlayers);
    });

    // Turn async back on
    $.ajaxSetup({ async : true });
}

/**
 * Iterate through tabs finding those playing and paused
 * @param callback with the tab id upon completion
 */
TabHandler.prototype.FindTabPlayingMusic = function(callback){
	logger.log("FindTabPlayingMusic");

	// TODO -- clean this up. Figure out a better way.

    // An array of tabs currently paused
    var pausedTabs = [];

    // A counter of async calls running. (starts at 1 before our first async)
    var asyncsRunning = { "count" : 1 };
    
    // Cycle through each tab
    chrome.windows.getAll({populate: true}, function(windows){
        for (var window=0; window<windows.length; window++){
            for (var i=0; i<windows[window].tabs.length; i++){
                // Get the current tab
                var curTab = windows[window].tabs[i];

                // Get the current window id
                var windowId = windows[window].id;

                // Now iterate through our patterns, checking if
                // this is a valid music player
                for (var curPlayer in mAllPlayers){
                    if (curTab.url.match(mAllPlayers[curPlayer]["pattern"])){
                        // We have found one of our players at this point
                        
                        // Save some information off
                        var curPlayer = mAllPlayers[curPlayer];

                        // A flag to ensure we know we already have seen a player
                        mPlayerOpen = true;

                        mLogger.log("FindTabPlayingMusic() -- Found " +
                                        curPlayer + " at tab " + curTab.id);

                        // Increment the number of asyncs we have running
                        asyncsRunning.count++;

                        // We want some closure to preserve the tabId for all callbacks.
                        (function (tabId, curWindowId){
                            // Increment asyncs again
                            asyncsRunning.count++;
                            
                            // Load the details for this player type into memory
                            $.getJSON(curPlayer.json_loc, function(playerDetails) {
                                mLogger.log("FindTabPlayingMusic() -- details = " + playerDetails);

                                // A flag to see if we have already returned a player
                                var alreadyReturned = false;

                                // Increment asyncs running
                                asyncsRunning.count++;

                                // Is it currently playing music?
                                IsPlayingMusic(tabId, playerDetails, function(isPlaying){
                                    if (isPlaying){
                                        // Sweet. Found one we wanted.
                                        mLogger.log("FindTabPlayingMusic() -- Tab " + tabId + " is playing music!");
                                        
                                        if (!alreadyReturned){
                                            alreadyReturned = true;
                                            mLastPlayingWindowId = curWindowId;
                                            callback(tabId, playerDetails);
                                            return;
                                        }
                                    }else{
                                        // Increment the number of asyncs we have running.
                                        asyncsRunning.count++;
                                        
                                        // Check if it was paused instead.
                                        IsPaused(tabId, playerDetails, function(isPaused){
                                            if (isPaused){
                                                mLogger.log("FindTabPlayingMusic() -- Tab " + tabId + " is paused!");
                                                
                                                // Found a paused tab. Save it off
                                                pausedTabs.push(
                                                    {
                                                        "id" : tabId,
                                                        "windowId" : curWindowId,
                                                        "details" : playerDetails
                                                    });
                                            }else{
                                                mLogger.log("FindTabPlayingMusic() -- Tab " + tabId + " is not playing or paused.");
                                            }
                                            // If everything's done,
                                            // returned a paused tab
                                            returnPausedTabHelper(asyncsRunning,
                                                                  pausedTabs,
                                                                  callback);

                                        });
                                    }
                                    // Decrement our asyncs running. See if we are
                                    // done or not.
                                    returnPausedTabHelper(asyncsRunning,
                                                          pausedTabs,
                                                          callback);
                                });
                                // Decrement our asyncs running. See if we are
                                // done or not.
                                returnPausedTabHelper(asyncsRunning,
                                                      pausedTabs,
                                                      callback);
                            });
                            // Decrement our asyncs running. See if we are
                            // done or not.
                            returnPausedTabHelper(asyncsRunning,
                                                  pausedTabs,
                                                  callback);
                        })(curTab.id, windowId)
                    }
                }
            }
        }
        returnPausedTabHelper(asyncsRunning, pausedTabs, callback);
    });
}