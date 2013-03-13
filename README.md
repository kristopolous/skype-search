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

All you have to do is find a file called main.db, it's in your .Skype/username/ directory.  Now take a COPY (don't move it you fool) and drop it into the api directory.  Host this locally, unless you want the world to search your databases.

If you wanted to be smarter, you could do something like a hardlink instead of a copy to make this always update.  But who would ever be that clever?

Certainly not I.  Have fun.

Oh yeah, I only show the first *ONE THOUSAND* results; to try to save your browser from locking up due to some bad query.

## Here's some info

* Edited messages are edited in the database. There is no record of its previous state (although there may be in the journal or other parts of what skype stores ...)
* Removed messages are the same deal.
* Skype keeps changing its schema AND backend way of storing data. Older versions of skype (2.x) don't use sqlite3 at all for the db - but some asofyet unknown format.
