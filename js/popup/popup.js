/////////////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////////////

// Class name for hidden button
var HIDDEN_BUTTON_CLASS = "hiddenButton";

// Class name for subdued button
var SUBDUED_BUTTON_CLASS = "subduedButton";

// Class name for dim button
var DIM_BUTTON_CLASS = "dimButton";

// Class name for visible button
var VISIBLE_BUTTON_CLASS = "visibleButton";


/////////////////////////////////////////////////////////////////////////////
// Member Variables
/////////////////////////////////////////////////////////////////////////////

// Whether or not we should debug
var mDebug = false;

// The background page
var mMusicality = chrome.extension.getBackgroundPage().Musicality;

// The player details
var mPlayerDetails = mMusicality.GetPlayerDetails();

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

// Update the information displayed within the extension
function UpdateInformation(){

    if (mDebug){
        console.log("popup.js::UpdateInformation()");
    }

    // Tell the background to update too
    var info = mMusicality.GetPlaybackInfo();

    // Re-grab the player details in case they changed
    mPlayerDetails = mMusicality.GetPlayerDetails();

    // Populate the information
    PopulateInformation(info);
}

// Populate the actual extension contents
function PopulateInformation(info){

    // Grab the player details again
    mPlayerDetails = mMusicality.GetPlayerDetails();
    
    // Get the artist from the background
    var artist = info.artist;
    
    if (mDebug){
        console.log("popup.js::PopulateInfo -- artist: " + artist);
    }

    // Get the track from the background
    var track = info.track;

    if (mDebug){
        console.log("popup.js::PopulateInfo -- track: " + track);
    }

    // Get handles to different elements we need
    var playPauseElement = $("#playPauseButton");
    var nextTrackElement = $("#nextButton");
    var prevTrackElement = $("#previousButton");
    var shuffleButtonElement = $("#shuffleButton");
    var repeatButtonElement = $("#repeatButton");
    var thumbsUpButtonElement = $("#thumbsUpButton");
    var thumbsDownButtonElement = $("#thumbsDownButton");
    var trackElement = $("#track");
    var artistElement = $("#artist");
    var artClass = $(".art");
    var playbackControlsImgElement = $("#playbackControlsBackgroundImage");
    var trackInfoImgElement = $("#trackInfoBackgroundImage");
    var totalTimeElement = $("#totalTime");
    var curTimeElement = $("#currentTime");
    var seekMarker = $("#seekMarker");

    if (track && track !== null && track !== "" && mPlayerDetails){
        UpdateElementText(trackElement, track);

        // Set the play/pause opacity
        if (mPlayerDetails.has_play_pause){
            UpdateButton(playPauseElement, VISIBLE_BUTTON_CLASS);
        }else{
            UpdateButton(playPauseElement, HIDDEN_BUTTON_CLASS);
        }

        // Set the next track opacity
        if (mPlayerDetails.has_next_track){
            UpdateButton(nextTrackElement, VISIBLE_BUTTON_CLASS);
        }else{
            UpdateButton(nextTrackElement, HIDDEN_BUTTON_CLASS);
        }

        // Set the prev track opacity
        if (mPlayerDetails.has_prev_track){
            UpdateButton(prevTrackElement, VISIBLE_BUTTON_CLASS);
        }else{
            UpdateButton(prevTrackElement, HIDDEN_BUTTON_CLASS);
        }

        // Set the shuffle button opacity
        if (mPlayerDetails.has_shuffle){
            UpdateButton(shuffleButtonElement, SUBDUED_BUTTON_CLASS);
        }else{
            UpdateButton(shuffleButtonElement, HIDDEN_BUTTON_CLASS);
        }

        // Set the repeat button opacity
        if (mPlayerDetails.has_repeat){
            UpdateButton(repeatButtonElement, SUBDUED_BUTTON_CLASS);
        }else{
            UpdateButton(repeatButtonElement, HIDDEN_BUTTON_CLASS);
        }

        // Set the thumbs up button opacity
        if (mPlayerDetails.has_thumbs_up){
            UpdateButton(thumbsUpButtonElement, SUBDUED_BUTTON_CLASS);
        }else{
            UpdateButton(thumbsUpButtonElement, HIDDEN_BUTTON_CLASS);
        }

        // Set the thumbs down button opacity
        if (mPlayerDetails.has_thumbs_down){
            UpdateButton(thumbsDownButtonElement, SUBDUED_BUTTON_CLASS);
        }else{
            UpdateButton(thumbsDownButtonElement, HIDDEN_BUTTON_CLASS);
        }                
        
        // Store the track for now
        mCurTrack = track;

        // Display the name of the player that is playing
        var playerName = mPlayerDetails.name;
        if (playerName !== null && playerName !== ""){
 
           // Let's push the player name as a custom GA variable
           _gaq.push(['_setCustomVar',
            1,
            'Player Name',
            mPlayerDetails.name,
            3]);

           // Track the event
           _gaq.push(['_trackEvent',
            'Found Player',
            'Popup'
            ]);
       }

        // Check the artist information and populate
        if (artist !== null && artist !== ""){
            UpdateElementText(artistElement, artist);
        }else{
            // No artist. Update text appropriately
            UpdateElementText(artistElement, "");
        }

        // Get the album art from the background
        var art_url = info.artUrl;
        
        // Log it if we've found the art
        if (mDebug){
            console.log("popup.js::PopulateInfo -- art URL: " + art_url);
        }

        // Check if we have art        
        if (art_url && art_url !== null && art_url !== ""){
            artClass.attr("src", art_url);
        }else{
            // Not found, so revert it to the empty art
            artClass.attr("src", "/images/art.png");
        }

        // Get the current time and total time from the player
        var current_time = Helper.MsToTime(info.currentTime);
        var total_time = Helper.MsToTime(info.totalTime);
        
        // Log it if we've found the current time
        if (mDebug){
            console.log("popup.js::PopulateInfo -- current time: " + current_time);
            console.log("popup.js::PopulateInfo -- total time: " + total_time);
        }

        var totalTimeSet = total_time !== null && total_time !== "" && info.totalTime > 0 && curTimeElement.text() !== "";

        // Update the info
        if (current_time !== null && current_time !== "" && info.currentTime > 0){
            // Only add the '/' if total time is present
            if (totalTimeSet){
                UpdateElementText(curTimeElement, current_time + "/");
            }else{
                UpdateElementText(curTimeElement, current_time);
            }
        }else{
            curTimeElement.text("");
        }

        // Update the info for total time
        if (totalTimeSet){
            UpdateElementText(totalTimeElement, total_time);
        }else{
            totalTimeElement.text("");
        }

        var percentagePlayed = info.currentTime / info.totalTime;
        seekMarker.css({left: percentagePlayed * 100 + "%"});

        // Get is playing from background
        var playing = info.isPlaying;

        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is playing: " + playing);
        }

        // Set the class of the element
        if (playing){
            playPauseElement.removeClass("play");
            playPauseElement.addClass("pause");
        }else{
            playPauseElement.removeClass("pause");
            playPauseElement.addClass("play");
        }

        // Get whether or not it's shuffled
        var shuffled = info.isShuffled;

        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is shuffled: " + shuffled);
        }

        if (shuffled){
            shuffleButtonElement.addClass("active");
        }else{
            shuffleButtonElement.removeClass("active");
        }
        
        // Get whether or not repeat is off
        var repeat_off = info.isRepeatOff;
        
        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is repeat off: " + repeat_off);
        }

        // Get the element
        if (repeat_off){
            repeatButtonElement.addClass("glyphicon-refresh");
            repeatButtonElement.removeClass("repeat-one");
            repeatButtonElement.removeClass("active");
        }

        // Get whether or not repeat is on (1)
        var repeat_one = info.isRepeatOne;

        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is repeat one: " + repeat_one);
        }

        // Get the element
        if (repeat_one){
            repeatButtonElement.addClass("active");
            repeatButtonElement.addClass("glyphicon-refresh");
            repeatButtonElement.addClass("repeat-one");
        }

        // Get whether or not it's repeat all
        var repeat_all = info.isRepeatAll;

        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is repeat all: " + repeat_all);
        }

        // Get the element
        if (repeat_all){
            repeatButtonElement.addClass("active");
            repeatButtonElement.addClass("glyphicon-refresh");
            repeatButtonElement.removeClass("repeat-one");
        }

        // Get the thumbs up state
        var thumbed_up = info.isThumbedUp;
        
        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is thumbed up: " + thumbed_up);
        }

        // Toggle the thumbs up button
        if (thumbed_up){
            thumbsUpButtonElement.addClass("active");
        }else{
            thumbsUpButtonElement.removeClass("active");
        }

        // Get the thumbed down state
        var thumbed_down = info.isThumbedDown;

        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is thumbed down: " + thumbed_down);
        }

        // Toggle the thumbs down button
        if (thumbed_down){
            thumbsDownButtonElement.addClass("active");
        }else{
            thumbsDownButtonElement.removeClass("active");
        }
    }else{
        // Looks like we have to disable some buttons
        UpdateButton(playPauseElement, DIM_BUTTON_CLASS);
        UpdateButton(nextTrackElement, DIM_BUTTON_CLASS);
        UpdateButton(prevTrackElement, DIM_BUTTON_CLASS);
        UpdateButton(shuffleButtonElement, DIM_BUTTON_CLASS);
        UpdateButton(repeatButtonElement, DIM_BUTTON_CLASS);
        UpdateButton(thumbsUpButtonElement, DIM_BUTTON_CLASS);
        UpdateButton(thumbsDownButtonElement, DIM_BUTTON_CLASS);

        // Tell the user nothing is playing
        UpdateElementText(artistElement, "");
        UpdateElementText(trackElement, "Play a song!");

        // Check if the hidden popup is already visible
        if (!$('#hiddenPopup').is(':visible')){
            DisplayHiddenPopupWithContentsOf("../html/instructions.html");
        }

        // Empty the other pieces as well
        artClass.attr("src", "../images/art.png");
        curTimeElement.text("");
        totalTimeElement.text("");
    }
}

// A function to update the element text (if unchanged)
function UpdateElementText(element, text){
    if (element.text() != text){
        element.text(text);
    }
}

// A function to change the class of the provided element
function UpdateButton(buttonToUpdate, updatedClass){
    // Remove all button classes
    buttonToUpdate.removeClass(HIDDEN_BUTTON_CLASS);
    buttonToUpdate.removeClass(SUBDUED_BUTTON_CLASS);
    buttonToUpdate.removeClass(DIM_BUTTON_CLASS);
    buttonToUpdate.removeClass(VISIBLE_BUTTON_CLASS);

    // Add the new class
    buttonToUpdate.addClass(updatedClass);
}

//// Click Functions ////

// Method executed when extensions shuffle is clicked
function ShuffleClick(){
    // Call the master clicker
    ClickSomething(CLICK_SHUFFLE);
}

// Method executed when extensions repeat is clicked
function RepeatClick(){
    ClickSomething(CLICK_REPEAT);
}

// Method executed when extensions prev track is clicked
function PrevTrackClick(){
    ClickSomething(CLICK_PREV_TRACK);
}

// Method executed when extensions play is clicked
function PlayClick(){
    ClickSomething(CLICK_PLAY);
}

// Method executed when extensions pause is clicked
function PauseClick(){
    ClickSomething(CLICK_PAUSE);
}

// Method executed when extensions next track is clicked
function NextTrackClick(){
    ClickSomething(CLICK_NEXT_TRACK);
}

// Method executed when extensions thumbs up is clicked
function ThumbsUpClick(){
    ClickSomething(CLICK_THUMBS_UP);
}

// Method executed when extensions thumbs down is clicked
function ThumbsDownClick(){
    ClickSomething(CLICK_THUMBS_DOWN);
}

// Method executed when extensions thumbs down is clicked
function SeekUpdate(value){
    ClickSomething(SEEK_UPDATE, value);
}

// General method for dealing with clicking anything
function ClickSomething(clickWhat, value){
    // Tell the background to take care of this
    mMusicality.ClickSomething(clickWhat, function(result){
        if (mDebug){
            console.log("ClickSomething callback with " + result);
        }

        // Wait a tenth of a second and update
        window.setTimeout(function(){
            UpdateInformation();
        }, 100);
    }, value);
}

// A function to start the marquee when hovered over
function startMarquee(){
    // Get the width of the item
    var width = $(this).width();
    var parentWidth = $(this).parent().width();

    // Check if we are overflowing
    if(width > parentWidth - 10) {

        // Get the distance to scroll (10 pixel buffer)
        var scrollDistance = width - parentWidth + 10;

        // Get the item to scroll
        var itemToScroll = $(this).parent();

        // Stop any current animation on that item
        itemToScroll.stop();
        
        // Start animating
        itemToScroll.animate({scrollLeft: scrollDistance}, 2000 * (scrollDistance/parentWidth), 'linear');
    }
}

// A function to stop the marquee when it's no longer hovered over
function stopMarquee(){
    // Get the item that could be scrolling
    var itemToStop = $(this).parent();

    // Stop the animation
    itemToStop.stop();

    // Swing it back to the original position
    itemToStop.animate({scrollLeft: 0}, 'medium', 'swing');
}

// A function to display specific text in the popup
function DisplayHiddenPopupWithContentsOf(path){
    $('#hiddenPopup').load(path, function(){

        // Bind the click event to close the popup
        $("#hiddenPopupCloseButton").bind('click', function(){
            CloseHiddenPopup();
        });

        UpdateInformation();

        // Wait a short amoutn of time, and fade in
        setTimeout(function(){
            $('#hiddenPopup').fadeIn();
        }, 250);
    });
}

// A function to close the hidden popup
function CloseHiddenPopup(){
    $('#hiddenPopup').fadeOut();
}

/////////////////////////////////////////////////////////////////////////////
// Execution Start
/////////////////////////////////////////////////////////////////////////////

// Once the document is ready, bind all of the functions.
$(function(){
    // Immediately update our information
    UpdateInformation();
    
    //Update our information once second.
    window.setInterval(function() {
        UpdateInformation();
    }, 1000);

    // Get the clickable elements ready!

    // Shuffle button
    $("#shuffleButton").bind('click', function(){
        ShuffleClick();
    });

    // Repeat button
    $("#repeatButton").bind('click', function(){
        RepeatClick();
    });
    
    // Previous track
    $("#previousButton").bind('click', function(){
       PrevTrackClick();
    });

    $("#seekContainer").bind('click', function(){
        SeekUpdate(0.5);
    });

    // Play/pause

    // Get the element
    var playPauseElement = $("#playPauseButton");
    playPauseElement.bind('click', function(handler){
        // Be smart about what we are clicking
        if (playPauseElement.hasClass("play")){
            // Click play
            PlayClick();
        }else if (playPauseElement.hasClass("pause")){
            // Click pause
            PauseClick();
        }
    });

    // Next track
    $("#nextButton").bind('click', function(){
        NextTrackClick();
    });

    // Thumbs up
    $("#thumbsUpButton").bind('click', function(){
        ThumbsUpClick();
    });

    // Thumbs down
    $("#thumbsDownButton").bind('click', function(){
        ThumbsDownClick();
    });

    // Player name
    $('#art').bind('click', function(){
        mMusicality.GoToNowPlayingTab();
    });

    // Register all marquee items to marquee
    $(".marqueeItem").hover(startMarquee, stopMarquee);

    // Tell background to open the default player, if there is one set
    mMusicality.OpenDefaultPlayer();

    // Let's decide if we should show the popup or not (1/15 chance)
    if (Math.random() < 0.067){
        DisplayHiddenPopupWithContentsOf("../html/hiddenPopup.html");
    }
});
