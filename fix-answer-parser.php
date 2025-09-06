<?php
// Fix the answer parser to handle WpProQuiz_Model_AnswerTypes objects properly
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
    
    echo "<h1>🔧 Fixed Answer Parser</h1>";
    
    // Create a mock WpProQuiz_Model_AnswerTypes class to handle unserialization
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
    
    // Function to parse answer data properly
    function parseAnswerData($answer_data) {
        if (empty($answer_data)) {
            return [];
        }
        
        // Try to unserialize the data
        $answers = @unserialize($answer_data);
        if ($answers === false) {
            return [];
        }
        
        $parsed_answers = [];
        if (is_array($answers)) {
            foreach ($answers as $index => $answer) {
                if (is_object($answer)) {
                    $parsed_answers[] = [
                        'index' => $index,
                        'text' => $answer->getAnswer(),
                        'correct' => $answer->isCorrect(),
                        'points' => $answer->getPoints(),
                        'html' => $answer->getHtml()
                    ];
                }
            }
        }
        
        return $parsed_answers;
    }
    
    // Get questions from quiz ID 0 (which has the most questions)
    echo "<h2>Quiz ID 0 Questions with Parsed Answers</h2>";
    $stmt = $pdo->prepare("SELECT id, question, answer_data FROM {$table_prefix}learndash_pro_quiz_question WHERE quiz_id = 0 ORDER BY id LIMIT 10");
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($questions as $q) {
        echo "<div style='border: 2px solid #333; margin: 15px; padding: 15px; background: #f9f9f9;'>";
        echo "<h3>Question {$q['id']}</h3>";
        echo "<strong>Question Text:</strong> " . htmlspecialchars($q['question']) . "<br><br>";
        
        $parsed_answers = parseAnswerData($q['answer_data']);
        
        if (!empty($parsed_answers)) {
            echo "<strong>Answer Options:</strong><br>";
            foreach ($parsed_answers as $answer) {
                $correct_indicator = $answer['correct'] ? '✅ CORRECT' : '❌';
                $points = $answer['points'] > 0 ? " ({$answer['points']} points)" : '';
                echo "<div style='margin: 5px 0; padding: 5px; background: " . ($answer['correct'] ? '#e8f5e8' : '#fff') . ";'>";
                echo "{$correct_indicator} Option {$answer['index']}: " . htmlspecialchars($answer['text']) . $points . "<br>";
                if (!empty($answer['html'])) {
                    echo "HTML: " . htmlspecialchars($answer['html']) . "<br>";
                }
                echo "</div>";
            }
        } else {
            echo "<em>No parsed answers available</em><br>";
        }
        echo "</div>";
    }
    
    // Test the specific question we're looking for
    echo "<h2>Search for Road Marking Question</h2>";
    $stmt = $pdo->prepare("SELECT id, question, answer_data FROM {$table_prefix}learndash_pro_quiz_question WHERE question LIKE '%קו%' OR question LIKE '%סימון%' OR question LIKE '%דרך%'");
    $stmt->execute();
    $road_questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($road_questions) {
        foreach ($road_questions as $q) {
            echo "<div style='border: 3px solid #007cba; margin: 15px; padding: 15px; background: #e7f3ff;'>";
            echo "<h3>🎯 FOUND: Question {$q['id']}</h3>";
            echo "<strong>Question:</strong> " . htmlspecialchars($q['question']) . "<br><br>";
            
            $parsed_answers = parseAnswerData($q['answer_data']);
            
            if (!empty($parsed_answers)) {
                echo "<strong>Answer Options:</strong><br>";
                foreach ($parsed_answers as $answer) {
                    $correct_indicator = $answer['correct'] ? '✅ CORRECT ANSWER' : '❌';
                    echo "<div style='margin: 5px 0; padding: 8px; background: " . ($answer['correct'] ? '#d4edda; border: 2px solid #28a745' : '#fff; border: 1px solid #ccc') . ";'>";
                    echo "{$correct_indicator} " . htmlspecialchars($answer['text']) . "<br>";
                    echo "</div>";
                }
            }
            echo "</div>";
        }
    } else {
        echo "<p>No road marking questions found with Hebrew text</p>";
    }
    
    // Generate corrected answer fetcher code
    echo "<h2>📋 Updated Answer Fetcher Logic</h2>";
    echo "<pre style='background: #f4f4f4; padding: 15px; border: 1px solid #ddd;'>";
    echo htmlspecialchars('
// Updated get_answers_by_question_ids method
public function get_answers_by_question_ids($question_ids) {
    if (empty($question_ids) || !is_array($question_ids)) {
        return array();
    }
    
    $placeholders = str_repeat("?,", count($question_ids) - 1) . "?";
    $table_name = $this->table_prefix . "learndash_pro_quiz_question";
    
    $sql = "SELECT id, question, answer_data FROM {$table_name} WHERE id IN ({$placeholders})";
    $stmt = $this->wpdb->prepare($sql, $question_ids);
    $questions = $this->wpdb->get_results($stmt, ARRAY_A);
    
    $correct_answers = array();
    
    foreach ($questions as $question) {
        $question_id = $question["id"];
        $answer_data = $question["answer_data"];
        
        if (!empty($answer_data)) {
            // Create mock class if needed
            if (!class_exists("WpProQuiz_Model_AnswerTypes")) {
                // Include the class definition here
            }
            
            $answers = @unserialize($answer_data);
            if ($answers && is_array($answers)) {
                foreach ($answers as $index => $answer) {
                    if (is_object($answer) && method_exists($answer, "isCorrect") && $answer->isCorrect()) {
                        $correct_answers[$question_id] = array(
                            "question_id" => $question_id,
                            "correct_answer_index" => $index,
                            "correct_answer_text" => method_exists($answer, "getAnswer") ? $answer->getAnswer() : "",
                            "points" => method_exists($answer, "getPoints") ? $answer->getPoints() : 1
                        );
                        break; // Found the correct answer
                    }
                }
            }
        }
    }
    
    return $correct_answers;
}');
    echo "</pre>";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
