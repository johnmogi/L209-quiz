<?php
/**
 * Quiz Footer Answers Template
 * Displays correct answers directly in the footer
 */

// Debug: Log that template is being loaded
error_log('QUIZ FOOTER: Template loading started');

// Database configuration
$host = '127.0.0.1';
$port = 10074;
$username = 'root';
$password = 'root';
$database = 'local';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    error_log('QUIZ FOOTER: Database connection successful');
    
    // Try to get current quiz ID from global context
    $current_quiz_id = null;
    if (function_exists('get_the_ID')) {
        global $post;
        if ($post && isset($post->ID)) {
            // Try to get quiz ID from post meta or other LearnDash methods
            $current_quiz_id = get_post_meta($post->ID, '_sfwd-quiz', true);
            if (is_array($current_quiz_id) && isset($current_quiz_id['sfwd-quiz_quiz'])) {
                $current_quiz_id = intval($current_quiz_id['sfwd-quiz_quiz']);
            }
        }
    }
    
    $quiz_id = null;
    
    // First, try current quiz if it has questions
    if ($current_quiz_id) {
        $check_sql = "SELECT COUNT(*) FROM edc_learndash_pro_quiz_question WHERE quiz_id = ? AND answer_data IS NOT NULL AND CHAR_LENGTH(answer_data) > 50";
        $check_stmt = $pdo->prepare($check_sql);
        $check_stmt->execute([$current_quiz_id]);
        if ($check_stmt->fetchColumn() > 0) {
            $quiz_id = $current_quiz_id;
        }
    }
    
    // If current quiz has no questions, find any available quiz
    if (!$quiz_id) {
        $find_sql = "SELECT DISTINCT quiz_id FROM edc_learndash_pro_quiz_question WHERE answer_data IS NOT NULL AND CHAR_LENGTH(answer_data) > 50 ORDER BY quiz_id DESC LIMIT 1";
        $find_stmt = $pdo->prepare($find_sql);
        $find_stmt->execute();
        $quiz_id = $find_stmt->fetchColumn();
    }
    
    if ($quiz_id) {
        error_log("QUIZ FOOTER: Using quiz ID $quiz_id");
        // Get questions for the quiz
        $sql = "
            SELECT 
                id as question_id,
                quiz_id,
                CONVERT(question USING utf8mb4) as question,
                answer_data,
                answer_type,
                sort
            FROM edc_learndash_pro_quiz_question 
            WHERE quiz_id = ? AND answer_data IS NOT NULL AND CHAR_LENGTH(answer_data) > 50
            ORDER BY sort, id
            LIMIT 10
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$quiz_id]);
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($questions)) {
            error_log("QUIZ FOOTER: Found " . count($questions) . " questions, rendering footer");
            ?>
            <div class="quiz-footer-answers" style="
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #ffffff;
                color: #333333;
                padding: 15px 20px;
                z-index: 999999;
                font-family: Arial, sans-serif;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
                border-top: 3px solid #2196F3;
                max-height: 200px;
                overflow-y: auto;
            ">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <?php if ($current_quiz_id && $current_quiz_id != $quiz_id): ?>
                        <h3 style="margin: 0 0 10px 0; color: #FF9800; font-size: 16px;">⚠️ Sample Quiz Answers (Current quiz has no data - showing Quiz ID: <?php echo $quiz_id; ?>)</h3>
                    <?php else: ?>
                        <h3 style="margin: 0 0 10px 0; color: #2196F3; font-size: 16px;">🎯 Quiz Answers (Quiz ID: <?php echo $quiz_id; ?>)</h3>
                    <?php endif; ?>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 6px; font-size: 13px;">
                        <?php
                        foreach ($questions as $index => $q) {
                            $answers = parseAnswers($q['answer_data']);
                            $correct_answer = null;
                            
                            // Find the correct answer (1-based index)
                            foreach ($answers as $idx => $answer) {
                                if ($answer['correct']) {
                                    $correct_answer = $idx + 1;
                                    break;
                                }
                            }
                            
                            $correctLetter = $correct_answer ? ['A', 'B', 'C', 'D'][$correct_answer - 1] : '?';
                            $correctText = $correct_answer && isset($answers[$correct_answer - 1]) 
                                ? mb_substr($answers[$correct_answer - 1]['text'], 0, 30) . '...'
                                : 'No answer';
                            ?>
                            <div style="background: #f0f8ff; padding: 5px; border-radius: 3px; border-left: 3px solid #2196F3;">
                                <strong style="color: #333;">Q<?php echo $index + 1; ?>:</strong> 
                                <span style="color: #4CAF50; font-weight: bold; font-size: 14px;"><?php echo $correctLetter; ?></span>
                                <div style="font-size: 10px; color: #666; margin-top: 2px;"><?php echo htmlspecialchars($correctText); ?></div>
                            </div>
                            <?php
                        }
                        ?>
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; color: #666;">
                        Showing first <?php echo count($questions); ?> questions from Quiz ID: <?php echo $quiz_id; ?>
                    </div>
                </div>
            </div>
            
            <style>
                body { padding-bottom: 120px !important; }
            </style>
            <?php
        }
    }
    
} catch (PDOException $e) {
    error_log('QUIZ FOOTER: Database error - ' . $e->getMessage());
    // Silent fail - don't show errors to users
}

function parseAnswers($raw_data) {
    $answers = [];
    
    // Extract answers with proper encoding
    preg_match_all('/s:\d+:"\x00\*\x00_answer";s:(\d+):"([^"]*)"/', $raw_data, $answer_matches, PREG_SET_ORDER);
    preg_match_all('/s:\d+:"\x00\*\x00_correct";b:([01])/', $raw_data, $correct_matches);
    
    if (!empty($answer_matches)) {
        foreach ($answer_matches as $i => $match) {
            $answer_text = $match[2];
            $is_correct = isset($correct_matches[1][$i]) && $correct_matches[1][$i] == '1';
            
            // Fix Hebrew encoding
            $answer_text = mb_convert_encoding($answer_text, 'UTF-8', 'UTF-8');
            $answer_text = trim($answer_text);
            
            if ($answer_text) {
                $answers[] = [
                    'letter' => chr(65 + $i),
                    'text' => $answer_text,
                    'correct' => $is_correct
                ];
            }
        }
    }
    
    return $answers;
}
?>
