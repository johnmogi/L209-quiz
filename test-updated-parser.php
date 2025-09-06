<?php
// Test the updated answer parser
require_once 'includes/quiz-answer-fetcher.php';

// Test with some question IDs from quiz 0
$fetcher = new LilacQuizAnswerFetcher();

echo "<h1>🧪 Testing Updated Answer Parser</h1>";

// Test with question IDs from quiz 0
$test_question_ids = [19, 20, 21, 36, 37];

echo "<h2>Testing Question IDs: " . implode(', ', $test_question_ids) . "</h2>";

$results = $fetcher->get_answers_by_question_ids($test_question_ids);

if (!empty($results)) {
    echo "<h3>✅ Found Correct Answers:</h3>";
    foreach ($results as $question_id => $answer_data) {
        echo "<div style='border: 2px solid #28a745; margin: 10px; padding: 15px; background: #d4edda;'>";
        echo "<strong>Question ID:</strong> {$question_id}<br>";
        echo "<strong>Correct Answer Index:</strong> {$answer_data['correct_answer_index']}<br>";
        echo "<strong>Answer Text:</strong> " . htmlspecialchars($answer_data['correct_answer_text']) . "<br>";
        echo "<strong>Points:</strong> {$answer_data['points']}<br>";
        echo "</div>";
    }
} else {
    echo "<h3>❌ No correct answers found</h3>";
}

// Test the AJAX handler directly
echo "<h2>Testing AJAX Handler</h2>";

// Simulate AJAX request
$_POST['question_ids'] = $test_question_ids;

ob_start();
$fetcher->handle_ajax_get_quiz_correct_answers();
$ajax_output = ob_get_clean();

echo "<h3>AJAX Response:</h3>";
echo "<pre style='background: #f4f4f4; padding: 10px; border: 1px solid #ddd;'>";
echo htmlspecialchars($ajax_output);
echo "</pre>";

// Test fallback to quiz ID method
echo "<h2>Testing Fallback Quiz ID Method</h2>";
unset($_POST['question_ids']);
$_POST['quiz_id'] = 0;

ob_start();
$fetcher->handle_ajax_get_quiz_correct_answers();
$fallback_output = ob_get_clean();

echo "<h3>Fallback AJAX Response:</h3>";
echo "<pre style='background: #f4f4f4; padding: 10px; border: 1px solid #ddd;'>";
echo htmlspecialchars($fallback_output);
echo "</pre>";

echo "<h2>✅ Test Complete</h2>";
?>
