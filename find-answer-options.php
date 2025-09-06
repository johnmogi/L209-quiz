<?php
// Find where answer options are actually stored
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
    
    echo "<h1>🔍 Finding Answer Options Storage</h1>";
    
    // Search for the specific answer texts we know from the browser
    $answer_texts = [
        'לא. בירה אינה משקה העלול להשפיע על הנהיגה',
        'כן. בבירה יש יותר אלכוהול מבויסקי', 
        'לא. שתיהן משפיעות במידה שווה',
        'לא. הכמות של הבירה גדולה יותר'
    ];
    
    echo "<h2>1. Searching for Known Answer Texts</h2>";
    
    foreach ($answer_texts as $index => $answer_text) {
        echo "<h3>Searching for answer " . ($index + 1) . ": " . substr($answer_text, 0, 30) . "...</h3>";
        
        // Search in all text columns across all tables
        $tables_to_search = [
            'posts' => ['post_content', 'post_title', 'post_excerpt'],
            'postmeta' => ['meta_value'],
            'options' => ['option_value'],
            'comments' => ['comment_content'],
            'usermeta' => ['meta_value']
        ];
        
        foreach ($tables_to_search as $table => $columns) {
            $full_table = $table_prefix . $table;
            
            foreach ($columns as $column) {
                try {
                    $stmt = $pdo->prepare("
                        SELECT * FROM {$full_table} 
                        WHERE {$column} LIKE ? 
                        LIMIT 3
                    ");
                    $stmt->execute(['%' . $answer_text . '%']);
                    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    if (!empty($results)) {
                        echo "<div style='border: 3px solid #28a745; padding: 15px; margin: 10px 0;'>";
                        echo "<h4>✅ Found in {$full_table}.{$column}</h4>";
                        
                        foreach ($results as $result) {
                            echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 5px 0;'>";
                            foreach ($result as $key => $value) {
                                $display_value = is_string($value) ? substr($value, 0, 200) : $value;
                                echo "<p><strong>{$key}:</strong> {$display_value}</p>";
                            }
                            echo "</div>";
                        }
                        echo "</div>";
                    }
                } catch (Exception $e) {
                    // Skip if column doesn't exist
                    continue;
                }
            }
        }
    }
    
    // Check ACF (Advanced Custom Fields) tables
    echo "<h2>2. Checking ACF Fields</h2>";
    
    // Look for ACF field groups related to questions
    $stmt = $pdo->prepare("
        SELECT post_title, post_content, post_excerpt
        FROM {$table_prefix}posts 
        WHERE post_type = 'acf-field-group'
        AND (post_title LIKE '%question%' OR post_title LIKE '%answer%' OR post_title LIKE '%quiz%')
    ");
    $stmt->execute();
    $acf_groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($acf_groups)) {
        echo "<p>✅ Found ACF field groups:</p>";
        foreach ($acf_groups as $group) {
            echo "<div style='border: 2px solid #007cba; padding: 15px; margin: 10px 0;'>";
            echo "<h4>{$group['post_title']}</h4>";
            echo "<p><strong>Content:</strong> " . substr($group['post_content'], 0, 300) . "</p>";
            echo "</div>";
        }
    }
    
    // Look for ACF fields
    $stmt = $pdo->prepare("
        SELECT post_title, post_content, post_excerpt, post_name
        FROM {$table_prefix}posts 
        WHERE post_type = 'acf-field'
        AND (post_excerpt LIKE '%answer%' OR post_excerpt LIKE '%option%' OR post_name LIKE '%answer%')
    ");
    $stmt->execute();
    $acf_fields = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($acf_fields)) {
        echo "<p>✅ Found ACF answer fields:</p>";
        foreach ($acf_fields as $field) {
            echo "<div style='border: 2px solid #ff6600; padding: 15px; margin: 10px 0;'>";
            echo "<h4>{$field['post_title']} ({$field['post_name']})</h4>";
            echo "<p><strong>Excerpt:</strong> {$field['post_excerpt']}</p>";
            echo "<p><strong>Content:</strong> " . substr($field['post_content'], 0, 200) . "</p>";
            echo "</div>";
        }
    }
    
    // Check for serialized data containing answer options
    echo "<h2>3. Checking Serialized Data</h2>";
    
    $stmt = $pdo->prepare("
        SELECT pm.post_id, pm.meta_key, pm.meta_value, p.post_title
        FROM {$table_prefix}postmeta pm
        JOIN {$table_prefix}posts p ON pm.post_id = p.ID
        WHERE p.ID = 9133
        AND pm.meta_value LIKE 'a:%'
        AND LENGTH(pm.meta_value) > 100
    ");
    $stmt->execute();
    $serialized_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($serialized_data as $data) {
        echo "<div style='border: 2px solid #dc3545; padding: 15px; margin: 10px 0;'>";
        echo "<h4>Post: {$data['post_title']} - Meta Key: {$data['meta_key']}</h4>";
        
        $unserialized = unserialize($data['meta_value']);
        if ($unserialized !== false) {
            echo "<pre>" . print_r($unserialized, true) . "</pre>";
        } else {
            echo "<p>Failed to unserialize</p>";
            echo "<pre>" . substr($data['meta_value'], 0, 500) . "</pre>";
        }
        echo "</div>";
    }
    
    // Check for repeater fields or choice fields
    echo "<h2>4. Checking for Choice/Repeater Fields</h2>";
    
    $stmt = $pdo->prepare("
        SELECT meta_key, meta_value
        FROM {$table_prefix}postmeta 
        WHERE post_id = 9133
        AND (meta_key LIKE '%choice%' OR meta_key LIKE '%option%' OR meta_key LIKE '%_0_%' OR meta_key LIKE '%_1_%')
    ");
    $stmt->execute();
    $choice_fields = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($choice_fields)) {
        echo "<p>✅ Found choice/option fields:</p>";
        foreach ($choice_fields as $field) {
            echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 5px 0;'>";
            echo "<strong>{$field['meta_key']}:</strong> {$field['meta_value']}<br>";
            echo "</div>";
        }
    } else {
        echo "<p>❌ No choice/option fields found</p>";
    }
    
} catch (PDOException $e) {
    echo "<h1>❌ Database Error</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
