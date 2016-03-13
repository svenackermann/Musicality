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
	var that = this;

	// Immediately find out if badge text is enabled
	chrome.storage.local.get('badge_text_enabled', function(data){
		that.badgeTextEnabled = data.badge_text_enabled;
	});

	// Immediately find out if icon progress is enabled
	chrome.storage.local.get('icon_progress_enabled', function(data){
		that.iconProgressEnabled = data.icon_progress_enabled;
	});

	// Set the color of the icon's badge text background
	chrome.browserAction.setBadgeBackgroundColor({color: "#000000"});

	/**
	 * Update the current state of the badge text
	 */
	this.updateBadgeText = function(){
		if (this.badgeTextEnabled){
			// Get an update on the info
			var info = playerHandler.GetPlaybackInfo();

			if (info.isPlaying && info.track && info.track !== ""){
				var curTime = Date.now();
				if ((curTime - this.lastScrollTime) < (this.scrollDelayTime - 5)){
					// Scrolled too recently. Exit.
					return;
				}

				this.lastScrollTime = curTime;

				var badgeText = "        ";
				if (info.artist && info.artist !== ""){
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
			if (result !== ""){
				chrome.browserAction.setBadgeText({text: ""});
			}
		});
	};

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

		console.log(info);

		if (info.isPaused){
			if (!this.previousDrawPaused){
 			    this.drawNewIcon(this.icons.paused, -1); // No progress when paused
 			    this.previousDrawPaused = true;
 			}
		}else if(Object.keys(info).length > 0){
			this.drawNewIcon(this.icons.playing, percentage);
			this.previousDrawPaused = false;
		}
	};

	/**
	 * Draw a new icon onto the chrome icon data
	 */
	this.drawNewIcon = function(icons, percentage){
		// Get the image data for non-retina displays
		var imageData = this.getImageData(icons.regular, percentage, 19);

		// And retina displays
		var imageDataRetina = this.getImageData(icons.retina, percentage, 38);

		// Draw the new icon
		chrome.browserAction.setIcon({
			imageData: {
				19: imageData,
				38: imageDataRetina
			}
		});
	};

	/**
	 * Get the actual image data given the image path, percentage, and width
	 * @param  {String} imagePath  The path to the image
	 * @param  {float} percentage Percentage of the way through the song
	 * @param  {int} width      Width of the icon
	 * @return {Object}            ImageData object
	 */
	this.getImageData = function(image, percentage, width){
		var canvas;
		var existingCanvas = document.getElementById('canvas');
		if (existingCanvas === null){
			canvas = document.createElement('canvas');
		}else{
			canvas = existingCanvas;
		}

		var context = canvas.getContext('2d');
		context.clearRect(0, 0, width, width);
		context.drawImage(image, 0, 0, width, width);


		if (percentage >= 0.0){
			var prog = 0.85;
			var percentageToIcons = (percentage*width);

			// Draw the black background
			context.fillStyle = '#000000';
			context.fillRect(0, (prog * width), width, width - (prog * width));

			context.fillStyle = '#8fc7e7';
			context.fillRect(1, (prog * width) + 1, percentageToIcons - 1, width - (prog * width) - 2);
		}

		return context.getImageData(0, 0, width, width);
	};

	/**
	 * Get an Image object for the provided path
	 * @param  {String} path to the object
	 * @return {Image}  image object
	 */
	this.getImageObject = function(path){
		var image = new Image();
		image.src = path;
		return image;
	};

	// Need to buffer the icons so they don't load every time
	var pausedRegular = this.getImageObject("/images/icon19paused.png");
	var pausedRetina = this.getImageObject("/images/icon76paused.png");
	var playingRegular = this.getImageObject("/images/icon19.png");
	var playingRetina = this.getImageObject("/images/icon76.png");

	this.icons = {
		paused: {
			regular: pausedRegular,
			retina : pausedRetina
		},
		playing: {
			regular: playingRegular,
			retina : playingRetina
		}
	};

	/**
	 * Update the tooltip to contain what is now playing
	 */
	this.updateToolTip = function(){
		var nowPlayingInfo = playerHandler.GetPlaybackInfo();

		var title = "Musicality";
		if (nowPlayingInfo.isPlaying || nowPlayingInfo.isPaused){
			// Add on the track and artist
			title += ":\n    " + nowPlayingInfo.track;
			title += "\n    by " + nowPlayingInfo.artist; 
		}

		chrome.browserAction.setTitle({
			title: title
		});
	};
}

/**
 * Start the icon handler execution loop
 */
IconHandler.prototype.Run = function(){
	this.updateBadgeText();
	this.updateIcon();
	this.updateToolTip();

	window.setInterval(
		(function(self){
			return function(){
				self.updateBadgeText();
				self.updateIcon();
				self.updateToolTip();
			};
		})(this),
	this.scrollDelayTime);
};

/**
 * Set whether or not the badge text is enabledn
 * @param {Boolean} isEnabled
 */
IconHandler.prototype.SetBadgeTextEnabled = function(isEnabled){
	this.badgeTextEnabled = isEnabled;

	this.updateBadgeText();
};

/**
 * Set whether or not the icon progress is enabledn
 * @param {Boolean} isEnabled
 */
IconHandler.prototype.SetIconProgressEnabled = function(isEnabled){
	this.iconProgressEnabled = isEnabled;

	this.updateIcon();
};
