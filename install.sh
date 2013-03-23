#!/bin/bash
which sqlite3 > /dev/null
if [ $? -ne 0 ]; then
  echo "sqlite3 must be on here. Please do that first"
  echo "On ubuntu I need to do the following:"
  echo " sudo apt-get install php5-sqlite sqlite3"
  echo " sudo apachectl restart"
  exit 1
else
  echo "Found sqlite3"
fi

echo -n "Skype username > "
read username
(
  path=~/.Skype/$username/main.db
  cd api
  if [ -e $path ]; then
    [ -e main.db ] && unlink main.db
    ln $path .
    chmod o+x main.db
    echo "Using $path"
    echo "Installation successful."
  else
    echo "Woops, couldn't find $path. Not installed."
  fi
)
