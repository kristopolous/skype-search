# Skype search is painful. Let's do better.

Just put this little thing on a server my friend.

Here's a screen shot:

<img src=http://i.imgur.com/LuyrWd8.png>

All you have to do is find a file called main.db, it's in your .Skype/username/ directory.  Now take a COPY (don't move it you fool) and drop it into the api directory.  Host this locally, unless you want the world to search your databases.

If you wanted to be smarter, you could do something like a hardlink or a symlink instead of a copy to make this always update.  But who would ever be that clever?

Certainly not I.  Have fun.
