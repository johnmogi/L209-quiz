/**
 * CONSOLIDATED Quiz System - Single File Solution
 * Consolidates: quiz-answer-fix.js + quiz-comprehensive-system.js + quiz-integrated-analyzer.js
 * ONLY removes false positives - does NOT add correct answer indicators
 */

(function($) {
    'use strict';
    
    console.log('🔧 CONSOLIDATED Quiz System: Starting...');
    
    // Global state
    window.LilacQuizSystem = {
        initialized: false,
        
        init: function() {
            console.log('🔧 Consolidated System: Initializing...');
            
            this.setupAnswerFix();
            this.setupMutationObserver();
            
            this.initialized = true;
            console.log('🔧 Consolidated System: Ready');
        },
        
        // CORE FUNCTION: Remove ALL false positive "Correct answer" indicators
        removeAllFalsePositives: function() {
            console.log('🔧 Consolidated System: Removing false positives...');
            
            // Hide ALL "Correct answer" labels completely
            $('.ld-quiz-question-item__status--missed').each(function() {
                const $this = $(this);
                if ($this.text().includes('Correct answer') || $this.text().includes('תשובה נכונה')) {
                    $this.hide();
                }
            });
            
            // Additional cleanup for any other elements showing "Correct answer"
            $('*').filter(function() {
                return $(this).text().includes('Correct answer');
            }).hide();
        },
        
        // Setup answer fix with repeated cleanup
        setupAnswerFix: function() {
            // Run cleanup immediately and repeatedly
            this.removeAllFalsePositives();
            
            setTimeout(() => this.removeAllFalsePositives(), 100);
            setTimeout(() => this.removeAllFalsePositives(), 500);
            setTimeout(() => this.removeAllFalsePositives(), 1000);
            setTimeout(() => this.removeAllFalsePositives(), 2000);
            setTimeout(() => this.removeAllFalsePositives(), 3000);
        },
        
        // Setup mutation observer for dynamic content
        setupMutationObserver: function() {
            const self = this;
            
            const observer = new MutationObserver(function(mutations) {
                let shouldCleanup = false;
                
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) {
                                if ($(node).hasClass('wpProQuiz_content') || 
                                    $(node).find('.wpProQuiz_content').length > 0 ||
                                    $(node).hasClass('wpProQuiz_questionList') ||
                                    $(node).find('.wpProQuiz_questionList').length > 0) {
                                    shouldCleanup = true;
                                }
                            }
                        });
                    }
                });
                
                if (shouldCleanup) {
                    setTimeout(() => {
                        self.removeAllFalsePositives();
                    }, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    };
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        console.log('🔧 CONSOLIDATED Quiz System: DOM Ready');
        window.LilacQuizSystem.init();
        
        // Additional cleanup after page loads
        setTimeout(function() {
            window.LilacQuizSystem.removeAllFalsePositives();
        }, 2000);
    });
    
})(jQuery);
