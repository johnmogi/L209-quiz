<?php
/**
 * Working Answer Parser Test
 */

// Load WordPress
require_once('../../../wp-config.php');

// Include the answer fetcher
require_once(__DIR__ . '/includes/quiz-answer-fetcher.php');

echo "<h2>Working Answer Parser Test</h2>";

try {
    global $wpdb;
    $table_name = $wpdb->prefix . 'learndash_pro_quiz_question';
    
    // Get first 3 questions
    $questions = $wpdb->get_results("SELECT id, question, answer_data FROM {$table_name} LIMIT 3", ARRAY_A);
    
    echo "<h3>Testing Direct Answer Extraction:</h3>";
    
    $correct_answers = array();
    
    foreach ($questions as $question) {
        $question_id = $question['id'];
        $answer_data = $question['answer_data'];
        
        echo "<h4>Question ID: {$question_id}</h4>";
        echo "<p>Question: " . htmlspecialchars(strip_tags($question['question'])) . "</p>";
        
        if (!empty($answer_data)) {
            $answers = @unserialize($answer_data);
            if ($answers && is_array($answers)) {
                echo "<p>Found " . count($answers) . " answer options:</p>";
                
                foreach ($answers as $index => $answer) {
                    if (is_object($answer)) {
                        // Cast object to array to access protected properties
                        $answer_array = (array)$answer;
                        
                        $answer_text = isset($answer_array["\0*\0_answer"]) ? $answer_array["\0*\0_answer"] : '';
                        $points = isset($answer_array["\0*\0_points"]) ? $answer_array["\0*\0_points"] : 0;
                        $correct_flag = isset($answer_array["\0*\0_correct"]) ? $answer_array["\0*\0_correct"] : false;
                        
                        $is_correct = ($correct_flag == 1 || $correct_flag === true) || (is_numeric($points) && floatval($points) > 0);
                        
                        echo "<p>Answer {$index}: " . htmlspecialchars($answer_text) . " | Points: {$points} | Correct Flag: " . var_export($correct_flag, true) . " | <strong>" . ($is_correct ? "✅ CORRECT" : "❌ Wrong") . "</strong></p>";
                        
                        if ($is_correct) {
                            $correct_answers[$question_id] = array(
                                'question_id' => $question_id,
                                'correct_answer_index' => $index,
                                'correct_answer_text' => $answer_text,
                                'points' => floatval($points)
                            );
                        }
                    }
                }
            } else {
                echo "<p>❌ Failed to unserialize answer data</p>";
            }
        } else {
            echo "<p>❌ No answer data found</p>";
        }
        
        echo "<hr>";
    }
    
    echo "<h3>Final Correct Answers Found:</h3>";
    echo "<pre>" . print_r($correct_answers, true) . "</pre>";
    
    if (!empty($correct_answers)) {
        echo "<p style='color: green; font-weight: bold;'>✅ SUCCESS: Found " . count($correct_answers) . " correct answers!</p>";
        
        // Test the AJAX response format
        echo "<h3>AJAX Response Format:</h3>";
        $ajax_response = array(
            'success' => true,
            'data' => $correct_answers
        );
        echo "<pre>" . json_encode($ajax_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
    } else {
        echo "<p style='color: red; font-weight: bold;'>❌ No correct answers found</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>
