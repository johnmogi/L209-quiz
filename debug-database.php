<?php
/**
 * Database Diagnostic Script for Quiz Debugger
 * Run this to investigate the backend database structure
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    // Allow direct access for debugging
    require_once('../../../wp-config.php');
}

global $wpdb;

echo "<h2>Quiz Database Diagnostic</h2>\n";
echo "<pre>\n";

// 1. Show all quiz-related tables
echo "=== QUIZ TABLES ===\n";
$tables = $wpdb->get_results("SHOW TABLES LIKE '%quiz%'");
foreach ($tables as $table) {
    $table_name = array_values((array)$table)[0];
    echo "Found table: $table_name\n";
}

// 2. Check LearnDash Pro Quiz tables specifically
$possible_tables = [
    $wpdb->prefix . 'learndash_pro_quiz_question',
    $wpdb->prefix . 'pro_quiz_question',
    $wpdb->prefix . 'wp_pro_quiz_question'
];

echo "\n=== CHECKING SPECIFIC QUIZ TABLES ===\n";
foreach ($possible_tables as $table) {
    $exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
    if ($exists) {
        echo "✓ Table exists: $table\n";
        
        // Show table structure
        $structure = $wpdb->get_results("DESCRIBE $table");
        echo "  Columns: ";
        foreach ($structure as $col) {
            echo $col->Field . " ";
        }
        echo "\n";
        
        // Count records
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
        echo "  Record count: $count\n";
        
        // Show sample records for quiz_id 101
        echo "  Sample records for quiz_id 101:\n";
        $samples = $wpdb->get_results($wpdb->prepare(
            "SELECT id, quiz_id, question, answer_type FROM $table WHERE quiz_id = %d LIMIT 3",
            101
        ));
        foreach ($samples as $sample) {
            echo "    ID:{$sample->id} Quiz:{$sample->quiz_id} Type:{$sample->answer_type} Question:" . substr(strip_tags($sample->question), 0, 50) . "...\n";
        }
        
        // Check for post_id 11702 mapping
        echo "  Checking for post_id 11702 mapping:\n";
        $post_samples = $wpdb->get_results($wpdb->prepare(
            "SELECT id, quiz_id, question FROM $table WHERE quiz_id IN (SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key LIKE '%quiz%') LIMIT 3",
            11702
        ));
        foreach ($post_samples as $sample) {
            echo "    Found via post mapping - ID:{$sample->id} Quiz:{$sample->quiz_id}\n";
        }
        
    } else {
        echo "✗ Table not found: $table\n";
    }
}

// 3. Check post meta for quiz mapping
echo "\n=== POST META QUIZ MAPPING ===\n";
$quiz_meta = $wpdb->get_results($wpdb->prepare(
    "SELECT meta_key, meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key LIKE '%quiz%'",
    11702
));

if ($quiz_meta) {
    foreach ($quiz_meta as $meta) {
        echo "Post 11702 -> {$meta->meta_key}: {$meta->meta_value}\n";
    }
} else {
    echo "No quiz meta found for post 11702\n";
}

// 4. Check for quiz with ID 101 in any table
echo "\n=== SEARCHING FOR QUIZ ID 101 ===\n";
foreach ($possible_tables as $table) {
    $exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
    if ($exists) {
        $quiz_questions = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE quiz_id = %d LIMIT 1",
            101
        ));
        
        if ($quiz_questions) {
            $question = $quiz_questions[0];
            echo "Found quiz 101 in $table:\n";
            echo "  Question ID: {$question->id}\n";
            echo "  Question: " . substr(strip_tags($question->question), 0, 100) . "...\n";
            echo "  Answer Type: {$question->answer_type}\n";
            echo "  Answer Data Length: " . strlen($question->answer_data ?? '') . " bytes\n";
            
            // Try to unserialize answer data
            if (!empty($question->answer_data)) {
                $answer_data = @unserialize($question->answer_data);
                if ($answer_data && is_array($answer_data)) {
                    echo "  Answer Data: Successfully unserialized, " . count($answer_data) . " answers\n";
                    
                    // Show first answer structure
                    if (count($answer_data) > 0) {
                        $first_answer = $answer_data[0];
                        echo "  First Answer Type: " . gettype($first_answer) . "\n";
                        if (is_object($first_answer)) {
                            echo "  First Answer Class: " . get_class($first_answer) . "\n";
                            echo "  First Answer Properties: " . implode(', ', array_keys(get_object_vars($first_answer))) . "\n";
                        }
                    }
                } else {
                    echo "  Answer Data: Failed to unserialize or not array\n";
                    echo "  Raw data preview: " . substr($question->answer_data, 0, 200) . "...\n";
                }
            }
        } else {
            echo "No questions found for quiz_id 101 in $table\n";
        }
    }
}

echo "\n=== DIAGNOSTIC COMPLETE ===\n";
echo "</pre>";
?>
