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
	this.pausedIcon = new Image();
	this.pausedIcon.src = "/images/icon48paused.png";
	this.defaultIcon = new Image();
	this.defaultIcon.src = "/images/icon48.png";

	// Immediately find out if badge text is enabled
	chrome.storage.local.get('badge_text_enabled', $.proxy(function(data){
		this.badgeTextEnabled = data.badge_text_enabled;
	}, this));

	// Immediately find out if icon progress is enabled
	chrome.storage.local.get('icon_progress_enabled', $.proxy(function(data){
		this.iconProgressEnabled = data.icon_progress_enabled;
	}, this));

	// Set the color of the icon's badge text background
	chrome.browserAction.setBadgeBackgroundColor({color: "#000000"});

	/**
	 * Update the current state of the badge text
	 */
	this.updateBadgeText = function(){
		if (this.badgeTextEnabled){
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

	/**
	 * Update the current icon
	 */
	this.updateIcon = function(){
		var info = playerHandler.GetPlaybackInfo();

		// If the user wants progress bar, calculate percentage
		var percentage = -1;
		if (this.iconProgressEnabled){
			percentage = info.currentTime/info.totalTime;
		}

		if (info.isPaused){
			this.drawNewIcon(this.pausedIcon, percentage);
		}else{
			this.drawNewIcon(this.defaultIcon, percentage);
		}
	}

	/**
	 * Draw a new icon onto the chrome icon data
	 */
	this.drawNewIcon = function(image, percentage){
		var canvas;
		var existingCanvas = document.getElementById('canvas');
		if (existingCanvas == undefined){
			canvas = document.createElement('canvas');
		}else{
			canvas = existingCanvas;
		}

		var context = canvas.getContext('2d');
		context.clearRect(0, 0, 19, 19);
		context.drawImage(image, 0, 0, 19, 19);

		if (percentage >= 0.0){
			var percentageToIcons = (percentage*19);
			// Need to draw the percentage since it was provided
			context.fillStyle = '#CCCCCC';
			context.fillRect(0, 17, 19, 19);

			context.fillStyle = '#000000';
			context.fillRect(0, 17, percentageToIcons, 19);
		}

		var imageData = context.getImageData(0, 0, 19, 19);

		// Draw the new icon
		chrome.browserAction.setIcon({
			imageData: imageData
		});
	}
}

/**
 * Start the icon handler execution loop
 */
IconHandler.prototype.Run = function(){
	this.updateBadgeText();
	this.updateIcon();

	window.setInterval(
		(function(self){
			return function(){
				self.updateBadgeText();
				self.updateIcon();
			}
		})(this),
	this.scrollDelayTime);
}

/**
 * Set whether or not the badge text is enabledn
 * @param {Boolean} isEnabled
 */
IconHandler.prototype.SetBadgeTextEnabled = function(isEnabled){
	this.badgeTextEnabled = isEnabled;

	this.updateBadgeText();
}

/**
 * Set whether or not the icon progress is enabledn
 * @param {Boolean} isEnabled
 */
IconHandler.prototype.SetIconProgressEnabled = function(isEnabled){
	this.iconProgressEnabled = isEnabled;

	this.updateIcon();
}
