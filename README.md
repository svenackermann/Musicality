# Musicality

Musicality is a [Chrome Extension](https://chrome.google.com/webstore/detail/fjiolbglibkahkipcdgeepdfdgfkdbee?hl=en-US) which provides playback controls, now playing information, keyboard shortcuts, Scrobbling and more for a number of online music services such as Pandora™, Google Music™ and more. The project is free and open source, licensed under Apache 2.0. Written by Kyle Kamperschroer.

## Fixing or Adding a Player

Musicality was implemented with simplicity and extensibility in mind. If you want to contribute to this project and add or fix a player, all you need to know how to do is write JQuery selectors. There needs to be documentation written in order to provide a step-by-step guide to fixing and adding a new player, but the general idea is to modify [json/all_players.json](https://github.com/kkamperschroer/Musicality/blob/master/json/all_players.json) to specify some metadata about the player, and create a new json file for the player. Use the [Google Music™ json file](https://github.com/kkamperschroer/Musicality/blob/master/json/google_music.json) as an example of what fields can be used within the configuration file.

## Things I Need Your Help For

  - Whatever is in the issues list at this moment would be great to get fixed/addressed.
  - I really need someone with some graphic design background to take control and throw together some better mockups. I'm really bad with UI and design, including the webstore screenshots and promotional images.
  - Documentation is sorely lacking. It'd be great to have step-by-step guides for those new to the project.
  - Some users have asked for volume control. I'd like to discuss this idea futher. Maybe just globally control Chrome's volume?
  - I really need some assistance building an automated testing framework in order to automatically alert me (or open a bug on GitHub) if one of the players are no longer functioning. This happens way more often than it should, when ids or classes are changes which break the selectors. Contact me for more details of what I have in mind.
  - Code janitorial work. There is some serious callback hell in portions of background.js that need to be broken up. Moving portions to other scripts would also be fantastic.
  - Port to Firefox! (and Safari/Opera?) This would require abstracting API calls out.
  - Adding new players is always awesome.
  - Whatever else you can think of, or bugs you encounter!

Please don't hesitate to contact me if you have any questions.

## People Who Have Helped Out
  - antimatter15
  - Brad Lambeth
  - Marc-Andre Decoste
  - Michael Hart
  - Francsico Salvador (Bandcamp support, and more)