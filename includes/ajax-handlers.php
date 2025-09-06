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
    // Verify nonce for security (skip for development)
    // if (!wp_verify_nonce($_POST['nonce'] ?? '', 'lilac_quiz_nonce')) {
    //     wp_send_json_error('Invalid security token');
    //     return;
    // }
    
    $quiz_id = intval($_POST['quiz_id'] ?? 0);
    $question_id = intval($_POST['question_id'] ?? 0);
    $question_text = sanitize_text_field($_POST['question_text'] ?? '');
    
    if (!$quiz_id) {
        wp_send_json_error('Missing quiz_id');
        return;
    }
    
    // Allow requests without question_id for getting all quiz questions
    if (!$question_id) {
        error_log("LILAC DEBUG: No question_id provided, attempting to get all questions for quiz $quiz_id");
    }
    
    global $wpdb;
    
    try {
        // Query the ProQuiz question table
        $table_name = $wpdb->prefix . 'learndash_pro_quiz_question';
        
        if ($question_id) {
            $question = $wpdb->get_row($wpdb->prepare(
                "SELECT id, quiz_id, question, answer_data, answer_type 
                 FROM {$table_name} 
                 WHERE id = %d AND quiz_id = %d",
                $question_id,
                $quiz_id
            ));
        } else {
            // If no question_id, get all questions for the quiz
            error_log("LILAC DEBUG: Getting all questions for quiz $quiz_id");
            
            $all_questions = $wpdb->get_results($wpdb->prepare(
                "SELECT id, quiz_id, question, answer_data, answer_type 
                 FROM {$table_name} 
                 WHERE quiz_id = %d 
                 ORDER BY sort ASC",
                $quiz_id
            ));
            
            error_log("LILAC DEBUG: Found " . count($all_questions) . " questions");
            
            if ($all_questions) {
                $questions_data = array();
                foreach ($all_questions as $q) {
                    $processed_question = process_question_answers($q);
                    if ($processed_question) {
                        $questions_data[] = $processed_question;
                    }
                }
                
                error_log("LILAC DEBUG: Processed " . count($questions_data) . " questions successfully");
                
                wp_send_json_success(array(
                    'questions' => $questions_data,
                    'total' => count($questions_data),
                    'message' => 'All questions loaded successfully'
                ));
            } else {
                error_log("LILAC DEBUG: No questions found for quiz $quiz_id");
                wp_send_json_error('No questions found for this quiz');
            }
            return; // Exit here since we handled the all-questions case
        }
        
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

/**
 * Process question answers to extract correct answers
 */
function process_question_answers($question) {
    if (!$question) return null;
    
    $answer_data = @unserialize($question->answer_data);
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
    
    return [
        'question_id' => $question->id,
        'quiz_id' => $question->quiz_id,
        'question_text' => strip_tags($question->question),
        'answer_type' => $question->answer_type,
        'answers' => $formatted_answers
    ];
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
    
    // If no specific question_id, try to get ALL questions for the quiz
    if (!$question_id && $quiz_id) {
        return lilac_get_all_quiz_questions($quiz_id);
    }
    
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
 * Get ALL questions and answers for a quiz
 */
function lilac_get_all_quiz_questions($quiz_id) {
    global $wpdb;
    
    // First, try to get the post ID that corresponds to this quiz
    $post_id = $wpdb->get_var($wpdb->prepare(
        "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = 'quiz_pro_id' AND meta_value = %d",
        $quiz_id
    ));
    
    error_log("LILAC DEBUG: Quiz ID $quiz_id maps to Post ID: $post_id");
    
    $all_questions = [];
    $table_used = '';
    
    // Get question IDs from LearnDash quiz mapping
    if ($post_id) {
        $question_mapping = get_post_meta($post_id, 'ld_quiz_questions', true);
        error_log("LILAC DEBUG: Question mapping: " . print_r($question_mapping, true));
        
        if ($question_mapping && is_array($question_mapping)) {
            $question_ids = array_values($question_mapping); // Use VALUES, not keys!
            error_log("LILAC DEBUG: Question IDs to fetch (corrected): " . implode(', ', $question_ids));
            
            $possible_tables = [
                $wpdb->prefix . 'learndash_pro_quiz_question',
                $wpdb->prefix . 'pro_quiz_question',
                $wpdb->prefix . 'wp_pro_quiz_question'
            ];
            
            foreach ($possible_tables as $table) {
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
                if ($table_exists) {
                    // Get questions by their specific IDs
                    $placeholders = implode(',', array_fill(0, count($question_ids), '%d'));
                    $query = "SELECT * FROM $table WHERE id IN ($placeholders) ORDER BY sort ASC";
                    $questions = $wpdb->get_results($wpdb->prepare($query, ...$question_ids));
                    
                    if ($questions) {
                        $table_used = $table;
                        error_log("LILAC DEBUG: Found " . count($questions) . " questions in $table");
                        foreach ($questions as $question) {
                            $answer_data = @unserialize($question->answer_data);
                            $formatted_answers = [];
                            
                            error_log("LILAC DEBUG: Processing question {$question->id}, answer_data length: " . strlen($question->answer_data ?? ''));
                            
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
                                                'index' => $index,
                                                'text' => strip_tags($answer_text),
                                                'correct' => (bool) $is_correct
                                            ];
                                            
                                            error_log("LILAC DEBUG: Answer $index: " . strip_tags($answer_text) . " (correct: " . ($is_correct ? 'yes' : 'no') . ")");
                                        } catch (Exception $e) {
                                            error_log("LILAC DEBUG: Reflection error: " . $e->getMessage());
                                        }
                                    }
                                }
                            } else {
                                error_log("LILAC DEBUG: No valid answer data for question {$question->id}");
                            }
                            
                            $all_questions[] = [
                                'question_id' => $question->id,
                                'quiz_id' => $quiz_id, // Use the original quiz_id for consistency
                                'question_text' => strip_tags($question->question ?? ''),
                                'answers' => $formatted_answers,
                                'sort_order' => $question->sort ?? 0
                            ];
                        }
                        break;
                    }
                }
            }
        } else {
            error_log("LILAC DEBUG: No question mapping found for post $post_id");
        }
    } else {
        error_log("LILAC DEBUG: No post found for quiz_id $quiz_id");
        
        // Fallback: try direct quiz_id query
        $possible_tables = [
            $wpdb->prefix . 'learndash_pro_quiz_question',
            $wpdb->prefix . 'pro_quiz_question',
            $wpdb->prefix . 'wp_pro_quiz_question'
        ];
        
        foreach ($possible_tables as $table) {
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
            if ($table_exists) {
                $questions = $wpdb->get_results($wpdb->prepare(
                    "SELECT * FROM $table WHERE quiz_id = %d ORDER BY sort ASC",
                    $quiz_id
                ));
                
                if ($questions) {
                    $table_used = $table;
                    error_log("LILAC DEBUG: Fallback found " . count($questions) . " questions in $table");
                    
                    foreach ($questions as $question) {
                        $answer_data = @unserialize($question->answer_data);
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
                                            'index' => $index,
                                            'text' => strip_tags($answer_text),
                                            'correct' => (bool) $is_correct
                                        ];
                                    } catch (Exception $e) {
                                        error_log("LILAC DEBUG: Reflection error: " . $e->getMessage());
                                    }
                                }
                            }
                        }
                        
                        $all_questions[] = [
                            'question_id' => $question->id,
                            'quiz_id' => $question->quiz_id,
                            'question_text' => strip_tags($question->question ?? ''),
                            'answers' => $formatted_answers,
                            'sort_order' => $question->sort ?? 0
                        ];
                    }
                    break;
                }
            }
        }
    }
    
    $response = [
        'quiz_id' => $quiz_id,
        'questions' => $all_questions,
        'total_questions' => count($all_questions),
        'table_used' => $table_used
    ];
    
    error_log("LILAC DEBUG: All questions response: " . print_r($response, true));
    wp_send_json_success($response);
}

// Note: lilac_enqueue_quiz_nonce() function is declared in quiz-ajax-handler.php
