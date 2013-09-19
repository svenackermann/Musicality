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

        // Disect the request
        var playerDetails = request.playerDetails;
        var scriptKey = request.scriptKey;
        var result = null;

        if (mDebug){
            console.log("contentscript.js -- Receieved request: " + scriptKey);
        }

        if (playerDetails != null && scriptKey != null){
            var toEval = playerDetails[scriptKey];

            // Debug info
            if (mDebug){
                console.log("contentscript.js -- About to eval \"" + toEval + "\"");
            }
            
            var result = eval(toEval);

            // Log some information, if wanted
            if (mDebug){
                console.log("contentscript.js -- Eval yielded \"" + result + "\"");
            }
        }
            
        // Return whatever was requested
        sendResponse(result);
            
    });
