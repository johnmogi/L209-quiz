<?php
// Direct Answer Fix - Test actual question content matching
$host = '127.0.0.1';
$port = 3306;
$database = 'local';
$username = 'root';
$password = 'root';
$table_prefix = 'edc_';

try {
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$database}", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>🔍 Direct Answer Fix Test</h1>";
    
    // Search for the specific question about police testing that's showing wrong answer
    $search_terms = ['שוטר', 'בדיקת נשיפה', 'דם או שתן', 'אסור לסרב'];
    
    echo "<h2>Searching for Police Testing Question</h2>";
    
    foreach ($search_terms as $term) {
        echo "<h3>Searching for: {$term}</h3>";
        
        $stmt = $pdo->prepare("
            SELECT id, quiz_id, question, answer_type, answer_data 
            FROM {$table_prefix}learndash_pro_quiz_question 
            WHERE question LIKE ? 
            ORDER BY id DESC 
            LIMIT 5
        ");
        $stmt->execute(["%{$term}%"]);
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($questions as $q) {
            echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 10px 0;'>";
            echo "<h4>Question ID: {$q['id']} (Quiz: {$q['quiz_id']})</h4>";
            
            $question_text = strip_tags($q['question']);
            echo "<p><strong>Question:</strong> " . mb_substr($question_text, 0, 200) . "...</p>";
            
            // Parse answers
            $answer_data = unserialize($q['answer_data']);
            if (is_array($answer_data)) {
                echo "<p><strong>Answer Options:</strong></p>";
                foreach ($answer_data as $index => $answer) {
                    $is_correct = (isset($answer['correct']) && $answer['correct'] == 1) ? ' ✅ CORRECT' : '';
                    $answer_text = strip_tags($answer['answer']);
                    echo "<p>{$index}: " . mb_substr($answer_text, 0, 100) . "...{$is_correct}</p>";
                }
            }
            echo "</div>";
        }
    }
    
    // Check which quiz IDs have questions
    echo "<h2>Quiz IDs with Questions</h2>";
    $stmt = $pdo->prepare("
        SELECT quiz_id, COUNT(*) as question_count 
        FROM {$table_prefix}learndash_pro_quiz_question 
        GROUP BY quiz_id 
        ORDER BY quiz_id DESC
    ");
    $stmt->execute();
    $quiz_counts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p>Found questions in " . count($quiz_counts) . " different quiz IDs:</p>";
    foreach ($quiz_counts as $qc) {
        echo "<p>Quiz ID {$qc['quiz_id']}: {$qc['question_count']} questions</p>";
    }
    
    // Get all questions from the quiz with most questions
    if (!empty($quiz_counts)) {
        $main_quiz_id = $quiz_counts[0]['quiz_id'];
        echo "<h2>Questions from Quiz ID {$main_quiz_id}</h2>";
        
        $stmt = $pdo->prepare("
            SELECT id, quiz_id, question, answer_type, answer_data 
            FROM {$table_prefix}learndash_pro_quiz_question 
            WHERE quiz_id = ?
            ORDER BY id ASC 
            LIMIT 10
        ");
        $stmt->execute([$main_quiz_id]);
        $police_questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<p>Showing first 10 questions from quiz {$main_quiz_id}:</p>";
    } else {
        $police_questions = [];
    }
    
    foreach ($police_questions as $q) {
        echo "<div style='border: 2px solid #ff6600; padding: 15px; margin: 10px 0;'>";
        echo "<h4>🎯 Question ID: {$q['id']} (Quiz: {$q['quiz_id']})</h4>";
        
        $question_text = strip_tags($q['question']);
        echo "<p><strong>Full Question:</strong> {$question_text}</p>";
        
        // Parse answers with detailed analysis
        $answer_data = unserialize($q['answer_data']);
        if (is_array($answer_data)) {
            echo "<p><strong>Detailed Answer Analysis:</strong></p>";
            foreach ($answer_data as $index => $answer) {
                $is_correct = (isset($answer['correct']) && $answer['correct'] == 1) ? ' ✅ CORRECT' : '';
                $answer_text = strip_tags($answer['answer']);
                
                echo "<div style='margin: 5px 0; padding: 5px; background: " . 
                     ($is_correct ? '#e8f5e8' : '#f5f5f5') . ";'>";
                echo "<strong>Option {$index}:</strong> {$answer_text}{$is_correct}";
                echo "</div>";
            }
        }
        echo "</div>";
    }
    
    echo "<h2>✅ Analysis Complete</h2>";
    echo "<p>This will help identify which question is showing the wrong correct answer.</p>";
    
} catch (PDOException $e) {
    echo "<h1>❌ Database Error</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
