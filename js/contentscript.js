

/////////////////////////////////////////////////////////////////////////////
// Member variables
/////////////////////////////////////////////////////////////////////////////

// Debug flag
var mDebug = true;

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

// Function to listen for requests from the extension
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){

        // Check if this request is a ping
        if (request.ping == "ping"){
            if (mDebug){
                console.log("Received ping. Pong-ing back.");
            }
            
            // Just respond with true
            sendResponse(true);
        }else{

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
        }
    });

