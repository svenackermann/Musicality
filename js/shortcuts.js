chrome.commands.onCommand.addListener(function(command){
    // Check if this command is play pause
    if (command == "toggle-feature-play-pause"){
        if (mPlayerDetails && mPlayerDetails != null){
            if (mIsPlaying){
                ClickSomething("click_pause");
                UpdateInformation();
            }else{
                ClickSomething("click_play");
                UpdateInformation();
            }
        }
    }
});
    
