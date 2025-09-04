/**
 * Quiz Hint Button Force - Bypass all caching issues
 * Creates always-visible hint button with aggressive initialization
 */

(function($) {
    'use strict';

    console.log('Quiz Hint Button Force: Starting...');
    
    var buttonCreated = false;
    var attempts = 0;
    var maxAttempts = 15;

    function forceCreateHintButton() {
        attempts++;
        console.log('Quiz Hint Button Force: Attempt', attempts);
        
        if (buttonCreated) {
            console.log('Quiz Hint Button Force: Button already created');
            return;
        }
        
        // Check if body has enforce-hint class
        var hasEnforceHint = $('body').hasClass('enforce-hint');
        console.log('Quiz Hint Button Force: Body has enforce-hint class:', hasEnforceHint);
        
        if (!hasEnforceHint) {
            console.log('Quiz Hint Button Force: No enforce-hint class, skipping hint button creation');
            return;
        }
        
        // Remove any existing hint buttons
        $('.lilac-hint-message, .lilac-force-hint').remove();
        
        // Try multiple quiz container selectors
        var containers = [
            '.wpProQuiz_content',
            '.wpProQuiz_quiz', 
            '#wpProQuiz_1',
            '[id^="wpProQuiz_"]',
            '.quiz-container',
            '.learndash-quiz-container',
            '.ld-quiz-container'
        ];
        
        var quizContainer = null;
        for (var i = 0; i < containers.length; i++) {
            var found = $(containers[i]).first();
            if (found.length > 0) {
                quizContainer = found;
                console.log('Quiz Hint Button Force: Found container with selector:', containers[i]);
                break;
            }
        }
        
        if (!quizContainer || !quizContainer.length) {
            if (attempts < maxAttempts) {
                console.log('Quiz Hint Button Force: No container found, retrying in 800ms...');
                setTimeout(forceCreateHintButton, 800);
            } else {
                console.log('Quiz Hint Button Force: Giving up after', maxAttempts, 'attempts');
            }
            return;
        }
        
        // Check if there are actual hint buttons available
        var availableHints = $('.wpProQuiz_hint, .wpProQuiz_tip, [class*="hint"]').length;
        console.log('Quiz Hint Button Force: Available hint buttons found:', availableHints);
        
        if (availableHints === 0) {
            console.log('Quiz Hint Button Force: No hint buttons available, skipping creation');
            return;
        }

        console.log('Quiz Hint Button Force: Creating button...');

        // Create hint button with unique class
        var hintButton = $('<div class="lilac-force-hint" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; margin: 10px 0; border-radius: 8px; text-align: center; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: all 0.3s ease; z-index: 99999; position: relative; border: 2px solid #4a5568;">🔍 לחץ כאן לקבלת רמז</div>');
        
        // Add click handler with multiple hint selectors
        hintButton.on('click', function() {
            console.log('Quiz Hint Button Force: Button clicked!');
            
            var hintSelectors = [
                '.wpProQuiz_hint',
                '.wpProQuiz_tip', 
                '[class*="hint"]',
                '[class*="tip"]',
                '.quiz-hint',
                '.learndash-hint'
            ];
            
            var hintBtn = null;
            for (var j = 0; j < hintSelectors.length; j++) {
                var found = $(hintSelectors[j]).first();
                if (found.length > 0) {
                    hintBtn = found;
                    console.log('Quiz Hint Button Force: Found hint with selector:', hintSelectors[j]);
                    break;
                }
            }
            
            if (hintBtn && hintBtn.length) {
                hintBtn.click();
                console.log('Quiz Hint Button Force: Hint triggered successfully');
            } else {
                console.log('Quiz Hint Button Force: No hint button found');
                alert('רמז לא זמין עבור שאלה זו');
            }
        });
        
        // Find questions to position hint button below them
        var questions = quizContainer.find('.wpProQuiz_question, .wpProQuiz_listItem, [class*="question"]');
        console.log('Quiz Hint Button Force: Found questions:', questions.length);
        
        // Insert button below questions, or at end of container if no questions found
        try {
            if (questions.length > 0) {
                // Position after the last question
                questions.last().after(hintButton);
                console.log('Quiz Hint Button Force: Button added after last question');
            } else {
                // Fallback: add at end of quiz container
                quizContainer.append(hintButton);
                console.log('Quiz Hint Button Force: Button added at end of container');
            }
        } catch (e) {
            try {
                quizContainer.append(hintButton);
                console.log('Quiz Hint Button Force: Button added with append fallback');
            } catch (e2) {
                $('body').append(hintButton);
                console.log('Quiz Hint Button Force: Button added to body as last resort');
            }
        }
        
        buttonCreated = true;
        console.log('Quiz Hint Button Force: SUCCESS - Button created and added!');
        
        // Verify after short delay
        setTimeout(function() {
            var verification = $('.lilac-force-hint');
            console.log('Quiz Hint Button Force: Verification - buttons exist:', verification.length);
            if (verification.length > 0) {
                console.log('Quiz Hint Button Force: Button is visible and ready');
            } else {
                console.log('Quiz Hint Button Force: WARNING - Button not found in verification');
            }
        }, 200);
    }

    // Multiple initialization strategies with debug logging
    console.log('Quiz Hint Button Force: Setting up initialization...');
    
    // Strategy 1: Immediate
    setTimeout(function() {
        console.log('Quiz Hint Button Force: Immediate timeout triggered');
        forceCreateHintButton();
    }, 100);
    
    // Strategy 2: DOM ready
    $(document).ready(function() {
        console.log('Quiz Hint Button Force: DOM ready triggered');
        setTimeout(function() {
            console.log('Quiz Hint Button Force: DOM ready timeout triggered');
            forceCreateHintButton();
        }, 200);
    });
    
    // Strategy 3: Window load
    $(window).on('load', function() {
        console.log('Quiz Hint Button Force: Window load triggered');
        setTimeout(function() {
            console.log('Quiz Hint Button Force: Window load timeout triggered');
            forceCreateHintButton();
        }, 300);
    });
    
    // Strategy 4: Multiple delays with logging
    setTimeout(function() {
        console.log('Quiz Hint Button Force: 500ms timeout triggered');
        forceCreateHintButton();
    }, 500);
    
    setTimeout(function() {
        console.log('Quiz Hint Button Force: 1000ms timeout triggered');
        forceCreateHintButton();
    }, 1000);
    
    setTimeout(function() {
        console.log('Quiz Hint Button Force: 2000ms timeout triggered');
        forceCreateHintButton();
    }, 2000);

    console.log('Quiz Hint Button Force: Script loaded and initialized');

})(jQuery);
