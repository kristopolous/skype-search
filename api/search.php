<?
$db = new SQLite3("main.db");
if(!empty($_GET['q'])) {
  $query = mysql_real_escape_string($_GET['q']);

  $qres = $db->query("select id, convo_id, timestamp, from_dispname, chatname, body_xml from Messages where body_xml like '%${query}%' order by timestamp desc");
} else {

  $ts = mysql_real_escape_string($_GET['ts']);
  $convo = mysql_real_escape_string($_GET['convo']);

  $qres = $db->query("select id, convo_id, timestamp, from_dispname, chatname, body_xml from Messages where timestamp > ($ts - 300) and timestamp < ($ts + 300) and convo_id = $convo order by timestamp asc");
}

$res = Array();
while($row = $qres->fetchArray()) {
  $res[] = $row;
}
echo json_encode($res);
