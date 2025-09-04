<?php
/**
 * Verify Complete Quiz Data Retrieval
 * Test if ALL questions and answers are being loaded properly
 */

// Allow direct access for testing
require_once('../../../wp-config.php');

global $wpdb;

echo "<h2>Complete Quiz Data Verification</h2>\n";
echo "<pre>\n";

$quiz_id = 101;
$post_id = 11702;

echo "=== TESTING COMPLETE DATA RETRIEVAL ===\n";
echo "Quiz ID: $quiz_id\n";
echo "Post ID: $post_id\n\n";

// 1. Get the question mapping
$question_mapping = get_post_meta($post_id, 'ld_quiz_questions', true);
echo "Question Mapping Found: " . (is_array($question_mapping) ? 'YES' : 'NO') . "\n";

if (is_array($question_mapping)) {
    $question_ids = array_values($question_mapping); // CORRECTED: Use values, not keys
    echo "Total Question IDs in Mapping: " . count($question_ids) . "\n";
    echo "Question IDs: " . implode(', ', array_slice($question_ids, 0, 10)) . (count($question_ids) > 10 ? '...' : '') . "\n\n";
    
    // 2. Test the actual database retrieval
    $table = $wpdb->prefix . 'learndash_pro_quiz_question';
    
    if (count($question_ids) > 0) {
        $placeholders = implode(',', array_fill(0, count($question_ids), '%d'));
        $query = "SELECT * FROM $table WHERE id IN ($placeholders) ORDER BY sort ASC";
        $questions = $wpdb->get_results($wpdb->prepare($query, ...$question_ids));
        
        echo "=== DATABASE RETRIEVAL RESULTS ===\n";
        echo "Questions Retrieved from DB: " . count($questions) . "\n";
        echo "Expected Questions: " . count($question_ids) . "\n";
        echo "Retrieval Success Rate: " . round((count($questions) / count($question_ids)) * 100, 1) . "%\n\n";
        
        if (count($questions) > 0) {
            $total_answers = 0;
            $questions_with_answers = 0;
            $correct_answers_found = 0;
            
            echo "=== DETAILED QUESTION ANALYSIS ===\n";
            
            foreach ($questions as $index => $question) {
                $answer_data = @unserialize($question->answer_data);
                $question_answers = 0;
                $question_correct = 0;
                
                if ($answer_data && is_array($answer_data)) {
                    $questions_with_answers++;
                    $question_answers = count($answer_data);
                    $total_answers += $question_answers;
                    
                    foreach ($answer_data as $answer_obj) {
                        if (is_object($answer_obj)) {
                            try {
                                $reflection = new ReflectionObject($answer_obj);
                                $correctProp = $reflection->getProperty('_correct');
                                $correctProp->setAccessible(true);
                                $is_correct = $correctProp->getValue($answer_obj);
                                
                                if ($is_correct) {
                                    $question_correct++;
                                    $correct_answers_found++;
                                }
                            } catch (Exception $e) {
                                // Skip reflection errors
                            }
                        }
                    }
                }
                
                // Show first 5 questions in detail
                if ($index < 5) {
                    echo "Q" . ($index + 1) . " (ID:{$question->id}): ";
                    echo substr(strip_tags($question->question), 0, 60) . "...\n";
                    echo "   Answers: $question_answers | Correct: $question_correct\n";
                }
            }
            
            echo "\n=== SUMMARY STATISTICS ===\n";
            echo "Total Questions Processed: " . count($questions) . "\n";
            echo "Questions with Answer Data: $questions_with_answers\n";
            echo "Total Answer Options: $total_answers\n";
            echo "Total Correct Answers: $correct_answers_found\n";
            echo "Average Answers per Question: " . round($total_answers / count($questions), 1) . "\n";
            echo "Questions Missing Answer Data: " . (count($questions) - $questions_with_answers) . "\n";
            
            // 3. Test the AJAX endpoint directly
            echo "\n=== TESTING AJAX ENDPOINT ===\n";
            
            $_POST['action'] = 'get_quiz_answers';
            $_POST['quiz_id'] = $quiz_id;
            $_POST['nonce'] = wp_create_nonce('lilac_quiz_nonce');
            
            // Capture the AJAX response
            ob_start();
            do_action('wp_ajax_get_quiz_answers');
            $ajax_output = ob_get_clean();
            
            echo "AJAX Response Length: " . strlen($ajax_output) . " characters\n";
            
            // Try to decode the JSON response
            $ajax_data = json_decode($ajax_output, true);
            if ($ajax_data && isset($ajax_data['success']) && $ajax_data['success']) {
                $response_questions = $ajax_data['data']['questions'] ?? [];
                $response_total = count($response_questions);
                $response_answers = 0;
                
                foreach ($response_questions as $q) {
                    $response_answers += count($q['answers'] ?? []);
                }
                
                echo "AJAX Questions Returned: $response_total\n";
                echo "AJAX Total Answers: $response_answers\n";
                echo "AJAX Success: YES\n";
            } else {
                echo "AJAX Success: NO\n";
                echo "AJAX Error: " . ($ajax_data['data'] ?? 'Unknown error') . "\n";
                echo "Raw Response: " . substr($ajax_output, 0, 200) . "...\n";
            }
            
        } else {
            echo "❌ NO QUESTIONS RETRIEVED FROM DATABASE\n";
        }
    } else {
        echo "❌ NO QUESTION IDs IN MAPPING\n";
    }
} else {
    echo "❌ NO QUESTION MAPPING FOUND\n";
}

echo "\n=== VERIFICATION COMPLETE ===\n";
echo "</pre>";
?>
