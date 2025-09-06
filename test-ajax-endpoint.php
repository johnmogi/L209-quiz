<?php
/**
 * Simple AJAX endpoint test to isolate response issues
 */

// Load WordPress
require_once('../../../wp-load.php');

// Test simple JSON response
header('Content-Type: application/json; charset=utf-8');

// Clean any output buffers
while (ob_get_level()) {
    ob_end_clean();
}

$test_data = array(
    'message' => 'Test AJAX endpoint working',
    'timestamp' => time(),
    'hebrew_test' => 'בדיקה עברית',
    'status' => 'success'
);

echo json_encode($test_data, JSON_UNESCAPED_UNICODE);
exit;
?>
