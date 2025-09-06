<?php
// Investigate the actual source of quiz questions and answers
$host = '127.0.0.1';
$port = 3306;
$database = 'local';
$username = 'root';
$password = 'root';
$table_prefix = 'edc_';

try {
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    echo "<h1>🔍 Investigating Quiz Source</h1>";
    
    // 1. Check ProQuiz master table for quiz structure
    echo "<h2>1. ProQuiz Master Table</h2>";
    $stmt = $pdo->prepare("SELECT * FROM {$table_prefix}learndash_pro_quiz_master WHERE id IN (0, 1, 3, 5, 6, 101) ORDER BY id");
    $stmt->execute();
    $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($quizzes as $quiz) {
        echo "<h3>Quiz ID: {$quiz['id']} - {$quiz['name']}</h3>";
        echo "<p>Questions: {$quiz['question_count']}</p>";
        
        // Get questions for this quiz
        $stmt2 = $pdo->prepare("SELECT * FROM {$table_prefix}learndash_pro_quiz_question WHERE quiz_id = ? LIMIT 5");
        $stmt2->execute([$quiz['id']]);
        $questions = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h4>Sample Questions:</h4>";
        foreach ($questions as $q) {
            echo "<div style='border: 1px solid #ccc; margin: 10px; padding: 10px;'>";
            echo "<strong>Q{$q['id']}:</strong> " . htmlspecialchars($q['question']) . "<br>";
            echo "<strong>Answer Data:</strong> " . htmlspecialchars(substr($q['answer_data'], 0, 200)) . "...<br>";
            echo "<strong>Correct:</strong> " . htmlspecialchars($q['correct_msg']) . "<br>";
            echo "<strong>Incorrect:</strong> " . htmlspecialchars($q['incorrect_msg']) . "<br>";
            echo "</div>";
        }
    }
    
    // 2. Check if quiz data is loaded via AJAX
    echo "<h2>2. WordPress Options for Quiz Loading</h2>";
    $stmt = $pdo->prepare("SELECT option_name, option_value FROM {$table_prefix}options WHERE option_name LIKE '%quiz%' OR option_name LIKE '%learndash%' LIMIT 10");
    $stmt->execute();
    $options = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($options as $option) {
        echo "<strong>{$option['option_name']}:</strong> " . htmlspecialchars(substr($option['option_value'], 0, 100)) . "...<br>";
    }
    
    // 3. Check for quiz question with specific text we see in browser
    echo "<h2>3. Search for Specific Question Text</h2>";
    $search_terms = [
        'קו הפרדה רצוף',
        'פירוש הסימון',
        'על פני הדרך'
    ];
    
    foreach ($search_terms as $term) {
        echo "<h4>Searching for: {$term}</h4>";
        
        // Search in pro_quiz_question table
        $stmt = $pdo->prepare("SELECT id, quiz_id, question FROM {$table_prefix}learndash_pro_quiz_question WHERE question LIKE ?");
        $stmt->execute(["%{$term}%"]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($results) {
            foreach ($results as $result) {
                echo "Found in quiz_id {$result['quiz_id']}, question_id {$result['id']}: " . htmlspecialchars($result['question']) . "<br>";
            }
        } else {
            echo "Not found in pro_quiz_question table<br>";
        }
        
        // Search in WordPress posts
        $stmt = $pdo->prepare("SELECT ID, post_title, post_content FROM {$table_prefix}posts WHERE (post_title LIKE ? OR post_content LIKE ?) AND post_type = 'sfwd-question'");
        $stmt->execute(["%{$term}%", "%{$term}%"]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($results) {
            foreach ($results as $result) {
                echo "Found in WordPress post {$result['ID']}: " . htmlspecialchars($result['post_title']) . "<br>";
            }
        } else {
            echo "Not found in WordPress posts<br>";
        }
    }
    
    // 4. Check how LearnDash quiz 11702 connects to ProQuiz
    echo "<h2>4. LearnDash Quiz 11702 Connection</h2>";
    $stmt = $pdo->prepare("SELECT * FROM {$table_prefix}postmeta WHERE post_id = 11702");
    $stmt->execute();
    $meta = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($meta as $m) {
        if (strpos($m['meta_key'], 'quiz') !== false || strpos($m['meta_key'], 'pro') !== false) {
            echo "<strong>{$m['meta_key']}:</strong> " . htmlspecialchars($m['meta_value']) . "<br>";
        }
    }
    
    // 5. Check if quiz questions are loaded dynamically via JavaScript/AJAX
    echo "<h2>5. Dynamic Loading Investigation</h2>";
    
    // Check for AJAX endpoints
    $stmt = $pdo->prepare("SELECT option_value FROM {$table_prefix}options WHERE option_name = 'home'");
    $stmt->execute();
    $home_url = $stmt->fetchColumn();
    
    echo "<p>WordPress AJAX URL: {$home_url}/wp-admin/admin-ajax.php</p>";
    
    // Check for quiz-related AJAX actions
    $stmt = $pdo->prepare("SELECT option_name, option_value FROM {$table_prefix}options WHERE option_name LIKE '%ajax%' OR option_value LIKE '%quiz%'");
    $stmt->execute();
    $ajax_options = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($ajax_options as $option) {
        echo "<strong>{$option['option_name']}:</strong> " . htmlspecialchars(substr($option['option_value'], 0, 200)) . "...<br>";
    }
    
    // 6. Check ProQuiz question answer structure
    echo "<h2>6. ProQuiz Answer Structure Analysis</h2>";
    $stmt = $pdo->prepare("SELECT id, quiz_id, question, answer_data FROM {$table_prefix}learndash_pro_quiz_question WHERE quiz_id = 0 LIMIT 3");
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($questions as $q) {
        echo "<h4>Question {$q['id']} Analysis</h4>";
        echo "<strong>Question:</strong> " . htmlspecialchars($q['question']) . "<br>";
        
        // Try to decode answer_data
        $answer_data = $q['answer_data'];
        if ($answer_data) {
            // Try unserialize
            $unserialized = @unserialize($answer_data);
            if ($unserialized !== false) {
                echo "<strong>Unserialized Answer Data:</strong><br>";
                echo "<pre>" . print_r($unserialized, true) . "</pre>";
            } else {
                // Try JSON decode
                $json_decoded = json_decode($answer_data, true);
                if ($json_decoded !== null) {
                    echo "<strong>JSON Answer Data:</strong><br>";
                    echo "<pre>" . print_r($json_decoded, true) . "</pre>";
                } else {
                    echo "<strong>Raw Answer Data:</strong> " . htmlspecialchars(substr($answer_data, 0, 500)) . "...<br>";
                }
            }
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
