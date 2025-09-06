<?php
/**
 * Quiz Answer Fetcher
 * Handles fetching correct answers from the database
 */

// Create mock WpProQuiz_Model_AnswerTypes class if it doesn't exist
if (!class_exists('WpProQuiz_Model_AnswerTypes')) {
    class WpProQuiz_Model_AnswerTypes {
        protected $_answer = '';
        protected $_html = '';
        protected $_points = 0;
        protected $_correct = false;
        protected $_sortString = '';
        protected $_sortStringHtml = '';
        protected $_graded = 1;
        protected $_gradingProgression = 'not-graded-none';
        protected $_gradedType = 'text';
        protected $_mapper = null;
        
        public function getAnswer() { 
            return $this->_answer; 
        }
        
        public function isCorrect() { 
            return (bool)$this->_correct; 
        }
        
        public function getPoints() { 
            return (float)$this->_points; 
        }
        
        public function getHtml() { 
            return $this->_html; 
        }
        
        // Allow access to protected properties for debugging
        public function __get($property) {
            $prop = '_' . $property;
            if (property_exists($this, $prop)) {
                return $this->$prop;
            }
            return null;
        }
    }
}

class LilacQuizAnswerFetcher {
    
    private $wpdb;
    private $table_prefix;
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_prefix = $wpdb->prefix;
    }
    
    /**
     * Get correct answers for a quiz
     */
    public function get_quiz_correct_answers($quiz_id) {
        error_log("LILAC QUIZ: Fetching correct answers for quiz ID: " . $quiz_id);
        
        // Get all questions for this quiz
        $questions = $this->get_quiz_questions($quiz_id);
        $correct_answers = array();
        
        foreach ($questions as $question) {
            $question_id = $question->id;
            $question_type = $question->answer_type;
            
            error_log("LILAC QUIZ: Processing question ID: {$question_id}, type: {$question_type}");
            
            // Get correct answers based on question type
            $correct = $this->get_question_correct_answers($question_id, $question_type);
            
            if (!empty($correct)) {
                $correct_answers[$question_id] = array(
                    'question_id' => $question_id,
                    'question_type' => $question_type,
                    'correct_answers' => $correct,
                    'question_text' => $question->question
                );
            }
        }
        
        error_log("LILAC QUIZ: Found correct answers for " . count($correct_answers) . " questions");
        return $correct_answers;
    }
    
    /**
     * Get all questions for a quiz
     */
    private function get_quiz_questions($quiz_id) {
        // First, let's find the correct ProQuiz ID from the LearnDash post
        $pro_quiz_id = $this->get_pro_quiz_id_from_learndash($quiz_id);
        
        if (!$pro_quiz_id) {
            error_log("LILAC QUIZ: Could not find ProQuiz ID for LearnDash quiz: " . $quiz_id);
            return array();
        }
        
        error_log("LILAC QUIZ: Using ProQuiz ID: {$pro_quiz_id} for LearnDash quiz: {$quiz_id}");
        
        // Use LearnDash ProQuiz table naming convention
        $table_name = $this->table_prefix . 'learndash_pro_quiz_question';
        
        $sql = $this->wpdb->prepare("
            SELECT id, question, answer_type, answer_data
            FROM {$table_name} 
            WHERE quiz_id = %d 
            ORDER BY sort ASC
        ", $pro_quiz_id);
        
        $results = $this->wpdb->get_results($sql);
        error_log("LILAC QUIZ: Found " . count($results) . " questions in database for ProQuiz ID: " . $pro_quiz_id);
        
        return $results;
    }
    
    /**
     * Get ProQuiz ID from LearnDash quiz post
     */
    private function get_pro_quiz_id_from_learndash($post_id) {
        // Try different meta keys that LearnDash uses
        $meta_keys = array(
            '_sfwd-quiz_quiz_pro',
            'quiz_pro_id',
            '_quiz_pro_id'
        );
        
        foreach ($meta_keys as $meta_key) {
            $pro_quiz_id = get_post_meta($post_id, $meta_key, true);
            if (!empty($pro_quiz_id)) {
                error_log("LILAC QUIZ: Found ProQuiz ID {$pro_quiz_id} using meta key: {$meta_key}");
                
                // Check if this quiz ID actually has questions
                $table_name = $this->table_prefix . 'learndash_pro_quiz_question';
                $question_count = $this->wpdb->get_var($this->wpdb->prepare("
                    SELECT COUNT(*) FROM {$table_name} WHERE quiz_id = %d
                ", $pro_quiz_id));
                
                if ($question_count > 0) {
                    error_log("LILAC QUIZ: ProQuiz ID {$pro_quiz_id} has {$question_count} questions");
                    return intval($pro_quiz_id);
                } else {
                    error_log("LILAC QUIZ: ProQuiz ID {$pro_quiz_id} has no questions, trying alternatives");
                }
            }
        }
        
        // If the meta quiz ID has no questions, try common quiz IDs that have questions
        // Fallback quiz IDs - prioritize quiz ID 0 which has 1347 questions
        $common_quiz_ids = array(0, 1, 3, 5, 6);
        $table_name = $this->table_prefix . 'learndash_pro_quiz_question';
        
        foreach ($common_quiz_ids as $test_id) {
            $question_count = $this->wpdb->get_var($this->wpdb->prepare("
                SELECT COUNT(*) FROM {$table_name} WHERE quiz_id = %d
            ", $test_id));
            
            if ($question_count > 0) {
                error_log("LILAC QUIZ: Using fallback quiz ID {$test_id} with {$question_count} questions");
                return $test_id;
            }
        }
        
        // If not found in meta, try to extract from URL or other sources
        if (isset($_GET['quiz_id'])) {
            return intval($_GET['quiz_id']);
        }
        
        return null;
    }
    
    /**
     * Get correct answers for a specific question
     */
    private function get_question_correct_answers($question_id, $question_type) {
        $table_name = $this->table_prefix . 'learndash_pro_quiz_question';
        
        // Create placeholders for the IN clause
        $placeholders = implode(',', array_fill(0, count(array($question_id)), '%d'));
        
        $query = $this->wpdb->prepare("
            SELECT id, question, answer_data 
            FROM {$table_name} 
            WHERE id IN ({$placeholders})
        ", $question_id);
        
        $answer_data = $this->wpdb->get_var($query);
        
        if (empty($answer_data)) {
            error_log("LILAC QUIZ: No answer data found for question {$question_id}");
            return array();
        }
        
        // Unserialize the answer data
        $answers = maybe_unserialize($answer_data);
        
        if (!is_array($answers)) {
            error_log("LILAC QUIZ: Could not unserialize answer data for question {$question_id}");
            return array();
        }
        
        $correct_answers = array();
        
        // Process based on question type
        switch ($question_type) {
            case 'single': // Single choice
            case 'multiple': // Multiple choice
                foreach ($answers as $index => $answer) {
                    if (isset($answer['correct']) && $answer['correct'] == 1) {
                        $correct_answers[] = $index;
                    }
                }
                break;
                
            case 'free_answer': // Free text
                // For free answer, we need to get the correct text
                foreach ($answers as $index => $answer) {
                    if (isset($answer['answer'])) {
                        $correct_answers[] = $answer['answer'];
                    }
                }
                break;
                
            case 'sort_answer': // Sorting
                // For sorting, get the correct order
                foreach ($answers as $index => $answer) {
                    if (isset($answer['sort_string'])) {
                        $correct_answers[$index] = $answer['sort_string'];
                    }
                }
                break;
                
            case 'matrix_sort_answer': // Matrix sorting
                // Complex matrix handling
                foreach ($answers as $index => $answer) {
                    if (isset($answer['matrix_sort_string'])) {
                        $correct_answers[$index] = $answer['matrix_sort_string'];
                    }
                }
                break;
                
            default:
                error_log("LILAC QUIZ: Unknown question type: {$question_type}");
                break;
        }
        
        error_log("LILAC QUIZ: Question {$question_id} correct answers: " . json_encode($correct_answers));
        return $correct_answers;
    }
    
    /**
     * Handle AJAX request to get quiz correct answers
     */
    public function handle_ajax_get_quiz_correct_answers() {
        // Clean any output that might interfere with JSON response
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        try {
            error_log("LILAC QUIZ AJAX: Request received - " . print_r($_POST, true));
            
            // Verify this is actually an AJAX request
            if (!wp_doing_ajax()) {
                error_log("LILAC QUIZ AJAX: Not an AJAX request");
                wp_die('Invalid request method');
            }
            
            // Check if specific question IDs are provided (new dynamic method)
            $question_ids = isset($_POST['question_ids']) ? $_POST['question_ids'] : array();
            
            // Handle both array and string formats
            if (!empty($question_ids)) {
                if (is_string($question_ids)) {
                    // Handle comma-separated string
                    $question_ids = explode(',', $question_ids);
                }
                if (is_array($question_ids)) {
                    $question_ids = array_map('intval', array_filter($question_ids));
                }
            }
            
            if (!empty($question_ids) && is_array($question_ids)) {
                error_log("LILAC QUIZ AJAX: Using dynamic question ID detection with " . count($question_ids) . " questions");
                
                $correct_answers = $this->get_answers_by_question_ids($question_ids);
                
                if (empty($correct_answers)) {
                    error_log("LILAC QUIZ AJAX: No correct answers found for question IDs: " . implode(', ', $question_ids));
                    wp_send_json_error('No correct answers found for these questions');
                    return;
                }
                
                error_log("LILAC QUIZ AJAX: Returning " . count($correct_answers) . " correct answers via dynamic method");
                error_log("LILAC QUIZ AJAX: Response data: " . json_encode($correct_answers));
                
                // Ensure clean output buffer
                if (ob_get_level()) {
                    ob_clean();
                }
                
                // Set proper headers
                header('Content-Type: application/json; charset=utf-8');
                
                wp_send_json_success($correct_answers);
                return;
            }
            
            // Legacy method - fallback to quiz_id
            $quiz_id = isset($_POST['quiz_id']) ? intval($_POST['quiz_id']) : 0;
            
            if (empty($quiz_id)) {
                error_log("LILAC QUIZ AJAX: No quiz ID or question IDs provided");
                wp_send_json_error('Invalid request - no quiz ID or question IDs');
                return;
            }
            
            error_log("LILAC QUIZ AJAX: Using legacy quiz ID method with quiz {$quiz_id}");
            
            $correct_answers = $this->get_quiz_correct_answers($quiz_id);
            
            if (empty($correct_answers)) {
                error_log("LILAC QUIZ AJAX: No correct answers found for quiz {$quiz_id}");
                wp_send_json_error('No correct answers found for this quiz');
                return;
            }
            
            error_log("LILAC QUIZ AJAX: Returning " . count($correct_answers) . " correct answers via legacy method");
            wp_send_json_success($correct_answers);
            
        } catch (Exception $e) {
            error_log("LILAC QUIZ AJAX ERROR: " . $e->getMessage());
            wp_send_json_error('Error retrieving answers: ' . $e->getMessage());
        }
    }
    
    /**
     * Get correct answers by specific question IDs (dynamic method)
     */
    public function get_answers_by_question_ids($question_ids) {
        if (empty($question_ids) || !is_array($question_ids)) {
            error_log('Quiz Answer Fetcher: Empty or invalid question_ids provided');
            return array();
        }
        
        error_log('Quiz Answer Fetcher: Processing question IDs: ' . implode(', ', $question_ids));
        
        // Force cache invalidation - add timestamp
        error_log('Quiz Answer Fetcher: CACHE BUST - ' . time());
        
        $placeholders = str_repeat('%d,', count($question_ids) - 1) . '%d';
        $table_name = $this->table_prefix . 'learndash_pro_quiz_question';
        
        error_log('Quiz Answer Fetcher: Using placeholders: ' . $placeholders);
        
        $sql = "SELECT id, question, answer_data FROM {$table_name} WHERE id IN ({$placeholders})";
        $stmt = $this->wpdb->prepare($sql, ...$question_ids);
        error_log('Quiz Answer Fetcher: FIXED SQL Query: ' . $stmt);
        
        $questions = $this->wpdb->get_results($stmt, ARRAY_A);
        error_log('Quiz Answer Fetcher: Found ' . count($questions) . ' questions in database');
        
        $correct_answers = array();
        
        foreach ($questions as $question) {
            $question_id = $question['id'];
            $answer_data = $question['answer_data'];
            
            if (!empty($answer_data)) {
                // Try to unserialize the ProQuiz answer data
                $answers = @unserialize($answer_data);
                if ($answers && is_array($answers)) {
                    foreach ($answers as $index => $answer) {
                        // Check if this is a WpProQuiz_Model_AnswerTypes object
                        if (is_object($answer)) {
                            // Cast object to array to access protected properties
                            $answer_array = (array)$answer;
                            
                            $answer_text = isset($answer_array["\0*\0_answer"]) ? $answer_array["\0*\0_answer"] : '';
                            $points = isset($answer_array["\0*\0_points"]) ? $answer_array["\0*\0_points"] : 0;
                            $correct_flag = isset($answer_array["\0*\0_correct"]) ? $answer_array["\0*\0_correct"] : false;
                            
                            $is_correct = ($correct_flag == 1 || $correct_flag === true) || (is_numeric($points) && floatval($points) > 0);
                            
                            error_log("Quiz Answer Fetcher: Question {$question_id}, Index {$index}, Answer: '{$answer_text}', Points: {$points}, Correct Flag: " . var_export($correct_flag, true) . ", Final Correct: " . ($is_correct ? 'YES' : 'NO'));
                            
                            if ($is_correct) {
                                $correct_answers[$question_id] = array(
                                    'question_id' => $question_id,
                                    'correct_answer_index' => $index,
                                    'correct_answer_text' => $answer_text,
                                    'points' => floatval($points)
                                );
                                break; // Found the correct answer for this question
                            }
                        }
                    }
                }
            }
        }
        
        error_log('Quiz Answer Fetcher: Found ' . count($correct_answers) . ' correct answers for question IDs: ' . implode(', ', $question_ids));
        
        return $correct_answers;
    }
    
    /**
     * Get quiz ID from post ID
     */
    public static function get_quiz_id_from_post($post_id) {
        $quiz_id = get_post_meta($post_id, '_sfwd-quiz_quiz_pro', true);
        
        if (empty($quiz_id)) {
            // Try alternative meta key
            $quiz_id = get_post_meta($post_id, 'quiz_pro_id', true);
        }
        
        return intval($quiz_id);
    }
}

// Initialize the answer fetcher and register AJAX handlers
function lilac_quiz_answer_fetcher_init() {
    global $lilac_quiz_answer_fetcher;
    $lilac_quiz_answer_fetcher = new LilacQuizAnswerFetcher();
    
    // Register AJAX handlers
    add_action('wp_ajax_get_quiz_correct_answers', array($lilac_quiz_answer_fetcher, 'handle_ajax_get_quiz_correct_answers'));
    add_action('wp_ajax_nopriv_get_quiz_correct_answers', array($lilac_quiz_answer_fetcher, 'handle_ajax_get_quiz_correct_answers'));
    
    error_log('LILAC QUIZ: AJAX handlers registered successfully');
}

// Initialize after WordPress is fully loaded
add_action('init', 'lilac_quiz_answer_fetcher_init');
?>
