<?
$db = new SQLite3("main.db");
$res = Array();
$fields = 'id, convo_id, timestamp, from_dispname, body_xml';
$pre = "select $fields from Messages";

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

if(!empty($_GET['q'])) {
  // search works better when it's an and clause really as opposed to contiguous words.
  // at least that's how I work... 
  $queryList = explode(' ', mysql_real_escape_string($_GET['q']));
  $qres = $db->query("$pre where body_xml like '%" . implode("%' and body_xml like '%", $queryList) . "%' order by timestamp desc limit 1000");
  while(($res[] = prune($qres)) != null);
} else {

  $ts = mysql_real_escape_string($_GET['ts']);
  $convo = mysql_real_escape_string($_GET['convo']);

  // The contextual result of +/- 13 messages is done with 2 queries:
  // one that looks for things prior to the input tyimme in the given convo
  // and limits it to 13 and a second that does the same thing as the first
  // and also limits it to 13 ... this means that you get 13 + 13 - 1 results,
  // which is 25 ... but it's ok ... better that than more code.
  foreach(Array(
    Array('<', 'desc'),
    Array('>=', 'asc')
  ) as $tuple) {
    list($oper, $order) = $tuple;

    $qres = $db->query("$pre where timestamp $oper $ts and convo_id = $convo order by timestamp $order limit 13");
    while(($res[] = prune($qres)) != null);

    if($oper == '<') {
      $res = array_reverse($res);
    }
  }
}
echo json_encode($res);
