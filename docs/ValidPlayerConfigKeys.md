# Valid Player Config Keys

There are specific config keys that are expected for the primary two configuration files. These keys and their description can be found here.

## all_players.json

When adding a new player you'll need to add some values to the [all_players.json](json/all_players.json). The structure of this block you will be adding looks something like this:

````JSON
"Google Play Music" : {
    "simple_name" : "google_music",
    "pattern" : "https?\\:\\/\\/play\\.google\\.com\\/music\\/listen.*",
    "json_loc" : "/json/google_music.json",
    "open_page" : "https://play.google.com/music/listen"
},
````

The table below describes the keys you'll need with the `Google Play Music` object and a description of what the value should contain. For this particular section, each of these keys are required, so the "required" column is omitted from the table.

| Key | Description |
|-----|-------------|
| `simple_name` | The name of the player as it can be referenced by code. Lowercase with underscores instead of spaces or periods. |
| `pattern` | The regex pattern that would match any of the URLs of the player you want to match. |
| `json_loc` | The absolute path to the `.json` file which contains the full player configuration, rooted at the root of the repository. |
| `open_page` | The URL Musicality will use when automatically opening the page if the user has selected this player as their default in the options page. |

## your_player.json

The very first key you'll need is the player name. Here's a one row table for that very key:

| Key | Required | Description |
|-----|----------|-------------|
| `name` | Required | The full name of the player, including spaces and punctuation. |

### Player Abilities

When adding or fixing an existing player, there are a number of logical sections in the players configuration file, which is why there are multiple tables here.

The first is the section which defines the players abilities, along with what actions the user can and cannot perform on the player.

If a key is optional and you choose to omit it, Musicality will treat it as if you included that key and set it to false. Each of the values for these keys should be of type `boolean`.

| Key | Required | Description |
|-----|----------|-------------|
| `has_thumbs_up` | Optional | Whether or not the player has a thumbs up (or like, or heart) button of some sort. |
| `has_thumbs_down` | Optional | Whether or not the player has a thumbs down (or dislike, or ban) button of some sort. |
| `has_next_track` | Optional | Whether or not the player has a next track (or skip) button. |
| `has_prev_track` | Optional | Whether or not the player has a previous track button. |
| `has_play_pause` | Optional | Whether or not the player has a play/pause button or not. This could include a stop/play button for something like TuneIn. |
| `has_shuffle` | Optional | Whether or not the player has a shuffle button. |
| `has_repeat` | Optional | Whether or not the player has a repeat button. |
| `has_current_track_time` | Optional | Whether or not the player has the current track time available on the page. |
| `has_total_track_time` | Optional | Whether or not the player has the total track time on the page. This value would stay constant for the duration of the song. If this is true, it's expected the `has_remaining_track_time` field is false. |
| `has_remaining_track_time` | Optional | Whether or not the player has the remaining track time on the page. This value would decrement each second throughout the duration of the song. If this is true, it's expecte the `has_total_track_time` field is false. |

### How to Get Player Data

There are two logical sections here. One set of 'is'-ers, such as `isPlaying`, which should all evaluate to booleans, and another set of key/value pairs such as `track`, which should all evaulate to strings of some sort. This table below breaks down the 'is'-ers:

| Key | Required | Description of Statement to be Evaluated |
|-----|----------|-------------|
| `isPlaying` | If and only if `has_play_pause` is set to `true` | Determines whether or not the player is playing. Note that not playing does not necessarily mean the player is paused. |
| `isPaused` | If and only if `has_play_pause` is set to `true` | Determines whether or not the player is paused. |
| `isShuffled` | If and only if `has_shuffle` is set to `true` | Determines whether or not the player is set to shuffle. |
| `isRepeatOff` | If and only if `has_repeat` is set to `true` | Determines whether or not the players repeat setting is off. |
| `isRepeatOne` | If `has_repeat` is set to `true` and the player has a repeat one possibility | Determines whether or not the players repeat setting is set to repeat one or not. |
| `isRepeatAll` | If and only if `has_repeat` is set to `true` and the player has a repeat all possibility | Determine whether or not the players repeat setting is set to repeat all or not. |
| `isThumbedUp` | If and only if `has_thumbs_up` is set to `true` | Determines whether or not the current song is thumbed-up (or liked, or hearted, etc). |
| `isThumbedDown` | If and only if `has_thumbs_down` is set to `true` | Determines whether or not the current song is thumbed-down (or disliked, or banned, etc). |

And this next table is for the key/value pairs that we expect to return a string, as this provides us with information that isn't simply boolean in nature, such as the name of the track, or the URL to the album art.

| Key | Required | Description of Statement to be Evaluated |
|-----|----------|-------------|
| `artUrl` | Required | The URL to the album art of the currently playing song, if possible. If this returns nothing placeholder art will be used. |
| `artist` | Required | The artist of the currently playing track. |
| `track` | Required | The name of the currently playing track. |
| `currentTime` | If and only if `has_current_track_time` is set to `true` | The current time of the track being played. |
| `totalTime` | If and only if `has_total_track_time` is set to `true` | The total time of the track being played. This value should not change throughout the duration of the track |
| `remainingTime` | If and only if `has_remaining_track_time` is set to `true` | The remaining time of the track being played. This value should decrement each second throughout the duration of the track. |

### How to Perform Actions on the Player

This section is used to describe how Musicality can perform specific actions on the player. These values are not expected to return anything.

| Key | Required | Description of Statement to be Evaluated |
|-----|----------|-------------|
| `click_play` | If and only if `has_play_pause` is set to `true` | How to click the play button of the player, or some other action resulting in resumed playback |
| `click_pause` | If and only if `has_play_pause` is set to `true` | How to click the pause button (or stop button) of the player, or some other action resulting in paused/stopped playback. |
| `click_next_track` | If and only if `has_next_track` is set to `true` | How to skip the currently playing track. |
| `click_prev_track` | If and only if `has_prev_track` is set to `true` | How to go back and play the previously playing track. |
| `click_shuffle` | If and only if `has_shuffle` is set to `true` | How to toggle the shuffle state of the player. |
| `click_repeat` | If and only if `has_repeat` is set to `true` | How to change the repeat state of the player. |
| `click_thumbs_up` | If and only if `has_thumbs_up` is set to `true` | How to toggle the thumbs up state of the now playing track for the player. |
| `click_thumbs_down` | If and only if `has_thumbs_down` is set to `true` | How to toggle the thumbs down state of the now playing track for the player. |

### Miscellaneous Player Settings

There are some random additional special things for specific players. Feel free to use these keys below, which is currently just this one:

| Key | Required | Description |
|-----|----------|-------------|
| `scrobbleOnChange` | Optional | If set to `true` Musicality will scrobble the track when the now-playing track has changed. This is to be used when players don't provide track timing information that can be used to determine the appropriate time to scrobble. |