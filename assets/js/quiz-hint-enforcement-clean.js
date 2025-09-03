/**
 * LearnDash Quiz - Answer Reselection with Hint Enforcement
 * 
 * Enables users to reselect and submit answers after incorrect submission
 * Part of the Enforce Hint feature for the Lilac Quiz Sidebar plugin
 * Enhanced with modal hint display and correct answer detection
 */
(function($) {
    'use strict';
    
    // Configuration
    const config = {
        debug: true,
        enforceHintDelay: 300,
        observerDelay: 1000,
        tooltipText: 'טעית! להמשך חובה לקחת רמז!',
        answerDetection: true
    };
    
    // State management
    const state = {
        hintViewed: false,
        canProceed: false,
        currentQuestion: null
    };
    
    // Debug logger
    const log = {
        info: function(message, data) {
            if (config.debug) {
                const prefix = '%c[HINT] ';
                const style = 'color: #007700;';
                if (data) {
                    console.log(prefix + message, style, data);
                } else {
                    console.log(prefix + message, style);
                }
            }
        },
        error: function(message, data) {
            const prefix = '%c[HINT ERROR] ';
            const style = 'color: #c62828;';
            if (data) {
                console.error(prefix + message, style, data);
            } else {
                console.error(prefix + message, style);
            }
        }
    };
    
    log.info('Quiz hint enforcement script loaded successfully');
    
    /**
     * Check if answer is correct using debugger data
     */
    function checkAnswerFromDebuggerData(selectedIndex) {
        if (window.quizDetector && window.quizDetector.correctAnswers) {
            const correctAnswers = window.quizDetector.correctAnswers;
            if (correctAnswers.answers && Array.isArray(correctAnswers.answers)) {
                const correctAnswer = correctAnswers.answers.find(answer => answer.correct === true);
                if (correctAnswer) {
                    log.info('🎯 Debugger data - Correct answer index:', correctAnswer.index);
                    log.info('🎯 Selected index:', selectedIndex);
                    log.info('🎯 Selected index type:', typeof selectedIndex);
                    
                    // Multiple comparison methods to handle different data types
                    if (correctAnswer.index == selectedIndex) return true;
                    if (parseInt(correctAnswer.index) === parseInt(selectedIndex)) return true;
                    if (String(correctAnswer.index) === String(selectedIndex)) return true;
                    
                    return false;
                }
            }
        }
        log.info('⚠️ No debugger data available for answer checking');
        return null;
    }
    
    /**
     * Check if answer is correct using DOM feedback
     */
    function checkAnswerFromDOM() {
        const feedbackElements = document.querySelectorAll('.wpProQuiz_response');
        for (let feedback of feedbackElements) {
            if (feedback.style.display !== 'none') {
                const isCorrect = feedback.classList.contains('wpProQuiz_correct') || 
                                feedback.textContent.includes('נכון') ||
                                feedback.textContent.includes('correct');
                log.info('📋 DOM feedback detected:', isCorrect ? 'Correct' : 'Incorrect');
                return isCorrect;
            }
        }
        return null;
    }
    
    /**
     * Show hint modal popup
     */
    function showHintModal() {
        // First click the actual hint button to reveal hint content
        const hintButton = document.querySelector('.wpProQuiz_TipButton');
        let hintText = 'טוען רמז...';
        
        if (hintButton) {
            hintButton.click();
            
            // Wait for hint content to be revealed
            setTimeout(() => {
                const hintContainer = hintButton.closest('.wpProQuiz_listItem');
                if (hintContainer) {
                    const revealedHint = hintContainer.querySelector('.wpProQuiz_tipp');
                    if (revealedHint) {
                        const hintContent = revealedHint.querySelector('p');
                        if (hintContent) {
                            hintText = hintContent.textContent.trim();
                            log.info('💡 Hint content found:', hintText);
                        } else {
                            const altHint = revealedHint.textContent.trim();
                            hintText = altHint || 'רמז לא נמצא';
                            log.info('💡 Alternative hint content:', hintText);
                        }
                        
                        // Update modal content
                        const modalContent = document.querySelector('#lilac-hint-modal .modal-content p');
                        if (modalContent) {
                            modalContent.textContent = hintText;
                        }
                    } else {
                        hintText = 'לא נמצא רמז לשאלה זו';
                        log.info('⚠️ No hint container found');
                    }
                }
            }, 200);
        } else {
            hintText = 'כפתור הרמז לא נמצא';
            log.info('⚠️ Hint button not found');
        }
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('lilac-hint-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'lilac-hint-modal';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.cssText = 'background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; direction: rtl; text-align: right; font-family: Arial, sans-serif; position: relative;';
            
            modalContent.innerHTML = '<button class="close-modal" style="position: absolute; top: 10px; left: 10px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">×</button><h3 style="margin-top: 0; color: #333;">רמז לשאלה</h3><p style="font-size: 16px; line-height: 1.5; color: #555;">' + hintText + '</p>';
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Close modal handlers
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        modal.style.display = 'flex';
        log.info('💡 Hint modal displayed');
    }
    
    /**
     * Show inline hint message at bottom of quiz
     */
    function showInlineHintMessage() {
        // Remove existing hint message
        const existing = document.getElementById('lilac-hint-message');
        if (existing) {
            existing.remove();
        }
        
        // Create hint message
        const hintMessage = document.createElement('div');
        hintMessage.id = 'lilac-hint-message';
        hintMessage.className = 'lilac-hint-message';
        hintMessage.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px 20px; display: flex; align-items: center; gap: 15px; direction: rtl; text-align: right; font-family: Arial, sans-serif; margin: 20px auto; width: fit-content; max-width: 90%;';
        
        hintMessage.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; color: #856404; font-weight: bold; font-size: 16px;"><span style="color: #dc3545; font-size: 18px;">❌</span><span>תשובה שגויה! לחץ על רמז לקבלת עזרה</span></div><button class="lilac-force-hint" style="background: #ffc107; color: #212529; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; min-width: 80px;">רמז</button>';
        
        // Add click handler for hint button
        const hintButton = hintMessage.querySelector('.lilac-force-hint');
        if (hintButton) {
            hintButton.addEventListener('click', () => {
                showHintModal();
                state.hintViewed = true;
                enableAnswerInputs();
                updateHintMessageAfterViewing();
                log.info('💡 Hint viewed - inputs re-enabled');
            });
        }
        
        // Add to page
        const quizContainer = document.querySelector('.wpProQuiz_content, .quiz-content, .learndash-quiz-content, .wpProQuiz_quiz');
        if (quizContainer) {
            quizContainer.appendChild(hintMessage);
        } else {
            document.body.appendChild(hintMessage);
        }
        
        log.info('📝 Inline hint message displayed');
    }
    
    /**
     * Show success indicator with next button
     */
    function showSuccessIndicator() {
        const existing = document.getElementById('lilac-hint-message');
        if (existing) {
            existing.remove();
        }
        
        const successMessage = document.createElement('div');
        successMessage.id = 'lilac-hint-message';
        successMessage.className = 'lilac-success-message';
        successMessage.style.cssText = 'background: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 15px 20px; display: flex; align-items: center; gap: 15px; direction: rtl; text-align: right; font-family: Arial, sans-serif; margin: 20px auto; width: fit-content; max-width: 90%;';
        
        successMessage.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px;"><span style="color: #28a745; font-size: 18px;">✅</span><span>כל הכבוד! תשובה נכונה</span></div><button class="lilac-next-question" style="background: #28a745; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; min-width: 80px;">הבא</button>';
        
        // Add click handler for next button
        const nextButton = successMessage.querySelector('.lilac-next-question');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                // Reset state for next question
                state.hintViewed = false;
                state.canProceed = false;
                successMessage.remove();
                log.info('➡️ Moving to next question - state reset');
            });
        }
        
        // Add to page
        const quizContainer = document.querySelector('.wpProQuiz_content, .quiz-content, .learndash-quiz-content, .wpProQuiz_quiz');
        if (quizContainer) {
            quizContainer.appendChild(successMessage);
        } else {
            document.body.appendChild(successMessage);
        }
        
        log.info('✅ Success indicator displayed');
    }
    
    /**
     * Disable answer inputs after wrong answer
     */
    function disableAnswerInputs() {
        const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
        inputs.forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.5';
        });
        log.info('🚫 Answer inputs disabled');
    }
    
    /**
     * Enable answer inputs after hint viewing
     */
    function enableAnswerInputs() {
        const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
        inputs.forEach(input => {
            input.disabled = false;
            input.style.opacity = '1';
        });
        log.info('✅ Answer inputs re-enabled');
    }
    
    /**
     * Update hint message after hint is viewed
     */
    function updateHintMessageAfterViewing() {
        const hintMessage = document.getElementById('lilac-hint-message');
        if (hintMessage) {
            hintMessage.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px;"><span style="color: #28a745; font-size: 18px;">✓</span><span>רמז נצפה! כעת ניתן לבחור תשובה מחדש</span></div><button class="lilac-force-hint" style="background: #28a745; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; min-width: 80px;">רמז נוסף</button>';
            
            // Re-add click handler for additional hints
            const hintButton = hintMessage.querySelector('.lilac-force-hint');
            if (hintButton) {
                hintButton.addEventListener('click', () => {
                    showHintModal();
                    log.info('💡 Additional hint viewed');
                });
            }
        }
    }
    
    /**
     * Handle answer selection
     */
    function handleAnswerSelection(event) {
        const selectedInput = event.target;
        const selectedIndex = parseInt(selectedInput.value);
        
        log.info('🎯 Answer selected:', selectedIndex);
        
        // Add delay to ensure debugger data is current
        setTimeout(() => {
            // Check answer correctness
            let isCorrect = checkAnswerFromDebuggerData(selectedIndex);
            
            // Fallback to DOM checking if debugger data unavailable
            if (isCorrect === null) {
                isCorrect = checkAnswerFromDOM();
            }
            
            if (isCorrect === true) {
                log.info('✅ Correct answer detected');
                showSuccessIndicator();
            } else if (isCorrect === false) {
                log.info('❌ Wrong answer detected');
                disableAnswerInputs();
                showInlineHintMessage();
            } else {
                log.info('⚠️ Could not determine answer correctness');
            }
        }, 100);
    }
    
    /**
     * Setup question with hint enforcement
     */
    function setupQuestion(index, element) {
        const questionElement = element || document.querySelectorAll('.wpProQuiz_listItem')[index];
        if (!questionElement) return;
        
        log.info('🔧 Setting up question with hint enforcement');
        
        // Add event listeners to answer inputs
        const inputs = questionElement.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        inputs.forEach(input => {
            input.addEventListener('change', handleAnswerSelection);
            input.addEventListener('click', handleAnswerSelection);
        });
        
        // Show initial hint message
        showInlineHintMessage();
        
        log.info('✅ Question setup complete');
    }
    
    /**
     * Initialize hint enforcement
     */
    function initQuizHintEnforcement() {
        log.info('🚀 Initializing quiz hint enforcement');
        
        // Setup existing questions
        document.querySelectorAll('.wpProQuiz_listItem').forEach(setupQuestion);
        
        // Setup observer for dynamically added questions
        setupObserver();
        
        log.info('✅ Quiz hint enforcement initialized');
    }
    
    /**
     * Set up a mutation observer to watch for dynamically added questions
     */
    function setupObserver() {
        if (!window.MutationObserver) {
            log.error('MutationObserver not supported in this browser');
            return;
        }
        
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const node = mutation.addedNodes[i];
                        
                        if (node.nodeType === 1) {
                            if ($(node).hasClass('wpProQuiz_listItem')) {
                                setupQuestion(0, node);
                            } else {
                                $(node).find('.wpProQuiz_listItem').each(setupQuestion);
                            }
                        }
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        log.info('MutationObserver setup complete');
    }
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        setTimeout(initQuizHintEnforcement, config.observerDelay);
    });
    
})(jQuery);
