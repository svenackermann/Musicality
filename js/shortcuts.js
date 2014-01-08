// This script is simply responsible for dealing with keyboard shortcuts
chrome.commands.onCommand.addListener(function(command){
    // Check if this command is play pause
    if (mPlayerDetails && mPlayerDetails != null){
        if (command == "toggle-feature-play-pause"){
            if (mIsPlaying){
                ClickSomething(CLICK_PAUSE);
            }else{
                ClickSomething(CLICK_PLAY);
            }
        }else if (command == "toggle-feature-next-track"){
            // Regardless of play/pause state, click next
            ClickSomething(CLICK_NEXT_TRACK);
        }else if (command == "toggle-feature-prev-track"){
            // Regardless of play/pause state, click prev
            ClickSomething(CLICK_PREV_TRACK);
        }else if (command == "toggle-feature-thumbs-up"){
            // Click thumbs up
            ClickSomething(CLICK_THUMBS_UP);
        }else if (command == "toggle-feature-thumbs-down"){
            // Click thumbs down
            ClickSomething(CLICK_THUMBS_DOWN);
        }else if (command == "toggle-feature-shuffle"){
            // Click the shuffle button
            ClickSomething(CLICK_SHUFFLE);
        }else if (command == "toggle-feature-repeat"){
            // Click the repeat button
            ClickSomething(CLICK_REPEAT);
        }

        // Finally, update information
        UpdateInformation();
    }
});
    
