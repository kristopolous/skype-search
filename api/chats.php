<?php
require('common.php');

// yeah it's like that.
$qres = $db->query('select * from chats');
while(($res[] = prune($qres)) != null);
array_pop($res);

echo json_encode($res);
