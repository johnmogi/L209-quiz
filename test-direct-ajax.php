<?php
// Direct AJAX test to bypass WordPress and test the answer fetcher directly
require_once 'includes/quiz-answer-fetcher.php';

// Database connection
$host = '127.0.0.1';
$port = 3306;
$database = 'local';
$username = 'root';
$password = 'root';
$table_prefix = 'edc_';

try {
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$database}", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>🧪 Direct AJAX Test</h1>";
    
    // Test the answer fetcher class directly
    global $wpdb;
    $wpdb = new stdClass();
    $wpdb->prefix = $table_prefix;
    
    // Mock WordPress functions
    if (!function_exists('get_post_meta')) {
        function get_post_meta($post_id, $key, $single = false) {
            return null; // Force fallback to common quiz IDs
        }
    }
    
    $fetcher = new LilacQuizAnswerFetcher();
    
    // Test quiz ID 0 directly
    echo "<h2>Testing Quiz ID 0 (1347 questions)</h2>";
    
    $stmt = $pdo->prepare("
        SELECT id, question, answer_data 
        FROM {$table_prefix}learndash_pro_quiz_question 
        WHERE quiz_id = 0 
        ORDER BY id ASC 
        LIMIT 5
    ");
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p>Found " . count($questions) . " sample questions from quiz ID 0:</p>";
    
    foreach ($questions as $q) {
        echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 10px 0;'>";
        echo "<h4>Question ID: {$q['id']}</h4>";
        
        $question_text = strip_tags($q['question']);
        echo "<p><strong>Question:</strong> " . mb_substr($question_text, 0, 150) . "...</p>";
        
        // Parse answers
        $answer_data = unserialize($q['answer_data']);
        if (is_array($answer_data)) {
            echo "<p><strong>Answers:</strong></p>";
            foreach ($answer_data as $index => $answer) {
                $is_correct = (isset($answer['correct']) && $answer['correct'] == 1) ? ' ✅' : '';
                $answer_text = strip_tags($answer['answer']);
                echo "<p>  {$index}: " . mb_substr($answer_text, 0, 80) . "...{$is_correct}</p>";
            }
        }
        echo "</div>";
    }
    
    // Test the get_quiz_correct_answers method directly
    echo "<h2>Testing get_quiz_correct_answers(0)</h2>";
    
    try {
        $correct_answers = $fetcher->get_quiz_correct_answers(0);
        
        if (empty($correct_answers)) {
            echo "<p>❌ No correct answers returned from method</p>";
        } else {
            echo "<p>✅ Method returned " . count($correct_answers) . " correct answers</p>";
            
            // Show first 3 answers
            $sample_keys = array_slice(array_keys($correct_answers), 0, 3);
            foreach ($sample_keys as $key) {
                echo "<p><strong>Question {$key}:</strong> " . json_encode($correct_answers[$key]) . "</p>";
            }
        }
    } catch (Exception $e) {
        echo "<p>❌ Exception: " . $e->getMessage() . "</p>";
    }
    
} catch (Exception $e) {
    echo "<h1>❌ Error</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>
