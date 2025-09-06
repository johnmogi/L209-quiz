<?php
// Test the fixed SQL query directly
require_once('wp-config.php');
require_once('wp-content/plugins/lilac-quiz-sidebar/includes/quiz-answer-fetcher.php');

echo "=== Testing Fixed SQL Query ===\n";

// Create instance
$fetcher = new LilacQuizAnswerFetcher();

// Test with known question IDs
$question_ids = [1, 2, 3];
echo "Testing with question IDs: " . implode(', ', $question_ids) . "\n";

try {
    $result = $fetcher->get_answers_by_question_ids($question_ids);
    echo "✅ SQL Query executed successfully!\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
} catch (Exception $e) {
    echo "❌ SQL Query failed: " . $e->getMessage() . "\n";
}

echo "\n=== Testing AJAX Handler Directly ===\n";

// Simulate AJAX request
$_POST['action'] = 'get_quiz_correct_answers';
$_POST['question_ids'] = [1, 2, 3];

ob_start();
$fetcher->handle_ajax_get_quiz_correct_answers();
$output = ob_get_clean();

echo "AJAX Handler Output: " . $output . "\n";
?>
