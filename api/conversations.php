<?
require('common.php');

$qres = $db->query(
 "select 
    id, identity, displayname 
  from Conversations 
  where 
    inbox_timestamp is not null 
  order by history_horizon desc
");

while(($res[] = prune($qres)) != null);
array_pop($res);

echo json_encode($res);
