<?
$db = new SQLite3("main.db");
$res = Array();

if(!empty($_GET['q'])) {
  $query = mysql_real_escape_string($_GET['q']);

  $qres = $db->query("select id, convo_id, timestamp, from_dispname, chatname, body_xml from Messages where body_xml like '%${query}%' order by timestamp desc limit 1000");
  while($row = $qres->fetchArray()) {
    $res[] = $row;
  }
} else {

  $ts = mysql_real_escape_string($_GET['ts']);
  $convo = mysql_real_escape_string($_GET['convo']);

  $qres = $db->query("select id, convo_id, timestamp, from_dispname, chatname, body_xml from Messages where timestamp < $ts and convo_id = $convo order by timestamp desc limit 13");
  while($row = $qres->fetchArray()) {
    $res[] = $row;
  }
  $qres = $db->query("select id, convo_id, timestamp, from_dispname, chatname, body_xml from Messages where timestamp >= $ts order by timestamp asc limit 13");
  while($row = $qres->fetchArray()) {
    $res[] = $row;
  }
}

echo json_encode($res);
