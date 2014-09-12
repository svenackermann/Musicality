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
 * @param {Object} playerHandler for dealing with the players
 */
function TabHandler(playerHandler){
	this.logger = Logger.getInstance();
	this.lastPlayingWindowId = -1;
	this.playerOpen = false;
	this.playerHandler = playerHandler;

	// Temporarily turn off async to load the JSON in
    $.ajaxSetup({ async : false });

    // Deserialize the individual players JSON
    $.getJSON(ALL_PLAYERS_JSON, $.proxy(function(data){
        this.allPlayers = data;

        this.logger.log(this.allPlayers);

        // Immediately iterate through each and save off it's json
        this.players = {};
        for(var curPlayerName in this.allPlayers){
            var curPlayer = this.allPlayers[curPlayerName];
            $.getJSON(curPlayer.json_loc, $.proxy(function(playerDetails) {
                this.players[curPlayerName] = playerDetails;
            }, this));
        }
    }, this));

    // Turn async back on
    $.ajaxSetup({ async : true });

    //// Private methods ////

    /**
     * Helper method for returning a paused tab
     * @param  {Object}   asyncsRunning
     * @param  {Array}   pausedTabs
     * @param  {Function} callback
     */
    this.returnPausedTabHelper = function(asyncsRunning, pausedTabs, callback){
    	this.logger.log("returnPausedTabHelper() -- asyncsRunning = " +
    		(asyncsRunning.count - 1) + ", pausedTabs = " + pausedTabs);

        // Decrement asyncsRunning and check if we are done
        if (--asyncsRunning.count === 0){
            // All done with the asyncs. Check if there were any paused tabs
            if (pausedTabs.length > 0){
                pausedTabs.sort(this.pausedTabCompare); // We want consistent returns on which is selected
                this.lastPlayingWindowId = pausedTabs[0].windowId;
                callback(pausedTabs[0].id, pausedTabs[0].details);
                return;
            }else{
                // Nothing has been found. Sad!
                callback(-1, {});
                return;
            }
        }else if (asyncsRunning.count < 0){
            // Found nothing. Not a good sign.
            callback(-1, {});
            return;
        }
    };

	/**
	 * Compare two tabs for sorting (by id)
	 * @param  {Object:tab} tabA
	 * @param  {Object:tab} tabB
	 * @return {int} -1 if tabA > tabB, 1 if vice-versa, 0 if equal
	 */
    this.pausedTabCompare = function(tabA, tabB){
    	if (tabA.id > tabB.id){
    		return -1;
    	}else if (tabA.id < tabB.id){
    		return 1;
    	}else{
    		return 0;
    	}
    };

    /**
     * Given a tab and window, iterate through players and see if any match
     * @param  {int} windowId
     * @param  {Object} curTab
     * @param  {Object} asyncsRunning Object for keeping track of asyncs running
     * @param  {Array} pausedTabs
     * @param  {function} callback
     */
    this.checkCurrentTabForPlayers = function(windowId, curTab, asyncsRunning, pausedTabs, callback){
        // Now iterate through our patterns, checking if
        // this is a valid music player
        for (var curPlayer in this.allPlayers){
            if (curTab.url.match(this.allPlayers[curPlayer].pattern)){
                // We have found one of our players at this point
                
                // Save some information off
                var curPlayerDetails = this.players[curPlayer];

                // A flag to ensure we know we already have seen a player
                this.playerOpen = true;

                this.logger.log("checkCurrentTabForPlayers() -- Found " +
                                curPlayerDetails.name + " at tab " + curTab.id);

                asyncsRunning.count++;

                // Pass it along to check the current player for status
                this.checkCurrentPlayerForStatus(curPlayerDetails, windowId, curTab.id, asyncsRunning, pausedTabs, callback);
            }
        }
    };

    /**
     * Helper method that checks the current player for it's playback status
     * @param  {Object}   playerDetails
     * @param  {int}   windowId
     * @param  {int}   tabId
     * @param  {Object}   asyncsRunning
     * @param  {Array}   pausedTabs
     * @param  {Function} callback
     */
    this.checkCurrentPlayerForStatus = function(playerDetails, windowId, tabId, asyncsRunning, pausedTabs, callback){
        if (playerDetails !== undefined){
            this.logger.log("checkCurrentPlayerForStatus() -- details = " + playerDetails.name);

            // A flag to see if we have already returned a player
            var alreadyReturned = false;

            // Increment asyncs running
            asyncsRunning.count++;

            // Is it currently playing music?
            this.playerHandler.IsPlayingMusic(tabId, playerDetails, $.proxy(function(isPlaying){
                if (isPlaying){
                    // Sweet. Found one we wanted.
                    this.logger.log("checkCurrentPlayerForStatus() -- Tab " + tabId + " is playing music!");

                    // Keep track of what players users are using in order to
                    // know which are the most important to support.
                    _gaq.push(['_setCustomVar',
                        1,
                        'Player Name',
                        playerDetails.name,
                        3]);
                    
                    // Track the event
                    _gaq.push(['_trackEvent',
                        'Found Player',
                        'Background'
                        ]);
                    
                    if (!alreadyReturned){
                        alreadyReturned = true;
                        this.lastPlayingWindowId = windowId;
                        callback(tabId, playerDetails);
                        return;
                    }
                }else{
                    // Increment the number of asyncs we have running.
                    asyncsRunning.count++;
                    
                    // Check if it was paused instead.
                    this.playerHandler.IsPaused(tabId, playerDetails, $.proxy(function(isPaused){
                        if (isPaused){
                            this.logger.log("FindTabPlayingMusic() -- Tab " + tabId + " is paused!");
                            
                            // Found a paused tab. Save it off
                            pausedTabs.push(
                                {
                                    "id" : tabId,
                                    "windowId" : windowId,
                                    "details" : playerDetails
                                });
                        }else{
                            this.logger.log("FindTabPlayingMusic() -- Tab " + tabId + " is not playing or paused.");
                        }
                        // If everything's done,
                        // returned a paused tab
                        this.returnPausedTabHelper(asyncsRunning,
                        	pausedTabs,
                        	callback);

                    }, this));
                }
                // Decrement our asyncs running. See if we are
                // done or not.
                this.returnPausedTabHelper(asyncsRunning,
                	pausedTabs,
                	callback);
            }, this));
            // Decrement our asyncs running. See if we are
            // done or not.
            this.returnPausedTabHelper(asyncsRunning,
            	pausedTabs,
            	callback);
        }
    };
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
    chrome.windows.getAll({populate: true}, $.proxy(function(windows){
        for (var window=0; window<windows.length; window++){
            for (var i=0; i<windows[window].tabs.length; i++){
            	// Get the window and tab ids
                var windowId = windows[window].id;
                var curTab = windows[window].tabs[i];
                
                // Hand off to checkCurrentTabForPlayers
                this.checkCurrentTabForPlayers(
                	windowId,
                	curTab,
                	asyncsRunning,
                	pausedTabs,
                	callback
                );
            }
        }
        this.returnPausedTabHelper(asyncsRunning, pausedTabs, callback);
    }, this));
};

/**
 * Opens the deafult player
 */
TabHandler.prototype.OpenDefaultPlayer = function(){
    // Grab the value from storage, if it's there
    chrome.storage.local.get('default_open', $.proxy(function(data){
        // Check if it's set
        if (data.default_open){
            // Default mPlayerOpen to false before we check again
            this.playerOpen = false;

            // Check if we have a player
            this.FindTabPlayingMusic($.proxy(function(tabId, playerDetails){
                if (!this.playerOpen){
                    // Nothing open. Open one up
                    chrome.tabs.create({'url' : data.default_open});
                }
            }, this));
        }
    }, this));
};

/**
 * Re-directs the window/tab focus to whatever player is playing
 */
TabHandler.prototype.GoToNowPlayingTab = function(){
    // Update the winow to be focused
    chrome.windows.update(this.lastPlayingWindowId,
    {
        focused: true
    });

    // Change the current tab to the current player
    chrome.tabs.update(this.playerHandler.GetLastPlayingTabId(), {
        selected: true
    });
};

/**
 * Determine if the provided tab exists
 * @param {int}   tabId
 * @param {Function} callback
 */
TabHandler.prototype.DoesTabExist = function(tabId, callback){
    // Use the chrome API to check
    chrome.tabs.get(tabId, function(tab){
        if (!tab){
            callback(false);
            return;
        }else{
            callback(true);
            return;
        }
    });
};