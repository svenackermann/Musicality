/////////////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////////////

// Last.fm key
var LASTFM_KEY = "00fd800a7549fca4a235f69bf977fcf1";

// Last.fm secret (be cool bro. Don't steal my keys)
var LASTFM_SECRET = "1ba52c5a7ff76be423d90b874434c126";

// Last.fm url
var LASTFM_URL = "http://ws.audioscrobbler.com/2.0/";

// Specialized url for auth
var LASTFM_AUTH_URL = "http://www.last.fm/api/auth/";

/////////////////////////////////////////////////////////////////////////////
// Members
/////////////////////////////////////////////////////////////////////////////

// Debug flag
var mDebug = true;

// Last.fm token
var mToken = null;

// Last.fm session key
var mSessionKey = null;

// Last.fm username
var mUsername = null;

/////////////////////////////////////////////////////////////////////////////
// Methods
/////////////////////////////////////////////////////////////////////////////

// Method to authenticate the user with Last.fm
function AuthenticateWithLastFm(){
    if (mDebug){
        console.log("Beginning to authenticate");
    }

    // Clear anything saved off already
    chrome.storage.local.remove(["lastfm_token", "lastfm_username", "lastfm_session_key"], null);
    mToken = null;
    mSessionKey = null;
    mUsername = null;
    
    // Construct the query string
    var queryString = LASTFM_URL + "?method=auth.gettoken&api_key=" + LASTFM_KEY + "&format=json";

    if (mDebug){
        console.log("Query string = " + queryString);
    }
    
    // Make a query for a token
    $.get(queryString, function(returnData){
        mToken = returnData.token;
        
        // Fantastic. We got a response.
        if (mDebug){
            console.log("Response token: " + mToken);
        }

        // We need to save the token locally
        chrome.storage.local.set({'lastfm_token': mToken}, function(){
            // Succesfully saved the token!
            if (mDebug){
                console.log("Saved token locally.");
            }
        });

        // Using the token, we now need to request authorization from the user
        var authUrl = LASTFM_AUTH_URL + "?api_key=" + LASTFM_KEY + "&token=" + mToken;

        // Open a window containing that URL. Hopefully the user approves.
        window.open(authUrl);
    });
}

// Method to get the session id for a user
function GetLastFmSession(callback){
    // First, check if we have anything stored locally
    chrome.storage.local.get('lastfm_session_key', function(data){
        if (data.lastfm_session_key && data.lastfm_session_key != ''){
            // Save it off
            mSessionKey = data.lastfm_session_key;
            callback(mSessionKey);
        }else{
            if (mDebug){
                console.log("Attempting to get last.fm session id");
            }

            RunLastFmQuery({method: "auth.getSession", token: mToken}, function(data){
                // Check for error in the callback
                if (data.error){
                    // Yikes. We have an error.
                    console.log("Query returned an error: " + data.message);
                }else{
                    // Ok. Now get the session and username
                    if (data.session){
                        // Store it in memory too
                        mSessionKey = data.session["key"];
                        
                        if (mDebug){
                            console.log("Session key = " + data.session["key"]);
                            console.log("Username = " + data.session["name"]);
                        }
                        
                        // Save the information off
                        chrome.storage.local.set(
                            {
                                lastfm_session_key: data.session["key"],
                                lastfm_username: data.session["name"]
                            }, function(){
                                // Save successful.
                                if (mDebug){
                                    console.log("Successfully saved session and username");
                                }
                            });

                        // Callback with the session key
                        callback(mSessionKey);
                    }
                }
            });
        }
    });
}

// Run a particular last.fm query. Don't include key in parameters
function RunLastFmQuery(parameters, callback){
    // Get the signature
    var signature = GetLastFmQuerySignature(parameters);
    
    if (mDebug){
        console.log("Signature = \"" + signature + "\"");
    }
    
    // Construct the query string
    var queryString = LASTFM_URL + "?api_key=" + LASTFM_KEY;
    for (var key in parameters){
        queryString += "&" + key + "=" + parameters[key];
    }

    // Finally, append the signature and json request
    queryString += "&" + "api_sig=" + signature + "&format=json";

    if (mDebug){
        console.log("About to execute=\"" + queryString + "\"");
    }

    // Run the query! For real.
    $.get(queryString, function(data){
        // Awesome. Got a response.
        callback(data);
    });
}

// Get the signature for a query
function GetLastFmQuerySignature(parameters){
    // We need to add our api_key and token to the parameters
    parameters["api_key"] = LASTFM_KEY;

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
    preHashSignature += LASTFM_SECRET;

    if(mDebug){
        console.log("Prehash string = \"" + preHashSignature + "\"");
    }
    
    // Now generate the signature
    var sig = $.md5(preHashSignature);

    // Return the signature
    return sig;
}

// Temp test function
function RunTest(){
    GetLastFmSession(function(data){
        if (mDebug){
            console.log("Test executed. Session returned is " + data);
        }
    });
}

/////////////////////////////////////////////////////////////////////////////
// Execution entry point
/////////////////////////////////////////////////////////////////////////////
$(document).ready(function(){

    // First, determine if we already have a token saved
    chrome.storage.local.get('lastfm_token', function(data){
        // Check if it exists
        mToken = data.lastfm_token;

        if (mToken){
            // We have a token!
            if (mDebug){
                console.log("Token stored locally is: " + mToken);
            }
        }else{
            // No token. Allow the user to authenticate.
            if (mDebug){
                console.log("No token stored locally.");
            }
        }

    });

    // Also check if we have a session key already
    chrome.storage.local.get('lastfm_session_key', function(data){
        mSessionKey = data.lastfm_session_key;

        if (mSessionKey){
            // We already have a key
            if (mDebug){
                console.log("Session key stored locally is: " + mSessionKey);
            }
        }else{
            // No session key.
            if (mDebug){
                console.log("No session key.");
            }
        }
    });

    // Finally, check for the username
    chrome.storage.local.get('lastfm_username', function(data){
        mUsername = data.lastfm_username;

        if (mUsername){
            // We already have a key
            if (mDebug){
                console.log("Username stored locally is: " + mUsername);
            }
        }else{
            // No session key.
            if (mDebug){
                console.log("No username.");
            }
        }
    });
    
    // We want to bind the click button to do everything it needs to for authentication
    $("#authenticate").bind('click', function(){
        AuthenticateWithLastFm();
    });

    // Bind click of test button
    $("#test").bind('click', function(){
        RunTest();
    });
});
