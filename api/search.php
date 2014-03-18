<?php
require('common.php');
$fieldList = ['id', 'convo_id', 'timestamp', 'from_dispname', 'body_xml', 'chatmsg_type', 'identities'];

if(
    (!empty($_GET['q'])) ||
    (!empty($_GET['rooms'])) ||
    (!empty($_GET['notRooms'])) ||
    (!empty($_GET['users'])) ||
    (!empty($_GET['notUsers']))
) {
  // search works better when it's an and clause really as opposed to contiguous words.
  // at least that's how I work... 
  $findList = Array();

  if(!empty($_GET['from'])) {
    $findList[] = "timestamp >= " . strtotime($_GET['from']);
  } 

  if(!empty($_GET['to'])) {
    $findList[] = "timestamp <= " . strtotime($_GET['to']);
  } 

  if(!empty($_GET['rooms'])) {
    $findList[] = "convo_id in (" . mysql_real_escape_string(implode(',', $_GET['rooms'])) . ")";
  } 

  if(!empty($_GET['notRooms'])) {
    $findList[] = "convo_id not in (" . mysql_real_escape_string(implode(',', $_GET['notRooms'])) . ")";
  } 

  if(!empty($_GET['users'])) {
    $findList[] = "author in (\"" . implode('","', $_GET['users']) . "\")";
  } 

  if(!empty($_GET['notUsers'])) {
    $findList[] = "author not in (\"" . implode('","', $_GET['notUsers']) . "\")";
  } 

  if(!empty($_GET['q'])) {
    $queryList = explode(' ', addslashes($_GET['q']));

    // Sometimes you want to search a complete word, like "inc" and not "include"
    // You'd like a trailing space on it to make this possible.
    // If the first token is empty
    if(strlen($queryList[0]) == 0) {
      // we shift it off
      array_shift($queryList);

      // and prepend a space.
      $queryList[0] = ' ' . $queryList[0];
    }

    if(strlen(end($queryList)) == 0) {

      // Do the same thing in the other direction
      $space = array_pop($queryList);

      $token = array_pop($queryList);
      
      array_push($queryList, $token . ' ');
    } 

    // Hidden commands are awesome
    if(substr($queryList[0], 0, 1) == '!') {
      $func = strtolower($queryList[0]);
      array_shift($queryList);

      if($func == '!left') {
        $findList[] = "chatmsg_type == 4"; 
      } elseif($func == '!kick') {
        $findList[] = "chatmsg_type == 11"; 
      } elseif($func == '!join') {
        $findList[] = "chatmsg_type == 1"; 
      }

      if(count($queryList) > 0) {
        foreach($queryList as $who) {
          $findList[] = "(identities like '%$who%' or author like '%$who%' or from_dispname like '%$who%')";
        }
      }
    } else {
      $findList[] = "body_xml like '%" . implode("%' and body_xml like '%", $queryList) . "%'"; 
    }
  }

  $pre = "select " . implode(', ', $fieldList) . " from Messages";
  $finder = "where " . implode(' and ', $findList);

  $query = "$pre $finder order by timestamp desc limit 1000";
  $qres = $db->query($query);

  while(($res[] = prune($qres)) != null);

  // If the sql query failed, then add the query string in
  // for debugging purposes.
  if($res[0] == false) {
    $res[] = $query;
  }
} else {

  $pre = "select " . implode(', ', $fieldList) . " from Messages";
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

    $qres = $db->query("$pre where timestamp $oper $ts and convo_id = $convo order by timestamp $order limit " . (13 * $_GET['level']));
    while(($res[] = prune($qres)) != null);

    if($oper == '<') {
      $res = array_reverse($res);
    }
  }
}
echo json_encode($res);
