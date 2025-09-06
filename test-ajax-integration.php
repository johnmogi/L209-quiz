<?php
// Test AJAX integration with WordPress
define('WP_USE_THEMES', false);
require_once('../../../wp-load.php');

echo "<h1>🔗 Testing AJAX Integration</h1>";

// Test the AJAX action directly
echo "<h2>Testing get_quiz_correct_answers Action</h2>";

// Simulate AJAX request with question IDs
$_POST['action'] = 'get_quiz_correct_answers';
$_POST['question_ids'] = [19, 20, 21];

// Set up WordPress AJAX environment
define('DOING_AJAX', true);

// Capture output
ob_start();

// Trigger the AJAX action
do_action('wp_ajax_get_quiz_correct_answers');

$ajax_response = ob_get_clean();

echo "<h3>AJAX Response for Question IDs [19, 20, 21]:</h3>";
echo "<pre style='background: #f4f4f4; padding: 15px; border: 1px solid #ddd;'>";
echo htmlspecialchars($ajax_response);
echo "</pre>";

// Test with quiz ID fallback
echo "<h2>Testing Quiz ID Fallback</h2>";
unset($_POST['question_ids']);
$_POST['quiz_id'] = 0;

ob_start();
do_action('wp_ajax_get_quiz_correct_answers');
$fallback_response = ob_get_clean();

echo "<h3>AJAX Response for Quiz ID 0:</h3>";
echo "<pre style='background: #f4f4f4; padding: 15px; border: 1px solid #ddd;'>";
echo htmlspecialchars($fallback_response);
echo "</pre>";

// Test JavaScript AJAX call simulation
echo "<h2>JavaScript AJAX Call Test</h2>";
?>
<script>
// Test the actual AJAX call that would be made from the frontend
jQuery(document).ready(function($) {
    console.log('Testing AJAX call...');
    
    $.ajax({
        url: '<?php echo admin_url('admin-ajax.php'); ?>',
        type: 'POST',
        data: {
            action: 'get_quiz_correct_answers',
            question_ids: [19, 20, 21]
        },
        success: function(response) {
            console.log('AJAX Success:', response);
            $('#ajax-result').html('<h3>✅ AJAX Success</h3><pre>' + JSON.stringify(response, null, 2) + '</pre>');
        },
        error: function(xhr, status, error) {
            console.log('AJAX Error:', error);
            $('#ajax-result').html('<h3>❌ AJAX Error</h3><p>' + error + '</p><p>Status: ' + status + '</p>');
        }
    });
});
</script>

<div id="ajax-result" style="border: 2px solid #007cba; padding: 15px; margin: 15px 0; background: #f0f8ff;">
    <p>Loading AJAX test result...</p>
</div>

<?php
echo "<h2>✅ Integration Test Complete</h2>";
echo "<p>Check the browser console and the AJAX result div above for the actual frontend integration test.</p>";
?>
