<?php
require('common.php');
$fieldList = ['id', 'convo_id', 'timestamp', 'from_dispname', 'body_xml', 'chatmsg_type', 'identities'];

$limit = (empty($_GET['limit'])) ? 1000 : SQLite3::escapeString($_GET['limit']);

// That which we return
$res = Array(
  'res' => true,
  'data' => Array(),
  'dbg' => Array(),
);

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
    $findList[] = "convo_id in (" . SQLite3::escapeString(implode(',', $_GET['rooms'])) . ")";
  } 

  if(!empty($_GET['notRooms'])) {
    $findList[] = "convo_id not in (" . SQLite3::escapeString(implode(',', $_GET['notRooms'])) . ")";
  } 

  if(!empty($_GET['users'])) {
    $findList[] = "author in (\"" . implode('","', $_GET['users']) . "\")";
  } 

  if(!empty($_GET['notUsers'])) {
    $findList[] = "author not in (\"" . implode('","', $_GET['notUsers']) . "\")";
  } 

  $queryList = Array();
  $quoteList = Array();

  if(!empty($_GET['q'])) {
    list($queryList, $quoteList, $regex) = parser($_GET['q']);

    // Sometimes you want to search a complete word, like "inc" and not "include"
    // You'd like a trailing space on it to make this possible.
    // If the first token is empty
    if(count($queryList) > 0) {
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
    }

    $searchType = 'text';

    // Hidden commands are awesome
    if(count($queryList) > 0 && substr($queryList[0], 0, 1) == '!') {
      $searchType = 'person';
      $func = strtolower($queryList[0]);
      array_shift($queryList);

      if($func == '!left') {
        $findList[] = "chatmsg_type == 4"; 
      } elseif($func == '!kick') {
        $findList[] = "chatmsg_type == 11"; 
      } elseif($func == '!call') {
        $findList[] = "chatmsg_type == 18"; 
      } elseif($func == '!file') {
        $searchType = 'text';
        $findList[] = "chatmsg_type == 7"; 
        $findList[] = "(body_xml like '%Posted files%')";
      } elseif($func == '!join') {
        $findList[] = "chatmsg_type == 1"; 
      }
    }

    if($searchType == 'person') {
      if(count($queryList) > 0) {
        foreach($queryList as $who) {
          $findList[] = "(identities like '%$who%' or author like '%$who%' or from_dispname like '%$who%')";
        }
      }
    } else {
      // Do the quoted strings first
      foreach($quoteList as $what) {
        $findList[] = "(body_xml like '%$what%')"; 
      }
      foreach($queryList as $what) {
        if(substr($what, 0, 1) == '-') {
          $findList[] = "(body_xml not like '%" . substr($what, 1) . "%')"; 
        } else {
          $findList[] = "(body_xml like '%$what%')"; 
        }
      }
    }
  }

  $res['dbg'][] =  $queryList;
  $pre = "select " . implode(', ', $fieldList) . " from Messages";

  if(isset($regex) && $regex) {
    $findList[] = "chatmsg_type == 3"; 
    $limit *= 80;
  } 

  if(count($findList) > 0) {
    $finder = "where " . implode(' and ', $findList);
  } else {
    $finder = '';
  }
  $limitPart = "limit $limit";

  $query = "$pre $finder order by timestamp desc $limitPart";

  // Add the query to the debug list
  $res['dbg'][] = $query;
  $qres = $db->query($query);

  while(($res['data'][] = prune($qres)) != null);

  // regex matching
  if(isset($regex) && $regex) {
    $matchList = [];
    $matchIx = 0;
    $limit /= 20;
    foreach($res['data'] as $row) {
      $match = false;
      preg_match($regex, $row['body_xml'], $match);
      if(count($match) > 0) {
        $matchList[] = $row;
        $matchIx ++;

        if($matchIx > $limit) {
          break;
        }
      }
    }
    $res['data'] = $matchList;
  }

  // If the sql query failed, then swap the return code to false
  if(count($res['data'] > 0)) {
    if($res['data'][0] == false) {
      $res['res'] = false;
    }
  } else {
    $res['res'] = false;
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

    $query = "$pre where timestamp $oper $ts and convo_id = $convo order by timestamp $order limit " . (13 * $_GET['level']);
    $res['dbg'][] = $query;
    $qres = $db->query($query);
    while(($res['data'][] = prune($qres)) != null);

    if($oper == '<') {
      $res['data'] = array_reverse($res['data']);
    }
  }
}
echo json_encode($res);
