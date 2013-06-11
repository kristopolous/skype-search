<?
require('common.php');

$qres = $db->query("select 
  id, convo_id, chatname, author, from_dispname,
  timestamp, body_xml, call_guid
from Messages
  where chatmsg_type = 18 and type = 39
  order by timestamp desc limit 1000");

while(($res[] = prune($qres)) != null);

echo json_encode($res);
