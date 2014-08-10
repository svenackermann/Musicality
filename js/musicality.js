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
 * The master controller, the one and only; Musicality!
 */
function Musicality(){
	this.logger = Logger.getInstance();
	this.playerHandler = new PlayerHandler();
	this.tabHandler = new TabHandler(this.playerHandler);
    this.toaster = new Toaster(this.playerHandler);
    this.iconHandler = new IconHandler(this.playerHandler);
    this.scrobbler = new Scrobbler(this.playerHandler);
    this.shortcutHandler = new ShortcutHandler(this.playerHandler);


	// Private functions //

	/**
	 * Deal with some things when starting up, and manage first run
	 */
	this.processFirstRun = function(){
        // Query local storage for an init value
        chrome.storage.local.get('init_complete', $.proxy(function(result){
        	if (!result.init_complete){
                // Do some init processing
                chrome.storage.local.set({'scrobbling_enabled' : true,
                	'badge_text_enabled' : true,
                	'init_complete' : true,
                	'toaster_enabled' : true}, $.proxy(function(){
                		this.logger.log("Init now completed");
                	}, this));
            }else{
                // We're good.
                this.logger.log("Init already completed.");
            }
        }, this));

        // Check if we've shown the user the current welcome page
        chrome.storage.local.get('welcome_shown', function(result){
        	if (!result.welcome_shown){
                // Save off that we've shown it
                chrome.storage.local.set({'welcome_shown' : true}, function(){
                    // Show the welcome page
                    chrome.tabs.create({'url' : chrome.extension.getURL('html/welcome.html')});
                });
            }
        });
    }

    /**
     * Initialize the execution loop
     */
    this.startExecutionLoop = function(){
    	this.logger.log("Beginning execution loop");

    	this.updateInformation();

    	window.setInterval(
            (function(self){
                return function(){
                    self.updateInformation();
                }
            })(this),
    	5000);
    }

	/**
	 * Update information method. Called periodically by the execution loop
	 */
	this.updateInformation = function(){
		this.logger.log("UpdateInformation()");

        // Have we already found a tab playing music?
        var lastPlayingTabId = this.playerHandler.GetLastPlayingTabId();
        if (lastPlayingTabId != -1){
            // Check if the tab still exists
            this.tabHandler.DoesTabExist(lastPlayingTabId, $.proxy(function(exists){
            	if (exists){
                    // Is it still playing music?
                    this.playerHandler.IsStillPlayingMusic( $.proxy(function(isPlaying){
                    	if (isPlaying){
                            this.logger.log("Same player is still playing. Populating...");
                            // Grab the different pieces from that tab, if we are displaying
                            this.playerHandler.PopulateInformation();
                        }else{
                        	this.lookForPlayingTabHelper();
                        }
                    }, this));
                }else{
                    // Clear the info in player handler, since it's gone
                    this.playerHandler.ClearInfo();

                    // Need to look for a tab playing music
                    this.lookForPlayingTabHelper();
                }
            }, this));
        }else{
            this.lookForPlayingTabHelper();
        }
	}

    /**
     * Helper function called by updateInformation when we need to look again
     */
    this.lookForPlayingTabHelper = function(){
        this.tabHandler.FindTabPlayingMusic($.proxy(function(tabId, playerDetails){
            this.playerHandler.SetTabAndDetails(tabId, playerDetails);

            if (tabId != null && playerDetails != null){
                // We've got one. Populate if displayed
                this.playerHandler.PopulateInformation();

                // Let's push the player name as a custom GA variable
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
            }else{
                // If we didn't find anything, nothing is populated.
                this.logger.log("UpdateInformation() -- No players playing");

                // Reset variables in the player handler
                this.playerHandler.SetTabAndDetails(-1, undefined);

                // Set the default icon
                chrome.browserAction.setIcon({
                    path : "/images/icon19.png"
                });
            }
        }, this));
    }


	this.logger.log("Musicality done initializing");
}

/**
 * The primary entry point to be called after construction.
 */
Musicality.prototype.Run = function(){
	this.logger.log("Musicality started");

	this.processFirstRun();

	this.startExecutionLoop();

    this.toaster.Run();

    this.iconHandler.Run();

    this.scrobbler.Run();
}

/**
 * Popup needs to know info about the player to know what to display
 */
Musicality.prototype.GetPlayerDetails = function(){
    return this.playerHandler.GetPlayerDetails();
}

/**
 * Request from popup to retrieve updated information
 */
Musicality.prototype.GetPlaybackInfo = function(){
    // Since we'll probably be called again, request to update information
    this.updateInformation(); // async, so will not finish prior to return

    return this.playerHandler.GetPlaybackInfo();
}

/**
 * Request from the popup to perform an action
 */
Musicality.prototype.ClickSomething = function(whatToClick, callback){
    this.playerHandler.ClickSomething(whatToClick, callback);
}

/**
 * Request from the popup to open the default player
 */
Musicality.prototype.OpenDefaultPlayer = function(){
    this.tabHandler.OpenDefaultPlayer();
}

/**
 * Request from the popup to go the the now playing tab
 */
Musicality.prototype.GoToNowPlayingTab = function(){
    this.tabHandler.GoToNowPlayingTab();
}