<?php
/**
 * Direct Quiz Database Query Script
 * Queries LearnDash database directly to get all questions and correct answers
 */

// Database configuration from .env
$host = '127.0.0.1';
$port = '10074';
$username = 'root';
$password = 'root';
$database = 'local';

try {
    // Connect to database
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>LearnDash Quiz Database Query Results</h1>\n";
    echo "<style>body{font-family:Arial;margin:20px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:right;} th{background:#f2f2f2;} .correct{background:#d4edda;} .incorrect{background:#f8d7da;}</style>\n";
    
    // Step 1: Get total question count
    echo "<h2>Step 1: Total Question Count</h2>\n";
    $countQuery = "SELECT COUNT(*) as total FROM edc_learndash_pro_quiz_question";
    $stmt = $pdo->query($countQuery);
    $totalQuestions = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    echo "<p><strong>Total Questions in Database: {$totalQuestions}</strong></p>\n";
    
    // Step 2: Get sample questions to verify structure and examine raw data
    echo "<h2>Step 2: Sample Questions Structure</h2>\n";
    $sampleQuery = "SELECT id, question, answer_type, answer_data 
                    FROM edc_learndash_pro_quiz_question 
                    WHERE answer_data IS NOT NULL AND answer_data != ''
                    LIMIT 3";
    $stmt = $pdo->query($sampleQuery);
    $sampleQuestions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table>\n";
    echo "<tr><th>ID</th><th>Question</th><th>Type</th><th>Raw Answer Data</th></tr>\n";
    foreach ($sampleQuestions as $q) {
        echo "<tr>";
        echo "<td>{$q['id']}</td>";
        echo "<td>" . htmlspecialchars(strip_tags(substr($q['question'], 0, 50))) . "...</td>";
        echo "<td>{$q['answer_type']}</td>";
        echo "<td><pre style='font-size:10px;max-width:400px;overflow-x:scroll;'>" . htmlspecialchars(substr($q['answer_data'], 0, 500)) . "</pre></td>";
        echo "</tr>\n";
    }
    echo "</table>\n";
    
    // Step 3: Parse and extract correct answers from all questions
    echo "<h2>Step 3: Processing All Questions</h2>\n";
    $allQuestionsQuery = "SELECT id, question, answer_type, answer_data, tip_msg 
                          FROM edc_learndash_pro_quiz_question 
                          ORDER BY id ASC";
    $stmt = $pdo->query($allQuestionsQuery);
    $allQuestions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $processedQuestions = [];
    $successCount = 0;
    $errorCount = 0;
    
    echo "<p>Processing {$totalQuestions} questions...</p>\n";
    echo "<div style='max-height:400px;overflow-y:scroll;border:1px solid #ccc;padding:10px;'>\n";
    
    foreach ($allQuestions as $question) {
        $questionId = $question['id'];
        $questionText = strip_tags($question['question']);
        $answerData = $question['answer_data'];
        
        // Parse serialized answer data using regex approach to avoid class loading issues
        $answers = [];
        $correctAnswerIndex = null;
        
        if (!empty($answerData)) {
            // Use regex to extract answer data without unserializing objects
            // Look for the pattern: s:11:" * _correct";b:1 (correct answer)
            // and s:10:" * _answer";s:XX:"answer text"
            
            // Find all answer blocks in the serialized data
            preg_match_all('/i:(\d+);O:27:"WpProQuiz_Model_AnswerTypes"[^}]+}/', $answerData, $answerBlocks, PREG_SET_ORDER);
            
            foreach ($answerBlocks as $block) {
                $answerIndex = (int)$block[1];
                $answerBlock = $block[0];
                
                // Extract answer text using regex
                $answerText = '';
                if (preg_match('/s:10:" \* _answer";s:\d+:"([^"]+)"/', $answerBlock, $textMatch)) {
                    $answerText = trim(strip_tags($textMatch[1]));
                }
                
                // Check if this is the correct answer
                $isCorrect = false;
                if (preg_match('/s:11:" \* _correct";b:1/', $answerBlock)) {
                    $isCorrect = true;
                    $correctAnswerIndex = $answerIndex + 1; // Convert to 1-based
                }
                
                $answers[] = [
                    'text' => $answerText,
                    'correct' => $isCorrect,
                    'index' => $answerIndex
                ];
            }
            
            // If regex approach didn't work, try simple string search
            if (empty($answers) && strpos($answerData, '_correct') !== false) {
                // Count how many answers we have by counting answer patterns
                $answerCount = substr_count($answerData, '_answer');
                
                for ($i = 0; $i < $answerCount; $i++) {
                    // Look for correct answer pattern at position i
                    $pattern = 'i:' . $i . ';O:27:"WpProQuiz_Model_AnswerTypes"';
                    $pos = strpos($answerData, $pattern);
                    
                    if ($pos !== false) {
                        $answerSection = substr($answerData, $pos, 1000); // Get section of data
                        
                        // Check if this section contains the correct flag
                        if (strpos($answerSection, '_correct";b:1') !== false) {
                            $correctAnswerIndex = $i + 1; // Convert to 1-based
                            break;
                        }
                    }
                }
            }
            
            if ($correctAnswerIndex !== null) {
                $processedQuestions[$questionId] = [
                    'question_text' => $questionText,
                    'answers' => $answers,
                    'correct_answer' => $correctAnswerIndex,
                    'hint' => $question['tip_msg']
                ];
                $successCount++;
                
                echo "<div style='color:green;'>✅ Question {$questionId}: Correct answer is #{$correctAnswerIndex}</div>\n";
            } else {
                $errorCount++;
                echo "<div style='color:red;'>❌ Question {$questionId}: No correct answer found</div>\n";
            }
        } else {
            $errorCount++;
            echo "<div style='color:red;'>❌ Question {$questionId}: No answer data</div>\n";
        }
    }
    
    echo "</div>\n";
    
    // Step 4: Summary and Results
    echo "<h2>Step 4: Processing Summary</h2>\n";
    echo "<table>\n";
    echo "<tr><th>Metric</th><th>Count</th><th>Percentage</th></tr>\n";
    echo "<tr><td>Total Questions</td><td>{$totalQuestions}</td><td>100%</td></tr>\n";
    echo "<tr class='correct'><td>Successfully Processed</td><td>{$successCount}</td><td>" . round(($successCount/$totalQuestions)*100, 2) . "%</td></tr>\n";
    echo "<tr class='incorrect'><td>Processing Errors</td><td>{$errorCount}</td><td>" . round(($errorCount/$totalQuestions)*100, 2) . "%</td></tr>\n";
    echo "</table>\n";
    
    // Step 5: Generate JavaScript object for debugger
    echo "<h2>Step 5: JavaScript Object for Debugger</h2>\n";
    echo "<textarea style='width:100%;height:200px;font-family:monospace;'>\n";
    echo "// LearnDash Quiz Correct Answers - Generated " . date('Y-m-d H:i:s') . "\n";
    echo "window.lilacQuizCorrectAnswers = {\n";
    
    $jsEntries = [];
    foreach ($processedQuestions as $qId => $qData) {
        $jsEntries[] = "    '{$qId}': {$qData['correct_answer']}";
    }
    echo implode(",\n", $jsEntries) . "\n";
    echo "};\n\n";
    
    echo "// Total questions processed: {$successCount}\n";
    echo "// Success rate: " . round(($successCount/$totalQuestions)*100, 2) . "%\n";
    echo "</textarea>\n";
    
    // Step 6: Sample correct answers for verification
    echo "<h2>Step 6: Sample Correct Answers (First 10)</h2>\n";
    echo "<table>\n";
    echo "<tr><th>Question ID</th><th>Question Text</th><th>Correct Answer</th><th>Answer Text</th></tr>\n";
    
    $sampleCount = 0;
    foreach ($processedQuestions as $qId => $qData) {
        if ($sampleCount >= 10) break;
        
        $correctIndex = $qData['correct_answer'] - 1; // Convert back to 0-based
        $correctAnswerText = isset($qData['answers'][$correctIndex]) ? $qData['answers'][$correctIndex]['text'] : 'N/A';
        
        echo "<tr>";
        echo "<td>{$qId}</td>";
        echo "<td>" . htmlspecialchars(substr($qData['question_text'], 0, 50)) . "...</td>";
        echo "<td>#{$qData['correct_answer']}</td>";
        echo "<td>" . htmlspecialchars(substr($correctAnswerText, 0, 50)) . "...</td>";
        echo "</tr>\n";
        
        $sampleCount++;
    }
    echo "</table>\n";
    
    echo "<h2>✅ Query Complete!</h2>\n";
    echo "<p><strong>Successfully processed {$successCount} out of {$totalQuestions} questions.</strong></p>\n";
    
} catch (PDOException $e) {
    echo "<h1>Database Connection Error</h1>\n";
    echo "<p style='color:red;'>Error: " . htmlspecialchars($e->getMessage()) . "</p>\n";
    echo "<p>Please check your database configuration:</p>\n";
    echo "<ul>\n";
    echo "<li>Host: {$host}</li>\n";
    echo "<li>Port: {$port}</li>\n";
    echo "<li>Database: {$database}</li>\n";
    echo "<li>Username: {$username}</li>\n";
    echo "</ul>\n";
}
?>
