<?
require('common.php');

$qres = $db->query("select id, identity, displayname from Conversations;");

while(($res[] = prune($qres)) != null);
array_pop($res);

echo json_encode($res);
