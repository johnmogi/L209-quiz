<?php
/**
 * Final AJAX Test - Test the actual AJAX endpoint
 */

// Simulate AJAX request
$_POST['action'] = 'get_quiz_correct_answers';
$_POST['question_ids'] = array(1, 2, 3);

// Set AJAX environment
define('DOING_AJAX', true);

// Load WordPress
require_once('../../../wp-config.php');

// Test the actual AJAX endpoint
$response = wp_remote_post(home_url('/wp-admin/admin-ajax.php'), array(
    'body' => array(
        'action' => 'get_quiz_correct_answers',
        'question_ids' => array(1, 2, 3)
    )
));

echo "<h2>AJAX Endpoint Test</h2>";

if (is_wp_error($response)) {
    echo "<p style='color: red;'>❌ AJAX Error: " . $response->get_error_message() . "</p>";
} else {
    $body = wp_remote_retrieve_body($response);
    $status_code = wp_remote_retrieve_response_code($response);
    
    echo "<p><strong>Status Code:</strong> {$status_code}</p>";
    echo "<p><strong>Response:</strong></p>";
    echo "<pre>" . htmlspecialchars($body) . "</pre>";
    
    $data = json_decode($body, true);
    if ($data && isset($data['success']) && $data['success']) {
        echo "<p style='color: green; font-weight: bold;'>✅ AJAX Backend Detection: WORKING!</p>";
        echo "<p>Found " . count($data['data']) . " correct answers</p>";
    } else {
        echo "<p style='color: red; font-weight: bold;'>❌ AJAX Backend Detection: Not working</p>";
    }
}
?>
