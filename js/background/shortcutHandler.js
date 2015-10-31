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

	// Register immediately with the chrome api
	chrome.commands.onCommand.addListener($.proxy(function(command){
		this.logger.setEnabled(true);
		this.logger.log("Shortcut received for command " + command);
		this.logger.setEnabled(false);

		// Get some recent player details
		var info = this.playerHandler.GetPlaybackInfo();

	    // Check if this command is play pause
	    if (command == "toggle-feature-play-pause"){
	    	if (info.isPlaying){
	    		this.playerHandler.ClickSomething(CLICK_PAUSE);
	    	}else{
	    		this.playerHandler.ClickSomething(CLICK_PLAY);
	    	}
	    }else if (command == "toggle-feature-next-track"){
	        this.playerHandler.ClickSomething(CLICK_NEXT_TRACK);
	    }else if (command == "toggle-feature-prev-track"){
	        this.playerHandler.ClickSomething(CLICK_PREV_TRACK);
	    }else if (command == "toggle-feature-thumbs-up"){
	    	this.playerHandler.ClickSomething(CLICK_THUMBS_UP);
	    }else if (command == "toggle-feature-thumbs-down"){
	    	this.playerHandler.ClickSomething(CLICK_THUMBS_DOWN);
	    }else if (command == "toggle-feature-shuffle"){
	    	this.playerHandler.ClickSomething(CLICK_SHUFFLE);
	    }else if (command == "toggle-feature-repeat"){
	    	this.playerHandler.ClickSomething(CLICK_REPEAT);
	    }else if (command == "toggle-feature-toast"){
	    	this.toaster.Toast(this.playerHandler.GetPlaybackInfo());
	    }
	}, this));
}
