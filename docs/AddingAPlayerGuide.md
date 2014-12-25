# Step-by-step Guide to Adding a Player

Adding a player is actually a fairly straightforward process, which in most cases should require writing no actual code. Configuration files should be sufficient. This guide assumes you have this git repository cloned somewhere locally, that you know how to write JQuery selectors, and that you have some basic experience with Chrome Developer Tools.

## 0) Loading Musicality as an Unpacked Extension

Obviously in order to test out your changes you'll need to be able to run Musicality as an unpacked extension in developer mode. To do that you should go to [chrome://extensions](chrome://extensions) and enable developer mode by clicking the checkbox in the upper-right hand corner. You should now see a new button labeled "Load unpacked extension..." which you now want to click. Browse to the Musicality folder you had cloned down and click "Select" and Chrome will load the extension. If you already have Musicality installed from the Chrome Web Store, you'll see you now have two Musicality icons. This isn't a problem, just make sure you know which one is which or you may end up confusing yourself when attempting to debug later.

## 1) Adding to all_players.json

Open up [all_players.json](json/all_players.json) found in the [json](json/) directory. Here you will find a simple definition of the players supported in alphabetical order. In this example we are adding support for Google Play Music, so we would add a block similar to the following:

````JSON
"Google Play Music" : {
	"simple_name" : "google_music",
	"pattern" : "https?\\:\\/\\/play\\.google\\.com\\/music\\/listen.*",
	"json_loc" : "/json/google_music.json",
	"open_page" : "https://play.google.com/music/listen"
},
````

`simple_name` is the name of the player as it can be referenced by code (so lowercase with underscores instead of spaces or periods).
`pattern` is the regex pattern that would match any URL of the Google Play Music player. This is used by Musicality to see if the tab it's looking at is one of the known players or not. If it doesn't match the player, Musicality will not attempt to communicate with the contentscript on the page.
`json_loc` is the absolute path (rooted at the root of the source) to the json file that contains the full configuration details for the player. We will actually add this file in a moment, but we can expect it to be something like `/json/#{simple_name}.json` in order to be consistent.
`open_page` is the URL Musicality will open if the user has selected Google Play Music to be their default player. This is the URL of the new tab Musicality will open in that case.

That's all we need to add to `all_players.json` in order to register our new player with Musicality.

## 2) Adding google_music.json

Now it's time to actually start configuring the player. The purpose of this file we are about to create is to tell Musicality where it can look for each piece of information on that players page, as well as what it needs to do in order to play, pause, skip, previous, shuffle, etc; The actionable commands.

Create an empty file at `json/google_music.json` and open it up immediately for editing.

Musicality expects a number of specific key/value pairs in this file. To start, we need a name field. Let's add that:

````JSON
{
	"name" : "Google Play Music"
}
````

## 3) Defining a Players Abilities

Now we need to tell Musicality what pieces of information and interactive elements are possible to obtain and use for this player. To figure out what these values should be, simply look at the player in your web browser and see what interaction is possible! Let's add them for our player (`...` represents the things we've already added previously, namely name):

````JSON
{
	...

	"has_thumbs_up" : true,
    "has_thumbs_down" : true,
    "has_next_track" : true,
    "has_prev_track" : true,
    "has_play_pause" : true,
    "has_shuffle" : true,
    "has_repeat" : true,
    "has_current_track_time" : true,
    "has_total_track_time" : true,
    "has_remaining_track_time" : false,
}
````

Awesome. These key/value pairs are not arbitrary, though you can leave out values if they are false. Musicality will see a particular value is undefined and assume false. When determining what it should and should not attempt to query/do with the player, Musicality will look at these values. For exmaple, if `"has_repeat"` is set to `false`, Musicality will not attempt to get the repeat information from the player.

All of the exact valid keys can be found in the [Valid Player Config Keys](docs/ValidPlayerConfigKeys.md) document. Feel free to read through that later, or if you believe there are other keys you need/do not need.

## 4) Defining How to Get Data

We need to now tell Musicality how it can obtain the important pieces of information it needs in order to reflect that state back to the user. To start off with, let's figure out how to tell Musicality if the player is playing. We'll need to do some investigative work in Chrome in order to determine how to obtain this. One useful thing to know is that JQuery is injected as an available contentscript to our player, so that should make things somewhat easier.

Open up Chrome's developer tools on the players page. For our example of Google Play Music, we notice specifically that there is an element that has a `data-id="play-pause"` attribute. This is the actual play pause button. We can read this information to determine if the player is playing or paused. Playing around with Google Play Music, it's quickly obvious that when something is playing, this element has a new class added called `playing`. We can use all of this information to determine if the player (Google Play Music) is playing.

Let's craft this query in the console of Chrome's Developer Tools, since it's easy to quickly validate. We'll need to change the frame/context of the current console to be the sandbox of our extension, Musicality. Type in the following JQuery into the console:

````Javascript
$('*[data-id=play-pause]').hasClass('playing')
````

You'll see it returns `true` when Google Play Music is playing, and returns `false` when it is not. This is exactly what we want, so we can now add this to our config file:

````JSON
{
	...

	"isPlaying" : "$('*[data-id=play-pause]').hasClass('playing')"
}
````

We'll now need to repeat the same process for each possible field. This is far easier for some players than others depending on the complexity of their DOM.

Once again, you can find what each of the valid keys are in the [Valid Player Config Keys](docs/ValidPlayerConfigKeys.md) document, found in the [docs](docs/) folder.

Populating the rest of the getters should result with something that looks like this:

````JSON
{
	...

    "isPlaying" : "$('*[data-id=play-pause]').hasClass('playing')",
    "isPaused" : "(!$('*[data-id=play-pause]').hasClass('playing') && $('#playerSongTitle').length > 0)",
    "isShuffled" : "$('.player-middle *[data-id=shuffle]')[0].value == 'ALL_SHUFFLE'",
    "isRepeatOff" : "$('*[data-id=repeat]').attr('value') == 'NO_REPEAT'",
    "isRepeatOne" : "$('*[data-id=repeat]').attr('value') == 'SINGLE_REPEAT'",
    "isRepeatAll" : "$('*[data-id=repeat]').attr('value') == 'LIST_REPEAT'",
    "isThumbedUp" : "$('*[data-rating=5]').hasClass('selected')",
    "isThumbedDown" : "$('*[data-rating=1]').hasClass('selected')",
    
    "artUrl" : "$('#playingAlbumArt').attr('src').replace('s130', 's550')",
    "artist" : "$('#player-artist').text()",
    "track" : "$('#playerSongTitle').text()",
    "currentTime" : "$('#time_container_current').text()",
    "totalTime" : "$('#time_container_duration').text()"
}
````

### 5) Defining How to Perform Actions

Finally we need to tell the player how to perform specific actions, such as click play, next, thumbs up, etc. The process is nearly identical to what is layed out in the previous step. Let's start with trying to click the play button. JQuery provides a wonderful `.click()` function that can be used to simulate a click event on a specific element. We'll partially use the same selector we did before to determine the play state from the play/pause button. Except this time, we just want to call `.click()` on the element. Let's try this statement:

````Javascript
$('*[data-id=play-pause]').click()
````

When we execute that statement in the console the player actually plays/pauses. Perfect! Let's add it to our config:

````JSON
{
	...

    "click_play" : "$('*[data-id=play-pause]').click()"
}
````

Now we again repeat the same kind of process we did before for the rest of the valid actions. Here is the final result for this section:

````JSON
{
	...

    "click_play" : "$('*[data-id=play-pause]').click()",
    "click_pause" : "$('*[data-id=play-pause]').click()",
    "click_next_track" : "$('*[data-id=forward]').click()",
    "click_prev_track" : "$('*[data-id=rewind]').click()",
    "click_shuffle" : "$('*[data-id=\"shuffle\"]').click()",
    "click_repeat" : "$('*[data-id=\"repeat\"]').click()",
    "click_thumbs_up" : "$('*[data-rating=5]').click()",
    "click_thumbs_down" : "$('*[data-rating=1]').click()"
}
````

Wonderful. There is no further information necessary for Google Play Music. Musicality should now know everything it needs to know for this player. The final config should look something like this:

````JSON
{

    "name" : "Google Play Music",

"COMMENT_1" : "This block contiains all of the things a player may or may not have",

    "has_thumbs_up" : true,
    "has_thumbs_down" : true,
    "has_next_track" : true,
    "has_prev_track" : true,
    "has_play_pause" : true,
    "has_shuffle" : true,
    "has_repeat" : true,
    "has_current_track_time" : true,
    "has_total_track_time" : true,
    "has_remaining_track_time" : false,

"COMMENT_2" : "This block contains all boolean values we can get back from the player",

    "isPlaying" : "$('*[data-id=play-pause]').hasClass('playing')",
    "isPaused" : "(!$('*[data-id=play-pause]').hasClass('playing') && $('#playerSongTitle').length > 0)",
    "isShuffled" : "$('.player-middle *[data-id=shuffle]')[0].value == 'ALL_SHUFFLE'",
    "isRepeatOff" : "$('*[data-id=repeat]').attr('value') == 'NO_REPEAT'",
    "isRepeatOne" : "$('*[data-id=repeat]').attr('value') == 'SINGLE_REPEAT'",
    "isRepeatAll" : "$('*[data-id=repeat]').attr('value') == 'LIST_REPEAT'",
    "isThumbedUp" : "$('*[data-rating=5]').hasClass('selected')",
    "isThumbedDown" : "$('*[data-rating=1]').hasClass('selected')",

"COMMENT_3" : "This block contains all string values we can get back from the player",
    
    "artUrl" : "$('#playingAlbumArt').attr('src').replace('s130', 's550')",
    "artist" : "$('#player-artist').text()",
    "track" : "$('#playerSongTitle').text()",
    "currentTime" : "$('#time_container_current').text()",
    "totalTime" : "$('#time_container_duration').text()",

"COMMENT_4" : "Finally, this block contains info on how to perform actions",

    "click_play" : "$('*[data-id=play-pause]').click()",
    "click_pause" : "$('*[data-id=play-pause]').click()",
    "click_next_track" : "$('*[data-id=forward]').click()",
    "click_prev_track" : "$('*[data-id=rewind]').click()",
    "click_shuffle" : "$('*[data-id=\"shuffle\"]').click()",
    "click_repeat" : "$('*[data-id=\"repeat\"]').click()",
    "click_thumbs_up" : "$('*[data-rating=5]').click()",
    "click_thumbs_down" : "$('*[data-rating=1]').click()"
}
````

Please note I've added a few "comment" key/value pairs which are really just for the humans reading this. Musicality will ignore keys it's not looking for, so feel free to annotate anything you want with a unique key like `COMMENT_#` as shown above.

### 6) Testing It

Now to test it all out we need to reload the Musicality extension. If you head back to the [chrome://extensions](chrome://extensions) page, you'll see there is a small "Reload" link below the Musicality extension loaded from file. If you click that button Musicality will reload. This is necessary for any json file change, as they are loaded at startup and kept in memory.

Musicality will automatically re-inject the contentscript necessary into the Google Music page. Now hopefully we can also see that it has started to report back to the Musicality extension and we have information from the player and can perform actions. If something doesn't work you'll have to figure out what is wrong with your selector. Invalid json will unfortunately fail silently, so you can use something like [JSON Lint](http://jsonlint.com/) to validate your json changes.

### 7) Additional Debugging Information

There are two primary places you will want to get debugging information from Musicality. One is in the contentscript. If you open up Chrome Web Tools and change the frame/context to Musicality you can execute the following command:

````Javascript
mDebug = true;
````

If Musicality is sending/receiving information from the contentscript, you should now see a number of debug statements flowing by. This is a good sign. Feel free to toggle `mDebug` back to false in order to stop the output. Then you can look and see what Musicality is getting from each of the statement it attempted to execute. One example piece of output would be something like this:

````
contentscript.js -- About to eval "$('#time_container_duration').text()"
contentscript.js -- Eval yielded "3:39"
````

Here you can clearly see what the contentscript attempted to execute, along with the result it obtained. With some players it can be tricky to obtain the information you want, so you'll have to play around with different ways of obtaining that information by reverse engineering.

If you aren't getting any output from the contentscript this is a sign that Musicality for some reason is not sending commands to your player. This could be something wrong with the pattern you defined in [all_players.json](json/all_players.json) which doesn't truly match the URL. It could also be a problem with the config file itself that may be solvable by simply linting the file.

### 8) I'm Still Stuck

No worries, I can help. Reach out and send an email to me at kyle(at)kylek.me and I'll be more than happy to assist you.