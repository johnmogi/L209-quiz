<?php
// Test LearnDash question structure and find answer options
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
    
    echo "<h1>🔍 Testing LearnDash Question Structure</h1>";
    
    // Find the specific beer vs whiskey question
    echo "<h2>1. Beer vs Whiskey Question Details</h2>";
    $stmt = $pdo->prepare("
        SELECT ID, post_title, post_content, post_name, post_modified
        FROM {$table_prefix}posts 
        WHERE post_type = 'sfwd-question'
        AND post_content LIKE '%בירה%'
        AND post_content LIKE '%ויסקי%'
    ");
    $stmt->execute();
    $beer_question = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($beer_question) {
        echo "<div style='border: 3px solid #28a745; padding: 15px; margin: 10px 0;'>";
        echo "<h3>✅ Found Beer vs Whiskey Question</h3>";
        echo "<p><strong>Post ID:</strong> {$beer_question['ID']}</p>";
        echo "<p><strong>Title:</strong> {$beer_question['post_title']}</p>";
        echo "<p><strong>Content:</strong> {$beer_question['post_content']}</p>";
        echo "<p><strong>Last Modified:</strong> {$beer_question['post_modified']}</p>";
        echo "</div>";
        
        $question_id = $beer_question['ID'];
        
        // Get postmeta for this question
        echo "<h2>2. Question Metadata</h2>";
        $stmt = $pdo->prepare("
            SELECT meta_key, meta_value 
            FROM {$table_prefix}postmeta 
            WHERE post_id = ?
            ORDER BY meta_key
        ");
        $stmt->execute([$question_id]);
        $question_meta = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($question_meta as $meta) {
            echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 5px 0;'>";
            echo "<strong>{$meta['meta_key']}:</strong><br>";
            
            // Try to unserialize if it looks like serialized data
            if (substr($meta['meta_value'], 0, 2) === 'a:' || substr($meta['meta_value'], 0, 2) === 'O:') {
                $unserialized = unserialize($meta['meta_value']);
                if ($unserialized !== false) {
                    echo "<pre>" . print_r($unserialized, true) . "</pre>";
                } else {
                    echo "<pre>" . substr($meta['meta_value'], 0, 500) . "</pre>";
                }
            } else {
                echo "<pre>" . substr($meta['meta_value'], 0, 500) . "</pre>";
            }
            echo "</div>";
        }
        
        // Look for answer options in related posts or meta
        echo "<h2>3. Finding Answer Options</h2>";
        
        // Check if answers are stored as child posts
        $stmt = $pdo->prepare("
            SELECT ID, post_title, post_content, post_type
            FROM {$table_prefix}posts 
            WHERE post_parent = ?
            OR (post_type LIKE '%answer%' AND post_content LIKE '%{$question_id}%')
        ");
        $stmt->execute([$question_id]);
        $child_posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($child_posts)) {
            echo "<p>✅ Found related posts:</p>";
            foreach ($child_posts as $child) {
                echo "<div style='border: 2px solid #007cba; padding: 10px; margin: 5px 0;'>";
                echo "<h4>Post ID: {$child['ID']} (Type: {$child['post_type']})</h4>";
                echo "<p><strong>Title:</strong> {$child['post_title']}</p>";
                echo "<p><strong>Content:</strong> {$child['post_content']}</p>";
                echo "</div>";
            }
        } else {
            echo "<p>❌ No child posts found</p>";
        }
        
        // Check for quiz associations
        echo "<h2>4. Quiz Associations</h2>";
        $stmt = $pdo->prepare("
            SELECT p.ID, p.post_title, p.post_type, pm.meta_key, pm.meta_value
            FROM {$table_prefix}posts p
            JOIN {$table_prefix}postmeta pm ON p.ID = pm.post_id
            WHERE p.post_type = 'sfwd-quiz'
            AND (pm.meta_value LIKE '%{$question_id}%' OR pm.meta_value LIKE '%{$beer_question['post_name']}%')
        ");
        $stmt->execute();
        $quiz_associations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($quiz_associations)) {
            echo "<p>✅ Found quiz associations:</p>";
            foreach ($quiz_associations as $assoc) {
                echo "<div style='border: 2px solid #ff6600; padding: 10px; margin: 5px 0;'>";
                echo "<h4>Quiz: {$assoc['post_title']} (ID: {$assoc['ID']})</h4>";
                echo "<p><strong>Meta Key:</strong> {$assoc['meta_key']}</p>";
                echo "<p><strong>Meta Value:</strong> " . substr($assoc['meta_value'], 0, 200) . "...</p>";
                echo "</div>";
            }
        }
        
    } else {
        echo "<p>❌ Beer vs Whiskey question not found in posts table</p>";
    }
    
    // Get all sfwd-question posts to understand structure
    echo "<h2>5. All LearnDash Questions (Sample)</h2>";
    $stmt = $pdo->prepare("
        SELECT ID, post_title, post_content, post_name
        FROM {$table_prefix}posts 
        WHERE post_type = 'sfwd-question'
        ORDER BY post_modified DESC
        LIMIT 10
    ");
    $stmt->execute();
    $all_questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($all_questions as $q) {
        echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 5px 0;'>";
        echo "<h4>Question ID: {$q['ID']}</h4>";
        echo "<p><strong>Title:</strong> {$q['post_title']}</p>";
        echo "<p><strong>Content:</strong> " . substr($q['post_content'], 0, 100) . "...</p>";
        echo "</div>";
    }
    
    // Check for answer patterns in postmeta
    echo "<h2>6. Answer Patterns in Postmeta</h2>";
    $stmt = $pdo->prepare("
        SELECT DISTINCT meta_key, COUNT(*) as count
        FROM {$table_prefix}postmeta pm
        JOIN {$table_prefix}posts p ON pm.post_id = p.ID
        WHERE p.post_type = 'sfwd-question'
        AND (meta_key LIKE '%answer%' OR meta_key LIKE '%option%' OR meta_key LIKE '%choice%')
        GROUP BY meta_key
        ORDER BY count DESC
    ");
    $stmt->execute();
    $answer_patterns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($answer_patterns)) {
        echo "<p>✅ Found answer-related meta keys:</p>";
        foreach ($answer_patterns as $pattern) {
            echo "<p><strong>{$pattern['meta_key']}</strong>: {$pattern['count']} occurrences</p>";
        }
    } else {
        echo "<p>❌ No answer patterns found in postmeta</p>";
    }
    
} catch (PDOException $e) {
    echo "<h1>❌ Database Error</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
