<?php
/**
 * Quiz Answer Diagnostic Tool
 * Directly queries ProQuiz database to check answer data
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

function lilac_diagnose_quiz_answers($quiz_id = null) {
    global $wpdb;
    
    // Get quiz ID from URL if not provided
    if (!$quiz_id && isset($_GET['quiz_id'])) {
        $quiz_id = intval($_GET['quiz_id']);
    }
    
    echo "<h2>Quiz Answer Diagnostic Tool</h2>";
    
    if (!$quiz_id) {
        echo "<p>Please provide a quiz_id parameter in the URL: ?quiz_id=123</p>";
        echo "<p><strong>Available Quiz IDs to try:</strong></p>";
        echo "<ul>";
        echo "<li><a href='?lilac_diagnostic=1&quiz_id=94'>Quiz ID 94</a></li>";
        echo "<li><a href='?lilac_diagnostic=1&quiz_id=97'>Quiz ID 97</a></li>";
        echo "<li><a href='?lilac_diagnostic=1&quiz_id=98'>Quiz ID 98</a></li>";
        echo "<li><a href='?lilac_diagnostic=1&quiz_id=6'>Quiz ID 6</a></li>";
        echo "<li><a href='?lilac_diagnostic=1&quiz_id=5'>Quiz ID 5</a></li>";
        echo "</ul>";
        return;
    }
    
    echo "<h3>Checking Quiz ID: $quiz_id</h3>";
    
    // First, let's see what tables exist
    echo "<h4>Available ProQuiz Tables:</h4>";
    $all_tables = $wpdb->get_results("SHOW TABLES LIKE '%pro_quiz%'", ARRAY_N);
    if ($all_tables) {
        foreach ($all_tables as $table) {
            echo "<p>- {$table[0]}</p>";
        }
    } else {
        echo "<p>No ProQuiz tables found</p>";
    }
    
    // Check multiple possible table names
    $possible_tables = [
        $wpdb->prefix . 'learndash_pro_quiz_question',
        $wpdb->prefix . 'wp_pro_quiz_question',
        $wpdb->prefix . 'pro_quiz_question', 
        'wp_pro_quiz_question',
        'pro_quiz_question'
    ];
    
    foreach ($possible_tables as $table) {
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
        if ($table_exists) {
            echo "<h4>Found table: $table</h4>";
            
            // First show all quiz IDs in this table
            $all_quiz_ids = $wpdb->get_results("SELECT DISTINCT quiz_id FROM $table ORDER BY quiz_id");
            if ($all_quiz_ids) {
                echo "<p><strong>Available Quiz IDs in this table:</strong> ";
                $ids = array_map(function($row) { return $row->quiz_id; }, $all_quiz_ids);
                echo implode(', ', $ids) . "</p>";
            }
            
            // Get questions for this quiz - get ALL columns to see what's available
            $questions = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $table WHERE quiz_id = %d ORDER BY sort ASC LIMIT 1",
                $quiz_id
            ));
            
            if ($questions) {
                echo "<p>Found " . count($questions) . " questions</p>";
                echo "<p><strong>Showing first question only for detailed analysis:</strong></p>";
                
                $question = $questions[0]; // Just show first question
                echo "<div style='border: 1px solid #ccc; margin: 10px; padding: 10px;'>";
                echo "<h5>Question ID: {$question->id}</h5>";
                echo "<p><strong>Question:</strong> " . wp_strip_all_tags(substr($question->question, 0, 200)) . "...</p>";
                
                // Show ALL database columns for this question
                echo "<h6>All Database Columns:</h6>";
                foreach ($question as $column => $value) {
                    $display_value = is_string($value) ? substr($value, 0, 100) : print_r($value, true);
                    echo "<p><strong>$column:</strong> " . htmlspecialchars($display_value) . "</p>";
                }
                
                // Check for all quiz-related tables that might contain answers
                echo "<h6>Checking for quiz-related tables:</h6>";
                $quiz_tables = $wpdb->get_results("SHOW TABLES LIKE '%quiz%'", ARRAY_N);
                foreach ($quiz_tables as $table_row) {
                    $table_name = $table_row[0];
                    echo "<p><strong>Table:</strong> $table_name</p>";
                    
                    // Check table structure
                    $columns = $wpdb->get_results("DESCRIBE $table_name");
                    $column_names = array_map(function($col) { return $col->Field; }, $columns);
                    
                    // Look for question_id or answer-related columns
                    if (in_array('question_id', $column_names) || 
                        array_intersect(['answer', 'correct', 'option'], $column_names)) {
                        
                        echo "<p>Columns: " . implode(', ', $column_names) . "</p>";
                        
                        // Try to find data for our question
                        $sample_data = null;
                        if (in_array('question_id', $column_names)) {
                            $sample_data = $wpdb->get_results($wpdb->prepare(
                                "SELECT * FROM $table_name WHERE question_id = %d LIMIT 3",
                                $question->id
                            ));
                        }
                        
                        if ($sample_data) {
                            echo "<p><strong>Found " . count($sample_data) . " records for question {$question->id}:</strong></p>";
                            foreach ($sample_data as $record) {
                                echo "<pre>" . print_r($record, true) . "</pre>";
                            }
                        } else {
                            echo "<p>No data found for question {$question->id}</p>";
                        }
                    }
                }
                
                // Also check if there's a WordPress post that corresponds to this question
                echo "<h6>Checking WordPress posts for question data:</h6>";
                $post_data = $wpdb->get_results($wpdb->prepare(
                    "SELECT p.*, pm.meta_key, pm.meta_value 
                     FROM {$wpdb->posts} p 
                     LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id 
                     WHERE p.post_type = 'sfwd-question' 
                     AND (pm.meta_key LIKE '%answer%' OR pm.meta_key LIKE '%correct%' OR pm.meta_key LIKE '%quiz%')
                     LIMIT 10"
                ));
                
                if ($post_data) {
                    echo "<p><strong>Found LearnDash question posts with answer metadata:</strong></p>";
                    foreach ($post_data as $post) {
                        echo "<p>Post ID: {$post->ID}, Meta: {$post->meta_key} = " . substr($post->meta_value, 0, 100) . "</p>";
                    }
                } else {
                    echo "<p>No LearnDash question posts found</p>";
                }
                
                echo "</div>";
            } else {
                echo "<p>No questions found for quiz ID $quiz_id in table $table</p>";
            }
            break; // Stop after finding the first valid table
        }
    }
}

// Add admin page for diagnostics
add_action('admin_menu', function() {
    add_management_page(
        'Quiz Answer Diagnostic',
        'Quiz Answer Diagnostic', 
        'manage_options',
        'quiz-answer-diagnostic',
        function() {
            echo '<div class="wrap">';
            lilac_diagnose_quiz_answers();
            echo '</div>';
        }
    );
});

// Alternative: Add diagnostic to existing quiz debug
add_action('wp_ajax_lilac_quiz_diagnostic', function() {
    if (!current_user_can('manage_options')) {
        wp_die('Insufficient permissions');
    }
    
    $quiz_id = intval($_GET['quiz_id'] ?? 0);
    if (!$quiz_id) {
        wp_die('Quiz ID required');
    }
    
    ob_start();
    lilac_diagnose_quiz_answers($quiz_id);
    $output = ob_get_clean();
    
    echo $output;
    wp_die();
});

// Simple URL-based diagnostic (for testing)
add_action('init', function() {
    if (isset($_GET['lilac_diagnostic']) && current_user_can('manage_options')) {
        $quiz_id = intval($_GET['quiz_id'] ?? 0);
        if ($quiz_id) {
            echo '<html><head><title>Quiz Diagnostic</title></head><body>';
            lilac_diagnose_quiz_answers($quiz_id);
            echo '</body></html>';
            exit;
        }
    }
});
