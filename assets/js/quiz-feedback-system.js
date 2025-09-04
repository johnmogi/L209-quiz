/**
 * Quiz Feedback System - Enhanced Implementation
 * Provides always-visible hint button functionality with multiple fallback approaches
 */

(function($) {
    'use strict';

    console.log('Quiz Feedback System: Starting enhanced version...');
    
    var hintButtonCreated = false;
    var retryCount = 0;
    var maxRetries = 10;

    function createHintButton() {
        console.log('Quiz Feedback System: Creating hint button... (attempt ' + (retryCount + 1) + ')');
        
        if (hintButtonCreated) {
            console.log('Quiz Feedback System: Hint button already created, skipping');
            return;
        }
        
        // Remove existing hint button
        $('.lilac-hint-message').remove();
        
        // Try multiple selectors for quiz container
        var quizContainer = $('.wpProQuiz_content').first();
        if (!quizContainer.length) {
            quizContainer = $('.wpProQuiz_quiz').first();
        }
        if (!quizContainer.length) {
            quizContainer = $('#wpProQuiz_1').first();
        }
        if (!quizContainer.length) {
            quizContainer = $('[id^="wpProQuiz_"]').first();
        }
        
        console.log('Quiz Feedback System: Quiz container search result:', quizContainer.length);
        
        if (!quizContainer.length) {
            retryCount++;
            if (retryCount < maxRetries) {
                console.log('Quiz container not found, retrying in 1 second...');
                setTimeout(createHintButton, 1000);
            } else {
                console.log('Quiz container not found after ' + maxRetries + ' attempts, giving up');
            }
            return;
        }

        console.log('Quiz Feedback System: Quiz container found:', quizContainer[0]);

        // Create hint button with enhanced styling
        var hintButton = $('<div class="lilac-hint-message" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; margin: 10px 0; border-radius: 8px; text-align: center; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: all 0.3s ease; z-index: 9999; position: relative;">🔍 לחץ כאן לקבלת רמז</div>');
        
        // Add click handler with multiple hint button selectors
        hintButton.on('click', function() {
            console.log('Quiz Feedback System: Hint button clicked, searching for hint...');
            
            var hintBtn = $('.wpProQuiz_hint').first();
            if (!hintBtn.length) {
                hintBtn = $('.wpProQuiz_tip').first();
            }
            if (!hintBtn.length) {
                hintBtn = $('[class*="hint"]').first();
            }
            if (!hintBtn.length) {
                hintBtn = $('[class*="tip"]').first();
            }
            
            console.log('Quiz Feedback System: Found hint button:', hintBtn.length);
            
            if (hintBtn.length) {
                hintBtn.click();
                console.log('Quiz Feedback System: Hint triggered successfully');
            } else {
                console.log('Quiz Feedback System: No hint button found on page');
                alert('רמז לא זמין עבור שאלה זו');
            }
        });
        
        // Add to page - try multiple insertion methods
        try {
            quizContainer.prepend(hintButton);
            console.log('Quiz Feedback System: Hint button added with prepend');
        } catch (e) {
            try {
                quizContainer.before(hintButton);
                console.log('Quiz Feedback System: Hint button added with before');
            } catch (e2) {
                try {
                    $('body').append(hintButton);
                    console.log('Quiz Feedback System: Hint button added to body as fallback');
                } catch (e3) {
                    console.log('Quiz Feedback System: Failed to add hint button:', e3);
                    return;
                }
            }
        }
        
        hintButtonCreated = true;
        console.log('Quiz Feedback System: Hint button created successfully');
        
        // Verify button is visible
        setTimeout(function() {
            var addedButton = $('.lilac-hint-message');
            console.log('Quiz Feedback System: Verification - button exists:', addedButton.length);
            if (addedButton.length) {
                console.log('Quiz Feedback System: Button is visible and ready');
            }
        }, 100);
    }

    // Multiple initialization approaches
    $(document).ready(function() {
        console.log('Quiz Feedback System: DOM ready, initializing...');
        createHintButton();
        
        // Also try after additional delays
        setTimeout(createHintButton, 500);
        setTimeout(createHintButton, 1000);
        setTimeout(createHintButton, 2000);
    });
    
    // Try immediately if DOM is already ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('Quiz Feedback System: DOM already ready, initializing immediately...');
        setTimeout(createHintButton, 100);
    }

    console.log('Quiz Feedback System: Enhanced script loaded');

})(jQuery);
