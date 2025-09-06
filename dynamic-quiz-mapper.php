<?php
// Dynamic Quiz Mapper - Matches displayed questions with database questions
$host = '127.0.0.1';
$port = 3306;
$database = 'local';
$username = 'root';
$password = 'root';
$table_prefix = 'edc_';

try {
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$database}", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>🔄 Dynamic Quiz Mapping Solution</h1>";
    
    // The issue: LearnDash quiz 11702 has no mapped ProQuiz ID
    // Solution: Create a dynamic mapping based on question content matching
    
    echo "<h2>1. Problem Analysis</h2>";
    echo "<p>LearnDash quiz 11702 ('מבחן תרגול') has no mapped ProQuiz ID in postmeta.</p>";
    echo "<p>Current fallback uses quiz ID 0 (1347 questions) but these don't match the displayed quiz.</p>";
    
    echo "<h2>2. Dynamic Mapping Strategy</h2>";
    echo "<p>Instead of relying on static ProQuiz ID mapping, we'll:</p>";
    echo "<ul>";
    echo "<li>Extract question IDs from the quiz page DOM (from input names)</li>";
    echo "<li>Match these question IDs directly in the database</li>";
    echo "<li>Return correct answers for the actual displayed questions</li>";
    echo "</ul>";
    
    // Test this approach by finding questions that might be displayed
    echo "<h2>3. Testing Dynamic Question Detection</h2>";
    
    // Check what questions exist in different quiz IDs
    $stmt = $pdo->query("
        SELECT quiz_id, id as question_id, 
               SUBSTRING(question, 1, 50) as question_preview
        FROM {$table_prefix}learndash_pro_quiz_question 
        WHERE quiz_id IN (0, 5, 94, 97, 98, 101)
        ORDER BY quiz_id, id 
        LIMIT 20
    ");
    $sample_questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Quiz ID</th><th>Question ID</th><th>Preview</th></tr>";
    foreach ($sample_questions as $q) {
        echo "<tr>";
        echo "<td>{$q['quiz_id']}</td>";
        echo "<td>{$q['question_id']}</td>";
        echo "<td>" . htmlspecialchars($q['question_preview']) . "...</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<h2>4. Recommended Implementation</h2>";
    echo "<div style='background: #f0f8ff; padding: 15px; border-left: 4px solid #0066cc;'>";
    echo "<h3>JavaScript Detection (Frontend)</h3>";
    echo "<pre>";
    echo "// Extract question IDs from DOM
function getActualQuestionIds() {
    const inputs = document.querySelectorAll('input[name*=\"question_\"]');
    const questionIds = [];
    
    inputs.forEach(input => {
        const match = input.name.match(/question_\\d+_(\\d+)/);
        if (match) {
            questionIds.push(parseInt(match[1]));
        }
    });
    
    return questionIds;
}";
    echo "</pre>";
    
    echo "<h3>PHP Backend (AJAX Handler)</h3>";
    echo "<pre>";
    echo "// Modified AJAX handler
public function handle_ajax_get_quiz_correct_answers() {
    \$question_ids = isset(\$_POST['question_ids']) ? \$_POST['question_ids'] : [];
    
    if (empty(\$question_ids)) {
        // Fallback to old method
        \$quiz_id = intval(\$_POST['quiz_id']);
        return \$this->get_quiz_correct_answers(\$quiz_id);
    }
    
    // Direct question ID lookup
    return \$this->get_answers_by_question_ids(\$question_ids);
}";
    echo "</pre>";
    echo "</div>";
    
    echo "<h2>5. Implementation Steps</h2>";
    echo "<ol>";
    echo "<li>Modify JavaScript to extract actual question IDs from DOM</li>";
    echo "<li>Update AJAX call to send question IDs instead of quiz ID</li>";
    echo "<li>Create new method to fetch answers by question IDs directly</li>";
    echo "<li>Keep fallback method for compatibility</li>";
    echo "</ol>";
    
    echo "<h2>✅ This approach will solve the answer mismatch issue</h2>";
    echo "<p>By using actual question IDs from the displayed quiz, we'll get the correct answers regardless of ProQuiz ID mapping issues.</p>";
    
} catch (PDOException $e) {
    echo "<h1>❌ Database Error</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
