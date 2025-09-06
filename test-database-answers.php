<?php
/**
 * Direct Database Test for Quiz Answers
 * Test file to verify ProQuiz database structure and correct answers
 */

// Include WordPress
require_once('../../../wp-config.php');

// Get quiz ID from URL parameter
$quiz_id = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 11702;

echo "<h1>ProQuiz Database Test - Quiz ID: {$quiz_id}</h1>";

global $wpdb;
$table_prefix = $wpdb->prefix;

// First, let's find the ProQuiz ID from LearnDash post
echo "<h2>1. Finding ProQuiz ID from LearnDash Post</h2>";

$meta_keys = array('_sfwd-quiz_quiz_pro', 'quiz_pro_id', '_quiz_pro_id');
$pro_quiz_id = null;

foreach ($meta_keys as $meta_key) {
    $pro_quiz_id = get_post_meta($quiz_id, $meta_key, true);
    if (!empty($pro_quiz_id)) {
        echo "<p>✅ Found ProQuiz ID: <strong>{$pro_quiz_id}</strong> using meta key: {$meta_key}</p>";
        break;
    } else {
        echo "<p>❌ No ProQuiz ID found with meta key: {$meta_key}</p>";
    }
}

if (!$pro_quiz_id) {
    echo "<p><strong>❌ Could not find ProQuiz ID for LearnDash quiz: {$quiz_id}</strong></p>";
    echo "<p>Available post meta for this quiz:</p>";
    $all_meta = get_post_meta($quiz_id);
    echo "<pre>" . print_r($all_meta, true) . "</pre>";
    exit;
}

// Check if ProQuiz tables exist
echo "<h2>2. Checking ProQuiz Database Tables</h2>";

$quiz_table = $table_prefix . 'learndash_pro_quiz_master';
$question_table = $table_prefix . 'learndash_pro_quiz_question';

$tables_exist = true;

// Check quiz table
$quiz_table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$quiz_table}'");
if ($quiz_table_exists) {
    echo "<p>✅ Quiz table exists: {$quiz_table}</p>";
} else {
    echo "<p>❌ Quiz table missing: {$quiz_table}</p>";
    $tables_exist = false;
}

// Check question table
$question_table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$question_table}'");
if ($question_table_exists) {
    echo "<p>✅ Question table exists: {$question_table}</p>";
} else {
    echo "<p>❌ Question table missing: {$question_table}</p>";
    $tables_exist = false;
}

if (!$tables_exist) {
    echo "<p><strong>❌ ProQuiz tables are missing. Available tables:</strong></p>";
    $tables = $wpdb->get_results("SHOW TABLES LIKE '%quiz%'");
    echo "<pre>" . print_r($tables, true) . "</pre>";
    exit;
}

// Get quiz info
echo "<h2>3. Quiz Information</h2>";

$quiz_info = $wpdb->get_row($wpdb->prepare("
    SELECT * FROM {$quiz_table} WHERE id = %d
", $pro_quiz_id));

if ($quiz_info) {
    echo "<p>✅ Quiz found: <strong>{$quiz_info->name}</strong></p>";
    echo "<p>Quiz settings: <pre>" . print_r($quiz_info, true) . "</pre></p>";
} else {
    echo "<p>❌ Quiz not found in ProQuiz table with ID: {$pro_quiz_id}</p>";
}

// Get all questions for this quiz
echo "<h2>4. Quiz Questions</h2>";

$questions = $wpdb->get_results($wpdb->prepare("
    SELECT id, question, answer_type, answer_data, sort
    FROM {$question_table} 
    WHERE quiz_id = %d 
    ORDER BY sort ASC
", $pro_quiz_id));

if (empty($questions)) {
    echo "<p>❌ No questions found for ProQuiz ID: {$pro_quiz_id}</p>";
    
    // Check if there are any questions in the table at all
    $all_questions = $wpdb->get_results("SELECT quiz_id, COUNT(*) as count FROM {$question_table} GROUP BY quiz_id");
    echo "<p>Available questions by quiz ID:</p>";
    echo "<pre>" . print_r($all_questions, true) . "</pre>";
    exit;
}

echo "<p>✅ Found <strong>" . count($questions) . "</strong> questions</p>";

// Process each question
foreach ($questions as $index => $question) {
    echo "<div style='border: 1px solid #ccc; padding: 15px; margin: 10px 0;'>";
    echo "<h3>Question " . ($index + 1) . " (ID: {$question->id})</h3>";
    echo "<p><strong>Type:</strong> {$question->answer_type}</p>";
    echo "<p><strong>Question:</strong> " . substr(strip_tags($question->question), 0, 100) . "...</p>";
    
    // Parse answer data
    $answer_data = maybe_unserialize($question->answer_data);
    
    if (is_array($answer_data)) {
        echo "<h4>Answer Options:</h4>";
        $correct_answers = array();
        
        foreach ($answer_data as $ans_index => $answer) {
            $is_correct = isset($answer['correct']) && $answer['correct'] == 1;
            $answer_text = isset($answer['answer']) ? strip_tags($answer['answer']) : 'No text';
            
            echo "<p style='color: " . ($is_correct ? 'green' : 'black') . ";'>";
            echo "<strong>Option {$ans_index}:</strong> {$answer_text}";
            if ($is_correct) {
                echo " <strong>(CORRECT)</strong>";
                $correct_answers[] = $ans_index;
            }
            echo "</p>";
        }
        
        echo "<p><strong>Correct Answer Indices:</strong> " . implode(', ', $correct_answers) . "</p>";
        
    } else {
        echo "<p>❌ Could not parse answer data</p>";
        echo "<pre>" . print_r($question->answer_data, true) . "</pre>";
    }
    
    echo "</div>";
}

// Let's check which quiz ID actually has the questions we're seeing in the browser
echo "<h2>5. Finding Questions by Content Match</h2>";

// Get a sample of questions from each quiz_id to find the right one
$quiz_ids_with_questions = array(0, 1, 3, 5, 94, 97, 98);

foreach ($quiz_ids_with_questions as $test_quiz_id) {
    echo "<h3>Quiz ID: {$test_quiz_id}</h3>";
    
    $sample_questions = $wpdb->get_results($wpdb->prepare("
        SELECT id, question, answer_type 
        FROM {$question_table} 
        WHERE quiz_id = %d 
        ORDER BY sort ASC 
        LIMIT 3
    ", $test_quiz_id));
    
    if (!empty($sample_questions)) {
        foreach ($sample_questions as $q) {
            $question_preview = strip_tags($q->question);
            $question_preview = mb_substr($question_preview, 0, 100) . '...';
            echo "<p><strong>Question {$q->id}:</strong> {$question_preview}</p>";
        }
    }
}

// Test AJAX endpoint
echo "<h2>6. Testing AJAX Endpoint</h2>";

echo "<script>
jQuery(document).ready(function($) {
    console.log('Testing AJAX endpoint...');
    
    $.ajax({
        url: '/wp-admin/admin-ajax.php',
        type: 'POST',
        data: {
            action: 'get_quiz_correct_answers',
            quiz_id: {$quiz_id}
        },
        success: function(response) {
            console.log('AJAX Success:', response);
            $('#ajax-result').html('<pre style=\"color: green;\">' + JSON.stringify(response, null, 2) + '</pre>');
        },
        error: function(xhr, status, error) {
            console.log('AJAX Error:', xhr.responseText);
            $('#ajax-result').html('<pre style=\"color: red;\">Error: ' + xhr.responseText + '</pre>');
        }
    });
});
</script>";

echo "<div id='ajax-result'>Loading AJAX test...</div>";

echo "<h2>6. Manual Answer Verification</h2>";
echo "<p>Use this data to manually verify which answers should be correct in your quiz system.</p>";
?>
