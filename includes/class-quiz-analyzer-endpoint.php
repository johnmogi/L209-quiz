<?php
/**
 * Quiz Analyzer Endpoint Handler
 * Provides admin-only access to quiz analysis data
 */

if (!defined('ABSPATH')) {
    exit;
}

class Lilac_Quiz_Analyzer_Endpoint {
    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Register AJAX endpoints
        add_action('wp_ajax_lilac_quiz_analyzer', array($this, 'handle_analyzer_request'));
        add_action('wp_ajax_lilac_quiz_analyzer_json', array($this, 'handle_json_request'));
        
        // Add admin menu page
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }

    /**
     * Add admin menu for quiz analyzer
     */
    public function add_admin_menu() {
        add_submenu_page(
            'tools.php',
            'Live Quiz Analyzer',
            'Quiz Analyzer',
            'manage_options',
            'lilac-quiz-analyzer',
            array($this, 'render_analyzer_page')
        );
    }

    /**
     * Render the analyzer admin page
     */
    public function render_analyzer_page() {
        if (!current_user_can('manage_options')) {
            wp_die('Access denied');
        }

        $quiz_id = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 11702;
        ?>
        <div class="wrap">
            <h1>Live Quiz Analyzer</h1>
            <form method="get">
                <input type="hidden" name="page" value="lilac-quiz-analyzer">
                <label>Quiz ID: <input type="number" name="quiz_id" value="<?php echo $quiz_id; ?>"></label>
                <input type="submit" class="button" value="Analyze">
            </form>
            <div id="quiz-analysis-results">
                <?php $this->display_quiz_analysis($quiz_id); ?>
            </div>
        </div>
        <?php
    }

    /**
     * Handle AJAX analyzer request
     */
    public function handle_analyzer_request() {
        // Security check
        if (!current_user_can('manage_options')) {
            wp_die('Access denied');
        }

        $quiz_id = isset($_POST['quiz_id']) ? intval($_POST['quiz_id']) : 11702;
        
        ob_start();
        $this->display_quiz_analysis($quiz_id);
        $html = ob_get_clean();
        
        wp_send_json_success(array('html' => $html));
    }

    /**
     * Handle JSON API request
     */
    public function handle_json_request() {
        // Security check
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Access denied');
        }

        $quiz_id = isset($_POST['quiz_id']) ? intval($_POST['quiz_id']) : 11702;
        $data = $this->get_quiz_data($quiz_id);
        
        wp_send_json_success($data);
    }

    /**
     * Display quiz analysis
     */
    private function display_quiz_analysis($quiz_id) {
        $db_config = Lilac_Quiz_DB_Config::get_instance();
        $pdo = $db_config->get_connection();
        
        if (!$pdo) {
            echo '<div class="error"><p>Database connection failed</p></div>';
            return;
        }

        try {
            // Get quiz questions
            $query = "
                SELECT 
                    q.id as question_id,
                    q.question,
                    q.answer_data,
                    pm.meta_value as question_pro_id
                FROM edc_posts p
                JOIN edc_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = 'question_pro_id'
                JOIN edc_learndash_pro_quiz_question q ON q.id = pm.meta_value
                WHERE p.post_parent = :quiz_id
                ORDER BY pm.post_id
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':quiz_id', $quiz_id, PDO::PARAM_INT);
            $stmt->execute();
            $questions = $stmt->fetchAll();

            if (empty($questions)) {
                echo '<div class="notice notice-warning"><p>No questions found for Quiz ID: ' . $quiz_id . '</p></div>';
                return;
            }

            echo '<h2>Quiz Analysis for ID: ' . $quiz_id . '</h2>';
            echo '<div class="quiz-questions">';
            
            foreach ($questions as $index => $question) {
                $this->render_question_analysis($question, $index + 1);
            }
            
            echo '</div>';
            
        } catch (Exception $e) {
            echo '<div class="error"><p>Error: ' . esc_html($e->getMessage()) . '</p></div>';
        }
    }

    /**
     * Render individual question analysis
     */
    private function render_question_analysis($question, $number) {
        $answer_data = json_decode($question['answer_data'], true);
        
        echo '<div class="question-block" style="border: 1px solid #ddd; margin: 10px 0; padding: 15px;">';
        echo '<h3>Question ' . $number . ' (ID: ' . $question['question_id'] . ')</h3>';
        echo '<div class="question-text">' . wp_kses_post($question['question']) . '</div>';
        
        if ($answer_data && is_array($answer_data)) {
            echo '<div class="answers">';
            foreach ($answer_data as $index => $answer) {
                $is_correct = isset($answer['_answerCorrect']) && $answer['_answerCorrect'];
                $style = $is_correct ? 'background: #d4edda; color: #155724; font-weight: bold;' : 'background: #f8d7da; color: #721c24;';
                
                echo '<div style="padding: 5px; margin: 2px 0; ' . $style . '">';
                echo ($index + 1) . '. ' . esc_html($answer['_answer']);
                echo $is_correct ? ' ✓ (CORRECT)' : ' ✗';
                echo '</div>';
            }
            echo '</div>';
        }
        
        echo '</div>';
    }

    /**
     * Get quiz data for JSON API
     */
    private function get_quiz_data($quiz_id) {
        $db_config = Lilac_Quiz_DB_Config::get_instance();
        $pdo = $db_config->get_connection();
        
        if (!$pdo) {
            return array('error' => 'Database connection failed');
        }

        try {
            $query = "
                SELECT 
                    id as question_id,
                    quiz_id,
                    CONVERT(question USING utf8mb4) as question,
                    answer_data,
                    answer_type,
                    sort
                FROM edc_learndash_pro_quiz_question 
                WHERE quiz_id = :quiz_id 
                ORDER BY sort ASC
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':quiz_id', $quiz_id, PDO::PARAM_INT);
            $stmt->execute();
            
            return array(
                'quiz_id' => $quiz_id,
                'questions' => $stmt->fetchAll(),
                'total_questions' => $stmt->rowCount()
            );
            
        } catch (Exception $e) {
            return array('error' => $e->getMessage());
        }
    }
}
