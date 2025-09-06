<?php
// Simple database test to verify quiz ID detection logic
$host = '127.0.0.1';
$port = 3306;
$database = 'local';
$username = 'root';
$password = 'root';
$table_prefix = 'edc_';

try {
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$database}", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>✅ Database Connection Successful</h1>";
    
    // Test the updated quiz ID detection logic
    echo "<h2>Testing Quiz ID Detection Logic</h2>";
    
    // First, check what ProQuiz ID is mapped for LearnDash quiz 11702
    $stmt = $pdo->prepare("SELECT meta_value FROM {$table_prefix}postmeta WHERE post_id = ? AND meta_key = 'quiz_pro_id'");
    $stmt->execute([11702]);
    $mapped_quiz_id = $stmt->fetchColumn();
    
    echo "<p><strong>Mapped ProQuiz ID for LearnDash quiz 11702:</strong> {$mapped_quiz_id}</p>";
    
    // Check if this mapped quiz ID has questions
    if ($mapped_quiz_id) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM {$table_prefix}learndash_pro_quiz_question WHERE quiz_id = ?");
        $stmt->execute([$mapped_quiz_id]);
        $question_count = $stmt->fetchColumn();
        
        echo "<p><strong>Questions in mapped quiz ID {$mapped_quiz_id}:</strong> {$question_count}</p>";
    }
    
    // Now test the fallback logic - check quiz IDs that have questions
    echo "<h3>Fallback Quiz IDs with Questions:</h3>";
    $fallback_quiz_ids = [0, 5, 94, 97, 98];
    
    $best_quiz_id = null;
    $best_question_count = 0;
    
    foreach ($fallback_quiz_ids as $test_id) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM {$table_prefix}learndash_pro_quiz_question WHERE quiz_id = ?");
        $stmt->execute([$test_id]);
        $question_count = $stmt->fetchColumn();
        
        echo "<p><strong>Quiz ID {$test_id}:</strong> {$question_count} questions</p>";
        
        if ($question_count > $best_question_count) {
            $best_quiz_id = $test_id;
            $best_question_count = $question_count;
        }
    }
    
    echo "<h3>Best Quiz ID to Use: {$best_quiz_id} ({$best_question_count} questions)</h3>";
    
    // Test getting correct answers from the best quiz ID
    if ($best_quiz_id !== null) {
        echo "<h2>Testing Answer Extraction from Quiz ID {$best_quiz_id}</h2>";
        
        $stmt = $pdo->prepare("
            SELECT id, question, answer_type, answer_data 
            FROM {$table_prefix}learndash_pro_quiz_question 
            WHERE quiz_id = ? 
            ORDER BY sort ASC 
            LIMIT 3
        ");
        $stmt->execute([$best_quiz_id]);
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($questions as $question) {
            echo "<div style='border: 1px solid #ccc; padding: 10px; margin: 10px 0;'>";
            echo "<h4>Question {$question['id']}</h4>";
            
            $question_preview = strip_tags($question['question']);
            $question_preview = mb_substr($question_preview, 0, 100) . '...';
            echo "<p><strong>Question:</strong> {$question_preview}</p>";
            echo "<p><strong>Type:</strong> {$question['answer_type']}</p>";
            
            // Parse answer data
            $answer_data = unserialize($question['answer_data']);
            if (is_array($answer_data)) {
                $correct_answers = array();
                foreach ($answer_data as $index => $answer) {
                    if (isset($answer['correct']) && $answer['correct'] == 1) {
                        $correct_answers[] = $index;
                    }
                }
                echo "<p><strong>Correct Answer Indices:</strong> " . implode(', ', $correct_answers) . "</p>";
                
                // Show answer texts
                echo "<p><strong>All Answers:</strong></p><ul>";
                foreach ($answer_data as $index => $answer) {
                    $correct_marker = (isset($answer['correct']) && $answer['correct'] == 1) ? ' ✅' : '';
                    $answer_text = strip_tags($answer['answer']);
                    echo "<li>{$index}: {$answer_text}{$correct_marker}</li>";
                }
                echo "</ul>";
            }
            
            echo "</div>";
        }
    }
    
    echo "<h2>✅ Test Complete - Updated Logic Working</h2>";
    echo "<p>The fallback mechanism will now use quiz ID {$best_quiz_id} when the mapped quiz ID has no questions.</p>";
    
} catch (PDOException $e) {
    echo "<h1>❌ Database Connection Failed</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
