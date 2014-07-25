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
 * A class to handle all interaction with the player
 */
function PlayerHandler(){
	this.logger = Logger.getInstance();
	this.lastPlayingTabId = -1;
	this.playerDetails = null;
	this.currentInfo = {}; // contains track information
	this.lastPopulateTime = 0;

	/**
	 * Send a particular request to the player using members.
	 * @param  {String}   whatIsNeeded
	 * @param  {Function} callback function with result of action
	 */
	this.sendPlayerRequest = function(whatIsNeeded, callback){
		// Call the static version with our members
		this.sendPlayerStaticRequest(
			this.lastPlayingTabId,
			this.playerDetails,
			whatIsNeeded,
			callback);
	}

	/**
	 * Statically send the player a request and callback results
	 * @param  {int}   tabId
	 * @param  {Object}   playerDetails
	 * @param  {String}   whatIsNeeded
	 * @param  {Function} callback
	 */
	this.sendPlayerStaticRequest = function(tabId, playerDetails, whatIsNeeded, callback){
		this.logger.log("SendPlayerRequest for " + whatIsNeeded);

  		// Check if we have the player details
  		if (playerDetails != null){
            // Now ensure we have a content script already running
            chrome.tabs.sendMessage(tabId, { ping : "ping" }, $.proxy(function(response){
            	if (response){
                    // Tab has content script running. Send it the request.
                    chrome.tabs.sendMessage(
                    	tabId,
                    	{
                    		"playerDetails" : playerDetails,
                    		"scriptKey" : whatIsNeeded
                    	},
                    	$.proxy(function(result){
                    		this.logger.log("SendPlayerRequest for " + whatIsNeeded + " callback with " + result);

                    		if (callback){
                    			callback(result);
                    		}
                    	}, this));
                }else{
                	// Inject an re-request information
                	this.reinjectContentScript(
                		tabId,
                		playerDetails,
                		whatIsNeeded,
                		callback);
                }
            }, this));
	    }
	}

	/**
	 * Reinject content script into the provided tab
	 * @param  {int}   tabId
	 * @param  {Object}   playerDetails
	 * @param  {String}   whatIsNeeded
	 * @param  {Function} callback
	 */
	this.reinjectContentScript = function(tabId, playerDetails, whatIsNeeded, callback){
        // Need to re-inject everything. Either new install or update.
        this.logger.log("No contentscript detected on tab " + tabId + ". Re-injecting...");

        // Get the manifest
        chrome.manifest = chrome.app.getDetails();
        var scripts = chrome.manifest.content_scripts[0].js;
        for (var i = 0; i < scripts.length; i++){
        	this.logger.log("Injecting " +
        		scripts[i] + " into tab " + tabId);
        
        	chrome.tabs.executeScript(tabId,
        	{
        		file: scripts[i],
        		allFrames: false,
        		runAt: "document_start"
        	}, $.proxy(function(){
        		// Re-try the call
        		this.sendPlayerStaticRequest(
        			tabId,
        			playerDetails,
        			whatIsNeeded,
        			callback);
        	}, this));
        }
	}

	/**
	 * Helper method for determining and saving an individual detail from the player
	 * @param  {String}   whatToGet
	 * @param  {String}   key to store in our details as
	 * @param  {function} callback (optional)
	 */
	this.getValueFromPlayer = function(whatToGet, key, callback){
		this.sendPlayerRequest(whatToGet, $.proxy(function(result){
			if (result != this.currentInfo[key]){
				this.currentInfo[key] = result;
			}

			if (callback){
				callback(result);
			}
		}, this));
	}
}

/**
 * Set the tab and details for the player handler
 */
PlayerHandler.prototype.SetTabAndDetails = function(tabId, playerDetails){
	if (this.lastPlayingTabId != tabId ||
		this.playerDetails.name != playerDetails.name){

		// Save new data and reset fields
		this.lastPlayingTabId = tabId;
	    this.playerDetails = playerDetails;

	    this.currentInfo = {};
	}
}

/**
 * Clear info. Only to be called when nothing is playing or paused.
 */
PlayerHandler.prototype.ClearInfo = function(){
	this.currentInfo = {};
}

/**
 * Populate everything we can find out about the player
 */
PlayerHandler.prototype.PopulateInformation = function(){
	if (this.lastPlayingTabId < 0 || this.playerDetails == undefined){
		return;
	}

	// To prevent spamming the DOM too much, prevent calls to populate more
	// than once every quarter second
   	var curTime = Date.now();
   	if((curTime - this.lastPopulateTime) >= 250){
   		this.lastPopulateTime = curTime;

   		// Get all the data!
   		this.getValueFromPlayer("get_track", "track");
   		this.getValueFromPlayer("get_artist", "artist");
   		this.getValueFromPlayer("get_album_art", "artUrl");
   		this.getValueFromPlayer("is_playing", "isPlaying");
   		this.getValueFromPlayer("is_paused", "isPaused");
   		this.getValueFromPlayer("is_shuffled", "isShuffled");
   		this.getValueFromPlayer("is_repeat_off", "isRepeatOff");
   		this.getValueFromPlayer("is_repeat_all", "isRepeatAll");
   		this.getValueFromPlayer("is_repeat_one", "isRepeatOne");
   		this.getValueFromPlayer("is_thumbed_up", "isThumbedUp");
   		this.getValueFromPlayer("is_thumbed_down", "isThumbedDown");

   		// Times are a little more finicky to deal with
   		var hasTimeInMs = this.playerDetails.has_time_in_ms;
   		if (this.playerDetails.has_current_track_time){
   			this.getValueFromPlayer(
   				"get_current_time",
   				"ignore",
   				$.proxy(function(result){
   					if (!hasTimeInMs){
   						this.currentInfo.currentTime = Helper.TimeToMs(result);
   					}else{
   						this.currentInfo.currentTime = result;
   					}
   				}, this));
   		}

   		if (this.playerDetails.has_total_track_time){
   			this.getValueFromPlayer(
   				"get_total_time",
   				"ignore",
   				$.proxy(function(result){
   					if (!hasTimeInMs){
   						this.currentInfo.totalTime = Helper.TimeToMs(result);
   					}else{
   						this.currentInfo.totalTime = result;
   					}
   				}, this));
   		}else if (this.playerDetails.has_remaining_track_time){
   			this.getValueFromPlayer(
   				"get_remaining_time",
   				"ignore",
   				$.proxy(function(result){
   					var remainingMillis = result;
   					if (!hasTimeInMs){
   						remainingMillis = Helper.TimeToMs(remainingMillis);
   					}

   					// Update total time
   					this.currentInfo.totalTime = this.currentInfo.currentTime + Math.abs(remainingMillis);
   				}, this));
   		}
   	}
}

/**
 * Get the last known tab id that was playing
 */
PlayerHandler.prototype.GetLastPlayingTabId = function(){
	return this.lastPlayingTabId;
}

/**
 * Statically determine if the given tab is playing music
 * @param {int}   tabId
 * @param {Object}   playerDetails
 * @param {Function} callback
 * @return {boolean} true if tab is playing music, false if not
 */
PlayerHandler.prototype.IsPlayingMusic = function(tabId, playerDetails, callback){
    // Only check if the tabId > 0
    if (tabId > 0){
        // Send a request to the tab provided
        this.sendPlayerStaticRequest(
        	tabId,
        	playerDetails,
            "is_playing",
            callback);
    }else{
    	callback(false);
    }
}

/**
 * Determine if the player is still playing music
 */
PlayerHandler.prototype.IsStillPlayingMusic = function(callback){
	// Call the static version with our members
	return this.IsPlayingMusic(
		this.lastPlayingTabId,
		this.playerDetails,
		callback);
}

/**
 * Statically determine if the tab is paused
 * @param {int}   tabId
 * @param {Object}   playerDetails
 * @param {Function} callback
 * @return {boolean} True if the tab is paused, false if not.
 */
PlayerHandler.prototype.IsPaused = function(tabId, playerDetails, callback){
    // Only check if the tabId > 0
    if (tabId > 0){
        // Send a request to the tab provided
        this.sendPlayerStaticRequest(
        	tabId,
        	playerDetails,
            "is_paused",
            callback);
    }else{
    	callback(false);
    }
}

/**
 * Perform an action, such as clicking play or next
 * @param {string} clickWhat is what to click
 */
PlayerHandler.prototype.ClickSomething = function(clickWhat, callback){
	this.logger.log("ClickSomething() -- " + clickWhat);
    // First, ensure that something is playing
    if (this.playerDetails != null && this.lastPlayingTabId > 0){
        // Cool. Let's do it
        this.sendPlayerRequest(clickWhat, $.proxy(function(result){
        	this.logger.log("ClickSomething callback -- " + result);
        	// Reset last update and immediately re-populate
        	this.lastPopulateTime = 0;

        	// Wait just a tenth of a second before populating
        	window.setTimeout(
        		(function(self){
        			return function(){
        				self.PopulateInformation();
        			}
        		})(this),
    		100);

        	// Callback with the result
        	if(callback){
        		callback(result);
        	}
        }, this));
    }
}

/**
 * Retrieve the current track information
 * @return {Object} Current track/playback information
 */
PlayerHandler.prototype.GetPlaybackInfo = function(){
	return this.currentInfo;
}

/**
 * Retrieve the player details
 */
PlayerHandler.prototype.GetPlayerDetails = function(){
	return this.playerDetails;
}