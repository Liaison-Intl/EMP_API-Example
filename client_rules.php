<?php

require_once('scripts/config.php');
require_once('scripts/functions.php');

$url = ALL_CLIENT_RULES_URL . '?CLIENT-ID=' . $config['SpectrumEMPClientID'];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HEADER, 0);
curl_exec($ch);
curl_close($ch);

?>
