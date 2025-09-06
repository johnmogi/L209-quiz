<?php
// Direct test of answer parsing without WordPress dependencies
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
    
    echo "<h1>🧪 Direct Answer Parser Test</h1>";
    
    // Create mock WpProQuiz_Model_AnswerTypes class
    if (!class_exists('WpProQuiz_Model_AnswerTypes')) {
        class WpProQuiz_Model_AnswerTypes {
            protected $_answer = '';
            protected $_html = '';
            protected $_points = 0;
            protected $_correct = false;
            protected $_sortString = '';
            protected $_sortStringHtml = '';
            protected $_graded = 1;
            protected $_gradingProgression = 'not-graded-none';
            protected $_gradedType = 'text';
            protected $_mapper = null;
            
            public function getAnswer() { return $this->_answer; }
            public function isCorrect() { return $this->_correct; }
            public function getPoints() { return $this->_points; }
            public function getHtml() { return $this->_html; }
        }
    }
    
    // Function to parse answer data
    function parseAnswerData($answer_data) {
        if (empty($answer_data)) {
            return null;
        }
        
        $answers = @unserialize($answer_data);
        if (!$answers || !is_array($answers)) {
            return null;
        }
        
        foreach ($answers as $index => $answer) {
            if (is_object($answer)) {
                $is_correct = false;
                $answer_text = '';
                
                if (method_exists($answer, 'isCorrect')) {
                    $is_correct = $answer->isCorrect();
                } elseif (property_exists($answer, '_correct')) {
                    $is_correct = $answer->_correct;
                }
                
                if (method_exists($answer, 'getAnswer')) {
                    $answer_text = $answer->getAnswer();
                } elseif (property_exists($answer, '_answer')) {
                    $answer_text = $answer->_answer;
                }
                
                if ($is_correct) {
                    return [
                        'correct_answer_index' => $index,
                        'correct_answer_text' => $answer_text,
                        'points' => method_exists($answer, 'getPoints') ? $answer->getPoints() : 1
                    ];
                }
            }
        }
        
        return null;
    }
    
    // Test with questions from quiz 0
    echo "<h2>Testing Quiz 0 Questions</h2>";
    $stmt = $pdo->prepare("SELECT id, question, answer_data FROM {$table_prefix}learndash_pro_quiz_question WHERE quiz_id = 0 AND answer_data IS NOT NULL AND answer_data != '' LIMIT 5");
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $successful_parses = 0;
    
    foreach ($questions as $q) {
        echo "<div style='border: 1px solid #ccc; margin: 10px; padding: 15px;'>";
        echo "<h3>Question {$q['id']}</h3>";
        echo "<strong>Question:</strong> " . htmlspecialchars($q['question']) . "<br><br>";
        
        $parsed = parseAnswerData($q['answer_data']);
        
        if ($parsed) {
            $successful_parses++;
            echo "<div style='background: #d4edda; padding: 10px; border: 2px solid #28a745;'>";
            echo "<strong>✅ CORRECT ANSWER FOUND:</strong><br>";
            echo "Index: {$parsed['correct_answer_index']}<br>";
            echo "Text: " . htmlspecialchars($parsed['correct_answer_text']) . "<br>";
            echo "Points: {$parsed['points']}<br>";
            echo "</div>";
        } else {
            echo "<div style='background: #f8d7da; padding: 10px; border: 2px solid #dc3545;'>";
            echo "❌ No correct answer found or parsing failed";
            echo "</div>";
        }
        echo "</div>";
    }
    
    echo "<h2>📊 Results Summary</h2>";
    echo "<p><strong>Successfully parsed:</strong> {$successful_parses} out of " . count($questions) . " questions</p>";
    
    if ($successful_parses > 0) {
        echo "<div style='background: #d1ecf1; padding: 15px; border: 2px solid #0c5460;'>";
        echo "<h3>✅ SUCCESS: Answer parser is working!</h3>";
        echo "<p>The updated parser can successfully extract correct answers from the ProQuiz database.</p>";
        echo "<p><strong>Next step:</strong> Test the AJAX integration in the actual quiz.</p>";
        echo "</div>";
    } else {
        echo "<div style='background: #f8d7da; padding: 15px; border: 2px solid #721c24;'>";
        echo "<h3>❌ ISSUE: Parser needs more work</h3>";
        echo "<p>The parser is not finding correct answers. Need to investigate the data structure further.</p>";
        echo "</div>";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
