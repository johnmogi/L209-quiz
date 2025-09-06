<?php
// Find the actual source of quiz questions
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
    
    echo "<h1>🔍 Finding Actual Quiz Question Source</h1>";
    
    // Check all tables that might contain quiz data
    echo "<h2>1. All Tables with 'quiz' in name</h2>";
    $stmt = $pdo->prepare("SHOW TABLES LIKE '%quiz%'");
    $stmt->execute();
    $quiz_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($quiz_tables as $table) {
        echo "<h3>Table: {$table}</h3>";
        
        // Get table structure
        $stmt = $pdo->prepare("DESCRIBE {$table}");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<p>Columns: ";
        foreach ($columns as $col) {
            echo "{$col['Field']} ({$col['Type']}), ";
        }
        echo "</p>";
        
        // Sample data
        $stmt = $pdo->prepare("SELECT * FROM {$table} LIMIT 3");
        $stmt->execute();
        $sample_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($sample_data)) {
            echo "<p>Sample data:</p>";
            foreach ($sample_data as $row) {
                echo "<div style='border: 1px solid #ddd; padding: 5px; margin: 5px 0; font-size: 12px;'>";
                foreach ($row as $key => $value) {
                    $display_value = is_string($value) ? substr($value, 0, 100) : $value;
                    echo "<strong>{$key}:</strong> {$display_value}<br>";
                }
                echo "</div>";
            }
        }
    }
    
    // Check WordPress postmeta for quiz data
    echo "<h2>2. WordPress Postmeta for Quiz 11702</h2>";
    $stmt = $pdo->prepare("
        SELECT meta_key, meta_value 
        FROM {$table_prefix}postmeta 
        WHERE post_id = 11702
        ORDER BY meta_key
    ");
    $stmt->execute();
    $quiz_meta = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($quiz_meta as $meta) {
        echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 5px 0;'>";
        echo "<strong>{$meta['meta_key']}:</strong><br>";
        echo "<pre>" . substr($meta['meta_value'], 0, 500) . "</pre>";
        echo "</div>";
    }
    
    // Check for ProQuiz master table
    echo "<h2>3. ProQuiz Master Table</h2>";
    $master_table = $table_prefix . 'learndash_pro_quiz_master';
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM {$master_table} LIMIT 5");
        $stmt->execute();
        $master_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($master_data as $quiz) {
            echo "<div style='border: 2px solid #007cba; padding: 15px; margin: 10px 0;'>";
            echo "<h4>Quiz ID: {$quiz['id']}</h4>";
            foreach ($quiz as $key => $value) {
                if (is_string($value) && strlen($value) > 50) {
                    $value = substr($value, 0, 100) . "...";
                }
                echo "<p><strong>{$key}:</strong> {$value}</p>";
            }
            echo "</div>";
        }
    } catch (Exception $e) {
        echo "<p>Master table not found or error: " . $e->getMessage() . "</p>";
    }
    
    // Check options table for quiz settings
    echo "<h2>4. WordPress Options for Quiz</h2>";
    $stmt = $pdo->prepare("
        SELECT option_name, option_value 
        FROM {$table_prefix}options 
        WHERE option_name LIKE '%quiz%' 
        OR option_name LIKE '%learndash%'
        LIMIT 10
    ");
    $stmt->execute();
    $quiz_options = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($quiz_options as $option) {
        echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 5px 0;'>";
        echo "<strong>{$option['option_name']}:</strong><br>";
        echo "<pre>" . substr($option['option_value'], 0, 300) . "</pre>";
        echo "</div>";
    }
    
    // Search for any table containing Hebrew text
    echo "<h2>5. Tables with Hebrew Content</h2>";
    
    $all_tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($all_tables as $table) {
        try {
            // Get text columns
            $columns_stmt = $pdo->prepare("
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = ? 
                AND DATA_TYPE IN ('text', 'longtext', 'mediumtext', 'varchar')
            ");
            $columns_stmt->execute([$database, $table]);
            $text_columns = $columns_stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (!empty($text_columns)) {
                foreach ($text_columns as $column) {
                    $search_stmt = $pdo->prepare("
                        SELECT * FROM {$table} 
                        WHERE {$column} LIKE '%בירה%' 
                        OR {$column} LIKE '%ויסקי%'
                        OR {$column} LIKE '%השפעתה%'
                        LIMIT 2
                    ");
                    $search_stmt->execute();
                    $hebrew_results = $search_stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    if (!empty($hebrew_results)) {
                        echo "<h3>✅ Found Hebrew in {$table}.{$column}</h3>";
                        foreach ($hebrew_results as $result) {
                            echo "<div style='border: 3px solid #28a745; padding: 15px; margin: 10px 0;'>";
                            foreach ($result as $key => $value) {
                                $display_value = is_string($value) ? substr($value, 0, 200) : $value;
                                echo "<p><strong>{$key}:</strong> {$display_value}</p>";
                            }
                            echo "</div>";
                        }
                    }
                }
            }
        } catch (Exception $e) {
            // Skip tables we can't access
            continue;
        }
    }
    
} catch (PDOException $e) {
    echo "<h1>❌ Database Error</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
