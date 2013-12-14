// A function to change the last.fm button to say authenticate
function SetLastFmAuthenticationButton(isAuthed){
    // Get the element we are setting
    $authBtn = $("#authenticate");
    $authLbl = $("#authenticate_label");
    $scrobBtn = $("#scrobbling_toggle");
    $scrobLbl = $("#scrobbling_toggle_label");

    if (isAuthed){
        $authBtn.text("Reauthenticate");
        $authLbl.text("If you are experiencing issues, reauthenticating may resolve them.");

        // Also set the scrobbling button state
        $scrobBtn.show();
    }else{
        $authBtn.text("Authenticate");
        $authLbl.text("Authentication is necessary to scrobble to your Last.FM account.");

        // We also want to hide the enable/disable button
        $scrobBtn.hide();
    }
}

// A function to change the scrobble button text
function SetScrobblingStateButton(isEnabled){
    // Get the scrobble button
    $scrobBtn = $("#scrobbling_toggle");
    $scrobLbl = $("#scrobbling_toggle_label");

    if (isEnabled){
        // Set the text and class
        $scrobBtn.text("Disable Scrobbling");
        $scrobBtn.removeClass("btn-fail");
        $scrobBtn.addClass("btn-success");
        $scrobLbl.text("Disable scrobbling to stop sending tracks to Last.FM.");
    }else{
        // Set the text and class
        $scrobBtn.text("Enable Scrobbling");
        $scrobBtn.removeClass("btn-success");
        $scrobBtn.addClass("btn-fail");
        $scrobLbl.text("Enable scrobbling to resume sending tracks to Last.FM.");
    }
}

// A function to update the buttons to display the correct info
function UpdateButtons(){
    // Check if we are already authenticated
    AlreadyAuthenticated(function(result){
        SetLastFmAuthenticationButton(result);
    });

    // Check if last.fm is disabled
    IsScrobblingEnabled(function(result){
        SetScrobblingStateButton(result);
    });
}

// Start of execution when the document is ready
$(document).ready(function(){

    // We want to bind the click button to do everything it needs to for authentication
    $("#authenticate").bind('click', function(){
        // Authenticate is in scrobbler.js
        AuthenticateWithLastFm();
    });

    // Bind the click of the button to flip the state of scrobbling
    $("#scrobbling_toggle").bind('click', function(){
        IsScrobblingEnabled(function(result){
            SetScrobblingState(!result, function(){
                SetScrobblingStateButton(!result);
            });
        });
    });

    // Immediately update the buttons
    UpdateButtons();

    // Update these buttons every few seconds
    window.setInterval(function(){
        UpdateButtons();
    }, 3000);
});
