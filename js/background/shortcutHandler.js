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
 * A class to handle keyboard shortcuts
 */
function ShortcutHandler(playerHandler, toaster){
	this.playerHandler = playerHandler;
	this.toaster = toaster;
	this.logger = Logger.getInstance();
	var that = this;

	// Register immediately with the chrome api
	chrome.commands.onCommand.addListener(function(command){
		that.logger.setEnabled(true);
		that.logger.log("Shortcut received for command " + command);
		that.logger.setEnabled(false);

		// Get some recent player details
		var info = that.playerHandler.GetPlaybackInfo();

	    // Check if this command is play pause
	    if (command == "toggle-feature-play-pause"){
	    	if (info.isPlaying){
	    		that.playerHandler.ClickSomething(CLICK_PAUSE);
	    	}else{
	    		that.playerHandler.ClickSomething(CLICK_PLAY);
	    	}
	    }else if (command == "toggle-feature-next-track"){
	        that.playerHandler.ClickSomething(CLICK_NEXT_TRACK);
	    }else if (command == "toggle-feature-prev-track"){
	        that.playerHandler.ClickSomething(CLICK_PREV_TRACK);
	    }else if (command == "toggle-feature-thumbs-up"){
	    	that.playerHandler.ClickSomething(CLICK_THUMBS_UP);
	    }else if (command == "toggle-feature-thumbs-down"){
	    	that.playerHandler.ClickSomething(CLICK_THUMBS_DOWN);
	    }else if (command == "toggle-feature-shuffle"){
	    	that.playerHandler.ClickSomething(CLICK_SHUFFLE);
	    }else if (command == "toggle-feature-repeat"){
	    	that.playerHandler.ClickSomething(CLICK_REPEAT);
	    }else if (command == "toggle-feature-toast"){
	    	that.toaster.Toast(that.playerHandler.GetPlaybackInfo());
	    }
	});
}
