<?php
// Test AJAX answer detection with updated quiz ID logic
require_once('../../../wp-config.php');

// Check if the class exists before testing
if (!class_exists('LilacQuizAnswerFetcher')) {
    echo "<h1>❌ LilacQuizAnswerFetcher class not found</h1>";
    echo "<p>Plugin may not be loaded properly. Let's test the database directly.</p>";
} else {
    echo "<h1>✅ LilacQuizAnswerFetcher class found</h1>";
}

// Set up WordPress environment
global $wpdb;

echo "<h1>Testing Updated Answer Detection System</h1>";

// Test the AJAX endpoint directly
echo "<h2>1. Testing AJAX Endpoint Directly</h2>";

// Simulate the AJAX request
$_POST['action'] = 'get_quiz_correct_answers';
$_POST['quiz_id'] = 11702; // Use the LearnDash quiz ID

// Create instance of the answer fetcher
$fetcher = new LilacQuizAnswerFetcher();

// Call the AJAX handler directly
ob_start();
$fetcher->handle_ajax_get_quiz_correct_answers();
$ajax_response = ob_get_clean();

echo "<h3>AJAX Response:</h3>";
echo "<pre>" . htmlspecialchars($ajax_response) . "</pre>";

// Test the quiz ID detection logic
echo "<h2>2. Testing Quiz ID Detection Logic</h2>";

// Test with different quiz IDs to see which one has questions
$test_quiz_ids = array(0, 5, 94, 97, 98, 101);
$table_name = $wpdb->prefix . 'learndash_pro_quiz_question';

foreach ($test_quiz_ids as $test_id) {
    $question_count = $wpdb->get_var($wpdb->prepare("
        SELECT COUNT(*) FROM {$table_name} WHERE quiz_id = %d
    ", $test_id));
    
    echo "<p><strong>Quiz ID {$test_id}:</strong> {$question_count} questions</p>";
    
    if ($question_count > 0) {
        // Get a sample question
        $sample_question = $wpdb->get_row($wpdb->prepare("
            SELECT id, question, answer_type, answer_data 
            FROM {$table_name} 
            WHERE quiz_id = %d 
            ORDER BY sort ASC 
            LIMIT 1
        ", $test_id));
        
        if ($sample_question) {
            $question_preview = strip_tags($sample_question->question);
            $question_preview = mb_substr($question_preview, 0, 100) . '...';
            echo "<p style='margin-left: 20px; color: #666;'>Sample: {$question_preview}</p>";
        }
    }
}

// Test the actual answer fetching
echo "<h2>3. Testing Answer Fetching for Quiz ID with Questions</h2>";

// Find the first quiz ID that has questions
foreach ($test_quiz_ids as $test_id) {
    $question_count = $wpdb->get_var($wpdb->prepare("
        SELECT COUNT(*) FROM {$table_name} WHERE quiz_id = %d
    ", $test_id));
    
    if ($question_count > 0) {
        echo "<h3>Testing with Quiz ID: {$test_id} ({$question_count} questions)</h3>";
        
        // Get correct answers for this quiz
        $questions = $wpdb->get_results($wpdb->prepare("
            SELECT id, question, answer_type, answer_data 
            FROM {$table_name} 
            WHERE quiz_id = %d 
            ORDER BY sort ASC 
            LIMIT 3
        ", $test_id));
        
        foreach ($questions as $question) {
            echo "<div style='border: 1px solid #ccc; padding: 10px; margin: 10px 0;'>";
            echo "<h4>Question {$question->id}</h4>";
            
            $question_preview = strip_tags($question->question);
            $question_preview = mb_substr($question_preview, 0, 150) . '...';
            echo "<p><strong>Question:</strong> {$question_preview}</p>";
            echo "<p><strong>Type:</strong> {$question->answer_type}</p>";
            
            // Parse answer data
            $answer_data = maybe_unserialize($question->answer_data);
            if (is_array($answer_data)) {
                $correct_answers = array();
                foreach ($answer_data as $index => $answer) {
                    if (isset($answer['correct']) && $answer['correct'] == 1) {
                        $correct_answers[] = $index;
                    }
                }
                echo "<p><strong>Correct Answer Indices:</strong> " . implode(', ', $correct_answers) . "</p>";
            }
            
            echo "</div>";
        }
        
        break; // Only test the first quiz ID that has questions
    }
}

echo "<h2>4. JavaScript Test</h2>";
echo "<p>Open browser console to see AJAX test results.</p>";

?>

<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script>
jQuery(document).ready(function($) {
    console.log('Testing AJAX endpoint with updated quiz ID detection...');
    
    // Test the AJAX endpoint
    $.ajax({
        url: '/wp-admin/admin-ajax.php',
        type: 'POST',
        data: {
            action: 'get_quiz_correct_answers',
            quiz_id: 11702
        },
        success: function(response) {
            console.log('AJAX Success:', response);
            try {
                var data = JSON.parse(response);
                console.log('Parsed response:', data);
                if (data.success) {
                    console.log('✅ Answer detection working! Found answers for', Object.keys(data.data).length, 'questions');
                } else {
                    console.log('❌ Answer detection failed:', data.data);
                }
            } catch (e) {
                console.log('❌ Failed to parse JSON response:', e);
                console.log('Raw response:', response);
            }
        },
        error: function(xhr, status, error) {
            console.log('❌ AJAX Error:', status, error);
            console.log('Response:', xhr.responseText);
        }
    });
});
</script>
