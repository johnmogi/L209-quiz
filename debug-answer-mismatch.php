<?php
// Debug answer mismatch - compare what's in database vs what's actually displayed
$host = '127.0.0.1';
$port = 3306;
$database = 'local';
$username = 'root';
$password = 'root';
$table_prefix = 'edc_';

try {
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$database}", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>🔍 Answer Mismatch Investigation</h1>";
    
    // Get the actual quiz being displayed (LearnDash quiz 11702)
    echo "<h2>1. LearnDash Quiz 11702 Analysis</h2>";
    
    // Check what ProQuiz ID is mapped
    $stmt = $pdo->prepare("SELECT meta_value FROM {$table_prefix}postmeta WHERE post_id = ? AND meta_key IN ('quiz_pro_id', '_sfwd-quiz_quiz_pro')");
    $stmt->execute([11702]);
    $mapped_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<p><strong>Mapped ProQuiz IDs:</strong> " . implode(', ', $mapped_ids) . "</p>";
    
    // Check all quiz IDs that have questions and find which one matches the actual quiz content
    echo "<h2>2. All Quiz IDs with Questions</h2>";
    
    $stmt = $pdo->query("
        SELECT quiz_id, COUNT(*) as question_count, 
               MIN(id) as first_question_id, MAX(id) as last_question_id
        FROM {$table_prefix}learndash_pro_quiz_question 
        GROUP BY quiz_id 
        HAVING question_count > 0 
        ORDER BY question_count DESC
    ");
    $quiz_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($quiz_stats as $stat) {
        echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 5px 0;'>";
        echo "<h3>Quiz ID: {$stat['quiz_id']} ({$stat['question_count']} questions)</h3>";
        echo "<p>Question IDs: {$stat['first_question_id']} - {$stat['last_question_id']}</p>";
        
        // Get sample questions from this quiz
        $stmt = $pdo->prepare("
            SELECT id, question, answer_type, answer_data 
            FROM {$table_prefix}learndash_pro_quiz_question 
            WHERE quiz_id = ? 
            ORDER BY sort ASC 
            LIMIT 2
        ");
        $stmt->execute([$stat['quiz_id']]);
        $sample_questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($sample_questions as $q) {
            $question_preview = strip_tags($q['question']);
            $question_preview = mb_substr($question_preview, 0, 80) . '...';
            echo "<p><strong>Q{$q['id']}:</strong> {$question_preview}</p>";
            
            // Parse answers
            $answer_data = unserialize($q['answer_data']);
            if (is_array($answer_data)) {
                $correct_answers = array();
                foreach ($answer_data as $index => $answer) {
                    if (isset($answer['correct']) && $answer['correct'] == 1) {
                        $correct_answers[] = $index;
                    }
                }
                echo "<p style='margin-left: 20px; color: #666;'>Correct answers: " . implode(', ', $correct_answers) . "</p>";
            }
        }
        echo "</div>";
    }
    
    // Check if there are questions specifically for the current quiz
    echo "<h2>3. Looking for Questions Matching Current Quiz Pattern</h2>";
    
    // Search for questions that might match the current quiz based on content or timing
    $stmt = $pdo->query("
        SELECT DISTINCT quiz_id, COUNT(*) as count
        FROM {$table_prefix}learndash_pro_quiz_question 
        WHERE question LIKE '%נסיעה%' OR question LIKE '%תמרור%' OR question LIKE '%כביש%'
        GROUP BY quiz_id
        ORDER BY count DESC
    ");
    $content_matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Quiz IDs with Hebrew driving content:</strong></p>";
    foreach ($content_matches as $match) {
        echo "<p>Quiz ID {$match['quiz_id']}: {$match['count']} matching questions</p>";
    }
    
    // Check the ProQuiz master table for quiz 101 (the mapped one)
    echo "<h2>4. ProQuiz Master Table Check</h2>";
    $stmt = $pdo->prepare("SELECT * FROM {$table_prefix}learndash_pro_quiz_master WHERE id = ?");
    $stmt->execute([101]);
    $quiz_master = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($quiz_master) {
        echo "<p><strong>Quiz 101 exists in master table:</strong></p>";
        echo "<p>Name: {$quiz_master['name']}</p>";
        echo "<p>Question Random: {$quiz_master['question_random']}</p>";
        echo "<p>Show Max Questions: {$quiz_master['show_max_question_value']}</p>";
    } else {
        echo "<p>❌ Quiz 101 not found in master table</p>";
    }
    
    echo "<h2>5. Recommendation</h2>";
    echo "<p>Based on this analysis, the system should use Quiz ID <strong>{$quiz_stats[0]['quiz_id']}</strong> which has the most questions ({$quiz_stats[0]['question_count']}).</p>";
    
} catch (PDOException $e) {
    echo "<h1>❌ Database Error</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
