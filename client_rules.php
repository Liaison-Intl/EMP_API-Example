<?php

require_once('scripts/config.php');
require_once('scripts/functions.php');

$url = ALL_CLIENT_RULES_URL . '?CLIENT-ID=' . $config['SpectrumEMPClientID'];

$ch = curl_init($url);

// set the url, number of POST vars, POST data
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HEADER, 0);

// execute post
curl_exec($ch);

// close connection
curl_close($ch);

?>
