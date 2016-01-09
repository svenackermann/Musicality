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
 * Class responsible for all things scrobbling!
 * @param {PlayHandler} playerHandler to get playback information
 */
function Scrobbler(playerHandler){
	this.logger = Logger.getInstance();
	this.playerHandler = playerHandler;
	this.listeningTrackTimestamp = undefined;
	this.listeningTrackName = undefined;
	this.listeningTrackProgress = undefined;
	this.trackRepeatingScrobbled = false;
	this.scrobbleQueue = [];
	this.lastScrobble = "";
	this.workDelay = 15000;


	this.KEY = "00fd800a7549fca4a235f69bf977fcf1";
	// Don't steal my keys, please!
	this.SECRET = "1ba52c5a7ff76be423d90b874434c126";
	this.LASTFM_URL = "http://ws.audioscrobbler.com/2.0/";
	this.AUTH_URL = "http://www.last.fm/api/auth/";
	this.token = undefined;
	this.sessionKey = undefined;
	this.username = undefined;

    var that = this;

	/**
	 * Helper method to prevent duped code, and deal with async
	 * @param  {Object}   parameters
	 * @param  {Function} callback
	 */
	this.getSignatureHelper = function(parameters, callback){
	    // Extract the keys
	    var keys = Object.keys(parameters);

	    // Sort them
	    keys.sort();

	    // The string we are building
	    var preHashSignature = "";

	    // Now iterate through, building our string
	    for (var i=0; i<keys.length; i++){
	        preHashSignature += keys[i] + parameters[keys[i]];
	    }

	    // Finally, append the secret
	    preHashSignature += this.SECRET;

	    this.logger.log("Prehash string = \"" + preHashSignature + "\"");
	    
	    // Now generate the signature
	    var sig = $.md5(preHashSignature);

	    // Return the signature
	    callback(sig);
	};

	/**
	 * Definitely needs cleaning up, but this function runs if 
	 * scrobbling is enabled and will hit the API for now playing,
	 * as well as scrobbles.
	 */
	this.talkToLastFm = function(){
		// Check if scrobbling is even enabled
		this.IsScrobblingEnabled(function(result){
			if (!result){
				return;
			}

			// Get the most recent info from the player handler
			var info = that.playerHandler.GetPlaybackInfo();

			// Ensure we have a track and artist and are playing
			if (info.track && info.artist && info.isPlaying){
			    // Cool. Tell Last.fm we are playing 
			    that.RunLastFmQuery(
			    	{
			    		method: "track.updateNowPlaying",
			    		track: info.track,
			    		artist: info.artist
			    	}, false, null);
			}

			// Build the curScrobble string
			var curTrack = info.track + " " + info.artist;

			// Get the current timestamp
			var curTimestamp = Date.now();

			// Variable in case track is repeating
			var trackRepeating = false;

			// Variable in case track has repeated
			var trackRepeated = false;

			// Check if the current track is repeating
			if ((that.listeningTrackName == curTrack) &&
			    (info.isRepeatOne || info.isRepeatAll)){
			    // Set a variable that makes it clear this track is in the process
			    // of repeating
			    trackRepeating = true;

			    // Now check if it has already repeated, and progress is less
			    // than what it was last time we checked.
			    if (info.currentTime < that.listeningTrackProgress){
			        // Yup. It has repeated, so let's log it as such.
			        trackRepeated = true;

			        // Reset trackRepeatingScrobbled so the next repeat will get scrobbled
			        that.trackRepeatingScrobbled = false;
			    }
			}

			// Set the current listening time
			that.listeningTrackProgress = info.currentTime;

			// Check if this is a new track, or if we've repeated the same one
			if (that.listeningTrackName != curTrack || trackRepeated){
			    // Reset the stored timestamp
			    that.listeningTrackTimestamp = curTimestamp;

			    // Reset the listening track variable
			    that.listeningTrackName = curTrack;

			    // Build up a new queue
			    var newQueue = [];

			    // Iterate through the scrobble queue, scrobbling any
			    // tracks we've saved off.
			    // Now we should iterate through everything in our scrobble queue
			    for (var i=0; i<that.scrobbleQueue.length; i++){

			        // Get the current track in the queue
			        var curQTrack = that.scrobbleQueue[i];

			        // Attempt to scrobble it
			        that.RunLastFmQuery(
			            {
			                method: "track.scrobble",
			                track: curQTrack.track,
			                artist: curQTrack.artist,
			                timestamp: curQTrack.timestamp
			            }, false, function(result){
			                // We need to check if it's failed
			                var errCode = result.error;
			                if (errCode){
			                    // Check if this error is one we should re-try
			                    if (errCode == 11 || errCode == 16 || errCode == -1){
			                        // Keep it in the cache
			                        console.write("Last.fm scrobbling error: " + result);
			                        newQueue.push(curQTrack);
			                    } // Else, something else is wrong with this track. Discard it
			                } // Else, success. Nothing to do.
			            });
			    }

			    // Now save the mScrobbleQueue as the newQueue
			    that.scrobbleQueue = newQueue.slice();
			}else{
			    // This is not a new track. Check if our timestamp is old enough
			    if (curTimestamp - that.listeningTrackTimestamp > 31000 - that.workDelay){
			        // Get the percentage
			        var percentage = info.currentTime/info.totalTime;

			        var playerDetails = that.playerHandler.GetPlayerDetails();
			        
			        // Now check to ensure it's progress is greater than 50 or that this
			        // player doesn't have any way of tracking progress
			        if (percentage >= 0.5 && percentage < 1 ||
			            (playerDetails && playerDetails.scrobbleOnChange)){

			            // Ensure we haven't already scrobbled this track, or that it's
			            // repeating and we have gone backwards in progress
			            if (curTrack != that.lastScrobble ||
			                (trackRepeating && !that.trackRepeatingScrobbled)){
			                // Push this scrobble into our queue
			                that.scrobbleQueue.push(
			                	{
			                		artist: info.artist,
			                		track: info.track,
			                		timestamp: Math.round(
			                			(new Date()).getTime() / 1000).toString()
			                	});

			                // Save this track off as the last scrobble
			                that.lastScrobble = curTrack;

			                // If we scrobbled this due to repeating track, make sure
			                // we don't do it again until the next repeat
			                if (trackRepeating){
			                    that.trackRepeatingScrobbled = true;
			                }
			            }
			        }
			    }
			}
		});
	};
}

/**
 * Start the execution loop for the scrobbler
 */
Scrobbler.prototype.Run = function(){
    var that = this;
    // First, determine if we already have a token saved
    chrome.storage.local.get('lastfm_token', function(data){
        // Check if it exists
        that.token = data.lastfm_token;

        if (that.token){
            // We have a token!
            that.logger.log("Token stored locally is: " + that.token);
        }else{
        	that.logger.log("No token stored locally.");
        }
    });

    // Also check if we have a session key already
    chrome.storage.local.get('lastfm_session_key', function(data){
        that.sessionKey = data.lastfm_session_key;

        if (that.sessionKey){
            // We already have a key
            that.logger.log("Session key stored locally is: " + that.sessionKey);
        }else{
            // No session key.
            that.logger.log("No session key.");
        }
    });

    // Finally, check for the username
    chrome.storage.local.get('lastfm_username', function(data){
        that.username = data.lastfm_username;

        if (that.username){
            // We already have a key
            that.logger.log("Username stored locally is: " + that.username);
        }else{
            // No session key.
            that.logger.log("No username.");
        }
    });

    // Finally, start the execution loop
    window.setInterval(
    	(function(self){
    		return function(){
    			self.talkToLastFm();
    		};
    	})(that),
    that.workDelay);
};

/**
 * Authenticate client with last fm
 */
Scrobbler.prototype.AuthenticateWithLastFm = function(){
	this.logger.log("Beginning to authenticate");

    // Clear anything saved off already
    chrome.storage.local.remove(["lastfm_token", "lastfm_username", "lastfm_session_key"], null);
    this.token = null;
    this.sessionKey = null;
    this.username = null;
    
    // Construct the query string
    var queryString = this.LASTFM_URL + "?method=auth.gettoken&api_key=" + this.KEY + "&format=json";

    this.logger.log("Query string = " + queryString);
    
    // Make a query for a token
    $.get(queryString, $.proxy(function(returnData){
        this.token = returnData.token;
        
        // Fantastic. We got a response.
        this.logger.log("Response token: " + this.token);

        // We need to save the token locally
        chrome.storage.local.set({'lastfm_token': this.token}, $.proxy(function(){
            // Succesfully saved the token!
            this.logger.log("Saved token locally.");
        }, this));

        // Also set scrobbling enabled to true
        chrome.storage.local.set({'scrobbling_enabled': true}, $.proxy(function(){
            // Succesfully enabled scrobbling
            this.logger.log("Saved scrobbling enabled boolean locally.");
        }, this));

        // Using the token, we now need to request authorization from the user
        var authUrl = this.AUTH_URL + "?api_key=" + this.KEY + "&token=" + this.token;

        // Open a window containing that URL. Hopefully the user approves.
        window.open(authUrl);
    }, this));
};

/**
 * Method to check if we have already been authenticated
 * @param {Function} callback
 */
Scrobbler.prototype.AlreadyAuthenticated = function(callback){
    // Attempt to get the last_fm_session_key from storage
    chrome.storage.local.get('lastfm_session_key', $.proxy(function(data){
        if (!data.lastfm_session_key || data.lastfm_session_key === ''){
            // Hmmm. Try requesting a session key in case we authed
            this.GetLastFmSession(function(result){
                if (result){
                    callback(true);
                }else{
                    callback(false);
                }
            });
        }else{
            callback(true);
        }
    }, this));
};

/**
 * Method to check if scrobbling is already enabled
 * @param {Function} callback
 */
Scrobbler.prototype.IsScrobblingEnabled = function(callback){
    chrome.storage.local.get('scrobbling_enabled', $.proxy(function(data){
        if (data.scrobbling_enabled) {
            this.AlreadyAuthenticated(function(result){
                if (!result) {
                    callback(false);
                } else {
                    callback(true);
                }
            });
        } else {
            callback(false);
        }
    }, this));
};

/**
 * Method to set scrobbling state
 * @param {Boolean}  isEnabled
 * @param {Function} callback
 */
Scrobbler.prototype.SetScrobblingState = function(isEnabled, callback){
    // Set the value in storage
    chrome.storage.local.set({'scrobbling_enabled': isEnabled}, $.proxy(function(){
        // Cool. Debug message for it.
        this.logger.log("Set scrobbling enabled to " + isEnabled + " locally.");

        // Callback success
        callback(true);
    }, this));
};

/**
 * Method to get the session id for a user
 * @param {Function} callback
 */
Scrobbler.prototype.GetLastFmSession = function(callback){
    // First, check if we have anything stored locally
    chrome.storage.local.get('lastfm_session_key', $.proxy(function(data){
        if (data.lastfm_session_key && data.lastfm_session_key !== ''){
            // Save it off
            this.sessionKey = data.lastfm_session_key;
            callback(this.sessionKey);
        }else{
        	this.logger.log("Attempting to get last.fm session id");

            // We need to grab the latest token out of local storage first
            chrome.storage.local.get('lastfm_token', $.proxy(function(data){
                this.token = data.lastfm_token;

                // Debug what token is
                this.logger.log("Token is " + this.token);
                
                // Check if we have a token
                if (this.token === undefined){
                    // We don't have a token yet. Callback false
                    callback(false);
                }
                
                this.RunLastFmQuery({method: "auth.getSession", token: this.token}, true, $.proxy(function(data){
                    // Check for error in the callback
                    if (data.error){
                        // Yikes. We have an error.
                        this.logger.log("Query returned an error: " + data.message);

                        // Clear the token to be safe
                        chrome.storage.local.set({'lastfm_token': undefined}, function() {
                            callback(false);
                        });

                        callback(false);
                    }else{
                        // Ok. Now get the session and username
                        if (data.session){
                            // Store it in memory too
                            this.sessionKey = data.session.key;
                            
                            this.logger.log("Session key = " + data.session.key);
                            this.logger.log("Username = " + data.session.name);
                            
                            // Save the information off
                            chrome.storage.local.set(
                                {
                                    lastfm_session_key: data.session.key,
                                    lastfm_username: data.session.name
                                }, $.proxy(function(){
                                    // Save successful.
                                    this.logger.log("Successfully saved session and username");
                                }, this));

                            // Callback with the session key
                            callback(this.sessionKey);
                        }
                    }
                }, this));
            }, this));
        }
    }, this));
};

/**
 * Run a particular last.fm query. Don't include key in parameters
 * @param {Object}   parameters
 * @param {Boolean}   true for GET, false for POST
 * @param {Function} callback
 */
Scrobbler.prototype.RunLastFmQuery = function(parameters, get, callback){
    // Get the signature
    this.GetLastFmQuerySignature(parameters, $.proxy(function(signature){
    	this.logger.log("Signature = \"" + signature + "\"");
        
        // Construct the query string
        var queryString = this.LASTFM_URL + "?api_key=" + this.KEY;
        for (var key in parameters){
            if (key){
                queryString += "&" + key + "=" + encodeURIComponent(parameters[key]);
            }
        }

        // Finally, append the signature and json request
        queryString += "&" + "api_sig=" + signature + "&format=json";

        this.logger.log("About to execute=\"" + queryString + "\"");

        if (get){
            // Run the query with error handling
            $.ajax({
                url: queryString,
                type: 'GET',
                success: function(data){
                    // Awesome. Got a response.
                    if (callback){
                        callback(data);
                    }
                },
                error: function(data){
                    // Oh no. Callback with a simple structure to signal error
                    if (callback){
                        callback({error: -1});
                    }
                }
            });
        }else{
            // Post request.
            $.ajax({
                url: queryString,
                type: 'POST',
                success: function(data){
                    // Nice. Callback if there is one.
                    if (callback){
                        callback(data);
                    }
                },
                error: function(data){
                    // Yikes. Callback with a simple structure to signal error
                    if (callback){
                        callback({error: -1});
                    }
                }
            });
        }
    }, this));
};

/**
 * Get the signature for a query
 * @param {Object}   parameters
 * @param {Function} callback
 */
Scrobbler.prototype.GetLastFmQuerySignature = function(parameters, callback){
    // We need to add our api_key and token to the parameters
    parameters.api_key = this.KEY;

    // If the method isn't auth.getSession, we need to add the session key too
    if (parameters.method != "auth.getSession"){
        this.GetLastFmSession($.proxy(function(){
            parameters.sk = this.sessionKey;
            this.getSignatureHelper(parameters, callback);
        }, this));
    }else{
    	this.getSignatureHelper(parameters, callback);
    }
};

