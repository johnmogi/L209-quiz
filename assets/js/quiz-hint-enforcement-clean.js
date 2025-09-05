/**
 * LearnDash Quiz - Clean Hint Enforcement System
 * 
 * Simple, reliable hint enforcement for quiz questions
 * Shows hint requirement after wrong answers
 */
(function($) {
    'use strict';
    
    // State management
    const state = {
        hintViewed: false,
        wrongAnswerGiven: false
    };
    
    /**
     * Check if answer is correct using integrated analyzer data
     */
    function isAnswerCorrect(selectedValue, questionElement) {
        // Try to get correct answer from integrated analyzer
        if (window.LilacQuizAnalyzer && window.LilacQuizAnalyzer.correctAnswers) {
            const questionId = extractQuestionId(questionElement);
            if (questionId && window.LilacQuizAnalyzer.correctAnswers[questionId]) {
                const correctAnswerIndex = window.LilacQuizAnalyzer.correctAnswers[questionId];
                return parseInt(selectedValue) === correctAnswerIndex;
            }
        }
        
        // Fallback: Check DOM feedback
        setTimeout(() => {
            const feedbackElements = questionElement.querySelectorAll('.wpProQuiz_response');
            for (let feedback of feedbackElements) {
                if (feedback.style.display !== 'none') {
                    return feedback.classList.contains('wpProQuiz_correct') || 
                           feedback.textContent.includes('נכון') ||
                           feedback.textContent.includes('correct');
                }
            }
        }, 100);
        
        return null; // Unknown
    }
    
    /**
     * Extract question ID from question element
     */
    function extractQuestionId(questionElement) {
        const questionIdInput = questionElement.querySelector('input[name*="question_pro_id"]');
        if (questionIdInput) {
            return questionIdInput.value;
        }
        
        const dataAttr = questionElement.querySelector('[data-question-pro-id]');
        if (dataAttr) {
            return dataAttr.getAttribute('data-question-pro-id');
        }
        
        return null;
    }
    
    /**
     * Show permanent hint requirement box
     */
    function showPermanentHintBox() {
        // Remove existing box
        $('.lilac-permanent-hint-box').remove();
        
        const hintBox = $(`
            <div class="lilac-permanent-hint-box" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #4a90e2, #5ba0f2);
                color: white;
                padding: 25px 35px;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(74, 144, 226, 0.4);
                z-index: 20000;
                font-family: Arial, sans-serif;
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                direction: rtl;
                min-width: 400px;
                backdrop-filter: blur(5px);
                border: 2px solid #3a7bc8;
                animation: hintPulse 2s infinite;
            ">
                <div style="margin-bottom: 20px; font-size: 20px;">
                    💡 חובה לצפות ברמז לפני המשך
                </div>
                <button class="hint-trigger-btn" style="
                    background: white;
                    color: #4a90e2;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                ">
                    לחץ לצפייה ברמז
                </button>
            </div>
        `);
        
        // Add CSS animation
        if (!$('#hint-pulse-animation').length) {
            $('head').append(`
                <style id="hint-pulse-animation">
                    @keyframes hintPulse {
                        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.95; }
                        50% { transform: translate(-50%, -50%) scale(1.02); opacity: 1; }
                        100% { transform: translate(-50%, -50%) scale(1); opacity: 0.95; }
                    }
                    .hint-trigger-btn:hover {
                        background: #f0f8ff !important;
                        transform: scale(1.05) !important;
                    }
                </style>
            `);
        }
        
        // Add click handler
        hintBox.find('.hint-trigger-btn').on('click', function() {
            triggerHintButton();
        });
        
        $('body').append(hintBox);
    }
    
    /**
     * Hide permanent hint box
     */
    function hidePermanentHintBox() {
        $('.lilac-permanent-hint-box').fadeOut(300, function() {
            $(this).remove();
        });
    }
    
    /**
     * Trigger the actual hint button
     */
    function triggerHintButton() {
        const hintButton = $('.wpProQuiz_TipButton, .wpProQuiz_button[name="tip"]').first();
        
        if (hintButton.length) {
            hintButton.click();
            
            // Wait for hint to be revealed, then mark as viewed
            setTimeout(() => {
                state.hintViewed = true;
                hidePermanentHintBox();
                showSuccessMessage();
                enableAllInputs();
            }, 500);
        } else {
            // No hint button found, show generic message
            showGenericHint();
        }
    }
    
    /**
     * Show generic hint when no hint button available
     */
    function showGenericHint() {
        const modal = $(`
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.6);
                z-index: 25000;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 500px;
                    text-align: center;
                    direction: rtl;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <h3 style="color: #4a90e2; margin-bottom: 20px; font-size: 22px;">💡 רמז לשאלה</h3>
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px; color: #555;">
                        קרא שוב את השאלה בעיון ושים לב למילות המפתח. חשוב על הכללים והחוקים הרלוונטיים לנושא.
                    </p>
                    <button class="close-hint-modal" style="
                        background: #4a90e2;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    ">הבנתי, תודה</button>
                </div>
            </div>
        `);
        
        modal.find('.close-hint-modal').on('click', function() {
            state.hintViewed = true;
            modal.remove();
            hidePermanentHintBox();
            showSuccessMessage();
            enableAllInputs();
        });
        
        $('body').append(modal);
    }
    
    /**
     * Show success message after hint viewed
     */
    function showSuccessMessage() {
        $('.lilac-success-message').remove();
        
        const successMsg = $(`
            <div class="lilac-success-message" style="
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #d4edda;
                color: #155724;
                padding: 15px 25px;
                border-radius: 8px;
                border: 2px solid #28a745;
                font-weight: bold;
                z-index: 15000;
                direction: rtl;
                box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            ">
                ✅ רמז נצפה! כעת ניתן לבחור תשובה מחדש
            </div>
        `);
        
        $('body').append(successMsg);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            successMsg.fadeOut(500, function() {
                $(this).remove();
            });
        }, 5000);
    }
    
    /**
     * Block all quiz inputs
     */
    function blockAllInputs() {
        const inputs = $('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
        
        inputs.each(function() {
            const $input = $(this);
            
            // Store original state
            $input.data('original-disabled', $input.prop('disabled'));
            $input.data('original-opacity', $input.css('opacity'));
            
            // Disable input
            $input.prop('disabled', true);
            $input.css({
                'opacity': '0.3',
                'pointer-events': 'none',
                'cursor': 'not-allowed'
            });
            
            // Add visual overlay to parent
            const $container = $input.closest('.wpProQuiz_questionListItem');
            if ($container.length && !$container.find('.quiz-blocked-overlay').length) {
                $container.css('position', 'relative').append(`
                    <div class="quiz-blocked-overlay" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(220, 53, 69, 0.1);
                        border: 2px dashed #dc3545;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                        pointer-events: none;
                        font-weight: bold;
                        color: #dc3545;
                        font-size: 14px;
                        text-align: center;
                        direction: rtl;
                    ">
                        🚫<br>חסום עד צפייה ברמז
                    </div>
                `);
            }
        });
    }
    
    /**
     * Enable all quiz inputs
     */
    function enableAllInputs() {
        const inputs = $('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
        
        inputs.each(function() {
            const $input = $(this);
            
            // Restore original state
            $input.prop('disabled', $input.data('original-disabled') || false);
            $input.css({
                'opacity': $input.data('original-opacity') || '1',
                'pointer-events': 'auto',
                'cursor': 'pointer'
            });
            
            // Remove stored data
            $input.removeData('original-disabled original-opacity');
            
            // Remove visual overlay
            const $container = $input.closest('.wpProQuiz_questionListItem');
            $container.find('.quiz-blocked-overlay').remove();
            $container.css('position', '');
        });
    }
    
    /**
     * Handle answer selection
     */
    function handleAnswerSelection(event) {
        const $input = $(event.target);
        const selectedValue = $input.val();
        const questionElement = $input.closest('.wpProQuiz_listItem')[0];
        
        if (!questionElement) return;
        
        // Small delay to allow for answer processing
        setTimeout(() => {
            const isCorrect = isAnswerCorrect(selectedValue, questionElement);
            
            if (isCorrect === true) {
                // Correct answer - hide hint box and show success
                hidePermanentHintBox();
                $('.lilac-success-message').remove();
                
                const correctMsg = $(`
                    <div class="lilac-success-message" style="
                        position: fixed;
                        bottom: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #d4edda;
                        color: #155724;
                        padding: 15px 25px;
                        border-radius: 8px;
                        border: 2px solid #28a745;
                        font-weight: bold;
                        z-index: 15000;
                        direction: rtl;
                        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                    ">
                        ✅ כל הכבוד! תשובה נכונה
                    </div>
                `);
                
                $('body').append(correctMsg);
                
                setTimeout(() => {
                    correctMsg.fadeOut(500, function() {
                        $(this).remove();
                    });
                }, 3000);
                
            } else if (isCorrect === false && !state.hintViewed) {
                // Wrong answer and hint not viewed - block inputs and show hint requirement
                state.wrongAnswerGiven = true;
                blockAllInputs();
                showPermanentHintBox();
            }
        }, 200);
    }
    
    /**
     * Initialize the hint enforcement system
     */
    function init() {
        // Set up event delegation for answer selection
        $(document).on('change click', '.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]', handleAnswerSelection);
        
        // Reset state for each new question/page
        state.hintViewed = false;
        state.wrongAnswerGiven = false;
        
        // Remove any existing overlays on init
        $('.quiz-blocked-overlay, .lilac-permanent-hint-box, .lilac-success-message').remove();
        enableAllInputs();
    }
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        // Wait a bit for quiz to load
        setTimeout(init, 500);
    });
    
    // Make functions globally available for debugging
    window.lilacHintSystem = {
        showHintBox: showPermanentHintBox,
        hideHintBox: hidePermanentHintBox,
        enableInputs: enableAllInputs,
        blockInputs: blockAllInputs,
        state: state
    };

})(jQuery);
