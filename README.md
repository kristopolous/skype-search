# Skype search is painful. Let's do better.

Just put this little thing on a server my friend.

## Holy shit, it's a useful call log.
<img src=http://i.imgur.com/bagatWC.png>
Features above:

* Every user has a unique background color
* Hover over a username to get a highlight of their membership, and the calls they were on.
* All username are alphabetized per call.
* You can click on the channel name on the right to see *ONLY THE CALLS* in that channel
* You get *fractional hours* for each call
* You have an *auto-complete room* filter so you can see calls from a larger set.
  * In the "Chat" mode, this is all the rooms
  * In the "Call" mode, this is only the rooms that have had calls.

Note: The text isn't actually ugly-ass-yellow. That's just for the screen shot.

## Crap, I can search sensibly!
<img src=http://i.imgur.com/ePGIi5m.png>

Features above:

 * If you click on the arrow next to the name you get all messages +/- a 13 message window around the search context within the search room.
 * If you click on the room title, then you see only the messages from that room with respect to the search query
 * You can search multiple rooms at once
 * If you click on the "Skype-Search" brand on the left, the search query will go away and then you can see just the logs of the rooms that you have selected.
 * The search terms are a boolean OR

<blockquote>
Note: Only the first *ONE THOUSAND* results; to try to save your browser from locking up due to some bad query.
</blockquote>

# Installation

1. You should have a PHP-friendly stack (LAMP works).
2. In your ~/.Skype/username/ directory there is a file named `main.db`, either
  * copy this file into the API directory *~ OR ~*
  * hard-link from your home-directory to the api directory.


## Miscellaneous Information

* Edited messages are edited in the database. There is no record of its previous state (although there may be in the journal or other parts of what Skype stores ...)
* Removed messages are the same deal.
* Skype keeps changing its schema AND backend way of storing data. Older versions of Skype (2.x) don't use sqlite3 at all for the db - but some asofyet unknown format.
