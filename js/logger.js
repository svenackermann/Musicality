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

// TODO -- Convert to singleton. Only one logger!

/**
 * Class for Logging
 * @param {boolean} Whether or not the logger is enabled
 */
function Logger(enabled){
	// Logger can be toggled to write out or not
	this.enabled = enabled;

	// Private method to get an error object, used for additional
	// information upon logging.
	this.getErrorObject = function(){
		try { throw Error('') } catch(err) { return err; }
	}
}

/**
 * Set whether or not the logger should be enabled
 * @param {boolean} Whether or not the logger should be enabled
 */
Logger.prototype.setEnabled = function(enabled){
	this.enabled = enabled;
}

/**
 * Log the provided string
 * @param  {string} The string to log out
 */
Logger.prototype.log = function(stringToLog){
	// Check if enabled
	if (this.enabled){
		// Get an error object to determine the file and line
		var err = this.getErrorObject();
		var caller_line = err.stack.split("\n")[4];
		var index = caller_line.indexOf("at ");
		var clean = caller_line.slice(index+2, caller_line.length);

		console.log(clean + ' -- ' + stringToLog);
	}
}

