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
	this.isPlaying = false;
	this.isPaused = false;
	this.artist = null;
	this.track = null;
	this.artUrl = null;
	this.currentTime = null;
	this.totalTime = null;
	this.isShuffled = false;
	this.isRepeatOne = false;
	this.isRepeatAll = false;
	this.isRepeatOff = false;
	this.isThumbedUp = false;
	this.isThumbedDown = false;

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
                    		this.logger.log("SendPlayerRequest(" +
                    			tabId + "," + whatIsNeeded + "," + result + ")");
                    		callback(result);
                    		return;
                    	}, this));
                }else{
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
            }, this));
	    }else{
	    	callback(false);
	    }
	}
}

/**
 * Set the tab and details for the player handler
 */
PlayerHandler.prototype.SetTabAndDetails = function(tabId, playerDetails){
	this.lastPlayingTabId = tabId;
	this.playerDetails = playerDetails;
}

/**
 * Populate everything we can find out about the player
 */
PlayerHandler.prototype.PopulateInformation = function(){
	// TODO
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
    // First, ensure that something is playing
    if (this.playerDetails != null && this.lastPlayingTabId > 0){
        // Cool. Let's do it
        this.sendPlayerRequest(clickWhat, function(result){
        	callback(result);
        });
    }
}