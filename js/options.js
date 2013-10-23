/////////////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////////////

// Last.fm key
var LASTFM_KEY = "00fd800a7549fca4a235f69bf977fcf1";

// Last.fm url
var LASTFM_URL = "http://ws.audioscrobbler.com/2.0/";

/////////////////////////////////////////////////////////////////////////////
// Members
/////////////////////////////////////////////////////////////////////////////

// Debug flag
var mDebug = true;

// Last.fm token
var mToken = null;


// Method to authenticate the user with Last.fm
function AuthenticateWithLastFm(){
    if (mDebug){
        console.log("Beginning to authenticate");
    }
    
    // Construct the query string
    var queryString = LASTFM_URL + "?method=auth.gettoken&api_key=" + LASTFM_KEY + "&format=json";

    if (mDebug){
        console.log("Query string = " + queryString);
    }
    
    // Make a query for a token
    $.get(queryString, function(returnData){
        // Fantastic. We got a response.
        if (mDebug){
            console.log("Response: " + returnData.token);
        }

        // We need to save the token locally
        chrome.storage.local.set({'lastfm_token': returnData.token}, function(){
            // Succesfully saved the token!
            if (mDebug){
                console.log("Saved token locally.");
            }
        });
        
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
    
    // We want to bind the click button to do everything it needs to for authentication
    $("#authenticate").bind('click', function(){
        AuthenticateWithLastFm();
    });
});
