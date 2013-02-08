<?
$query = mysql_real_escape_string($_GET['q']);
$db = new SQLite3("main.db");

$qres = $db->query("select id, convo_id, timestamp, author, chatname, body_xml from Messages where body_xml like '%${query}%' order by timestamp desc");

$res = Array();
while($row = $qres->fetchArray()) {
  $res[] = $row;
}
echo json_encode($res);
