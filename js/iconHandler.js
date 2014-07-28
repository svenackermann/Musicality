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
 * A class to handle the icon and badge text
 */
function IconHandler(playerHandler){
	this.currentScroll = 0;
	this.lastScrollTime = 0;
	this.scrollDelayTime = 250;
	this.playerHandler = playerHandler;

	// Immediately find out if badge text is enabled
	chrome.storage.local.get('badge_text_enabled', $.proxy(function(data){
		this.enabled = data.badge_text_enabled;
	}, this));

	// Set the color of the icon's badge text background
	chrome.browserAction.setBadgeBackgroundColor({color: "#000000"});

	/**
	 * Update the current state of the badge text
	 */
	this.updateBadgeText = function(){
		if (this.enabled){
			// Get an update on the info
			var info = playerHandler.GetPlaybackInfo();

			if (info.isPlaying && info.track && info.track != ""){
				var curTime = Date.now();
				if ((curTime - this.lastScrollTime) < (this.scrollDelayTime - 5)){
					// Scrolled too recently. Exit.
					return;
				}

				this.lastScrollTime = curTime;

				var badgeText = "        ";
				if (info.artist && info.artist != ""){
					badgeText += info.artist + " - ";
				}
				badgeText += info.track + "        ";

				var badgeTextLength = badgeText.length;

				if (this.currentScroll >= badgeTextLength - 8){
					this.currentScroll = 0;
				}

				var scrollingBadgeText = badgeText.substring(this.currentScroll);

				chrome.browserAction.setBadgeText({text: scrollingBadgeText});

				this.currentScroll++;

				return;
			}
		}

		// Clear the badge text (if it isn't already)
		chrome.browserAction.getBadgeText({}, function(result){
			if (result != ""){
				chrome.browserAction.setBadgeText({text: ""});
			}
		})
	}
}

/**
 * Start the icon handler execution loop
 */
IconHandler.prototype.Run = function(){
	// todo -- interval code
	this.updateBadgeText();

	window.setInterval(
		(function(self){
			return function(){
				self.updateBadgeText();
			}
		})(this),
	this.scrollDelayTime);
}