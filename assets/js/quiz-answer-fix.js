/**
 * Quiz Answer Display Fix
 * Fixes the issue where all answers show "Correct answer" instead of only the actually correct one
 */

(function($) {
    'use strict';
    
    console.log('🔧 Quiz Answer Fix: Script loaded');
    
    $(document).ready(function() {
        console.log('🔧 Quiz Answer Fix: Initializing...');
        
        // Run fix immediately and repeatedly to catch dynamic content
        fixQuizAnswerDisplay();
        
        // Run fix multiple times with different delays to catch all quiz loading scenarios
        setTimeout(fixQuizAnswerDisplay, 500);
        setTimeout(fixQuizAnswerDisplay, 1000);
        setTimeout(fixQuizAnswerDisplay, 2000);
        setTimeout(fixQuizAnswerDisplay, 3000);
        
        // Watch for DOM changes and reapply fix
        const observer = new MutationObserver(function(mutations) {
            let shouldFix = false;
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            if ($(node).hasClass('wpProQuiz_content') || 
                                $(node).find('.wpProQuiz_content').length > 0 ||
                                $(node).hasClass('wpProQuiz_questionList') ||
                                $(node).find('.wpProQuiz_questionList').length > 0) {
                                shouldFix = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldFix) {
                setTimeout(fixQuizAnswerDisplay, 100);
            }
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
    
    function fixQuizAnswerDisplay() {
        console.log('🔧 Quiz Answer Fix: Running fix...');
        
        // First, hide ALL "Correct answer" labels to prevent the issue
        $('.ld-quiz-question-item__status--missed').each(function() {
            const $this = $(this);
            if ($this.text().includes('Correct answer') || $this.text().includes('תשובה נכונה')) {
                $this.hide();
                console.log('🔧 Quiz Answer Fix: Hidden incorrect label');
            }
        });
        
        // Try to get quiz data and mark correct answers properly
        if (typeof window.lilacQuizData !== 'undefined' && window.lilacQuizData.questions) {
            console.log('🔧 Quiz Answer Fix: Found quiz data with', window.lilacQuizData.questions.length, 'questions');
            
            // Process each question
            $('.wpProQuiz_questionList').each(function(questionIndex) {
                const $question = $(this);
                const questionData = window.lilacQuizData.questions[questionIndex];
                
                if (!questionData) return;
                
                console.log('🔧 Quiz Answer Fix: Processing question', questionIndex + 1, 'ID:', questionData.id);
                
                // Find the correct answer and show only that one
                if (questionData.answers && Array.isArray(questionData.answers)) {
                    questionData.answers.forEach(function(answer, answerIndex) {
                        if (answer.is_correct) {
                            const $answerItem = $question.find('.wpProQuiz_questionListItem').eq(answerIndex);
                            let $statusEl = $answerItem.find('.ld-quiz-question-item__status--missed');
                            
                            // If no status element exists, create one
                            if ($statusEl.length === 0) {
                                $statusEl = $('<span class="ld-quiz-question-item__status--missed"></span>');
                                $answerItem.append($statusEl);
                            }
                            
                            $statusEl.show().text('✓ תשובה נכונה').css({
                                'color': '#4CAF50',
                                'font-weight': 'bold',
                                'background': '#E8F5E8',
                                'padding': '2px 6px',
                                'border-radius': '3px',
                                'margin-left': '10px',
                                'display': 'inline-block'
                            });
                            
                            $answerItem.addClass('quiz-correct-answer');
                            
                            console.log('🔧 Quiz Answer Fix: Marked answer', answerIndex + 1, 'as correct for question', questionData.id);
                        }
                    });
                }
            });
        } else {
            console.log('🔧 Quiz Answer Fix: No quiz data available - applying basic cleanup only');
        }
        
        // Additional cleanup - remove any remaining incorrect labels
        setTimeout(function() {
            $('.ld-quiz-question-item__status--missed').each(function() {
                const $this = $(this);
                const text = $this.text().trim();
                if (text === 'Correct answer' || text === 'תשובה נכונה') {
                    // Only hide if it's not our marked correct answer
                    if (!$this.parent().hasClass('quiz-correct-answer')) {
                        $this.hide();
                    }
                }
            });
        }, 100);
    }
    
})(jQuery);
