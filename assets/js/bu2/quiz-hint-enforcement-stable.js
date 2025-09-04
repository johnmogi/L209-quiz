/**
 * LearnDash Quiz - STABILIZED VERSION (Post-Deadline)
 * 
 * HINT ENFORCEMENT DISABLED FOR STABILITY
 * Only detection and logging active - no user blocking
 * Date: 2025-01-09 - Cache-busted stable version
 */
(function($) {
    'use strict';
    
    // Configuration - ENFORCEMENT DISABLED
    const config = {
        debug: false,
        enforceHintDelay: 300,
        observerDelay: 500,
        tooltipText: 'טעית! להמשך חובה לקחת רמז!',
        answerDetection: true,
        ENFORCEMENT_DISABLED: true  // CRITICAL: Enforcement disabled for stability
    };
    
    // State management
    const state = {
        hintViewed: false,
        canProceed: true,  // Always allow proceeding in stable mode
        currentQuestion: null,
        initialized: false
    };
    
    // Debug logger - minimal logging for production
    const log = {
        info: function(message, data) {
            if (config.debug) {
                console.log('[Quiz Stable]', message, data || '');
            }
        },
        error: function(message, data) {
            console.error('[Quiz Stable ERROR]', message, data || '');
        }
    };
    
    log.info('Quiz hint enforcement STABLE script loaded - enforcement DISABLED');
    
    /**
     * FORCE REMOVE ALL BLOCKING - Critical for stability
     */
    function forceRemoveAllBlocking() {
        log.info('🔓 Force removing all blocking elements');
        
        // Remove all overlays
        document.querySelectorAll('.quiz-blocked-overlay, .permanent-hint-box').forEach(el => el.remove());
        
        // Enable all inputs
        const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
        inputs.forEach(input => {
            input.disabled = false;
            input.style.opacity = '';
            input.style.pointerEvents = '';
            input.style.cursor = '';
            input.removeAttribute('data-quiz-blocked');
            
            // Restore container opacity
            const container = input.closest('.wpProQuiz_questionListItem');
            if (container) {
                container.style.opacity = '';
                container.style.position = '';
            }
        });
        
        // Remove any event listeners that might block
        document.querySelectorAll('[data-enforcement-listener]').forEach(el => {
            el.removeAttribute('data-enforcement-listener');
        });
        
        log.info('✅ All blocking removed - quiz inputs are free');
    }
    
    /**
     * Check if answer is correct using debugger data
     */
    function checkAnswerFromDebuggerData(selectedIndex) {
        if (window.quizDetector && window.quizDetector.correctAnswers) {
            const correctAnswers = window.quizDetector.correctAnswers;
            if (correctAnswers.answers && Array.isArray(correctAnswers.answers)) {
                const correctAnswer = correctAnswers.answers.find(answer => answer.correct === true);
                if (correctAnswer) {
                    log.info('Debugger data - Correct answer index:', correctAnswer.index);
                    log.info('Selected index:', selectedIndex);
                    
                    // Multiple comparison methods for robustness
                    if (correctAnswer.index == selectedIndex) return true;
                    if (parseInt(correctAnswer.index) === parseInt(selectedIndex)) return true;
                    if (String(correctAnswer.index) === String(selectedIndex)) return true;
                    return false;
                }
            }
        }
        return null;
    }
    
    /**
     * Check if answer is correct from DOM feedback
     */
    function checkAnswerFromDOM() {
        const feedbackElements = document.querySelectorAll('.wpProQuiz_response');
        for (let feedback of feedbackElements) {
            if (feedback.style.display !== 'none') {
                const isCorrect = feedback.classList.contains('wpProQuiz_correct') || 
                                feedback.textContent.includes('נכון') ||
                                feedback.textContent.includes('correct');
                log.info('DOM feedback check - Is correct:', isCorrect);
                return isCorrect;
            }
        }
        return null;
    }
    
    /**
     * Handle answer selection - DETECTION ONLY, NO BLOCKING
     */
    function handleAnswerSelection(event) {
        if (config.ENFORCEMENT_DISABLED) {
            log.info('📊 Answer selected - detection only (no blocking)');
            
            const selectedInput = event.target;
            const selectedIndex = parseInt(selectedInput.value);
            
            // Detect correctness for logging purposes only
            setTimeout(() => {
                let isCorrect = checkAnswerFromDebuggerData(selectedIndex);
                if (isCorrect === null) {
                    isCorrect = checkAnswerFromDOM();
                }
                
                if (isCorrect === true) {
                    log.info('✅ Correct answer detected');
                } else if (isCorrect === false) {
                    log.info('❌ Wrong answer detected - but no blocking applied');
                } else {
                    log.info('❓ Answer correctness could not be determined');
                }
                
                // Ensure no blocking is applied
                forceRemoveAllBlocking();
            }, 100);
            
            return;
        }
    }
    
    /**
     * Initialize the stable system
     */
    function initializeStableSystem() {
        if (state.initialized) {
            log.info('System already initialized');
            return;
        }
        
        log.info('🚀 Initializing STABLE quiz system (enforcement disabled)');
        
        // Force remove any existing blocking immediately
        forceRemoveAllBlocking();
        
        // Set up minimal event listeners for detection only
        if (config.answerDetection) {
            const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
            inputs.forEach(input => {
                input.addEventListener('change', handleAnswerSelection);
                input.setAttribute('data-enforcement-listener', 'detection-only');
            });
            log.info('📊 Detection listeners attached to', inputs.length, 'inputs');
        }
        
        // Periodic cleanup to ensure no blocking appears
        setInterval(() => {
            if (config.ENFORCEMENT_DISABLED) {
                forceRemoveAllBlocking();
            }
        }, 2000);
        
        state.initialized = true;
        log.info('✅ Stable system initialized successfully');
    }
    
    /**
     * DOM ready initialization
     */
    $(document).ready(function() {
        log.info('DOM ready - starting stable initialization');
        
        // Immediate cleanup
        forceRemoveAllBlocking();
        
        // Initialize after a short delay
        setTimeout(() => {
            initializeStableSystem();
        }, 500);
        
        // Also initialize when quiz content loads
        const observer = new MutationObserver((mutations) => {
            let shouldInit = false;
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && (
                            node.classList?.contains('wpProQuiz_questionListItem') ||
                            node.querySelector?.('.wpProQuiz_questionListItem')
                        )) {
                            shouldInit = true;
                        }
                    });
                }
            });
            
            if (shouldInit) {
                log.info('Quiz content detected - reinitializing stable system');
                setTimeout(() => {
                    forceRemoveAllBlocking();
                    initializeStableSystem();
                }, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
    
    // Global cleanup function
    window.quizStableCleanup = forceRemoveAllBlocking;
    
    log.info('🔒 Quiz Stable System Ready - All enforcement DISABLED for stability');
    
})(jQuery);
