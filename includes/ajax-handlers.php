<?php
/**
 * AJAX handlers for Lilac Quiz Sidebar
 * Handles requests for quiz data and correct answers
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * AJAX handler to get correct answers for a specific question
 */
function lilac_get_correct_answers_handler() {
    // Verify nonce for security
    if (!wp_verify_nonce($_POST['nonce'] ?? '', 'lilac_quiz_nonce')) {
        wp_send_json_error('Invalid security token');
        return;
    }
    
    $quiz_id = intval($_POST['quiz_id'] ?? 0);
    $question_id = intval($_POST['question_id'] ?? 0);
    $question_text = sanitize_text_field($_POST['question_text'] ?? '');
    
    if (!$quiz_id || !$question_id) {
        wp_send_json_error('Missing quiz_id or question_id');
        return;
    }
    
    global $wpdb;
    
    try {
        // Query the ProQuiz question table
        $table_name = $wpdb->prefix . 'learndash_pro_quiz_question';
        
        $question = $wpdb->get_row($wpdb->prepare(
            "SELECT id, quiz_id, question, answer_data, answer_type 
             FROM {$table_name} 
             WHERE id = %d AND quiz_id = %d",
            $question_id,
            $quiz_id
        ));
        
        if (!$question) {
            // Try alternative search by question text if direct ID fails
            $question = $wpdb->get_row($wpdb->prepare(
                "SELECT id, quiz_id, question, answer_data, answer_type 
                 FROM {$table_name} 
                 WHERE quiz_id = %d AND question LIKE %s 
                 LIMIT 1",
                $quiz_id,
                '%' . $wpdb->esc_like(substr($question_text, 0, 50)) . '%'
            ));
        }
        
        if (!$question) {
            wp_send_json_error('Question not found in database');
            return;
        }
        
        // Parse answer data
        $correct_answers = [];
        $answer_data = @unserialize($question->answer_data);
        
        if ($answer_data && is_array($answer_data)) {
            foreach ($answer_data as $index => $answer_obj) {
                if (is_object($answer_obj)) {
                    try {
                        // Use reflection to access protected properties
                        $reflection = new ReflectionObject($answer_obj);
                        
                        $answerProp = $reflection->getProperty('_answer');
                        $answerProp->setAccessible(true);
                        $answer_text = $answerProp->getValue($answer_obj);
                        
                        $correctProp = $reflection->getProperty('_correct');
                        $correctProp->setAccessible(true);
                        $is_correct = $correctProp->getValue($answer_obj);
                        
                        if ($is_correct) {
                            $correct_answers[] = [
                                'index' => $index + 1,
                                'text' => strip_tags($answer_text),
                                'is_correct' => true
                            ];
                        }
                    } catch (Exception $e) {
                        // Fallback: regex parsing
                        $answer_string = serialize($answer_obj);
                        if (preg_match('/s:\d+:"_answer";s:\d+:"([^"]+)"/', $answer_string, $answer_match) &&
                            preg_match('/s:\d+:"_correct";b:1/', $answer_string)) {
                            $correct_answers[] = [
                                'index' => $index + 1,
                                'text' => strip_tags($answer_match[1]),
                                'is_correct' => true
                            ];
                        }
                    }
                }
            }
        }
        
        $response_data = [
            'question_id' => $question->id,
            'quiz_id' => $question->quiz_id,
            'question_text' => strip_tags($question->question),
            'answer_type' => $question->answer_type,
            'correct_answers' => $correct_answers,
            'total_answers' => count($answer_data ?: [])
        ];
        
        wp_send_json_success($response_data);
        
    } catch (Exception $e) {
        error_log('Lilac Quiz: Error fetching correct answers - ' . $e->getMessage());
        wp_send_json_error('Database error: ' . $e->getMessage());
    }
}

// Register AJAX handlers
add_action('wp_ajax_lilac_get_correct_answers', 'lilac_get_correct_answers_handler');
add_action('wp_ajax_nopriv_lilac_get_correct_answers', 'lilac_get_correct_answers_handler');

// Add enhanced AJAX handler for question detection
add_action('wp_ajax_get_quiz_answers', 'lilac_enhanced_get_quiz_answers');
add_action('wp_ajax_nopriv_get_quiz_answers', 'lilac_enhanced_get_quiz_answers');

function lilac_enhanced_get_quiz_answers() {
    $quiz_id = intval($_POST['quiz_id'] ?? 0);
    $question_id = intval($_POST['question_id'] ?? 0);
    
    error_log("LILAC DEBUG: Enhanced handler - Quiz:$quiz_id Question:$question_id");
    
    global $wpdb;
    
    // Try multiple table names for ProQuiz
    $possible_tables = [
        $wpdb->prefix . 'learndash_pro_quiz_question',
        $wpdb->prefix . 'pro_quiz_question',
        $wpdb->prefix . 'wp_pro_quiz_question'
    ];
    
    $question = null;
    $table_used = '';
    
    foreach ($possible_tables as $table) {
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
        if ($table_exists) {
            error_log("LILAC DEBUG: Checking table: $table");
            
            if ($question_id) {
                $question = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM $table WHERE id = %d",
                    $question_id
                ));
            }
            
            if (!$question && $quiz_id) {
                $question = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM $table WHERE quiz_id = %d ORDER BY sort ASC LIMIT 1",
                    $quiz_id
                ));
            }
            
            if ($question) {
                $table_used = $table;
                break;
            }
        }
    }
    
    if (!$question) {
        // Debug: Show available tables and questions
        $tables = $wpdb->get_results("SHOW TABLES LIKE '%quiz%'");
        error_log("LILAC DEBUG: Available quiz tables: " . print_r($tables, true));
        
        wp_send_json_error("Question not found. Quiz:$quiz_id Question:$question_id");
        return;
    }
    
    error_log("LILAC DEBUG: Found question in table: $table_used");
    
    // Get answer data
    $answer_data = null;
    if (isset($question->answer_data)) {
        $answer_data = @unserialize($question->answer_data);
    }
    
    $formatted_answers = [];
    
    if ($answer_data && is_array($answer_data)) {
        foreach ($answer_data as $index => $answer_obj) {
            if (is_object($answer_obj)) {
                try {
                    $reflection = new ReflectionObject($answer_obj);
                    
                    $answerProp = $reflection->getProperty('_answer');
                    $answerProp->setAccessible(true);
                    $answer_text = $answerProp->getValue($answer_obj);
                    
                    $correctProp = $reflection->getProperty('_correct');
                    $correctProp->setAccessible(true);
                    $is_correct = $correctProp->getValue($answer_obj);
                    
                    $formatted_answers[] = [
                        'index' => $index + 1,
                        'text' => strip_tags($answer_text),
                        'correct' => (bool) $is_correct
                    ];
                } catch (Exception $e) {
                    error_log("LILAC DEBUG: Reflection error: " . $e->getMessage());
                }
            }
        }
    }
    
    $response = [
        'question_id' => $question->id,
        'quiz_id' => $question->quiz_id ?? $quiz_id,
        'question_text' => strip_tags($question->question ?? ''),
        'answers' => $formatted_answers,
        'table_used' => $table_used
    ];
    
    error_log("LILAC DEBUG: Response: " . print_r($response, true));
    wp_send_json_success($response);
}

/**
 * Enqueue nonce for AJAX security
 */
function lilac_enqueue_quiz_nonce() {
    if (is_singular('sfwd-quiz') || strpos($_SERVER['REQUEST_URI'], '/quiz') !== false) {
        wp_localize_script('jquery', 'lilacQuizData', [
            'nonce' => wp_create_nonce('lilac_quiz_nonce'),
            'ajax_url' => admin_url('admin-ajax.php')
        ]);
        
        // Also add to window object directly
        echo '<script>window.lilacQuizNonce = "' . wp_create_nonce('lilac_quiz_nonce') . '";</script>';
    }
}
add_action('wp_enqueue_scripts', 'lilac_enqueue_quiz_nonce');
