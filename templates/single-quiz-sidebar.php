<?php
/**
 * Template for quizzes with sidebar
 *
 * Based on the LearnDash quiz template but with added sidebar
 *
 * @package Lilac_Quiz_Sidebar
 */

if (!defined('ABSPATH')) {
    exit;
}

// Debug: Log template loading
error_log('Lilac Quiz Sidebar: Loading template file: ' . __FILE__);

// Include theme header
get_header();


// Get quiz ID and settings
$quiz_id = get_the_ID();
$has_sidebar = get_post_meta($quiz_id, '_ld_quiz_toggle_sidebar', true);
$enforce_hint = get_post_meta($quiz_id, '_ld_quiz_enforce_hint', true);

// Get quiz data for footer display
$quiz_data = null;
if (function_exists('learndash_get_quiz_questions')) {
    $questions = learndash_get_quiz_questions($quiz_id);
    if (!empty($questions)) {
        $quiz_data = [
            'success' => true,
            'quiz_id' => $quiz_id,
            'questions' => [],
            'total' => count($questions)
        ];
        
        $question_number = 1;
        foreach ($questions as $question_id => $question_data) {
            $question_post = get_post($question_id);
            if (!$question_post) continue;
            
            // Get question meta data
            $question_meta = get_post_meta($question_id, '_sfwd-question', true);
            
            // Get question answers
            $answers_data = [];
            $correct_answer = null;
            
            if (is_array($question_meta) && isset($question_meta['sfwd-question_question_type'])) {
                $question_type = $question_meta['sfwd-question_question_type'];
                
                // Handle multiple choice questions
                if ($question_type === 'single' || $question_type === 'multiple') {
                    // Get answers from meta
                    $answers_meta = get_post_meta($question_id, '_sfwd-question_answers', true);
                    
                    if (is_array($answers_meta)) {
                        foreach ($answers_meta as $index => $answer) {
                            $answer_text = isset($answer['answer']) ? $answer['answer'] : '';
                            $is_correct = isset($answer['correct']) && $answer['correct'] == '1';
                            
                            if (!empty($answer_text)) {
                                $answers_data[] = [
                                    'letter' => chr(65 + $index),
                                    'text' => strip_tags($answer_text),
                                    'correct' => $is_correct
                                ];
                                
                                if ($is_correct && !$correct_answer) {
                                    $correct_answer = $index + 1;
                                }
                            }
                        }
                    }
                }
            }
            
            $question_text = $question_post->post_title;
            if (empty($question_text)) {
                $question_text = $question_post->post_content;
            }
            $question_text = strip_tags($question_text);
            
            $quiz_data['questions'][] = [
                'question_id' => $question_id,
                'question_number' => $question_number,
                'question_text' => $question_text,
                'answers' => $answers_data,
                'correct_answer' => $correct_answer,
                'quiz_id' => $quiz_id
            ];
            
            $question_number++;
            
            // Limit to 20 questions for performance
            if ($question_number > 20) break;
        }
    }
}

// Debug output removed for production
?>

<script type="text/javascript">
console.log('Lilac Quiz Sidebar: Template loaded');
console.log('Quiz ID:', <?php echo json_encode($quiz_id); ?>);
console.log('Has Sidebar:', <?php echo json_encode($has_sidebar); ?>);
console.log('Enforce Hint:', <?php echo json_encode($enforce_hint); ?>);

// Embed quiz data directly in the page to bypass network issues
window.embeddedQuizData = <?php echo json_encode($quiz_data, JSON_UNESCAPED_UNICODE); ?>;
console.log('Embedded Quiz Data:', window.embeddedQuizData);

jQuery(document).ready(function($) {
    console.log('Lilac Quiz Sidebar: Document ready');
    
    // Debug: Check if our script is loaded
    if (typeof window.lilacQuizSidebarInit === 'function') {
        console.log('Lilac Quiz Sidebar: Main script is loaded');
    } else {
        console.warn('Lilac Quiz Sidebar: Main script not loaded!');
    }
    
    // Debug: Check LearnDash
    if (typeof LearnDashData !== 'undefined') {
        console.log('LearnDash data:', LearnDashData);
    } else {
        console.warn('LearnDashData not found!');
    }
});
</script>

<main id="primary" class="site-main lilac-quiz-main">
    <div class="quiz-container" data-quiz-id="<?php echo esc_attr($quiz_id); ?>" data-has-sidebar="<?php echo esc_attr($has_sidebar); ?>">
        <!-- Main Quiz Content -->
        <div class="quiz-content">
            <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class('sfwd-quiz lilac-quiz-article'); ?>>
                    <header class="entry-header">
                        <h1 class="entry-title"><?php the_title(); ?></h1>
                    </header>

                    <div class="entry-content quiz-entry-content">
                        <?php 
                        // Output the quiz content using LearnDash shortcode
                        $quiz_content = do_shortcode('[ld_quiz quiz_id="' . $quiz_id . '"]');
                        
                        // Ensure content is properly wrapped
                        if (!empty($quiz_content)) {
                            echo '<div class="lilac-quiz-wrapper">' . $quiz_content . '</div>';
                        } else {
                            echo '<div class="lilac-quiz-error">';
                            echo '<p>' . __('שגיאה בטעינת המבחן. אנא רענן את הדף ונסה שוב.', 'lilac-quiz-sidebar') . '</p>';
                            echo '</div>';
                        }
                        ?>
                    </div>
                </article>
            <?php endwhile; else: ?>
                <div class="lilac-no-quiz">
                    <p><?php _e('מבחן לא נמצא.', 'lilac-quiz-sidebar'); ?></p>
                </div>
            <?php endif; ?>
        </div>
        
        <!-- Enhanced Sidebar -->
        <aside class="ld-quiz-sidebar" role="complementary" aria-label="<?php esc_attr_e('תוכן עזר למבחן', 'lilac-quiz-sidebar'); ?>">
            
            <div id="question-media" class="question-media-container">
                <div class="media-loading" style="display: none;">
                    <div class="spinner"></div>
                    <p><?php _e('טוען תוכן...', 'lilac-quiz-sidebar'); ?></p>
                </div>
                
                <div class="media-content question-media-image">
                    <?php 
                    $default_image = plugins_url('/assets/images/default-media.png', dirname(__DIR__));
                    if (file_exists(dirname(__DIR__) . '/assets/images/default-media.png')) {
                        echo '<img src="' . esc_url($default_image) . '" alt="' . esc_attr__('תמונת ברירת מחדל', 'lilac-quiz-sidebar') . '" class="fallback-image">';
                    }
                    ?>
                </div>
                
                <div class="media-placeholder">
                </div>
                
                <div class="media-error" style="display: none;">
                </div>
            </div>
        </aside>
    </div>
</main>

<?php
// Include quiz footer answers
echo "<!-- DEBUG: About to include quiz footer -->";
$footer_path = dirname(__FILE__) . '/quiz-footer-answers.php';
echo "<!-- DEBUG: Footer path: $footer_path -->";
if (file_exists($footer_path)) {
    echo "<!-- DEBUG: Footer file exists, including -->";
    include($footer_path);
    echo "<!-- DEBUG: Footer included -->";
} else {
    echo "<!-- DEBUG: Footer file NOT found -->";
}

// Include theme footer
get_footer();
?>

<?php
// Only show hint button if enforce hint is enabled
$quiz_id = get_the_ID();
$enforce_hint = get_post_meta($quiz_id, '_ld_quiz_enforce_hint', true);
echo "<!-- Debug: Quiz ID: $quiz_id, Enforce Hint: $enforce_hint -->";
if ($enforce_hint === '1' || $enforce_hint === 'yes' || $enforce_hint === true):
?>
<script type="text/javascript">
// Template hint button - only loads when enforce hint is enabled
console.log('Template hint button: Starting...');

jQuery(document).ready(function($) {
    console.log('Template hint button: DOM ready');
    
    // Check body has enforce-hint class
    if (!$('body').hasClass('enforce-hint')) {
        console.log('Template hint button: No enforce-hint class, skipping');
        return;
    }
    
    // Remove any existing hint buttons
    $('.lilac-hint-message, .lilac-force-hint, .lilac-template-hint').remove();
    
    // Find quiz container
    var quizContainer = $('.wpProQuiz_content, .wpProQuiz_quiz, #wpProQuiz_1, [id^="wpProQuiz_"]').first();
    console.log('Template hint button: Quiz container found:', quizContainer.length);
    
    if (quizContainer.length === 0) {
        console.log('Template hint button: No quiz container found');
        return;
    }
    
    // Check for available hint buttons
    var availableHints = $('.wpProQuiz_hint, .wpProQuiz_tip, [class*="hint"]').length;
    console.log('Template hint button: Available hints:', availableHints);
    
    // Create hint button
    var hintButton = $('<div class="lilac-template-hint" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; margin: 10px 0; border-radius: 8px; text-align: center; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: all 0.3s ease; z-index: 99999; position: relative; border: 2px solid #4a5568;">🔍 לחץ כאן לקבלת רמז</div>');
    
    // Add click handler
    hintButton.on('click', function() {
        console.log('Template hint button: Clicked');
        var hintBtn = $('.wpProQuiz_hint, .wpProQuiz_tip').first();
        if (hintBtn.length) {
            hintBtn.click();
            console.log('Template hint button: Hint triggered');
        } else {
            console.log('Template hint button: No hint available');
            alert('רמז לא זמין עבור שאלה זו');
        }
    });
    
    // Position below questions
    var questions = quizContainer.find('.wpProQuiz_question, .wpProQuiz_listItem, [class*="question"]');
    console.log('Template hint button: Questions found:', questions.length);
    
    if (questions.length > 0) {
        questions.last().after(hintButton);
        console.log('Template hint button: Added after last question');
    } else {
        quizContainer.append(hintButton);
        console.log('Template hint button: Added to container end');
    }
    
    console.log('Template hint button: Created successfully');
});
</script>
<?php endif; ?>
