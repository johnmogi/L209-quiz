<?php
/**
 * Quiz Debug Display - Print quiz data to footer
 * Shows quiz questions, answers, and highlights correct answers
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

function lilac_get_quiz_data($quiz_id = 1) {
    global $wpdb;
    
    // Get quiz questions and their answer data
    $questions = $wpdb->get_results($wpdb->prepare("
        SELECT 
            q.id as question_id,
            q.quiz_id,
            q.question,
            q.answer_data,
            q.answer_type,
            CASE 
                WHEN q.answer_data LIKE '%\"_correct\";b:1%' THEN 'Has correct answer'
                WHEN q.answer_data = '0' THEN 'Invalid data'
                WHEN q.answer_data = 'a:0:{}' THEN 'Empty data'
                ELSE 'No correct answer marked'
            END as answer_status
        FROM 
            {$wpdb->prefix}learndash_pro_quiz_question q
        WHERE 
            q.quiz_id = %d
        ORDER BY q.sort, q.id
        LIMIT 10
    ", $quiz_id));
    
    return $questions;
}

function lilac_parse_answer_data($answer_data) {
    if ($answer_data === '0' || $answer_data === 'a:0:{}') {
        return ['error' => 'Invalid answer data'];
    }
    
    // Unserialize the answer data
    $answers = @unserialize($answer_data);
    if ($answers === false) {
        return ['error' => 'Could not parse answer data'];
    }
    
    $parsed_answers = [];
    
    if (is_array($answers)) {
        foreach ($answers as $index => $answer_obj) {
            if (is_object($answer_obj)) {
                $answer_text = '';
                $is_correct = false;
                
                try {
                    // Use reflection to access protected properties safely
                    try {
                        $reflection = new ReflectionObject($answer_obj);
                        
                        // Try to get _answer property
                        if ($reflection->hasProperty('_answer')) {
                            $answerProp = $reflection->getProperty('_answer');
                            $answerProp->setAccessible(true);
                            $answer_text = $answerProp->getValue($answer_obj);
                        }
                        
                        // Try to get _correct property
                        if ($reflection->hasProperty('_correct')) {
                            $correctProp = $reflection->getProperty('_correct');
                            $correctProp->setAccessible(true);
                            $is_correct = $correctProp->getValue($answer_obj);
                        }
                    } catch (ReflectionException $re) {
                        // Skip reflection if it fails
                        continue;
                    }
                    
                } catch (Exception $e) {
                    // Fallback: parse the original serialized string directly
                    // Extract answer text using regex from the original data
                    if (preg_match('/s:10:".*?_answer";s:\d+:"([^"]*)"/', $answer_data, $matches)) {
                        $answer_text = $matches[1];
                    }
                    
                    // Extract correct flag using regex
                    if (preg_match('/s:11:".*?_correct";b:([01])/', $answer_data, $matches)) {
                        $is_correct = ($matches[1] === '1');
                    }
                    
                    // If still no text, try a simpler approach
                    if (empty($answer_text)) {
                        $answer_text = "Answer " . ($index + 1) . " (parsing failed)";
                    }
                }
                
                if (empty($answer_text)) {
                    $answer_text = 'Could not extract answer text';
                }
                
                $parsed_answers[] = [
                    'index' => $index,
                    'text' => $answer_text,
                    'correct' => $is_correct
                ];
            }
        }
    }
    
    return $parsed_answers;
}

function lilac_display_quiz_debug($quiz_id = 1) {
    $questions = lilac_get_quiz_data($quiz_id);
    
    echo '<div style="
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #000;
        color: #00ff00;
        font-family: monospace;
        font-size: 11px;
        padding: 15px;
        z-index: 9999;
        max-height: 300px;
        overflow-y: auto;
        border-top: 2px solid #00ff00;
        direction: ltr;
        text-align: left;
    ">';
    
    echo '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">';
    echo '<strong style="color: #ffff00;">LILAC QUIZ DEBUG - Quiz ID: ' . $quiz_id . '</strong>';
    echo '<button onclick="this.parentElement.parentElement.style.display=\'none\'" style="background: #ff0000; color: white; border: none; padding: 2px 8px; cursor: pointer;">×</button>';
    echo '</div>';
    
    if (empty($questions)) {
        echo '<div style="color: #ff0000;">No questions found for quiz ID: ' . $quiz_id . '</div>';
        echo '</div>';
        return;
    }
    
    echo '<div>Found ' . count($questions) . ' questions:</div><br>';
    
    foreach ($questions as $question) {
        echo '<div style="margin-bottom: 15px; border: 1px solid #333; padding: 10px; background: #111;">';
        echo '<div style="color: #ffff00; font-weight: bold;">Question ID: ' . $question->question_id . '</div>';
        echo '<div style="color: #ccc; margin: 5px 0;">Type: ' . $question->answer_type . '</div>';
        echo '<div style="color: #ccc; margin: 5px 0;">Status: ' . $question->answer_status . '</div>';
        echo '<div style="color: #fff; margin: 5px 0;">Question: ' . strip_tags($question->question) . '</div>';
        
        // Show raw answer data for debugging
        echo '<div style="color: #888; margin: 5px 0; font-size: 10px;">Raw Data: ' . htmlspecialchars(substr($question->answer_data, 0, 200)) . '...</div>';
        
        // Parse and display answers
        $answers = lilac_parse_answer_data($question->answer_data);
        
        if (isset($answers['error'])) {
            echo '<div style="color: #ff0000;">Error: ' . $answers['error'] . '</div>';
        } else {
            echo '<div style="color: #00ffff; margin: 5px 0;">Answers:</div>';
            foreach ($answers as $answer) {
                $color = $answer['correct'] ? '#00ff00' : '#fff';
                $marker = $answer['correct'] ? ' ✓ CORRECT' : '';
                echo '<div style="color: ' . $color . '; margin-left: 20px;">';
                echo ($answer['index'] + 1) . '. ' . htmlspecialchars($answer['text']) . $marker;
                echo '</div>';
            }
        }
        
        echo '</div>';
    }
    
    echo '</div>';
}

// Hook to display debug info in footer
add_action('wp_footer', function() {
    // Only show on quiz pages or when debug parameter is present
    if (isset($_GET['quiz_debug']) || is_singular('sfwd-quiz')) {
        $quiz_id = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 1;
        lilac_display_quiz_debug($quiz_id);
    }
});

// Add admin menu for testing
add_action('admin_menu', function() {
    add_submenu_page(
        'tools.php',
        'Quiz Debug',
        'Quiz Debug',
        'manage_options',
        'quiz-debug',
        function() {
            $quiz_id = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 1;
            echo '<div class="wrap">';
            echo '<h1>Quiz Debug - Quiz ID: ' . $quiz_id . '</h1>';
            echo '<form method="get">';
            echo '<input type="hidden" name="page" value="quiz-debug">';
            echo '<label>Quiz ID: <input type="number" name="quiz_id" value="' . $quiz_id . '" min="1"></label>';
            echo '<input type="submit" value="Load Quiz" class="button-primary">';
            echo '</form>';
            echo '<hr>';
            
            $questions = lilac_get_quiz_data($quiz_id);
            if ($questions) {
                echo '<h2>Quiz Data:</h2>';
                echo '<pre style="background: #f0f0f0; padding: 15px; overflow: auto; max-height: 500px;">';
                foreach ($questions as $question) {
                    echo "Question ID: " . $question->question_id . "\n";
                    echo "Question: " . strip_tags($question->question) . "\n";
                    echo "Answer Status: " . $question->answer_status . "\n";
                    
                    $answers = lilac_parse_answer_data($question->answer_data);
                    if (isset($answers['error'])) {
                        echo "Error: " . $answers['error'] . "\n";
                    } else {
                        echo "Answers:\n";
                        foreach ($answers as $answer) {
                            $marker = $answer['correct'] ? ' *** CORRECT ***' : '';
                            echo "  " . ($answer['index'] + 1) . ". " . $answer['text'] . $marker . "\n";
                        }
                    }
                    echo "\n" . str_repeat("-", 50) . "\n\n";
                }
                echo '</pre>';
            } else {
                echo '<p>No questions found for quiz ID: ' . $quiz_id . '</p>';
            }
            echo '</div>';
        }
    );
});
?>
