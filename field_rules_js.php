<?php

require_once('scripts/config.php');

$url = WC_URL . 'assets/scripts/plugins/field_rules.js';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HEADER, 0);
curl_exec($ch);
curl_close($ch);

?>
