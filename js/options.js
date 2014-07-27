// This script contains most of the logic for dealing with the options page.

/////////////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////////////

// Shared constants reside in constants.js

/////////////////////////////////////////////////////////////////////////////
// Member Variables
/////////////////////////////////////////////////////////////////////////////

// The core
var mMusicality = chrome.extension.getBackgroundPage().Musicality;

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

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
        $scrobLbl.show();
    }else{
        $authBtn.text("Authenticate");
        $authLbl.text("Authentication is necessary to scrobble to your Last.FM account.");

        // We also want to hide the enable/disable button
        $scrobBtn.hide();
        $scrobLbl.hide();
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

// A function to set the badge text button information
function SetBadgeTextButton(isEnabled){
    // Get the button
    $iconTextBtn = $("#icon_text");
    $iconTextLbl = $("#icon_text_label");

    if (isEnabled){
        // Set the button to say disable
        $iconTextBtn.text("Disable Icon Text");
        $iconTextBtn.removeClass("btn-fail");
        $iconTextBtn.addClass("btn-success");
        $iconTextLbl.text("Disable the scrolling text on the Musicality icon");
    }else{
        // Set the button to say enable
        $iconTextBtn.text("Enable Icon Text");
        $iconTextBtn.removeClass("btn-success");
        $iconTextBtn.addClass("btn-fail");
        $iconTextLbl.text("Enable the scrolling text on the Musicality icon");
    }
}

// A function to set the toaster notification information
function SetToastNotificationsButton(isEnabled){
    // Get the button
    $toasterNotificationBtn = $("#toast_notifications");
    $toasterNotificationLbl = $("#toast_notifications_label");

    if (isEnabled){
        // Set the button to say disable
        $toasterNotificationBtn.text("Disable Toast Notifications");
        $toasterNotificationBtn.removeClass("btn-fail");
        $toasterNotificationBtn.addClass("btn-success");
        $toasterNotificationLbl.text("Disable the toast notification popup on track changes.");
    }else{
        // Set the button to say enable
        $toasterNotificationBtn.text("Enable Toast Notifications");
        $toasterNotificationBtn.removeClass("btn-success");
        $toasterNotificationBtn.addClass("btn-fail");
        $toasterNotificationLbl.text("Enable the toast notification popup on track changes.");
    }
}

// A function to check if the badge text is enabled
function IsBadgeTextEnabled(callback){
    // Query the local storage for the value we are looking for
    chrome.storage.local.get('badge_text_enabled', function(data){
        callback(data.badge_text_enabled);
    });
}

// A function to set if badge text should be enabled or not
function SetBadgeTextEnabled(isEnabled, callback){
    // Set the value in local storage
    chrome.storage.local.set({'badge_text_enabled' : isEnabled}, function(){
        // Callback success
        callback(true);
    });
}

// A function to check if the toast notifications is enabled
function AreToastNotificationsEnabled(callback){
    // Query the local storage for the value we are looking for
    chrome.storage.local.get('toaster_enabled', function(data){
        callback(data.toaster_enabled);
    });
}

// A function to set if toast notifications should be enabled or not
function SetToastNotificationsEnabled(isEnabled, callback){
    // Set the value in local storage
    chrome.storage.local.set({'toaster_enabled' : isEnabled}, function(){
        // Callback success
        callback(true);
    });

    // Update the running instance as well
    mMusicality.toaster.SetEnabled(isEnabled);
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

    // Check if badge text is enabled
    IsBadgeTextEnabled(function(result){
        SetBadgeTextButton(result);
    });

    // Check if toast notifications are enabled
    AreToastNotificationsEnabled(function(result){
        SetToastNotificationsButton(result);
    });
}

// Function to build the default player for the dropdown
function BuildDefaultPlayerDropdown(){
    // Get the element we will be populating
    var playersList = $("#players-list");

    // We want to build a mapping so we know which player is already selected
    var pagePlayerMap = {};
    
    // Start by loading the all_players ajax
    $.getJSON(ALL_PLAYERS_JSON, function(all_players){
        // Iterate through each of the players
        for (var curPlayer in all_players){
            // Get the open_page
            var openPage = all_players[curPlayer].open_page;

            // Get the simple name
            var simpleName = all_players[curPlayer].simple_name;

            // Save it in our inverse mapping
            pagePlayerMap[openPage] = curPlayer;

            // Build the string to add
            var htmlToAdd = "<li id=" + simpleName + "><a href='#'>" + curPlayer + "</a></li>";
            
            // Now add the string to our list
            playersList.append(htmlToAdd);

            // Grab the newly created element
            var newElement = $("#" + simpleName);

            // Now bind the element to a new click event
            console.log("Binding " + curPlayer + " to click open " + openPage);
            (function (player, page){
                newElement.bind('click', function(){
                    SaveDefaultPlayer(player, page)
                });
            })(curPlayer, openPage);
        }

        // Grab the players-list-button
        var playersListButton = $("#players-list-button");

        // Update the button to reflect which one is already stored (if any)
        chrome.storage.local.get('default_open', function(data){
            // Check it's value
            if (data.default_open){
                // Use our map to set the player text, if it exists
                var playerName = pagePlayerMap[data.default_open];
                if (playerName){
                    // Set the button to this players name
                    playersListButton.text(playerName);

                    // Append the caret within the button
                    playersListButton.append("  <span class='caret'></span>");
                }else{
                    // A players URL may have changed. Leave it unset.
                    playersListButton.text("None");
                    playersListButton.append("  <span class='caret'></span>");
                }
            }else{
                // Undefined. Leave it unset.
                playersListButton.text("None");
                playersListButton.append("  <span class='caret'></span>");
            }
        });
    });
}

// This function is called when a player in the default player dropdown is
// selelcted. Used to save what is selected.
function SaveDefaultPlayer(playerName, openPage){
    // Save this player as the default
    chrome.storage.local.set({'default_open' : openPage}, function(){
        console.log("options.js::Saved default player to open " + playerName + " at " + openPage);
    });

    // Grab the button
    var playersListButton = $("#players-list-button");

    // We also need to make sure this player is the one selected in the dropdown
    playersListButton.text(playerName);
    playersListButton.append("  <span class='caret'></span>");
}

/////////////////////////////////////////////////////////////////////////////
// Execution Start
/////////////////////////////////////////////////////////////////////////////

// Start of execution when the document is ready
$(function(){

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

    // Bind the click of the icon text button to flip the state of the icon text
    $("#icon_text").bind('click', function(){
        // Check if badge text is enabled
        IsBadgeTextEnabled(function(result){
            SetBadgeTextEnabled(!result, function(){
                SetBadgeTextButton(!result);
            });
        });
    });

    // Bind the click of the toast notifications button to flip the state
    $("#toast_notifications").bind('click', function(){
        // Check if toasting is enabled
        AreToastNotificationsEnabled(function(result){
            SetToastNotificationsEnabled(!result, function(){
                SetToastNotificationsButton(!result);
            });
        });
    });

    // Build the dropdown for the default player
    BuildDefaultPlayerDropdown();

    // Immediately update the buttons
    UpdateButtons();

    // Update these buttons every few seconds
    window.setInterval(function(){
        UpdateButtons();
    }, 3000);
});
