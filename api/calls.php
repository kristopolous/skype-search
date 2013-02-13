<?
require('common.php');

$qres = $db->query("select duration, begin_timestamp, current_video_audience from Calls order by begin_timestamp desc limit 1000");

while(($res[] = prune($qres)) != null);

echo json_encode($res);
