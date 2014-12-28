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
 * A class to handle keeping track of which players are blacklisted
 */
function BlacklistHandler(){
	this.blacklist = [];

	// Immediately determine which players are disabled
	chrome.storage.local.get('disabled_players_list', $.proxy(function(data){
		if (data.disabled_players_list){
			this.blacklist = data.disabled_players_list.split(',');
		}
	}, this));

	this.updateStorage = function(blacklist){
		var joinedList = blacklist.join(',');
		chrome.storage.local.set({'disabled_players_list' : joinedList });
	};
}

/**
 * Check if a specific player is blacklisted
 * @param  {string} The simple name of the player to check
 * @return {boolean} True if the player is disabled, false if not.
 */
BlacklistHandler.prototype.IsPlayerBlacklisted = function(simplePlayerName){
	return ($.inArray(simplePlayerName, this.blacklist) !== -1);
};

/**
 * Blacklists the given player and updates the chrome storage.
 * @param {string} The simple name of the player to blacklist
 */
BlacklistHandler.prototype.BlacklistPlayer = function(simplePlayerName){
	if (this.IsPlayerBlacklisted(simplePlayerName)){
		return; // nothing to do
	}

	this.blacklist.push(simplePlayerName);

	this.updateStorage(this.blacklist);
};

/**
 * Enables the given player and updates the chrome storage.
 * @param {string} The simple name of the player to enable
 */
BlacklistHandler.prototype.EnablePlayer = function(simplePlayerName){
	if (!this.IsPlayerBlacklisted(simplePlayerName)){
		return; // nothing to do
	}

	this.blacklist.splice( $.inArray(simplePlayerName, this.blacklist), 1 );

	this.updateStorage(this.blacklist);
};











