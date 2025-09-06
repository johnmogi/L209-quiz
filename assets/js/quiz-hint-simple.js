/**
 * Simple Quiz Hint System
 * 
 * Clean, working hint system with toast notifications
 * Based on proven working implementations
 */
(function($) {
    'use strict';
    
    console.log('🚀 LILAC HINT SIMPLE: Script loading...');
    
    // State management
    const state = {
        hintViewed: false,
        wrongAnswerGiven: false,
        initialized: false
    };
    
    console.log('🚀 LILAC HINT SIMPLE: State initialized', state);
    
    /**
     * Create hint toast notification
     */
    function showHintToast() {
        console.log('🍞 LILAC HINT SIMPLE: Creating hint toast...');
        
        // Remove existing toast
        $('.lilac-hint-toast').remove();
        
        const toast = $(`
            <div class="lilac-hint-toast" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 25px;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 16px;
                font-weight: bold;
                text-align: center;
                direction: rtl;
                min-width: 300px;
                cursor: pointer;
                border: 2px solid #4a5568;
                animation: slideInUp 0.5s ease-out;
            ">
                <div style="margin-bottom: 15px; font-size: 18px;">
                    💡 רמז זמין לשאלה זו
                </div>
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 15px;">
                    לחץ כאן לקבלת עזרה
                </div>
                <button class="hint-btn" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    transition: all 0.3s;
                ">
                    הצג רמז
                </button>
            </div>
        `);
        
        // Add CSS animation
        if (!$('#toast-animations').length) {
            $('head').append(`
                <style id="toast-animations">
                    @keyframes slideInUp {
                        from { 
                            transform: translateY(100px);
                            opacity: 0;
                        }
                        to { 
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                    .lilac-hint-toast:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5);
                    }
                    .hint-btn:hover {
                        background: rgba(255,255,255,0.3) !important;
                        transform: scale(1.05);
                    }
                </style>
            `);
        }
        
        // Add click handlers
        toast.on('click', triggerHint);
        toast.find('.hint-btn').on('click', function(e) {
            e.stopPropagation();
            triggerHint();
        });
        
        $('body').append(toast);
        console.log('✅ LILAC HINT SIMPLE: Toast added to body');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            console.log('⏰ LILAC HINT SIMPLE: Auto-hiding toast after 10 seconds');
            toast.fadeOut(500, function() {
                $(this).remove();
            });
        }, 10000);
    }
    
    /**
     * Trigger hint functionality
     */
    function triggerHint() {
        console.log('🎯 LILAC HINT SIMPLE: Triggering hint...');
        
        // Try to find and click native hint button first
        const nativeHintBtn = $('.wpProQuiz_TipButton, .wpProQuiz_tipButton, input[value*="רמז"], button[class*="hint"], .wpProQuiz_button[name="tip"]');
        console.log('🔍 LILAC HINT SIMPLE: Found native hint buttons:', nativeHintBtn.length);
        
        if (nativeHintBtn.length > 0) {
            console.log('✅ LILAC HINT SIMPLE: Clicking native hint button');
            nativeHintBtn.first().trigger('click');
            
            // Wait a moment to see if native hint appears
            setTimeout(() => {
                const $nativeHintContent = $('.wpProQuiz_tipp:visible, .wpProQuiz_response:visible');
                if ($nativeHintContent.length > 0) {
                    console.log('✅ LILAC HINT SIMPLE: Native hint content appeared');
                    state.hintViewed = true;
                    showHintViewedToast();
                } else {
                    console.log('💡 LILAC HINT SIMPLE: Native hint button clicked but no content, showing custom hint');
                    showCustomHint();
                }
            }, 500);
        } else {
            // Always show custom hint when no native button exists
            console.log('💡 LILAC HINT SIMPLE: No native hint found, showing custom hint');
            showCustomHint();
        }
        
        // Hide the hint request toast
        $('.lilac-hint-toast').fadeOut(300, function() {
            $(this).remove();
        });
    }
    
    /**
     * Show custom hint when no native hint available
     */
    function showCustomHint() {
        console.log('💡 LILAC HINT SIMPLE: Showing custom hint modal...');
        const hintContent = getHintForCurrentQuestion();
        
        const hintDisplay = $(`
            <div class="lilac-hint-display" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.3);
                z-index: 15000;
                max-width: 500px;
                width: 90%;
                text-align: center;
                direction: rtl;
                border: 3px solid #667eea;
                font-family: Arial, sans-serif;
            ">
                <div style="color: #667eea; font-size: 24px; margin-bottom: 20px; font-weight: bold;">
                    💡 רמז לשאלה
                </div>
                <div style="font-size: 16px; line-height: 1.6; margin-bottom: 25px; color: #333;">
                    ${hintContent}
                </div>
                <button class="close-hint" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.3s;
                ">הבנתי, תודה</button>
            </div>
        `);
        
        // Add backdrop
        const backdrop = $(`
            <div class="hint-backdrop" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.6);
                z-index: 14000;
                backdrop-filter: blur(2px);
            "></div>
        `);
        
        // Add hover effect
        hintDisplay.find('.close-hint').hover(
            function() { $(this).css('background', '#5a6fd8'); },
            function() { $(this).css('background', '#667eea'); }
        );
        
        hintDisplay.find('.close-hint').on('click', function() {
            console.log('✅ LILAC HINT SIMPLE: Custom hint closed');
            state.hintViewed = true;
            hintDisplay.remove();
            backdrop.remove();
            showHintViewedToast();
        });
        
        backdrop.on('click', function() {
            console.log('✅ LILAC HINT SIMPLE: Custom hint closed via backdrop');
            state.hintViewed = true;
            hintDisplay.remove();
            backdrop.remove();
            showHintViewedToast();
        });
        
        $('body').append(backdrop).append(hintDisplay);
        console.log('✅ LILAC HINT SIMPLE: Custom hint modal displayed');
    }
    
    /**
     * Get hint content for current question
     */
    function getHintForCurrentQuestion() {
        // Try to extract hint from existing hint elements
        const existingHint = $('.wpProQuiz_tipp:visible, .quiz-hint-content:visible').first();
        if (existingHint.length) {
            const hintText = existingHint.text().trim();
            if (hintText && hintText.length > 10) {
                return hintText;
            }
        }
        
        // Default hint messages
        const defaultHints = [
            'קרא שוב את השאלה בעיון ושים לב למילות המפתח.',
            'חשוב על הכללים והחוקים הרלוונטיים לנושא השאלה.',
            'שים לב לפרטים הקטנים בשאלה - לעיתים הם מכילים את המפתח לתשובה.',
            'נסה לחשוב על המצב המתואר בשאלה ומה היית עושה במציאות.'
        ];
        
        return defaultHints[Math.floor(Math.random() * defaultHints.length)];
    }
    
    /**
     * Show confirmation toast after hint viewed
     */
    function showHintViewedToast() {
        $('.lilac-hint-viewed').remove();
        
        const viewedToast = $(`
            <div class="lilac-hint-viewed" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                direction: rtl;
                animation: slideInUp 0.5s ease-out;
            ">
                ✅ רמז נצפה! כעת ניתן להמשיך
            </div>
        `);
        
        $('body').append(viewedToast);
        
        setTimeout(() => {
            viewedToast.fadeOut(500, function() {
                $(this).remove();
            });
        }, 3000);
    }
    
    /**
     * Check if answer is correct using analyzer data
     */
    function checkAnswerCorrectness(selectedValue, questionElement) {
        // Try integrated analyzer first
        if (window.LilacQuizAnalyzer && window.LilacQuizAnalyzer.correctAnswers) {
            const questionId = extractQuestionId(questionElement);
            if (questionId && window.LilacQuizAnalyzer.correctAnswers[questionId]) {
                const correctAnswer = window.LilacQuizAnalyzer.correctAnswers[questionId];
                return parseInt(selectedValue) === correctAnswer;
            }
        }
        
        // Fallback: check DOM feedback after delay
        setTimeout(() => {
            const feedback = $(questionElement).find('.wpProQuiz_response:visible');
            if (feedback.length) {
                const isCorrect = feedback.hasClass('wpProQuiz_correct') || 
                                feedback.text().includes('נכון') ||
                                feedback.text().includes('correct');
                return isCorrect;
            }
        }, 200);
        
        return null;
    }
    
    /**
     * Extract question ID from element
     */
    function extractQuestionId(questionElement) {
        const $question = $(questionElement);
        
        // Try various methods to get question ID
        const questionIdInput = $question.find('input[name*="question_pro_id"]');
        if (questionIdInput.length) {
            return questionIdInput.val();
        }
        
        const dataAttr = $question.find('[data-question-pro-id]');
        if (dataAttr.length) {
            return dataAttr.attr('data-question-pro-id');
        }
        
        return null;
    }
    
    /**
     * Handle answer selection
     */
    function handleAnswerSelection(event) {
        const $input = $(event.target);
        const selectedValue = $input.val();
        const questionElement = $input.closest('.wpProQuiz_listItem')[0];
        
        if (!questionElement) return;
        
        // Small delay for answer processing
        setTimeout(() => {
            const isCorrect = checkAnswerCorrectness(selectedValue, questionElement);
            
            if (isCorrect === false && !state.hintViewed) {
                // Wrong answer and no hint viewed - show hint toast
                state.wrongAnswerGiven = true;
                showHintToast();
            } else if (isCorrect === true) {
                // Correct answer - hide any hint toasts
                $('.lilac-hint-toast').fadeOut(300, function() {
                    $(this).remove();
                });
                
                // Show success message
                const successToast = $(`
                    <div style="
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background: #28a745;
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                        z-index: 10000;
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        font-weight: bold;
                        text-align: center;
                        direction: rtl;
                        animation: slideInUp 0.5s ease-out;
                    ">
                        ✅ כל הכבוד! תשובה נכונה
                    </div>
                `);
                
                $('body').append(successToast);
                
                setTimeout(() => {
                    successToast.fadeOut(500, function() {
                        $(this).remove();
                    });
                }, 2500);
            }
        }, 300);
    }
    
    /**
     * Initialize the hint system
     */
    function init() {
        console.log('🔧 LILAC HINT SIMPLE: Initializing...');
        
        if (state.initialized) {
            console.log('⚠️ LILAC HINT SIMPLE: Already initialized');
            return;
        }
        
        // Check if hint enforcement is enabled
        const hasEnforceHint = $('body').hasClass('enforce-hint');
        console.log('🔍 LILAC HINT SIMPLE: Body has enforce-hint class:', hasEnforceHint);
        console.log('🔍 LILAC HINT SIMPLE: Body classes:', $('body').attr('class'));
        
        if (!hasEnforceHint) {
            console.log('❌ LILAC HINT SIMPLE: Hint enforcement not enabled, skipping');
            return;
        }
        
        // Check for quiz elements
        const quizElements = $('.wpProQuiz_questionListItem, .wpProQuiz_listItem, .wpProQuiz_content');
        console.log('🔍 LILAC HINT SIMPLE: Found quiz elements:', quizElements.length);
        
        // Set up event delegation for answer selection
        $(document).on('change click', '.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]', function(e) {
            console.log('🎯 LILAC HINT SIMPLE: Answer selection detected!', e.target);
            handleAnswerSelection(e);
        });
        
        state.initialized = true;
        console.log('✅ LILAC HINT SIMPLE: Initialization complete!');
        
        // Test function - show toast immediately for testing
        window.testHintToast = function() {
            console.log('🧪 LILAC HINT SIMPLE: Testing toast...');
            showHintToast();
        };
        
        console.log('🧪 LILAC HINT SIMPLE: Test function available - call testHintToast() in console');
    }
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        console.log('🚀 LILAC HINT SIMPLE: DOM ready, initializing...');
        setTimeout(init, 500);
    });
    
    console.log('🚀 LILAC HINT SIMPLE: Script loaded completely!');
    
    // Make functions globally available for debugging
    window.lilacHintSimple = {
        showToast: showHintToast,
        triggerHint: triggerHint,
        state: state
    };

})(jQuery);
