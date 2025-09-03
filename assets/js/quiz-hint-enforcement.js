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
        observerDelay: 500,
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
            
            modalContent.innerHTML = '<button class="close-modal" style="position: absolute; top: 15px; left: 15px; background: #6c757d; color: white; border: none; width: 35px; height: 35px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center;">×</button><p style="font-size: 16px; line-height: 1.5; color: #555; margin-top: 20px;">' + hintText + '</p>';
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Close modal handlers
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
                onHintModalClosed();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    onHintModalClosed();
                }
            });
        }
        
        modal.style.display = 'flex';
        log.info('💡 Hint modal displayed');
    }
    
    /**
     * Handle hint modal closure - enable inputs and update hint box
     */
    function onHintModalClosed() {
        log.info('🔓 Hint modal closed - enabling answer inputs');
        
        // Enable all answer inputs
        enableAnswerInputs();
        
        // Update hint box to show inputs are now enabled
        const hintBox = document.querySelector('.lilac-hint-message');
        if (hintBox) {
            hintBox.style.background = '#d4edda !important';
            hintBox.style.borderColor = '#28a745 !important';
            hintBox.style.animation = 'none !important';
            hintBox.style.boxShadow = 'none !important';
            hintBox.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px; width: 100%;">
                    <span style="color: #28a745; font-size: 18px;">✓</span>
                    <span>רמז נצפה! כעת ניתן לבחור תשובה</span>
                </div>
            `;
        }
        
        log.info('✅ Inputs re-enabled after hint modal closed');
    }
    
    /**
     * Show inline hint message under each quiz question
     */
    function showInlineHintMessage() {
        // Find all quiz questions
        const questions = document.querySelectorAll('.wpProQuiz_listItem');
        
        questions.forEach((question, index) => {
            // Remove existing hint message for this question
            const existing = question.querySelector('.lilac-hint-message');
            if (existing) {
                existing.remove();
            }
            
            // Hide the original hint content
            const originalHint = question.querySelector('.wpProQuiz_tipp');
            if (originalHint) {
                originalHint.style.display = 'none';
                originalHint.style.visibility = 'hidden';
            }
            
            // Create hint message for this question
            const hintMessage = document.createElement('div');
            hintMessage.className = 'lilac-hint-message';
            hintMessage.style.cssText = 'background: #cce5ff; border: 2px solid #007bff; border-radius: 8px; padding: 15px 20px; display: flex; align-items: center; gap: 15px; direction: rtl; text-align: right; font-family: Arial, sans-serif; margin: 15px 0; width: 100%; box-sizing: border-box;';
            
            hintMessage.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; color: #004085; font-weight: bold; font-size: 16px;"><span style="color: #007bff; font-size: 18px;">💡</span><span>צפייה ברמז</span></div><button class="lilac-force-hint" style="background: #007bff; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; min-width: 80px;">רמז</button>';
            
            // Add click handler for hint button
            const hintButton = hintMessage.querySelector('.lilac-force-hint');
            if (hintButton) {
                hintButton.addEventListener('click', () => {
                    showHintModal();
                    state.hintViewed = true;
                    log.info('💡 Hint viewed for question', index + 1);
                });
            }
            
            // Add hint message directly after the question
            question.appendChild(hintMessage);
        });
        
        log.info('📝 Inline hint messages displayed for', questions.length, 'questions');
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
            input.style.opacity = '0.3';
            input.style.pointerEvents = 'none';
            
            // Add visual feedback to the parent container
            const container = input.closest('.wpProQuiz_questionListItem');
            if (container) {
                container.style.position = 'relative';
                container.style.opacity = '0.6';
                
                // Add overlay to prevent any interaction
                if (!container.querySelector('.disabled-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'disabled-overlay';
                    overlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(255, 255, 255, 0.7);
                        z-index: 1000;
                        cursor: not-allowed;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        color: #dc3545;
                        font-size: 14px;
                        text-align: center;
                        padding: 10px;
                    `;
                    overlay.innerHTML = 'יש לצפות ברמז לפני בחירת תשובה';
                    container.appendChild(overlay);
                }
            }
        });
        log.info('🚫 Answer inputs disabled with visual feedback');
    }
    
    /**
     * Enable answer inputs after hint viewing
     */
    function enableAnswerInputs() {
        const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
        inputs.forEach(input => {
            input.disabled = false;
            input.style.opacity = '1';
            input.style.pointerEvents = 'auto';
            
            // Remove visual feedback from parent container
            const container = input.closest('.wpProQuiz_questionListItem');
            if (container) {
                container.style.opacity = '1';
                
                // Remove overlay
                const overlay = container.querySelector('.disabled-overlay');
                if (overlay) {
                    overlay.remove();
                }
            }
            
            // Re-attach event listeners to ensure they work after enabling
            input.removeEventListener('change', handleAnswerSelection);
            input.removeEventListener('click', handleAnswerSelection);
            input.addEventListener('change', handleAnswerSelection);
            input.addEventListener('click', handleAnswerSelection);
        });
        log.info('✅ Answer inputs re-enabled with visual feedback removed');
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
        
        log.info('✅ Quiz hint enforcement initialized');
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
        
        // Find the question container and existing hint box
        const questionContainer = selectedInput.closest('.wpProQuiz_listItem');
        const existingHintBox = questionContainer?.querySelector('.lilac-hint-message');
        
        if (!existingHintBox) {
            log.info('⚠️ No hint box found to update');
            return;
        }
        
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
                // Replace hint box content with success message
                existingHintBox.style.background = '#d4edda !important';
                existingHintBox.style.borderColor = '#28a745 !important';
                existingHintBox.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px; width: 100%;">
                        <span style="color: #28a745; font-size: 18px;">✅</span>
                        <span>כל הכבוד! תשובה נכונה</span>
                        <button class="lilac-next-question" style="
                            background: #28a745 !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 6px !important;
                            padding: 10px 20px !important;
                            font-size: 16px !important;
                            font-weight: bold !important;
                            cursor: pointer !important;
                            margin-right: auto !important;
                        ">הבא</button>
                    </div>
                `;
                
                // Add click handler for next button
                const nextButton = existingHintBox.querySelector('.lilac-next-question');
                if (nextButton) {
                    nextButton.addEventListener('click', () => {
                        // Find and click the original quiz next button
                        const originalNext = document.querySelector('input[name="next"]');
                        if (originalNext) {
                            log.info('➡️ Clicking original next button');
                            originalNext.click();
                        } else {
                            // If no next button, look for end quiz button (last question)
                            const endButton = document.querySelector('input[name="endQuizSummary"]');
                            if (endButton) {
                                log.info('🏁 Clicking end quiz button (last question)');
                                endButton.click();
                            } else {
                                log.info('⚠️ No navigation button found');
                            }
                        }
                        
                        state.hintViewed = false;
                        state.canProceed = false;
                        log.info('➡️ State reset for next question');
                    });
                }
                
            } else if (isCorrect === false) {
                log.info('❌ Wrong answer detected');
                
                // Immediately disable all answer inputs
                disableAnswerInputs();
                
                // Add visual highlighting to hint area
                existingHintBox.style.background = '#f8d7da !important';
                existingHintBox.style.borderColor = '#dc3545 !important';
                existingHintBox.style.boxShadow = '0 0 15px rgba(220, 53, 69, 0.5) !important';
                existingHintBox.style.animation = 'pulse 2s infinite !important';
                
                // Add CSS for pulse animation
                if (!document.getElementById('hint-pulse-style')) {
                    const style = document.createElement('style');
                    style.id = 'hint-pulse-style';
                    style.textContent = `
                        @keyframes pulse {
                            0% { box-shadow: 0 0 15px rgba(220, 53, 69, 0.5); }
                            50% { box-shadow: 0 0 25px rgba(220, 53, 69, 0.8); }
                            100% { box-shadow: 0 0 15px rgba(220, 53, 69, 0.5); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                existingHintBox.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; color: #721c24; font-weight: bold; font-size: 16px; width: 100%;">
                        <span style="color: #dc3545; font-size: 18px;">❌</span>
                        <span>תשובה שגויה! חובה לצפות ברמז לפני המשך</span>
                        <button class="lilac-force-hint" style="
                            background: #dc3545 !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 6px !important;
                            padding: 10px 20px !important;
                            font-size: 16px !important;
                            font-weight: bold !important;
                            cursor: pointer !important;
                            margin-right: auto !important;
                            animation: pulse 2s infinite !important;
                        ">רמז</button>
                    </div>
                `;
                
                // Add click handler for hint button
                const hintButton = existingHintBox.querySelector('.lilac-force-hint');
                if (hintButton) {
                    hintButton.addEventListener('click', () => {
                        showHintModal();
                        state.hintViewed = true;
                        log.info('💡 Hint viewed - modal opened');
                        
                        // Remove pulse animation and highlighting
                        existingHintBox.style.animation = 'none !important';
                        existingHintBox.style.boxShadow = 'none !important';
                        
                        // Update hint message but keep inputs disabled until modal closes
                        existingHintBox.style.background = '#fff3cd !important';
                        existingHintBox.style.borderColor = '#ffc107 !important';
                        existingHintBox.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 10px; color: #856404; font-weight: bold; font-size: 16px; width: 100%;">
                                <span style="color: #ffc107; font-size: 18px;">⏳</span>
                                <span>רמז פתוח - סגור את החלון כדי להמשיך</span>
                            </div>
                        `;
                        log.info('⏳ Waiting for modal to close before enabling inputs');
                    });
                }
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
        
        // Disable answer inputs initially
        const inputs = questionElement.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        inputs.forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.5';
            input.addEventListener('change', handleAnswerSelection);
            input.addEventListener('click', handleAnswerSelection);
        });
        
        // Show initial hint message
        showInlineHintMessage();
        
        log.info('✅ Quiz hint enforcement initialized');
    }
    
    /**
     * Initialize hint enforcement when page loads
     */
    function initializeHintEnforcement() {
        log.info('🚀 Initializing hint enforcement system');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeHintEnforcement);
            return;
        }
        
        // Wait a bit more for quiz to fully load
        setTimeout(() => {
            const questions = document.querySelectorAll('.wpProQuiz_listItem');
            log.info('📋 Found questions:', questions.length);
            
            if (questions.length > 0) {
                questions.forEach((question, index) => {
                    setupQuestion(index, question);
                });
                
                // Also set up global event delegation for answer selection
                document.addEventListener('change', function(event) {
                    if (event.target.matches('.wpProQuiz_questionInput input[type="radio"], .wpProQuiz_questionInput input[type="checkbox"]')) {
                        log.info('🎯 Global answer selection detected');
                        handleAnswerSelection(event);
                    }
                });
                
                log.info('✅ Global event delegation set up');
            } else {
                log.info('⚠️ No questions found, retrying...');
                // Retry after a delay if no questions found
                setTimeout(() => {
                    const retryQuestions = document.querySelectorAll('.wpProQuiz_listItem');
                    log.info('📋 Retry found questions:', retryQuestions.length);
                    if (retryQuestions.length > 0) {
                        retryQuestions.forEach((question, index) => {
                            setupQuestion(index, question);
                        });
                        
                        // Set up global event delegation for retry case too
                        document.addEventListener('change', function(event) {
                            if (event.target.matches('.wpProQuiz_questionInput input[type="radio"], .wpProQuiz_questionInput input[type="checkbox"]')) {
                                log.info('🎯 Global answer selection detected (retry)');
                                handleAnswerSelection(event);
                            }
                        });
                        
                        log.info('✅ Global event delegation set up (retry)');
                    } else {
                        log.info('❌ Still no questions found after retry');
                    }
                }, 2000);
            }
        }, 500);
}

// Alternative initialization approach - use multiple methods
$(document).ready(function() {
    log.info('🚀 jQuery ready - starting hint enforcement');
    initializeHintEnforcement();
    
    // Set up universal event listener for answer changes - multiple selectors
    $(document).on('change click', 'input[type="radio"], input[type="checkbox"]', function(e) {
        log.info('🎯 Universal answer selection detected');
        handleAnswerSelection(e);
    });
    
    // Also try specific quiz selectors
    $(document).on('change click', '.wpProQuiz_questionInput input, .wpProQuiz_listItem input', function(e) {
        log.info('🎯 Quiz-specific answer selection detected');
        handleAnswerSelection(e);
    });
    
    log.info('✅ Universal event delegation set up');
    
    // Also try immediate initialization
    setTimeout(() => {
        log.info('🔄 Backup initialization attempt');
        const questions = document.querySelectorAll('.wpProQuiz_listItem');
        log.info('📋 Backup found questions:', questions.length);
        
        if (questions.length > 0) {
            questions.forEach((question, index) => {
                setupQuestion(index, question);
            });
        }
    }, 1000);
});

// Start initialization
initializeHintEnforcement();

})(jQuery);
