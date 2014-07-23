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
 */
function TabHandler(){
	this.logger = Logger.getInstance();
	this.lastPlayingWindowId = -1;
	this.lastPlayingTabId = -1;
	this.playerOpen = false;

	// Temporarily turn off async to load the JSON in
    $.ajaxSetup({ async : false });

    // Deserialize the individual players JSON
    $.getJSON(ALL_PLAYERS_JSON, function(data) {
        this.allPlayers = data;

        this.logger.log(allPlayers);
    });

    // Turn async back on
    $.ajaxSetup({ async : true });

    //// Private methods ////

    /**
     * Helper method for returning a paused tab
     * @param  {Object}   asyncsRunning
     * @param  {Array}   pausedTabs
     * @param  {Function} callback
     */
    var returnPausedTabHelper = function(asyncsRunning, pausedTabs, callback){
    	this.logger.log("returnPausedTabHelper() -- asyncsRunning = " +
    		(asyncsRunning.count - 1) + ", pausedTabs = " + pausedTabs);

        // Decrement asyncsRunning and check if we are done
        if (--asyncsRunning.count == 0){
            // All done with the asyncs. Check if there were any paused tabs
            if (pausedTabs.length > 0){
                pausedTabs.sort(pausedTabCompare); // We want consistent returns on which is selected
                mLastPlayingWindowId = pausedTabs[0].windowId;
                callback(pausedTabs[0].id, pausedTabs[0].details);
                return;
            }else{
                // Nothing has been found. Sad!
                callback(-1, null);
            }
        }else if (asyncsRunning.count < 0){
            // Found nothing. Not a good sign.
            callback(-1, null);
            return;
        }
    }

	/**
	 * Compare two tabs for sorting (by id)
	 * @param  {Object:tab} tabA
	 * @param  {Object:tab} tabB
	 * @return {int} -1 if tabA > tabB, 1 if vice-versa, 0 if equal
	 */
    var pausedTabCompare = function(tabA, tabB){
    	if (tabA.id > tabB.id){
    		return -1;
    	}else if (tabA.id < tabB.id){
    		return 1;
    	}else{
    		return 0;
    	}
    }
}

/**
 * Iterate through tabs finding those playing and paused
 * @param callback with the tab id upon completion
 */
TabHandler.prototype.FindTabPlayingMusic = function(callback){
	this.logger.log("FindTabPlayingMusic");

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
                        this.playerOpen = true;

                        this.logger.log("FindTabPlayingMusic() -- Found " +
                                        curPlayer + " at tab " + curTab.id);

                        // Increment the number of asyncs we have running
                        asyncsRunning.count++;

                        // We want some closure to preserve the tabId for all callbacks.
                        (function (tabId, curWindowId){
                            // Increment asyncs again
                            asyncsRunning.count++;
                            
                            // Load the details for this player type into memory
                            $.getJSON(curPlayer.json_loc, function(playerDetails) {
                                this.logger.log("FindTabPlayingMusic() -- details = " + playerDetails);

                                // A flag to see if we have already returned a player
                                var alreadyReturned = false;

                                // Increment asyncs running
                                asyncsRunning.count++;

                                // Is it currently playing music?
                                IsPlayingMusic(tabId, playerDetails, function(isPlaying){
                                    if (isPlaying){
                                        // Sweet. Found one we wanted.
                                        this.logger.log("FindTabPlayingMusic() -- Tab " + tabId + " is playing music!");
                                        
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
                                                this.logger.log("FindTabPlayingMusic() -- Tab " + tabId + " is paused!");
                                                
                                                // Found a paused tab. Save it off
                                                pausedTabs.push(
                                                    {
                                                        "id" : tabId,
                                                        "windowId" : curWindowId,
                                                        "details" : playerDetails
                                                    });
                                            }else{
                                                this.logger.log("FindTabPlayingMusic() -- Tab " + tabId + " is not playing or paused.");
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