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
    
    console.log('[HINT] Quiz hint enforcement script loaded successfully');
    
    // Initialize on document ready
    $(document).ready(function() {
        initQuizAnswerReselection();
    });
    
    /**
     * Initialize the quiz answer reselection functionality
     */
    function initQuizAnswerReselection() {
        log.info('🚀 Initializing quiz hint enforcement');
        
        // Set up initial questions
        $('.wpProQuiz_listItem').each(setupQuestion);
        
        // Set up observer for dynamic content
        setTimeout(setupObserver, config.observerDelay);
        
        // Always show hint message on page load
        setTimeout(() => {
            showInlineHintMessage();
        }, 500);
        
        // Handle answer selection with immediate debugger-based detection
        $(document).on('change', '.wpProQuiz_questionInput', function() {
            const $question = $(this).closest('.wpProQuiz_listItem');
            log.info('📝 Answer selected - checking with debugger data');
            
            // Check answer immediately using debugger data
            const isCorrect = checkAnswerFromDebuggerData($question);
            if (isCorrect !== null) {
                if (isCorrect) {
                    log.info('✅ Correct answer detected from debugger');
                    handleCorrectAnswer($question);
                } else {
                    log.info('❌ Incorrect answer detected from debugger');
                    handleIncorrectAnswer($question);
                }
            } else {
                log.info('⚠️ No debugger data available, using fallback detection');
            }
        });
        
        // Handle check button clicks
        $(document).on('click', '.wpProQuiz_button[name="check"], input[value*="בדוק"], button[onclick*="check"]', function() {
            const $question = $(this).closest('.wpProQuiz_listItem');
            log.info('🔍 Check button clicked - verifying answer');
            
            // Check answer immediately using debugger data
            setTimeout(() => {
                const isCorrect = checkAnswerFromDebuggerData($question);
                if (isCorrect !== null) {
                    if (isCorrect) {
                        log.info('✅ Correct answer confirmed on check');
                        handleCorrectAnswer($question);
                    } else {
                        log.info('❌ Incorrect answer confirmed on check');
                        handleIncorrectAnswer($question);
                    }
                }
            }, 300);
        });
    }
    
    /**
     * Set up a question for hint enforcement
     */
    function setupQuestion(index, element) {
        const $question = $(element);
        
        if (!$question.length) {
            return;
        }
        
        log.info('Setting up question for hint enforcement');
        
        // Enable all inputs for this question
        enableInputsForQuestion($question);
        
        // Always show hint message for every question
        showInlineHintMessage();
    }
    
    /**
     * Check answer correctness using debugger data
     */
    function checkAnswerFromDebuggerData($question) {
        try {
            // Get debugger data from quiz detector
            if (window.quizDetector && window.quizDetector.correctAnswers && window.quizDetector.correctAnswers.answers) {
                const correctAnswersData = window.quizDetector.correctAnswers.answers;
                
                // Get selected answer indices
                const selectedAnswers = [];
                $question.find('input[type="radio"]:checked, input[type="checkbox"]:checked').each(function() {
                    const $input = $(this);
                    // Try multiple ways to get the answer index
                    let answerIndex = parseInt($input.val()) || 
                                    parseInt($input.attr('data-index')) || 
                                    parseInt($input.attr('data-answer-index'));
                    
                    // If still no index, try to find it from the input's position
                    if (!answerIndex) {
                        const inputIndex = $question.find('input[type="radio"], input[type="checkbox"]').index($input);
                        answerIndex = inputIndex + 1; // Convert to 1-based index
                    }
                    
                    if (answerIndex) {
                        selectedAnswers.push(answerIndex);
                    }
                });
                
                // Get correct answer indices from debugger data
                const correctAnswers = correctAnswersData
                    .filter(answer => answer.correct === true)
                    .map(answer => answer.index);
                
                log.info('Selected answers:', selectedAnswers);
                log.info('Correct answers:', correctAnswers);
                
                if (selectedAnswers.length > 0 && correctAnswers.length > 0) {
                    // For single answer questions
                    if (selectedAnswers.length === 1 && correctAnswers.length === 1) {
                        return selectedAnswers[0] === correctAnswers[0];
                    }
                    // For multiple answer questions
                    return selectedAnswers.sort().join(',') === correctAnswers.sort().join(',');
                }
            }
        } catch (error) {
            log.error('Error checking debugger data:', error);
        }
        
        return null; // Unable to determine from debugger data
    }
    
    /**
     * Handle correct answer - show success indicator with next button
     */
    function handleCorrectAnswer($question) {
        log.info('✅ Correct answer detected');
        
        // Show correct answer indicator with next button
        showCorrectAnswerIndicator();
        
        // Allow progression
        state.hintViewed = true;
        state.canProceed = true;
        
        // Enable next button
        enableNextButton();
    }
    
    /**
     * Handle incorrect answer
     */
    function handleIncorrectAnswer($question) {
        log.info('❌ Incorrect answer detected');
        
        // Keep hint message visible (it's already shown)
        // The hint message stays as is for incorrect answers
        
        // Disable progression until hint is viewed
        state.canProceed = false;
        
        // Hide next button
        disableNextButton();
    }
    
    /**
     * Show inline hint message at bottom of quiz
     */
    function showInlineHintMessage() {
        // Remove existing hint message
        const existingHint = document.getElementById('lilac-hint-message');
        if (existingHint) {
            existingHint.remove();
        }
        
        // Create hint message
        const hintMessage = document.createElement('div');
        hintMessage.id = 'lilac-hint-message';
        hintMessage.className = 'lilac-hint-message';
        hintMessage.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            direction: rtl;
            text-align: right;
            font-family: Arial, sans-serif;
            max-width: 90%;
            width: auto;
        `;
        
        hintMessage.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                gap: 10px;
                color: #856404;
                font-weight: bold;
                font-size: 16px;
            ">
                <span style="color: #dc3545; font-size: 18px;">❌</span>
                <span>תשובה שגויה! לחץ על רמז לקבלת עזרה</span>
            </div>
            <button class="lilac-force-hint" style="
                background: #ffc107;
                color: #212529;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.3s;
                min-width: 80px;
            ">רמז</button>
        `;
        
        // Add to page
        const quizContainer = document.querySelector('.wpProQuiz_content, .quiz-content, .learndash-quiz-content, .wpProQuiz_quiz');
        if (quizContainer) {
            quizContainer.appendChild(hintMessage);
        } else {
            document.body.appendChild(hintMessage);
        }
        
        // Add click handler for the hint button
        const hintButton = hintMessage.querySelector('.lilac-force-hint');
        if (hintButton) {
            hintButton.addEventListener('click', () => {
                // Show hint content in modal instead of clicking actual hint button
                showHintModal();
                log.info('💡 Hint button clicked - showing modal');
            });
        }
        
        log.info('📘 Inline hint message displayed');
    }
    
    /**
     * Show hint content in a modal popup
     */
    function showHintModal() {
        // Get hint content from the current question
        const currentQuestion = document.querySelector('.wpProQuiz_listItem');
        const hintContent = currentQuestion ? currentQuestion.querySelector('.wpProQuiz_tipp p') : null;
        const hintText = hintContent ? hintContent.textContent.trim() : 'מקום אסור לחנייה';
        
        // Remove existing modal
        const existingModal = document.getElementById('lilac-hint-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'lilac-hint-modal';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            width: 90%;
            position: relative;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            direction: rtl;
            text-align: right;
        `;
        
        modalContent.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="width: 4px; height: 40px; background: #007cba; margin-left: 15px;"></div>
                <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">רמז</h3>
                <button id="lilac-modal-close" style="
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #999;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>
            <p style="margin: 0; line-height: 1.5; color: #555;">${hintText}</p>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Add close handlers
        const closeButton = modalContent.querySelector('#lilac-modal-close');
        closeButton.addEventListener('click', closeHintModal);
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeHintModal();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                closeHintModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
        
        log.info('📘 Hint modal displayed');
    }
    
    /**
     * Close hint modal
     */
    function closeHintModal() {
        const modal = document.getElementById('lilac-hint-modal');
        if (modal) {
            modal.remove();
            log.info('📘 Hint modal closed');
        }
    }
    
    /**
     * Show correct answer indicator with next button navigation - replaces hint message
     */
    function showCorrectAnswerIndicator() {
        // Find the existing hint message container
        const hintMessage = document.getElementById('lilac-hint-message');
        if (hintMessage) {
            // Replace the hint message content with correct answer indicator
            hintMessage.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #d4edda;
                border: 2px solid #28a745;
                border-radius: 8px;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                z-index: 9999;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                direction: rtl;
                text-align: right;
                font-family: Arial, sans-serif;
                max-width: 90%;
                width: auto;
            `;
            
            hintMessage.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #155724;
                    font-weight: bold;
                    font-size: 16px;
                ">
                    <span style="color: #28a745; font-size: 18px;">✓</span>
                    <span>תשובה נכונה! לחץ על הבא להמשיך</span>
                </div>
                <button class="lilac-next-button" style="
                    background: #007cba;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 10px 20px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    min-width: 80px;
                ">הבא</button>
            `;
            
            // Add click handler for next button
            const nextButton = hintMessage.querySelector('.lilac-next-button');
            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    // Find and click the actual next button
                    const actualNextButton = document.querySelector('.wpProQuiz_button[name="next"], .wpProQuiz_button[value*="הבא"], input[value*="הבא"], button[onclick*="next"]');
                    if (actualNextButton) {
                        actualNextButton.click();
                        log.info('➡️ Next button clicked from correct indicator');
                    } else {
                        log.error('❌ Could not find next button to click');
                    }
                });
                
                // Add hover effect
                nextButton.addEventListener('mouseenter', () => {
                    nextButton.style.backgroundColor = '#0056b3';
                });
                
                nextButton.addEventListener('mouseleave', () => {
                    nextButton.style.backgroundColor = '#007cba';
                });
            }
            
            log.info('✅ Correct answer indicator displayed in place of hint message');
        }
    }
    
    /**
     * Make sure inputs for a question are enabled and clickable
     */
    function enableInputsForQuestion($question) {
        $question.find('.wpProQuiz_questionInput').prop('disabled', false)
            .removeAttr('disabled')
            .css('pointer-events', 'auto');
        
        $question.find('.wpProQuiz_questionListItem label').css('pointer-events', 'auto');
    }
    
    /**
     * Enable next button
     */
    function enableNextButton() {
        $('.wpProQuiz_button[name="next"]').show().prop('disabled', false);
    }
    
    /**
     * Disable next button
     */
    function disableNextButton() {
        $('.wpProQuiz_button[name="next"]').hide().prop('disabled', true);
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
    
})(jQuery);
