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
 * Singleton class for Logging
 * @param {boolean} Whether or not the logger is enabled
 */
var Logger = (function(){
	var instance;

	function init(){
		/**
		 * Get an error object for additional logging information
		 * @return {Error}
		 */
   	    function getErrorObject(){
   	    	try { throw Error('') } catch(err) { return err; }
   	    }

   	    // Public methods returned out
   	    return {
   	    	/**
   	    	 * Set whether or not the logger should be enabled
   	    	 * @param {boolean} enabled
   	    	 */
   	    	setEnabled: function(enabled){
   	    		this.enabled = enabled;
   	    	},

   	    	/**
   	    	 * Set a string filter to limit what's output
   	    	 * @param {String} filterString
   	    	 */
   	    	setFilter: function(filterString){
   	    		this.filter = filterString;
   	    	},

   	    	/**
   	    	 * Log the input to file, along with filename and line number,
   	    	 * but only if the logger is enabled.
   	    	 * @param  {String} The string to log out
   	    	 */
   	    	log: function(stringToLog){
   	            // Check if enabled
   	            if (this.enabled){
   	            	// Check if it matches the filter (if enabled)
   	            	if (this.filter.length == 0 ||
   	            		   (this.filter.length > 0 &&
   	            			stringToLog.toLowerCase().indexOf(this.filter.toLowerCase()) > -1)
   	            		   ){

                		// Get an error object to determine the file and line
                	    var err = getErrorObject();
                	    var caller_line = err.stack.split("\n")[4];
                	    var index = caller_line.indexOf("at ");
                	    var clean = caller_line.slice(index+2, caller_line.length);

                	    console.log(clean + ' -- ' + stringToLog);
                	}
            	}
   	    	}
   	    };
	};

	return {
		/**
		 * Get the singleton instance or create one if it doesn't exist.
		 * @return {Logger}
		 */
		getInstance: function(){
  		    if (!instance){
  		    	instance = init();
  		    	instance.setEnabled(false);
  		    	instance.setFilter("");
  		    }

  		    return instance;
  		}
	};
})();
