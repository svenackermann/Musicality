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
 * @param {Object} logger for logging
 */
function TabHandler(logger){
	this.logger = logger;
	this.lastPlayingWindowId = -1;
	this.lastPlayingTabId = -1;
}

/**
 * Iterate through tabs finding those playing and paused
 * @param callback with the tab id upon completion
 */
TabHandler.prototype.FindTabPlayingMusic = function(callback){
	logger.log("FindTabPlayingMusic");

	
}