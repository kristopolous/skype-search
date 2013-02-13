# Skype search is painful. Let's do better.

Just put this little thing on a server my friend.

Here's a screen shot:

<img src=http://i.imgur.com/cIHy9gb.png>

If you click on a timestamp then you get all messages +/- a 13 message window around the search context within the search room.

Also, there's a call log feature now ... it looks like this
<img src=http://i.imgur.com/ea3AxOg.png>
Except for the japanese-porn blur.

All you have to do is find a file called main.db, it's in your .Skype/username/ directory.  Now take a COPY (don't move it you fool) and drop it into the api directory.  Host this locally, unless you want the world to search your databases.

If you wanted to be smarter, you could do something like a hardlink instead of a copy to make this always update.  But who would ever be that clever?

Certainly not I.  Have fun.

Oh yeah, I only show the first *ONE THOUSAND* results; to try to save your browser from locking up due to some bad query.
