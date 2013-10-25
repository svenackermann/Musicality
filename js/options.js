$(document).ready(function(){
    // We want to bind the click button to do everything it needs to for authentication
    $("#authenticate").bind('click', function(){
        // Authenticate is in scrobbler.js
        AuthenticateWithLastFm();
    });
});
