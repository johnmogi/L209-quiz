<?php
/**
 * Complete Quiz Questions and Answers Validator
 * Shows all questions with answers, highlighting correct ones in bold
 * Assesses system readiness for large quizzes (200+ questions)
 */

require_once('../../../wp-config.php');
global $wpdb;

// Get quiz parameters
$post_id = isset($_GET['post_id']) ? intval($_GET['post_id']) : 11702;
$quiz_id = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 101;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 0; // 0 = no limit

?>
<!DOCTYPE html>
<html>
<head>
    <title>Complete Quiz Validator - Quiz <?php echo $quiz_id; ?></title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #2c5aa0; color: white; padding: 15px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0; }
        .stats { background: #e8f4fd; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #2c5aa0; }
        .question { background: #f9f9f9; border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 5px; }
        .question-header { font-weight: bold; color: #2c5aa0; margin-bottom: 10px; font-size: 16px; }
        .question-text { background: white; padding: 10px; border-radius: 3px; margin-bottom: 15px; border-left: 3px solid #2c5aa0; }
        .answers { margin-left: 20px; }
        .answer { padding: 8px; margin: 5px 0; border-radius: 3px; border: 1px solid #eee; }
        .answer.correct { background: #d4edda; border-color: #28a745; font-weight: bold; }
        .answer.incorrect { background: #f8f9fa; border-color: #dee2e6; }
        .performance { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .success { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .controls { background: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .controls input, .controls select { margin: 5px; padding: 5px; }
        .btn { background: #2c5aa0; color: white; padding: 8px 15px; border: none; border-radius: 3px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #1e3d6f; }
        .json-output { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 12px; max-height: 300px; overflow-y: auto; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>🎯 Complete Quiz Validator</h1>
        <p>Comprehensive validation for Quiz ID <?php echo $quiz_id; ?> (Post <?php echo $post_id; ?>)</p>
    </div>

    <div class="controls">
        <form method="GET">
            <label>Post ID: <input type="number" name="post_id" value="<?php echo $post_id; ?>" /></label>
            <label>Quiz ID: <input type="number" name="quiz_id" value="<?php echo $quiz_id; ?>" /></label>
            <label>Limit: <select name="limit">
                <option value="0" <?php echo $limit == 0 ? 'selected' : ''; ?>>All Questions</option>
                <option value="10" <?php echo $limit == 10 ? 'selected' : ''; ?>>First 10</option>
                <option value="30" <?php echo $limit == 30 ? 'selected' : ''; ?>>First 30</option>
                <option value="50" <?php echo $limit == 50 ? 'selected' : ''; ?>>First 50</option>
            </select></label>
            <input type="submit" value="Update" class="btn" />
        </form>
    </div>

<?php

// Performance timing start
$start_time = microtime(true);

// Get the question mapping (corrected to use values, not keys)
$question_mapping = get_post_meta($post_id, 'ld_quiz_questions', true);
if (!$question_mapping || !is_array($question_mapping)) {
    echo '<div class="warning">❌ No question mapping found for post ID ' . $post_id . '</div>';
    exit;
}

$question_ids = array_values($question_mapping); // Use VALUES not keys - CORRECTED
$total_mapped = count($question_ids);

// Apply limit if specified
if ($limit > 0) {
    $question_ids = array_slice($question_ids, 0, $limit);
}

// Get all questions and answers
$table_questions = $wpdb->prefix . 'learndash_pro_quiz_question';
$table_answers = $wpdb->prefix . 'learndash_pro_quiz_answer';

$placeholders = implode(',', array_fill(0, count($question_ids), '%d'));
$questions_query = $wpdb->prepare("
    SELECT id, quiz_id, question, answer_type, sort_order 
    FROM $table_questions 
    WHERE id IN ($placeholders) 
    ORDER BY sort_order ASC
", $question_ids);

$questions = $wpdb->get_results($questions_query);

// Get all answers for these questions
$answers_query = $wpdb->prepare("
    SELECT question_id, answer, correct, sort_order 
    FROM $table_answers 
    WHERE question_id IN ($placeholders) 
    ORDER BY question_id ASC, sort_order ASC
", $question_ids);

$answers = $wpdb->get_results($answers_query);

// Group answers by question
$answers_by_question = [];
foreach ($answers as $answer) {
    $answers_by_question[$answer->question_id][] = $answer;
}

$end_time = microtime(true);
$query_time = round(($end_time - $start_time) * 1000, 2);

// Calculate statistics
$total_questions = count($questions);
$total_answers = count($answers);
$questions_with_answers = count($answers_by_question);
$correct_answers = 0;
foreach ($answers as $answer) {
    if ($answer->correct == 1) $correct_answers++;
}

?>

<div class="stats">
    <h3>📊 Quiz Statistics</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div><strong>Total Mapped Questions:</strong> <?php echo $total_mapped; ?></div>
        <div><strong>Questions Retrieved:</strong> <?php echo $total_questions; ?></div>
        <div><strong>Questions with Answers:</strong> <?php echo $questions_with_answers; ?></div>
        <div><strong>Total Answer Options:</strong> <?php echo $total_answers; ?></div>
        <div><strong>Correct Answers:</strong> <?php echo $correct_answers; ?></div>
        <div><strong>Query Time:</strong> <?php echo $query_time; ?>ms</div>
    </div>
</div>

<?php
// Performance assessment for large quizzes
if ($total_mapped >= 100) {
    echo '<div class="warning">⚠️ <strong>Large Quiz Detected:</strong> ' . $total_mapped . ' questions. Consider implementing pagination or current-question filtering for optimal frontend performance.</div>';
} elseif ($total_mapped >= 50) {
    echo '<div class="performance">📈 <strong>Medium Quiz:</strong> ' . $total_mapped . ' questions. Frontend should handle this well, but monitor performance on slower devices.</div>';
} else {
    echo '<div class="success">✅ <strong>Optimal Size:</strong> ' . $total_mapped . ' questions. Perfect for current frontend implementation.</div>';
}

// Data validation
$missing_questions = array_diff($question_ids, array_column($questions, 'id'));
if (!empty($missing_questions)) {
    echo '<div class="warning">❌ <strong>Missing Questions:</strong> ' . count($missing_questions) . ' questions not found in database: ' . implode(', ', array_slice($missing_questions, 0, 10)) . '</div>';
}

$questions_without_answers = array_diff(array_column($questions, 'id'), array_keys($answers_by_question));
if (!empty($questions_without_answers)) {
    echo '<div class="warning">❌ <strong>Questions Without Answers:</strong> ' . count($questions_without_answers) . ' questions have no answers: ' . implode(', ', $questions_without_answers) . '</div>';
}
?>

<h3>📝 Complete Questions and Answers</h3>

<?php
foreach ($questions as $index => $question) {
    $question_answers = isset($answers_by_question[$question->id]) ? $answers_by_question[$question->id] : [];
    $correct_count = 0;
    foreach ($question_answers as $ans) {
        if ($ans->correct == 1) $correct_count++;
    }
    ?>
    
    <div class="question">
        <div class="question-header">
            Question <?php echo ($index + 1); ?> (ID: <?php echo $question->id; ?>) 
            - Quiz: <?php echo $question->quiz_id; ?> 
            - Type: <?php echo $question->answer_type; ?>
            - Correct Answers: <?php echo $correct_count; ?>
        </div>
        
        <div class="question-text">
            <?php echo nl2br(html_entity_decode($question->question)); ?>
        </div>
        
        <div class="answers">
            <strong>Answer Options:</strong>
            <?php if (empty($question_answers)): ?>
                <div class="answer" style="background: #f8d7da; border-color: #f5c6cb;">
                    ❌ No answers found for this question
                </div>
            <?php else: ?>
                <?php foreach ($question_answers as $ans_index => $answer): ?>
                    <div class="answer <?php echo $answer->correct == 1 ? 'correct' : 'incorrect'; ?>">
                        <?php echo $answer->correct == 1 ? '✅' : '❌'; ?> 
                        <strong><?php echo chr(65 + $ans_index); ?>.</strong> 
                        <?php echo nl2br(html_entity_decode($answer->answer)); ?>
                        <?php if ($answer->correct == 1): ?>
                            <strong style="color: #28a745;"> [CORRECT ANSWER]</strong>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
    
<?php } ?>

<div class="performance">
    <h3>🚀 System Performance Assessment</h3>
    
    <h4>Current Quiz (<?php echo $total_mapped; ?> questions):</h4>
    <ul>
        <li><strong>Database Query Time:</strong> <?php echo $query_time; ?>ms (<?php echo $query_time < 100 ? '✅ Excellent' : ($query_time < 500 ? '⚠️ Good' : '❌ Slow'); ?>)</li>
        <li><strong>Data Transfer Size:</strong> ~<?php echo round(strlen(json_encode($questions)) / 1024, 1); ?>KB questions + ~<?php echo round(strlen(json_encode($answers)) / 1024, 1); ?>KB answers</li>
        <li><strong>Frontend Memory Usage:</strong> ~<?php echo round((count($questions) * 2 + count($answers) * 1.5) / 1024, 1); ?>KB estimated</li>
    </ul>
    
    <h4>200-Question Quiz Projection:</h4>
    <?php 
    $ratio = 200 / max($total_mapped, 1);
    $projected_query_time = $query_time * $ratio;
    $projected_data_size = (strlen(json_encode($questions)) + strlen(json_encode($answers))) * $ratio / 1024;
    ?>
    <ul>
        <li><strong>Projected Query Time:</strong> ~<?php echo round($projected_query_time, 1); ?>ms (<?php echo $projected_query_time < 500 ? '✅ Acceptable' : ($projected_query_time < 1000 ? '⚠️ Slow' : '❌ Too Slow'); ?>)</li>
        <li><strong>Projected Data Size:</strong> ~<?php echo round($projected_data_size, 1); ?>KB (<?php echo $projected_data_size < 500 ? '✅ Good' : ($projected_data_size < 1000 ? '⚠️ Heavy' : '❌ Too Heavy'); ?>)</li>
        <li><strong>Frontend Impact:</strong> <?php echo $projected_data_size < 500 ? '✅ Smooth performance expected' : ($projected_data_size < 1000 ? '⚠️ May cause lag on slow devices' : '❌ Will likely cause performance issues'); ?></li>
    </ul>
    
    <h4>Recommendations:</h4>
    <?php if ($total_mapped >= 100 || $projected_data_size > 500): ?>
        <div class="warning">
            <strong>For 200+ question quizzes, implement:</strong>
            <ul>
                <li>✅ <strong>Current-Question Filtering:</strong> Load only current question + next 2-3 questions</li>
                <li>✅ <strong>Lazy Loading:</strong> Fetch questions as user progresses</li>
                <li>✅ <strong>Answer Caching:</strong> Cache correct answers separately from full question data</li>
                <li>✅ <strong>Pagination:</strong> Break large quizzes into sections</li>
                <li>✅ <strong>Memory Management:</strong> Clear unused question data from memory</li>
            </ul>
        </div>
    <?php else: ?>
        <div class="success">
            <strong>Current system is optimal for this quiz size.</strong> No changes needed for quizzes up to <?php echo $total_mapped * 2; ?> questions.
        </div>
    <?php endif; ?>
</div>

<div class="json-output">
    <h4>🔧 Sample AJAX Response (First 2 Questions):</h4>
    <pre><?php 
    $sample_data = [
        'success' => true,
        'data' => [
            'quiz_id' => $quiz_id,
            'questions' => array_slice(array_map(function($q) use ($answers_by_question) {
                return [
                    'question_id' => $q->id,
                    'quiz_id' => $q->quiz_id,
                    'question_text' => $q->question,
                    'answers' => array_map(function($a, $idx) {
                        return [
                            'index' => $idx,
                            'text' => $a->answer,
                            'correct' => $a->correct == 1
                        ];
                    }, isset($answers_by_question[$q->id]) ? $answers_by_question[$q->id] : [], array_keys(isset($answers_by_question[$q->id]) ? $answers_by_question[$q->id] : []))
                ];
            }, $questions), 0, 2)
        ]
    ];
    echo json_encode($sample_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    ?></pre>
</div>

<div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
    <p><strong>Quiz Validation Complete</strong> | Generated: <?php echo date('Y-m-d H:i:s'); ?> | Processing Time: <?php echo round((microtime(true) - $start_time) * 1000, 2); ?>ms</p>
</div>

</div>
</body>
</html>
