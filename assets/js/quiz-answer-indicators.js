/**
 * Quiz Answer Indicators - Visual feedback system
 * Uses the debugger system as source of truth for answer correctness
 * Displays proper visual indicators based on actual quiz state
 */

(function($) {
    'use strict';

    const AnswerIndicators = {
        
        /**
         * Initialize the answer indicators system
         */
        init: function() {
            console.log('[Answer Indicators] Initializing visual feedback system');
            
            // Add CSS styles for indicators
            this.addStyles();
            
            // Set up observers to watch for answer state changes
            this.setupObservers();
            
            // Process any existing answers on page load
            this.processExistingAnswers();
        },

        /**
         * Add CSS styles for the answer indicators
         */
        addStyles: function() {
            if ($('#lilac-answer-indicators-styles').length) return;
            
            $('<style id="lilac-answer-indicators-styles">')
                .text(`
                    .lilac-answer-indicator {
                        position: relative;
                        display: inline-block;
                        padding: 8px 16px;
                        border-radius: 4px;
                        font-weight: bold;
                        font-size: 16px;
                        margin: 10px 0;
                        text-align: center;
                        direction: rtl;
                        min-width: 200px;
                    }
                    
                    .lilac-answer-indicator.correct {
                        background-color: #e8f5e8;
                        border: 1px solid #4caf50;
                        color: #2e7d32;
                    }
                    
                    .lilac-answer-indicator.incorrect {
                        background-color: #fff3e0;
                        border: 1px solid #ff9800;
                        color: #e65100;
                    }
                    
                    .lilac-answer-indicator .icon {
                        font-size: 18px;
                        margin-left: 8px;
                    }
                    
                    .lilac-answer-indicator.correct .icon {
                        color: #4caf50;
                    }
                    
                    .lilac-answer-indicator.incorrect .icon {
                        color: #f44336;
                    }
                    
                    /* Position above hint button */
                    .lilac-answer-indicator-container {
                        margin: 15px 0;
                        text-align: center;
                    }
                `)
                .appendTo('head');
        },

        /**
         * Set up mutation observers to watch for answer state changes
         */
        setupObservers: function() {
            const self = this;
            
            // Observer for class changes on answer items
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const $element = $(mutation.target);
                        const $question = $element.closest('.wpProQuiz_listItem');
                        
                        if ($question.length) {
                            // Delay to ensure all classes are applied
                            setTimeout(function() {
                                self.updateIndicatorForQuestion($question);
                            }, 100);
                        }
                    }
                });
            });
            
            // Observe all answer list items for class changes
            $('.wpProQuiz_questionListItem').each(function() {
                observer.observe(this, {
                    attributes: true,
                    attributeFilter: ['class']
                });
            });
            
            // Also observe for new questions being added
            const contentObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        $(mutation.addedNodes).find('.wpProQuiz_questionListItem').each(function() {
                            observer.observe(this, {
                                attributes: true,
                                attributeFilter: ['class']
                            });
                        });
                    }
                });
            });
            
            const quizContainer = document.querySelector('.wpProQuiz_content');
            if (quizContainer) {
                contentObserver.observe(quizContainer, {
                    childList: true,
                    subtree: true
                });
            }
        },

        /**
         * Process existing answers on page load
         */
        processExistingAnswers: function() {
            const self = this;
            $('.wpProQuiz_listItem').each(function() {
                self.updateIndicatorForQuestion($(this));
            });
        },

        /**
         * Update the indicator for a specific question - DISABLED
         */
        updateIndicatorForQuestion: function($question) {
            // Remove any existing indicators - gently clean up
            $question.find('.lilac-answer-indicator-container').fadeOut(300, function() {
                $(this).remove();
            });
            
            // No longer creating new indicators per user request
            return;
        },

        /**
         * Force update all indicators (useful for debugging)
         */
        forceUpdate: function() {
            console.log('[Answer Indicators] Force updating all indicators');
            this.processExistingAnswers();
        }
    };

    // Initialize when document is ready
    $(document).ready(function() {
        // Wait a bit for other scripts to load
        setTimeout(function() {
            AnswerIndicators.init();
        }, 500);
    });

    // Make available globally for debugging
    window.LilacAnswerIndicators = AnswerIndicators;

})(jQuery);
