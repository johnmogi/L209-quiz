<?php
/**
 * Simple AJAX Test for Quiz Answer Fetcher
 */

// Load WordPress
require_once('../../../wp-config.php');

// Test the AJAX handler directly
$_POST['action'] = 'get_quiz_correct_answers';
$_POST['question_ids'] = array(19, 20, 21);

// Set up WordPress AJAX environment
define('DOING_AJAX', true);

echo "<h2>Testing AJAX Handler Directly</h2>";

try {
    // Get the answer fetcher instance
    if (class_exists('LilacQuizAnswerFetcher')) {
        $fetcher = new LilacQuizAnswerFetcher();
        
        echo "<p>✅ LilacQuizAnswerFetcher class found</p>";
        
        // First, let's find what question IDs actually exist
        global $wpdb;
        $table_name = $wpdb->prefix . 'learndash_pro_quiz_question';
        $existing_questions = $wpdb->get_results("SELECT id, question FROM {$table_name} LIMIT 10", ARRAY_A);
        
        echo "<h3>Available Questions in Database:</h3>";
        echo "<pre>" . print_r($existing_questions, true) . "</pre>";
        
        if (!empty($existing_questions)) {
            $question_ids = array_column($existing_questions, 'id');
            $question_ids = array_slice($question_ids, 0, 3); // Take first 3
            
            echo "<h3>Testing with existing question IDs: " . implode(', ', $question_ids) . "</h3>";
            
            // Let's examine the raw answer_data first
            $raw_data = $wpdb->get_results("SELECT id, question, answer_data FROM {$table_name} WHERE id IN (" . implode(',', $question_ids) . ")", ARRAY_A);
            
            echo "<h3>Raw Answer Data from Database:</h3>";
            foreach ($raw_data as $row) {
                echo "<h4>Question ID: " . $row['id'] . "</h4>";
                echo "<p>Question: " . htmlspecialchars(strip_tags($row['question'])) . "</p>";
                echo "<p>Answer Data Length: " . strlen($row['answer_data']) . " characters</p>";
                echo "<p>Answer Data Preview: " . htmlspecialchars(substr($row['answer_data'], 0, 200)) . "...</p>";
                
                // Try to unserialize and see what we get
                $unserialized = @unserialize($row['answer_data']);
                if ($unserialized !== false) {
                    echo "<p>✅ Unserialization successful</p>";
                    echo "<p>Type: " . gettype($unserialized) . "</p>";
                    if (is_array($unserialized)) {
                        echo "<p>Array count: " . count($unserialized) . "</p>";
                        echo "<pre>" . print_r(array_slice($unserialized, 0, 2), true) . "</pre>";
                    }
                } else {
                    echo "<p>❌ Unserialization failed</p>";
                }
                echo "<hr>";
            }
            
            // Test the method directly
            $answers = $fetcher->get_answers_by_question_ids($question_ids);
        } else {
            echo "<p>❌ No questions found in database</p>";
            $question_ids = array(19, 20, 21);
            $answers = $fetcher->get_answers_by_question_ids($question_ids);
        }
        
        echo "<h3>Direct Method Test Results:</h3>";
        echo "<pre>" . print_r($answers, true) . "</pre>";
        
        // Test AJAX handler with proper POST data
        echo "<h3>Testing AJAX Handler:</h3>";
        $_POST['question_ids'] = $question_ids;
        
        ob_start();
        $fetcher->handle_ajax_get_quiz_correct_answers();
        $output = ob_get_clean();
        
        echo "<p>AJAX Handler Output:</p>";
        echo "<pre>" . htmlspecialchars($output) . "</pre>";
        
    } else {
        echo "<p>❌ LilacQuizAnswerFetcher class not found</p>";
        
        // Check if the file exists and can be included
        $file_path = __DIR__ . '/includes/quiz-answer-fetcher.php';
        if (file_exists($file_path)) {
            echo "<p>File exists at: $file_path</p>";
            include_once($file_path);
            
            if (class_exists('LilacQuizAnswerFetcher')) {
                echo "<p>✅ Class loaded after manual include</p>";
            } else {
                echo "<p>❌ Class still not available after include</p>";
            }
        } else {
            echo "<p>❌ File not found at: $file_path</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
    echo "<p>Stack trace:</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<h3>WordPress AJAX Actions:</h3>";
global $wp_filter;
if (isset($wp_filter['wp_ajax_get_quiz_correct_answers'])) {
    echo "<p>✅ wp_ajax_get_quiz_correct_answers action registered</p>";
    print_r($wp_filter['wp_ajax_get_quiz_correct_answers']);
} else {
    echo "<p>❌ wp_ajax_get_quiz_correct_answers action NOT registered</p>";
}

if (isset($wp_filter['wp_ajax_nopriv_get_quiz_correct_answers'])) {
    echo "<p>✅ wp_ajax_nopriv_get_quiz_correct_answers action registered</p>";
} else {
    echo "<p>❌ wp_ajax_nopriv_get_quiz_correct_answers action NOT registered</p>";
}
?>
