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
        $scrobBtn.text("Scrobbling enabled");
        $scrobBtn.removeClass("btn-fail");
        $scrobBtn.addClass("btn-success");
        $scrobLbl.text("Your tracks are being sent to last.fm");
    }else{
        // Set the text and class
        $scrobBtn.text("Scrobbling disabled");
        $scrobBtn.removeClass("btn-success");
        $scrobBtn.addClass("btn-fail");
        $scrobLbl.text("Your tracks are currently not being sent to last.fm");
    }
}

// A function to set the toaster notification information
function SetToastNotificationsButton(isEnabled){
    // Get the button
    $toasterNotificationBtn = $("#toast_notifications");
    $toasterNotificationLbl = $("#toast_notifications_label");

    if (isEnabled){
        // Set the button to say toasts are enabled
        $toasterNotificationBtn.text("Toast notifications enabled");
        $toasterNotificationBtn.removeClass("btn-fail");
        $toasterNotificationBtn.addClass("btn-success");
        $toasterNotificationLbl.text("Toast notification will be shown on track changes.");
    }else{
        // Set the button to say toasts are disabled
        $toasterNotificationBtn.text("Toast notifications disabled");
        $toasterNotificationBtn.removeClass("btn-success");
        $toasterNotificationBtn.addClass("btn-fail");
        $toasterNotificationLbl.text("Toast notification is not shown on track changes.");
    }
}

// A function to check if the badge text is enabled
function IsBadgeTextEnabled(callback){
    // Query the local storage for the value we are looking for
    chrome.storage.local.get('badge_text_enabled', function(data){
        callback(data.badge_text_enabled);
    });
}

// A function to check if the icon progress is enabled
function IsIconProgressEnabled(callback){
    // Query the local storage for the value we are looking for
    chrome.storage.local.get('icon_progress_enabled', function(data){
        callback(data.icon_progress_enabled);
    });
}

// A function to check if the icon is set to none (no scrolling or progress)
function AreIconOptionsDisabled(callback){
    // Query the local storage for the value we are looking for
    chrome.storage.local.get('icon_options_disabled', function(data){
        callback(data.icon_options_disabled);
    });
}

// A function to set if badge text should be enabled or not
function SetBadgeTextEnabled(isEnabled){
    // Set the value in local storage
    chrome.storage.local.set({'badge_text_enabled' : isEnabled});

    // Update the running instance
    mMusicality.iconHandler.SetBadgeTextEnabled(isEnabled);
}

// A function to set if icon progress bar should be enabled or not
function SetIconProgressEnabled(isEnabled, callback){
    // Set the value in local storage
    chrome.storage.local.set({'icon_progress_enabled' : isEnabled});

    // Update the running instance
    mMusicality.iconHandler.SetIconProgressEnabled(isEnabled);
}

// A function to disable icon progress and scrolling text
function SetIconOptionsDisabled(isDisabled, callback){
    // Set the value in local storage
    chrome.storage.local.set({'icon_options_disabled' : isDisabled});

    // Update the running instance (if we are disabling)
    if (isDisabled){
        mMusicality.iconHandler.SetIconProgressEnabled(false);
        mMusicality.iconHandler.SetBadgeTextEnabled(false);
    }
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
    mMusicality.scrobbler.AlreadyAuthenticated(function(result){
        SetLastFmAuthenticationButton(result);
    });

    // Check if last.fm is disabled
    mMusicality.scrobbler.IsScrobblingEnabled(function(result){
        SetScrobblingStateButton(result);
    });

    // Check if badge text is enabled
    IsBadgeTextEnabled(function(result){
        if(result){
            $("#icon_text").addClass("active");
        }
    });

    // Check if icon progress is enabled
    IsIconProgressEnabled(function(result){
        if(result){
            $("#icon_progress").addClass("active");
        }
    });

    // Check if icon changes are set to none
    AreIconOptionsDisabled(function(result){
        if(result){
            $("#icon_none").addClass("active");
        }
    });

    // Check if toast notifications are enabled
    AreToastNotificationsEnabled(function(result){
        SetToastNotificationsButton(result);
    });
}

// Function to build the default player for the dropdown
function BuildDefaultPlayerDropdown(playerList){
    // Get the element we will be populating
    var playersList = $("#players-list");

    // We want to build a mapping so we know which player is already selected
    var pagePlayerMap = {};
    
    // Iterate through each of the players
    for (var curPlayer in playerList){
        // Get the open_page
        var openPage = playerList[curPlayer].open_page;

        // Get the simple name
        var simpleName = playerList[curPlayer].simple_name;

        // Save it in our inverse mapping
        pagePlayerMap[openPage] = curPlayer;

        // Build the string to add
        var htmlToAdd = "<li id='default-dropdown-" + simpleName + "''><a href='#'>" + curPlayer + "</a></li>";
        
        // Now add the string to our list
        playersList.append(htmlToAdd);

        // Grab the newly created element
        var newElement = $("#default-dropdown-" + simpleName);

        // Now bind the element to a new click event
        console.log("Binding " + curPlayer + " to click open " + openPage);
        (function (player, page){
            newElement.bind('click', function(){
                SaveDefaultPlayer(player, page);
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

// This function build the table for enabling/disabling specific players
function BuildDisabledPlayersList(playerList){
    // Empty the table so there's no "Loading..." there.
    $('#loading-row').remove();

    var tableElement = $("#enabled-players-table");

    for(var curPlayer in playerList){
        var simpleName = playerList[curPlayer].simple_name;
        var playerDisabled = mMusicality.IsPlayerBlacklisted(simpleName);
        var checkedStr = "";
        if (!playerDisabled){
            checkedStr = "checked";
        }

        var newElementId = "#player-enabler-" + simpleName;

        var htmlToAdd = "<tr><td>" +
                        curPlayer +
                        "</td><td>" +
                        "<input type='checkbox' " +
                        checkedStr +
                        " id='" +
                        newElementId +
                        "' class='blacklist-checkbox'/></td></tr>";

        tableElement.append(htmlToAdd);

        var newElement = $(newElementId);
    }

    BindNewBlacklistElements();
}

// This function is used to bind all of the new blacklist checkboxes
function BindNewBlacklistElements(){
    $('.blacklist-checkbox').click(function(){
        var element = $(this);

        var simpleName = element.attr('id').split('#player-enabler-')[1];

        if (element.attr("checked")){
            console.log("Blacklisting player " + simpleName);

            mMusicality.BlacklistPlayer(simpleName);

            // Remove the attribute
            element.removeAttr("checked");
        }else{
            console.log("Enabling player " + simpleName);

            mMusicality.EnablePlayer(simpleName);

            // Add the checked attribute
            element.attr("checked", "");
        }
    });
}

/////////////////////////////////////////////////////////////////////////////
// Execution Start
/////////////////////////////////////////////////////////////////////////////

// Start of execution when the document is ready
$(function(){

    // We want to bind the click button to do everything it needs to for authentication
    $("#authenticate").bind('click', function(){
        // Authenticate is in scrobbler.js
        mMusicality.scrobbler.AuthenticateWithLastFm();
    });

    // Bind the click of the button to flip the state of scrobbling
    $("#scrobbling_toggle").bind('click', function(){
        mMusicality.scrobbler.IsScrobblingEnabled(function(result){
            mMusicality.scrobbler.SetScrobblingState(!result, function(){
                SetScrobblingStateButton(!result);
            });
        });
    });

    // Bind the click of the icon text button to flip the state of the icon text
    $("#icon_text").bind('click', function(){
        SetBadgeTextEnabled(true);

        // Disable icon progress
        SetIconProgressEnabled(false);
        SetIconOptionsDisabled(false);
    });

    // Bind the click of the icon progress button to flip the state of the icon text
    $("#icon_progress").bind('click', function(){
        SetIconProgressEnabled(true);

        // Disable badge text and disabled icon options
        SetBadgeTextEnabled(false);
        SetIconOptionsDisabled(false);
    });

    $("#icon_none").bind('click', function(){
        SetIconOptionsDisabled(true);
        SetIconProgressEnabled(false);
        SetBadgeTextEnabled(false);
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

    // Start by loading the all_players ajax
    $.getJSON(ALL_PLAYERS_JSON, function(all_players){
        // Build the dropdown for the default player
        BuildDefaultPlayerDropdown(all_players);

        // Build the player blacklist
        BuildDisabledPlayersList(all_players);
    });

    // Immediately update the buttons
    UpdateButtons();

    // Update these buttons every few seconds
    window.setInterval(function(){
        UpdateButtons();
    }, 3000);
});
