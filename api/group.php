<?php

$g_file = 'group_list.json';

function group_get() {
  global $g_file;
  $raw = file_get_contents($g_file);
  if(!$raw) {
    $raw = "{}";
  }
  return json_decode($raw, true);
}

function set($what) {
  global $g_file;
  $ret = file_put_contents($g_file, json_encode($what));
  return $what;
}

function group_del($params) {
  list($group, $who) = $params;
  $db = group_get();
  if(isset($db[$group])) {
    $db[$group] = array_diff($db[$group], array($who));
    if(count($db[$group]) == 0) {
      unset($db[$group]);
    }
  }
  return set($db);
}

function group_add($params) {
  list($group, $who) = $params;
  $db = group_get();
  if(!isset($db[$group])) {
    $db[$group] = array();
  }
  $db[$group][] = $who;
  $db[$group] = array_unique($db[$group]);
  return set($db);
}

if(function_exists('group_' . $_GET['action'])) {
  $action = 'group_' . $_GET['action'];
  $res = $action($_GET['params']);
  echo json_encode($res);
}

