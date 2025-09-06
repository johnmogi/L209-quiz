<?php
// Test actual database to verify quiz answer detection
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
    
    echo "<h1>🔍 Testing Actual Database for Quiz Answer Detection</h1>";
    
    // First, find the specific question about beer vs whiskey that's currently showing
    echo "<h2>1. Searching for Beer vs Whiskey Question</h2>";
    
    $search_terms = ['בירה', 'ויסקי', 'השפעתה של פחית'];
    
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
        
        if (!empty($questions)) {
            echo "<p>Found " . count($questions) . " questions with '{$term}'</p>";
            
            foreach ($questions as $q) {
                echo "<div style='border: 2px solid #007cba; padding: 15px; margin: 10px 0;'>";
                echo "<h4>🎯 Question ID: {$q['id']} (Quiz: {$q['quiz_id']})</h4>";
                
                $question_text = strip_tags($q['question']);
                echo "<p><strong>Question:</strong> {$question_text}</p>";
                
                // Parse and display answers
                $answer_data = unserialize($q['answer_data']);
                if (is_array($answer_data)) {
                    echo "<p><strong>Answer Options:</strong></p>";
                    foreach ($answer_data as $index => $answer) {
                        $is_correct = (isset($answer['correct']) && $answer['correct'] == 1) ? ' ✅ CORRECT' : '';
                        $answer_text = strip_tags($answer['answer']);
                        echo "<div style='margin: 5px 0; padding: 5px; background: " . 
                             ($is_correct ? '#e8f5e8' : '#f5f5f5') . ";'>";
                        echo "<strong>Option {$index}:</strong> {$answer_text}{$is_correct}";
                        echo "</div>";
                    }
                } else {
                    echo "<p>❌ Could not parse answer data</p>";
                }
                echo "</div>";
            }
        } else {
            echo "<p>No questions found with '{$term}'</p>";
        }
    }
    
    // Test the exact question text from the browser
    echo "<h2>2. Testing Exact Question Text</h2>";
    $exact_question = "האם השפעתה של פחית בירה על הנהג פחותה מהשפעתה של כוסית ויסקי";
    
    $stmt = $pdo->prepare("
        SELECT id, quiz_id, question, answer_type, answer_data 
        FROM {$table_prefix}learndash_pro_quiz_question 
        WHERE question LIKE ? 
        LIMIT 3
    ");
    $stmt->execute(["%{$exact_question}%"]);
    $exact_matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($exact_matches)) {
        echo "<p>✅ Found exact matches: " . count($exact_matches) . "</p>";
        
        foreach ($exact_matches as $q) {
            echo "<div style='border: 3px solid #28a745; padding: 15px; margin: 10px 0;'>";
            echo "<h4>🎯 EXACT MATCH - Question ID: {$q['id']} (Quiz: {$q['quiz_id']})</h4>";
            
            $question_text = strip_tags($q['question']);
            echo "<p><strong>Full Question:</strong> {$question_text}</p>";
            
            $answer_data = unserialize($q['answer_data']);
            if (is_array($answer_data)) {
                echo "<p><strong>Correct Answer Analysis:</strong></p>";
                foreach ($answer_data as $index => $answer) {
                    $is_correct = (isset($answer['correct']) && $answer['correct'] == 1) ? ' ✅ CORRECT' : '';
                    $answer_text = strip_tags($answer['answer']);
                    
                    echo "<div style='margin: 5px 0; padding: 8px; border: 1px solid " . 
                         ($is_correct ? '#28a745' : '#ddd') . "; background: " . 
                         ($is_correct ? '#d4edda' : '#f8f9fa') . ";'>";
                    echo "<strong>Option {$index}:</strong> {$answer_text}{$is_correct}";
                    echo "</div>";
                }
            }
            echo "</div>";
        }
    } else {
        echo "<p>❌ No exact matches found</p>";
    }
    
    // Test what quiz IDs actually have questions and their content
    echo "<h2>3. Quiz IDs with Questions (Top 10)</h2>";
    $stmt = $pdo->prepare("
        SELECT quiz_id, COUNT(*) as question_count,
               GROUP_CONCAT(SUBSTRING(question, 1, 50) SEPARATOR ' | ') as sample_questions
        FROM {$table_prefix}learndash_pro_quiz_question 
        GROUP BY quiz_id 
        ORDER BY question_count DESC
        LIMIT 10
    ");
    $stmt->execute();
    $quiz_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($quiz_stats as $stat) {
        echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 5px 0;'>";
        echo "<h4>Quiz ID {$stat['quiz_id']}: {$stat['question_count']} questions</h4>";
        echo "<p><strong>Sample questions:</strong> " . mb_substr($stat['sample_questions'], 0, 200) . "...</p>";
        echo "</div>";
    }
    
    // Test the current answer fetcher logic
    echo "<h2>4. Testing Answer Fetcher Logic</h2>";
    
    // Show raw data from quiz ID 0 to check encoding
    $stmt = $pdo->prepare("
        SELECT id, question, answer_data, HEX(question) as hex_question
        FROM {$table_prefix}learndash_pro_quiz_question 
        WHERE quiz_id = 0 
        ORDER BY id ASC
        LIMIT 10
    ");
    $stmt->execute();
    $raw_results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Raw Data from Quiz ID 0 (First 10 questions)</h3>";
    foreach ($raw_results as $q) {
        echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 5px 0;'>";
        echo "<h4>Question ID: {$q['id']}</h4>";
        echo "<p><strong>Raw Question:</strong> {$q['question']}</p>";
        echo "<p><strong>Hex Data:</strong> " . substr($q['hex_question'], 0, 100) . "...</p>";
        
        // Try to decode if it's base64 or other encoding
        $decoded = base64_decode($q['question'], true);
        if ($decoded !== false) {
            echo "<p><strong>Base64 Decoded:</strong> {$decoded}</p>";
        }
        
        // Check if it's URL encoded
        $url_decoded = urldecode($q['question']);
        if ($url_decoded !== $q['question']) {
            echo "<p><strong>URL Decoded:</strong> {$url_decoded}</p>";
        }
        
        echo "</div>";
    }
    
    // Check database charset and collation
    echo "<h2>5. Database Charset Information</h2>";
    $stmt = $pdo->prepare("SHOW TABLE STATUS LIKE '{$table_prefix}learndash_pro_quiz_question'");
    $stmt->execute();
    $table_info = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($table_info) {
        echo "<p><strong>Table Collation:</strong> {$table_info['Collation']}</p>";
    }
    
    $stmt = $pdo->prepare("SHOW FULL COLUMNS FROM {$table_prefix}learndash_pro_quiz_question WHERE Field = 'question'");
    $stmt->execute();
    $column_info = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($column_info) {
        echo "<p><strong>Question Column Collation:</strong> {$column_info['Collation']}</p>";
    }
    
    // Test if questions are stored in a different table or format
    echo "<h2>6. Alternative Question Sources</h2>";
    
    // Check WordPress posts table for quiz content
    $stmt = $pdo->prepare("
        SELECT ID, post_title, post_content, post_type 
        FROM {$table_prefix}posts 
        WHERE post_type = 'sfwd-quiz' 
        AND (post_title LIKE '%בירה%' OR post_content LIKE '%בירה%' OR post_title LIKE '%ויסקי%' OR post_content LIKE '%ויסקי%')
        LIMIT 5
    ");
    $stmt->execute();
    $wp_quiz_posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($wp_quiz_posts)) {
        echo "<p>✅ Found quiz posts in WordPress posts table</p>";
        foreach ($wp_quiz_posts as $post) {
            echo "<div style='border: 2px solid #28a745; padding: 15px; margin: 10px 0;'>";
            echo "<h4>WordPress Quiz Post ID: {$post['ID']}</h4>";
            echo "<p><strong>Title:</strong> {$post['post_title']}</p>";
            echo "<p><strong>Content:</strong> " . substr($post['post_content'], 0, 200) . "...</p>";
            echo "</div>";
        }
    } else {
        echo "<p>❌ No quiz posts found in WordPress posts table</p>";
    }
    
} catch (PDOException $e) {
    echo "<h1>❌ Database Error</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
