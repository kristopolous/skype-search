<?
require('common.php');
$fields = 'id, convo_id, timestamp, from_dispname, body_xml';
$pre = "select $fields from Messages";

if(!empty($_GET['q'])) {
  // search works better when it's an and clause really as opposed to contiguous words.
  // at least that's how I work...
  $queryList = explode(' ', addslashes($_GET['q']));
  $qres = $db->query("$pre where body_xml like '%" . implode("%' and body_xml like '%", $queryList) . "%' order by timestamp desc limit 1000");
  while(($res[] = prune($qres)) != null);
} else {

  $ts = addslashes($_GET['ts']);
  $convo = addslashes($_GET['convo']);

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
