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
 * A static helper 'class' with some useful functions that don't belong anywhere
 */
var Helper = {
	/**
	 * Turn the time string into a millisecond value
	 * @param {String} timeString to convert
	 */
	TimeToMs: function(timeString){
        // Get ints for the time and deal with the negative symbol
        // negative or not, the text will always be the last group,
        var splitNeg =  timeString.split("-");        
        var splitTime = splitNeg[splitNeg.length - 1].split(":");

        // The rightmost element as seconds
        var seconds = parseInt(splitTime[splitTime.length - 1]);

        // The next one from the right as minutes, only if it exists we'll add it.
        var minsText = splitTime[splitTime.length - 2];
        if (minsText) {
        	seconds += parseInt(minsText) * 60;

           // And the next one from the right as hours, same thing.
           var hoursText = splitTime[splitTime.length - 3];
           if (hoursText){
               seconds += parseInt(hoursText) * 3600;
           }
       }

        //Determine wether is negative or not
        var factor = 1;
        if (splitNeg.length > 1) {
        	factor = -1;
        }

        return seconds * 1000 * factor;
    },

	/**
    * Turn the milliseconds value into a time string
    */
    MsToTime: function(milliseconds){
        // Get the current time overall seconds
        var totalSeconds = milliseconds / 1000;

        var totalHours = Math.floor(totalSeconds/3600);
        var totalMins = Math.floor(totalSeconds/60) % 60;
        var totalSecs = Math.floor(totalSeconds) % 60;

        // Construct the strings we need
        var sTotalSecs = "" + totalSecs;
        if (totalSecs < 10){
        	sTotalSecs = "0" + totalSecs;
        }

        var sTotalMins = "" + totalMins;
        var sTotalHours = "";
        if (totalHours > 0) {                
        	if (totalMins < 10){
        		sTotalMins = "0" + totalMins;
        	}
        	sTotalHours = "" + totalHours + ":";
        }

        // Return the total time value
        return sTotalHours +  sTotalMins + ":" + sTotalSecs;
    }
};

