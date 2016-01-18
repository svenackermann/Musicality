[![Build Status](https://travis-ci.org/kkamperschroer/Musicality.svg?branch=master)](https://travis-ci.org/kkamperschroer/Musicality)

# Musicality

Musicality is a [Chrome Extension](https://chrome.google.com/webstore/detail/fjiolbglibkahkipcdgeepdfdgfkdbee?hl=en-US) which provides playback controls, now playing information, keyboard shortcuts, Scrobbling and more for a number of online music services such as Pandora™, Google Music™ and more.

If you are looking for the extension itself, it can be found [here](https://chrome.google.com/webstore/detail/fjiolbglibkahkipcdgeepdfdgfkdbee?hl=en-US). If you are looking for the source code to fix or add things, you are in the right place.

The project is free and open source, licensed under Apache 2.0. Written by Kyle Kamperschroer and some additional helpful contributors.

## Development Introduction

Musicality is architected in a common way for Chrome Extensions. There is a [manifest.json](manifest.json) file located in the root of the source which defines a number of things about the extension and is read in by the browser. This includes permissions that need to be requested. There are then three primary logically separate groups of scripts (all Javascript) that can be found within the [js](js/) folder. These three are [background](js/background/) scripts, [contentscript](js/contentscript/) scripts, and [popup](js/popup) scripts.

[background](js/background/) scripts contain most of the logic for Musicality. They are always running on an empty page in the background of the browser, found at [htlm/background.html](html/background.html), which is loaded by Chrome at runtime. The background scripts are also responsible for communicating with the contentscript scripts.

[contentscript](js/contentscript) scripts are injected into each and every page the user has opened. They allow the running instance of Musicality to query the page for information on what is currently playing, as well as send commands. This is handled via message passing provided by Chrome APIs. If you actually look within this folder, you'll notice there really isn't much logic in this [contentscript.js](js/contentscript/contentscript.js) file. This is a key piece of Musicality's flexiblity which I'll come back to in a moment.

[popup](js/popup/) scripts are executed by the popup itself when a user clicks on the Musicality icon to see what's currently playing as well as provide controls. These scripts communicate with the background scripts to obtain the information needed to display the relevant information to the user. Commands are also sent down to the Musicality instance, which in turn will send those commands to the contentscript running on the page.

Finally, there are a few other folders in [js](js/) that aren't really worth mentioning. One is [third parties](js/tp/), and the other is simply for the [options page](js/options/) accessed when a user right-clicks on the Musicality icon and chooses "Options".

## Configuration for Players

Adding or fixing players is very straightforward for anyone who knows how to write a JQuery selector. If you look within the [json](json/) folder you will see a number of `.json` files present. There is one for every single player supported, and that defines some metadata about the players called [all_players.json](json/all_players.json).

The primary example of the fields supported within the configuration for a player can be found in the [json/google_music.json](json/google_music.json) file. There is an additional [step-by-step guide](docs/AddingAPlayerGuide.md) to adding a player found under [docs](docs/).

## Testing Your Changes

One of the beautiful things about developing Chrome extensions is how easy it is to quickly test your changes. In Chrome if you navigate to `chrome://extensions/`, you should notice a small checkbox in the upper-right corner that says "Developer Mode". Tick that checkbox.

Now a new button should have appeared that says "Load Unpacked Extension". Click that button and point it to your Musicality directory. It will detect the manifest and load everything appropriately. If you've made a breaking change to the manifest, Chrome will inform you.

### Release Builds

In the root of the source is a wonderful [Gruntfile.js](Gruntfile.js). By running `grunt` from the command line (assuming Grunt and prerequisites of Grunt are installed) you will get a single `Musicality.zip` file in the folder you ran `grunt` from, as well as a `build` folder which contains the exact contents of that zip file. The grunting process will take care of optimizing, minifying, linting, etc. Before submitting a pull request, please ensure there are no errors in this process. You can load the `build` directory into Chrome the same way you would have when debugging.

## Primary Would-be-nice Features To Add

  - Whatever is in the issues list at this moment would be great to get fixed/addressed.
  - Some users have asked for volume control. I'd like to discuss this idea futher. Maybe just globally control Chrome's volume?
  - I really need some assistance building an automated testing framework in order to automatically alert me (or open a bug on GitHub) if one of the players are no longer functioning. This happens way more often than it should, when ids or classes are changes which break the selectors. Contact me for more details of what I have in mind.
  - Port to Firefox! (and Safari/Opera?) This would require abstracting API calls out.
  - Adding new players is always awesome.
  - Whatever else you can think of, or bugs you encounter!

Please don't hesitate to contact me if you have any questions.

## People Who Have Helped Out
  - antimatter15
  - Brad Lambeth
  - Marc-Andre Decoste
  - Michael Hart
  - Francsico Salvador - Bandcamp support, and more
  - cucko (MyCloudPlayers support)
  - Chris Roberts (NasaGeek) - SoundCloud, Accuradio, Amazon Cloud Player, and more
  - Jenny Li - Google Music and more
