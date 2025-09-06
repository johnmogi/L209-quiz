<?php
/**
 * Hint Locator and Tester Script
 * This script helps locate and test hint functionality in the quiz system
 */

// WordPress environment setup
define('WP_USE_THEMES', false);
require_once('../../../wp-load.php');

// Security check - only run for administrators
if (!current_user_can('administrator')) {
    die('Access denied. Administrator privileges required.');
}

?>
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>בודק רמזים - Hint Locator</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
            direction: rtl;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .section h3 {
            margin-top: 0;
            color: #333;
        }
        .quiz-list {
            display: grid;
            gap: 10px;
        }
        .quiz-item {
            padding: 10px;
            background: #f9f9f9;
            border-radius: 4px;
            border-left: 4px solid #2196f3;
        }
        .question-item {
            padding: 8px;
            background: #fff;
            border: 1px solid #eee;
            margin: 5px 0;
            border-radius: 3px;
        }
        .hint-content {
            background: #e8f5e8;
            padding: 10px;
            margin: 5px 0;
            border-radius: 3px;
            border-right: 3px solid #4caf50;
        }
        .no-hint {
            background: #ffebee;
            padding: 10px;
            margin: 5px 0;
            border-radius: 3px;
            border-right: 3px solid #f44336;
        }
        .test-button {
            background: #2196f3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        .test-button:hover {
            background: #1976d2;
        }
        .ajax-result {
            margin: 10px 0;
            padding: 10px;
            border-radius: 4px;
            background: #f0f0f0;
        }
        .success { background: #e8f5e8; border-right: 3px solid #4caf50; }
        .error { background: #ffebee; border-right: 3px solid #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 בודק רמזים - Hint Locator & Tester</h1>
        
        <div class="section">
            <h3>📊 סטטיסטיקות כלליות</h3>
            <?php
            global $wpdb;
            
            // Get quiz statistics - using correct table names with edc_ prefix
            $total_quizzes = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}learndash_pro_quiz_master");
            $total_questions = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}learndash_pro_quiz_question");
            $questions_with_hints = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}learndash_pro_quiz_question WHERE tip IS NOT NULL AND tip != ''");
            
            echo "<p><strong>סה\"כ חידונים:</strong> {$total_quizzes}</p>";
            echo "<p><strong>סה\"כ שאלות:</strong> {$total_questions}</p>";
            echo "<p><strong>שאלות עם רמזים:</strong> {$questions_with_hints}</p>";
            echo "<p><strong>אחוז שאלות עם רמזים:</strong> " . ($total_questions > 0 ? round(($questions_with_hints / $total_questions) * 100, 1) : 0) . "%</p>";
            ?>
        </div>

        <div class="section">
            <h3>🎯 חידונים עם רמזים</h3>
            <div class="quiz-list">
                <?php
                // Get quizzes with hints
                $quizzes_with_hints = $wpdb->get_results("
                    SELECT DISTINCT qm.id, qm.name, COUNT(qq.id) as question_count,
                           SUM(CASE WHEN qq.tip IS NOT NULL AND qq.tip != '' THEN 1 ELSE 0 END) as hint_count
                    FROM {$wpdb->prefix}learndash_pro_quiz_master qm
                    LEFT JOIN {$wpdb->prefix}learndash_pro_quiz_question qq ON qm.id = qq.quiz_id
                    GROUP BY qm.id, qm.name
                    HAVING hint_count > 0
                    ORDER BY hint_count DESC
                ");

                if ($quizzes_with_hints) {
                    foreach ($quizzes_with_hints as $quiz) {
                        echo "<div class='quiz-item'>";
                        echo "<h4>{$quiz->name} (ID: {$quiz->id})</h4>";
                        echo "<p>שאלות: {$quiz->question_count} | רמזים: {$quiz->hint_count}</p>";
                        echo "<button class='test-button' onclick='loadQuizQuestions({$quiz->id})'>הצג שאלות ורמזים</button>";
                        echo "<button class='test-button' onclick='testQuizHints({$quiz->id})'>בדוק AJAX לרמזים</button>";
                        echo "<div id='quiz-details-{$quiz->id}' style='display:none; margin-top:10px;'></div>";
                        echo "</div>";
                    }
                } else {
                    echo "<p>לא נמצאו חידונים עם רמזים</p>";
                }
                ?>
            </div>
        </div>

        <div class="section">
            <h3>🧪 בדיקת AJAX</h3>
            <button class='test-button' onclick='testAjaxEndpoint()'>בדוק נקודת קצה AJAX</button>
            <div id='ajax-test-result' class='ajax-result' style='display:none;'></div>
        </div>

        <div class="section">
            <h3>🔧 בדיקת JavaScript</h3>
            <button class='test-button' onclick='testJavaScriptIntegration()'>בדוק אינטגרציה JavaScript</button>
            <div id='js-test-result' class='ajax-result' style='display:none;'></div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        function loadQuizQuestions(quizId) {
            const detailsDiv = document.getElementById('quiz-details-' + quizId);
            
            if (detailsDiv.style.display === 'none') {
                $.ajax({
                    url: '/wp-admin/admin-ajax.php',
                    type: 'POST',
                    data: {
                        action: 'get_quiz_questions_with_hints',
                        quiz_id: quizId,
                        nonce: '<?php echo wp_create_nonce("hint_test_nonce"); ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            let html = '<h5>שאלות ורמזים:</h5>';
                            response.data.forEach(function(question) {
                                html += '<div class="question-item">';
                                html += '<strong>שאלה ' + question.id + ':</strong> ' + question.question.substring(0, 100) + '...';
                                if (question.hint) {
                                    html += '<div class="hint-content"><strong>רמז:</strong> ' + question.hint + '</div>';
                                } else {
                                    html += '<div class="no-hint">אין רמז</div>';
                                }
                                html += '</div>';
                            });
                            detailsDiv.innerHTML = html;
                            detailsDiv.style.display = 'block';
                        } else {
                            detailsDiv.innerHTML = '<div class="error">שגיאה: ' + response.data + '</div>';
                            detailsDiv.style.display = 'block';
                        }
                    },
                    error: function(xhr) {
                        detailsDiv.innerHTML = '<div class="error">שגיאת AJAX: ' + xhr.responseText + '</div>';
                        detailsDiv.style.display = 'block';
                    }
                });
            } else {
                detailsDiv.style.display = 'none';
            }
        }

        function testQuizHints(quizId) {
            $.ajax({
                url: '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: {
                    action: 'get_question_hint',
                    quiz_id: quizId,
                    nonce: '<?php echo wp_create_nonce("lilac_hint_nonce"); ?>'
                },
                success: function(response) {
                    alert('בדיקת AJAX הצליחה!\n\nתשובה: ' + JSON.stringify(response, null, 2));
                },
                error: function(xhr) {
                    alert('שגיאת AJAX!\n\nקוד שגיאה: ' + xhr.status + '\nתשובה: ' + xhr.responseText);
                }
            });
        }

        function testAjaxEndpoint() {
            const resultDiv = document.getElementById('ajax-test-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = 'בודק נקודת קצה AJAX...';

            $.ajax({
                url: '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: {
                    action: 'get_question_hint',
                    question_id: 1, // Test with question ID 1
                    nonce: '<?php echo wp_create_nonce("lilac_hint_nonce"); ?>'
                },
                success: function(response) {
                    resultDiv.className = 'ajax-result success';
                    resultDiv.innerHTML = '<strong>✅ AJAX עובד!</strong><br><pre>' + JSON.stringify(response, null, 2) + '</pre>';
                },
                error: function(xhr) {
                    resultDiv.className = 'ajax-result error';
                    resultDiv.innerHTML = '<strong>❌ שגיאת AJAX!</strong><br>קוד: ' + xhr.status + '<br>תשובה: ' + xhr.responseText;
                }
            });
        }

        function testJavaScriptIntegration() {
            const resultDiv = document.getElementById('js-test-result');
            resultDiv.style.display = 'block';
            
            let results = [];
            
            // Check if jQuery is loaded
            results.push('jQuery: ' + (typeof jQuery !== 'undefined' ? '✅ נטען' : '❌ לא נטען'));
            
            // Check for hint modal elements
            results.push('Modal HTML: ' + ($('#lilac-hint-modal').length > 0 ? '✅ קיים' : '❌ לא קיים'));
            
            // Check for hint triggers
            results.push('Hint Triggers: ' + ($('.lilac-template-hint').length + ' נמצאו'));
            
            // Check for AJAX data
            results.push('AJAX URL: ' + (typeof ajaxurl !== 'undefined' ? '✅ ' + ajaxurl : '❌ לא מוגדר'));
            
            resultDiv.innerHTML = '<strong>תוצאות בדיקת JavaScript:</strong><br>' + results.join('<br>');
        }
    </script>
</body>
</html>

<?php
// Add AJAX handlers for this test script
add_action('wp_ajax_get_quiz_questions_with_hints', 'handle_get_quiz_questions_with_hints');

function handle_get_quiz_questions_with_hints() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'hint_test_nonce')) {
        wp_die('Security check failed');
    }
    
    global $wpdb;
    $quiz_id = intval($_POST['quiz_id']);
    
    $questions = $wpdb->get_results($wpdb->prepare("
        SELECT id, question, tip as hint 
        FROM {$wpdb->prefix}learndash_pro_quiz_question 
        WHERE quiz_id = %d 
        ORDER BY sort_index
    ", $quiz_id));
    
    if ($questions) {
        wp_send_json_success($questions);
    } else {
        wp_send_json_error('No questions found for this quiz');
    }
}
?>
