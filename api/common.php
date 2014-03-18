<?php
date_default_timezone_set('UTC');
$db = new SQLite3("main.db");
// SQLite returns both an associative array and a numbered array
// that is to say that I get
// [0] => value,
// key => value
// ...
// This is twice as much info as I care about.  I usually don't care, but
// if I'm returning 1000 results, this does start to tax the browser significantly
// less; it's very quantifiably measurable in RAM, time to generate, etc.
function prune($obj) {
  $ret = $obj->fetchArray();
  if($ret) {
    foreach(array_keys($ret) as $key) {
      if(strval(intval($key)) == $key) {
        unset($ret[$key]);
      }
    }
  } 
  return $ret;
}
$res = Array();
