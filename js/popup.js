/////////////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////////////

// None

/////////////////////////////////////////////////////////////////////////////
// Member Variables
/////////////////////////////////////////////////////////////////////////////

// Whether or not we should debug
var mDebug = false;

// The background page
var mBackground = chrome.extension.getBackgroundPage();

// The player details
var mPlayerDetails = mBackground.mPlayerDetails;

/////////////////////////////////////////////////////////////////////////////
// Functions
/////////////////////////////////////////////////////////////////////////////

// Update the information displayed within the extension
function UpdateInformation(){

    if (mDebug){
        console.log("popup.js::UpdateInformation()");
    }

    // Tell the background to update too
    mBackground.UpdateInformation();

    // Re-grab the player details in case they changed
    mPlayerDetails = mBackground.mPlayerDetails;

    // Populate the information
    PopulateInformation();
}

// Populate the actual extension contents
function PopulateInformation(){
    // Get the artist from the background
    var artist = mBackground.mArtist;
    
    if (mDebug){
        console.log("popup.js::PopulateInfo -- artist: " + artist);
    }

    // Get the track from the background
    var track = mBackground.mTrack;

    if (mDebug){
        console.log("popup.js::PopulateInfo -- track: " + track);
    }

    // Get handles to different elements we need
    var playPauseElement = $("#play_pause");
    var nextTrackElement = $("#next_track");
    var prevTrackElement = $("#previous_track");
    var shuffleButtonElement = $("#shuffle_button");
    var repeatButtonElement = $("#repeat_button");
    var thumbsUpButtonElement = $("#thumbs_up_button");
    var thumbsDownButtonElement = $("#thumbs_down_button");
    var playerNameElement = $("#player_name");
    var trackElement = $("#track");
    var artistElement = $("#artist");
    var artElement = $("#art");
    var totalTimeElement = $("#total_time");
    var curTimeElement = $("#cur_time");
    var playPauseElement = $("#play_pause");
    var shuffleElement = $("#shuffle_button");
    var repeatElement = $("#repeat_button");
    var thumbsUpElement = $("#thumbs_up_button");
    var thumbsDownElement = $("#thumbs_down_button");
    
    if (track && track != null && track != ""){
        trackElement.text(track);

        // Set the play/pause opacity
        if (mPlayerDetails.has_play_pause){
            playPauseElement.css("opacity", "1");
        }else{
            playPauseElement.css("opacity", "0");
        }

        // Set the next track opacity
        if (mPlayerDetails.has_next_track){
            nextTrackElement.css("opacity", "1");
        }else{
            nextTrackElement.css("opacity", "0");
        }

        // Set the prev track opacity
        if (mPlayerDetails.has_prev_track){
            prevTrackElement.css("opacity", "1");
        }else{
            prevTrackElement.css("opacity", "0");
        }

        // Set the shuffle button opacity
        if (mPlayerDetails.has_shuffle){
            shuffleButtonElement.css("opacity", ".85");
        }else{
            shuffleButtonElement.css("opacity", "0");
        }

        // Set the repeat button opacity
        if (mPlayerDetails.has_repeat){
            repeatButtonElement.css("opacity", ".85");
        }else{
            repeatButtonElement.css("opacity", "0");
        }

        // Set the thumbs up button opacity
        if (mPlayerDetails.has_thumbs_up){
            thumbsUpButtonElement.css("opacity", ".85");
        }else{
            thumbsUpButtonElement.css("opacity", "0");
        }

        // Set the thumbs down button opacity
        if (mPlayerDetails.has_thumbs_down){
            thumbsDownButtonElement.css("opacity", ".85");
        }else{
            thumbsDownButtonElement.css("opacity", "0");
        }                
        
        // Store the track for now
        mCurTrack = track;

        // Display the name of the player that is playing
        playerNameElement.text(mPlayerDetails.name);

        // Check the artist information and populate
        if (artist != null && artist != ""){
            artistElement.text(artist);
        }else{
            // No artist. Update text appropriately
            artistElement.text("");
        }

        // Get the album art from the background
        var art_url = mBackground.mArtUrl;
        
        // Log it if we've found the art
        if (mDebug){
            console.log("popup.js::PopulateInfo -- art URL: " + art_url);
        }

        // Check if we have art        
        if (art_url && art_url != null && art_url != ""){
            // Update the art to display the now playing art
            artElement.attr("src", art_url);
        }else{
            // Not found, so revert it to the empty art
            artElement.attr("src", "/images/empty.png");
        }

        // Get the current time from the player
        var current_time = mBackground.GetTimeStringForMilliseconds(mBackground.mCurrentTime);
        
        // Log it if we've found the current time
        if (mDebug){
            console.log("popup.js::PopulateInfo -- current time: " + current_time);
        }

        // Update the info
        if (current_time != null && current_time != "" && mBackground.mCurrentTime > 0){
            curTimeElement.text(current_time + "/");
        }else{
            curTimeElement.text("");
        }

        // Get the total time
        var total_time = mBackground.GetTimeStringForMilliseconds(mBackground.mTotalTime);

        // Log it if we've found the total time
        if (mDebug){
            console.log("popup.js::PopulateInfo -- total time: " + total_time);
        }

        // Update the info
        if (total_time != null && total_time != "" && mBackground.mTotalTime > 0){
            totalTimeElement.text(total_time);
        }else{
            totalTimeElement.text("");
        }

        // Get is playing from background
        var playing = mBackground.mIsPlaying;

        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is playing: " + playing);
        }

        // Set the class of the element
        if (playing){
            playPauseElement.attr("class", "pause");
        }else{
            playPauseElement.attr("class", "play");
        }

        // Get whether or not it's shuffled
        var shuffled = mBackground.mIsShuffled;

        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is shuffled: " + shuffled);
        }

        if (shuffled){
            shuffleElement.attr("class", "shuffle_on");
        }else{
            shuffleElement.attr("class", "shuffle_off");
        }
        
        // Get whether or not repeat is off
        var repeat_off = mBackground.mIsRepeatOff;
        
        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is repeat off: " + repeat_off);
        }

        // Get the element
        if (repeat_off){
            repeatElement.attr("class", "repeat_off");
        }

        // Get whether or not repeat is on (1)
        var repeat_one = mBackground.mIsRepeatOne;

        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is repeat one: " + repeat_one);
        }

        // Get the element
        if (repeat_one){
            repeatElement.attr("class", "repeat_one");
        }

        // Get whether or not it's repeat all
        var repeat_all = mBackground.mIsRepeatAll;

        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is repeat all: " + repeat_all);
        }

        // Get the element
        if (repeat_all){
            repeatElement.attr("class", "repeat_all");
        }

        // Get the thumbs up state
        var thumbed_up = mBackground.mIsThumbedUp;
        
        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is thumbed up: " + thumbed_up);
        }

        // Toggle the thumbs up button
        if (thumbed_up){
            thumbsUpElement.attr("class", "thumbs_up_on");
        }else{
            thumbsUpElement.attr("class", "thumbs_up_off");
        }

        // Get the thumbed down state
        var thumbed_down = mBackground.mIsThumbedDown;

        // Log whatever we have got
        if (mDebug){
            console.log("popup.js::PopulateInfo -- is thumbed down: " + thumbed_down);
        }

        // Toggle the thumbs down button
        if (thumbed_down){
            thumbsDownElement.attr("class", "thumbs_down_on");
        }else{
            thumbsDownElement.attr("class", "thumbs_down_off");
        }
    }else{
        // Looks like we have to disable some buttons
        playPauseElement.css("opacity", ".1");
        nextTrackElement.css("opacity", ".1");
        prevTrackElement.css("opacity", ".1");
        shuffleButtonElement.css("opacity", ".1");   
        repeatButtonElement.css("opacity", ".1");   
        thumbsUpButtonElement.css("opacity", ".1");   
        thumbsDownButtonElement.css("opacity", ".1");
        playerNameElement.text("");

        // Tell the user nothing is playing
        trackElement.text("Play a song.");

        // Empty the other pieces as well
        artistElement.text("");
        artElement.attr("src", "/images/empty.png");
        curTimeElement.text("");
        totalTimeElement.text("");
    }
}

//// Click Functions ////

// Method executed when extensions shuffle is clicked
function ShuffleClick(){
    // Call the master clicker
    ClickSomething("click_shuffle");
}

// Method executed when extensions repeat is clicked
function RepeatClick(){
    ClickSomething("click_repeat");
}

// Method executed when extensions prev track is clicked
function PrevTrackClick(){
    ClickSomething("click_prev_track");
}

// Method executed when extensions play is clicked
function PlayClick(){
    ClickSomething("click_play");
}

// Method executed when extensions pause is clicked
function PauseClick(){
    ClickSomething("click_pause");
}

// Method executed when extensions next track is clicked
function NextTrackClick(){
    ClickSomething("click_next_track");
}

// Method executed when extensions thumbs up is clicked
function ThumbsUpClick(){
    ClickSomething("click_thumbs_up");
}

// Method executed when extensions thumbs down is clicked
function ThumbsDownClick(){
    ClickSomething("click_thumbs_down");
}

// General method for dealing with clicking anything
function ClickSomething(clickWhat){
    // Tell the background to take care of this
    mBackground.ClickSomething(clickWhat);
}

// A function to start the marquee when hovered over
function startMarquee(){
    // Get the width of the item
    var width = $(this).width();
    var parentWidth = $(this).parent().width();

    // Check if we are overflowing
    if(width > parentWidth) {

        // Get the distance to scroll
        var scrollDistance = width - parentWidth;

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

/////////////////////////////////////////////////////////////////////////////
// Execution Start
/////////////////////////////////////////////////////////////////////////////

// Once the document is ready, bind all of the functions.
$(function(){
    // Immediately update our information
    UpdateInformation();
    
    //Update our information once every quarter second.
    window.setInterval(function() {
        UpdateInformation();
    }, 1000)

    // Get the clickable elements ready!

    // Shuffle button
    $("#shuffle_button").bind('click', function(){
        ShuffleClick();
    });

    // Repeat button
    $("#repeat_button").bind('click', function(){
        RepeatClick();
    });
    
    // Previous track
    $("#previous_track").bind('click', function(){
       PrevTrackClick();
    });

    // Play/pause
    $("#play_pause").bind('click', function(handler){
        // Be smart about what we are clicking
        var className = handler.currentTarget.className;
        if (className == "play"){
            PlayClick();
        }else if (className == "pause"){
            PauseClick();
        }
    });

    // Next track
    $("#next_track").bind('click', function(){
        NextTrackClick();
    });

    // Thumbs up
    $("#thumbs_up_button").bind('click', function(){
        ThumbsUpClick();
    });

    // Thumbs down
    $("#thumbs_down_button").bind('click', function(){
        ThumbsDownClick();
    });

    // Register all marquee items to marquee
    $(".marquee_item").hover(startMarquee, stopMarquee);

    // Tell background to open the default player, if there is one set
    mBackground.OpenDefaultPlayer();
});
