<?php
require('common.php');
$qres = $db->query("select fullname,skypename from Contacts");
while(($res[] = prune($qres)) != null);
array_pop($res);
echo json_encode($res);
