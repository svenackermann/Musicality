/////////////////////////////////////////////////////////////////////////////
// Member variables
/////////////////////////////////////////////////////////////////////////////

// Debug flag
var mDebug = true;

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

// Function to listen for requests from the extension
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse){

        if (mDebug){
            console.log("contentscript.js -- Receieved request");
        }

        // Disect the request
        var playerDetails = request.playerDetails;
        var scriptKey = request.scriptKey;
        var result = null;

        if (playerDetails != null && scriptKey != null){
            var toEval = playerDetails[scriptKey];
            var result = eval(toEval);

            // Log some information, if wanted
            if (mDebug){
                console.log("contentscript.js -- Evaluating: " + toEval + " yields: " + result);
            }
        }
            
        // Return whatever was requested
        sendResponse(result);
            
    });
