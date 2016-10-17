/////////////////////////////////////////////////////////////////////////////
// Member variables
/////////////////////////////////////////////////////////////////////////////

// Debug flag
var mDebug = false;

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

// Function to listen for requests from the extension
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        var playerDetails = request.playerDetails;
        // Check if this request is a ping
        if (request.ping == "ping") {
            if (mDebug) {
                console.log("Received ping. Pong-ing back.");
            }

            // Just respond with true
            sendResponse(true);
        }
        else if (request.scriptKey == "seek_update") {

            var value = request.value;
            var seekContainerElement = document.getElementById(playerDetails.seekContainerId);
            var mouseEventType = playerDetails.seekContainerMouseEvent;

            var clickX = seekContainerElement.getBoundingClientRect().left + $(seekContainerElement).width() * value;
            var clickY = seekContainerElement.getBoundingClientRect().top + $(seekContainerElement).height() / 2;

            var ev = new MouseEvent(mouseEventType, {
                'view': window,
                'bubbles': true,
                'cancelable': true,
                'clientX': clickX,
                'clientY': clickY
            });

            var element = document.elementFromPoint(clickX, clickY);

            element.dispatchEvent(ev);

            sendResponse("");
        }
        else {

            // Disect the request
            var scriptKey = request.scriptKey;
            var result = null;

            if (mDebug) {
                console.log("contentscript.js -- Receieved request: " + scriptKey);
            }

            if (playerDetails !== null && scriptKey !== null) {
                var toEval = playerDetails[scriptKey];

                // Debug info
                if (mDebug) {
                    console.log("contentscript.js -- About to eval \"" + toEval + "\"");
                }

                result = eval(toEval);

                // Log some information, if wanted
                if (mDebug) {
                    console.log("contentscript.js -- Eval yielded \"" + result + "\"");
                }
            }

            try {
                // Return whatever was requested
                sendResponse(result);
            } catch (e) {
                if (mDebug) {
                    console.log(e.message);
                    console.log(e);
                }
                // Send something back
                sendResponse("");
            }
        }
    })
;

