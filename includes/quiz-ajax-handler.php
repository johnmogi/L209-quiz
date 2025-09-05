<?php
/**
 * Quiz AJAX Handler
 * Handles AJAX requests for quiz correct answers from database
 */

// Add AJAX handlers
add_action('wp_ajax_get_quiz_correct_answers', 'lilac_get_quiz_correct_answers_ajax');
add_action('wp_ajax_nopriv_get_quiz_correct_answers', 'lilac_get_quiz_correct_answers_ajax');

/**
 * AJAX handler to get correct answers for a quiz
 */
function lilac_get_quiz_correct_answers_ajax() {
    // Verify nonce if provided
    if (isset($_POST['nonce']) && !empty($_POST['nonce'])) {
        if (!wp_verify_nonce($_POST['nonce'], 'lilac_quiz_nonce')) {
            wp_die('Security check failed');
        }
    }
    
    $quiz_id = isset($_POST['quiz_id']) ? intval($_POST['quiz_id']) : 0;
    
    if (!$quiz_id) {
        wp_send_json_error('No quiz ID provided');
        return;
    }
    
    $correct_answers = lilac_get_quiz_correct_answers_from_db($quiz_id);
    
    if (empty($correct_answers)) {
        wp_send_json_error('No correct answers found');
        return;
    }
    
    wp_send_json_success($correct_answers);
}

/**
 * Get correct answers from LearnDash database
 * Enhanced to parse serialized answer_data from edc_learndash_pro_quiz_question table
 */
function lilac_get_quiz_correct_answers_from_db($quiz_id) {
    global $wpdb;
    
    $answer_data = array();
    
    // Get all questions for this quiz
    $questions = learndash_get_quiz_questions($quiz_id);
    
    if (empty($questions)) {
        error_log("LILAC DEBUG: No questions found for quiz ID: " . $quiz_id);
        return $answer_data;
    }
    
    error_log("LILAC DEBUG: Found " . count($questions) . " questions for quiz ID: " . $quiz_id);
    
    foreach ($questions as $question) {
        $question_id = $question->ID;
        $question_pro_id = get_post_meta($question_id, 'question_pro_id', true);
        
        if (!$question_pro_id) {
            error_log("LILAC DEBUG: No question_pro_id found for question ID: " . $question_id);
            continue;
        }
        
        // Use the correct table name from our database analysis
        $table_name = 'edc_learndash_pro_quiz_question';
        
        // Get question data including serialized answer_data
        $question_data = $wpdb->get_row($wpdb->prepare(
            "SELECT id, question, answer_type, answer_data, tip_msg FROM {$table_name} WHERE id = %d",
            $question_pro_id
        ));
        
        if (!$question_data) {
            error_log("LILAC DEBUG: No question data found for question_pro_id: " . $question_pro_id);
            continue;
        }
        
        // Parse the serialized answer_data
        $parsed_answers = lilac_parse_serialized_answers($question_data->answer_data);
        
        if (!empty($parsed_answers)) {
            $correct_answer_index = null;
            
            // Find the correct answer index
            foreach ($parsed_answers as $index => $answer) {
                if ($answer['correct']) {
                    $correct_answer_index = $index + 1; // Convert to 1-based index for frontend
                    break;
                }
            }
            
            $answer_data[$question_id] = array(
                'question_text' => strip_tags($question_data->question),
                'answers' => $parsed_answers,
                'correct_answer' => $correct_answer_index,
                'question_pro_id' => $question_pro_id,
                'answer_type' => $question_data->answer_type,
                'hint' => $question_data->tip_msg
            );
            
            error_log("LILAC DEBUG: Processed question ID {$question_id}, correct answer: " . $correct_answer_index);
        } else {
            error_log("LILAC DEBUG: Failed to parse answers for question ID: " . $question_id);
        }
    }
    
    error_log("LILAC DEBUG: Total processed questions: " . count($answer_data));
    return $answer_data;
}

/**
 * Parse serialized LearnDash answer data
 * Handles the complex PHP serialized WpProQuiz_Model_AnswerTypes objects
 */
function lilac_parse_serialized_answers($serialized_data) {
    if (empty($serialized_data)) {
        return array();
    }
    
    // Attempt to unserialize the data
    $unserialized = @unserialize($serialized_data);
    
    if ($unserialized === false) {
        error_log("LILAC DEBUG: Failed to unserialize answer data");
        return array();
    }
    
    $parsed_answers = array();
    
    // The data is an array of WpProQuiz_Model_AnswerTypes objects
    if (is_array($unserialized)) {
        foreach ($unserialized as $index => $answer_obj) {
            if (is_object($answer_obj)) {
                // Extract answer text and correct flag from the object
                $answer_text = '';
                $is_correct = false;
                
                // Try to access the private properties
                if (property_exists($answer_obj, '_answer')) {
                    $answer_text = $answer_obj->_answer;
                } elseif (isset($answer_obj->_answer)) {
                    $answer_text = $answer_obj->_answer;
                }
                
                if (property_exists($answer_obj, '_correct')) {
                    $is_correct = (bool)$answer_obj->_correct;
                } elseif (isset($answer_obj->_correct)) {
                    $is_correct = (bool)$answer_obj->_correct;
                }
                
                // Clean up the answer text
                $answer_text = trim(strip_tags($answer_text));
                
                $parsed_answers[] = array(
                    'text' => $answer_text,
                    'correct' => $is_correct,
                    'index' => $index
                );
            }
        }
    }
    
    return $parsed_answers;
}

/**
 * Enqueue nonce for AJAX requests
 */
function lilac_enqueue_quiz_nonce() {
    if (is_singular('sfwd-quiz')) {
        wp_localize_script('jquery', 'lilac_quiz_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('lilac_quiz_nonce')
        ));
    }
}
add_action('wp_enqueue_scripts', 'lilac_enqueue_quiz_nonce');
?>
