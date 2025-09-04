/**
 * LearnDash Quiz - Answer Reselection with Permanent Blue Hint Box
 * 
 * Enables users to reselect and submit answers after incorrect submission
 * Part of the Enforce Hint feature for the Lilac Quiz Sidebar plugin
 * Enhanced with permanent blue hint request box functionality
 */
(function($) {
    'use strict';
    
    // Configuration
    const config = {
        debug: true,                     // Enable debug messages for testing
        enforceHintDelay: 300,          // Delay in ms after checking answer before handling result
        observerDelay: 1000,            // Delay before setting up MutationObserver
        tooltipText: 'טעית! להמשך חובה לקחת רמז!',  // Hebrew text: You're wrong! You must take a hint to continue!
        answerDetection: true           // Enable answer detection
    };
    
    // Store for question data
    const questionData = {};
    
    // Debug logger with consistent formatting
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
    
    // Add immediate console log to verify script loading
    console.log('[HINT] Quiz hint enforcement script loaded successfully');
    
    // Initialize on document ready
    $(document).ready(function() {
        console.log('[HINT] Document ready - initializing');
        initQuizAnswerReselection();
    });
    
    // Also initialize after a short delay to catch dynamically loaded content
    setTimeout(function() {
        console.log('[HINT] Delayed initialization');
        initQuizAnswerReselection();
    }, config.observerDelay);
    
    /**
     * Initialize the quiz answer reselection functionality
     */
    function initQuizAnswerReselection() {
        log.info('Initializing quiz answer reselection...');
        
        // Remove any existing debug containers
        removeDebugContainers();
        
        // Show hint message immediately on page load
        setTimeout(function() {
            showInlineHintMessage();
        }, 1000);
        
        // Setup questions that are already loaded
        $('.wpProQuiz_listItem').each(setupQuestion);
        
        // Setup observer for dynamically loaded content
        setupObserver();
        
        log.info('Quiz answer reselection initialized successfully');
    }
    
    /**
     * Set up event handlers for quiz navigation and answer checking
     */
    function setupEventHandlers() {
        log.info('Setting up event handlers');
        
        // When hint button is clicked, record that hint was viewed
        $(document).on('click', '.wpProQuiz_TipButton, .wpProQuiz_hint', function() {
            const $question = $(this).closest('.wpProQuiz_listItem');
            $question.data('hint-viewed', true);
            $question.attr('data-hint-viewed', 'true');
            log.info('Hint button clicked, recorded as viewed');
            
            // Remove highlight and tooltip since hint was viewed
            removeHintHighlight($question);
            
            // Hide inline hint message
            hideInlineHintMessage();
        });
        
        // Handle answer selection and submission
        $(document).on('click', '.wpProQuiz_questionInput', function() {
            const $question = $(this).closest('.wpProQuiz_listItem');
            log.info('Answer selected in question');
            
            // Clear any existing feedback
            $question.find('.wpProQuiz_correct, .wpProQuiz_incorrect').hide();
            
            /**
             * Set up event handlers for a specific question
             */
            function setupQuestionEventHandlers($question) {
                // Remove existing handlers to prevent duplicates
                $question.off('.hintEnforcement');
                
                // Add answer selection handlers with immediate feedback
                $question.on('change.hintEnforcement', 'input[type="radio"], input[type="checkbox"]', function() {
                    log.info('');
            if (hasIncorrectFeedback) {
                log.info('Incorrect feedback detected');
                handleIncorrectAnswer($question);
            } else if (hasCorrectFeedback) {
                log.info('Correct feedback detected');
                handleCorrectAnswer($question);
            } else {
                log.info('No feedback detected yet, will retry');
                // Retry after a longer delay
                setTimeout(function() {
                    const hasCorrect = $question.find('.wpProQuiz_correct').is(':visible');
                    const hasIncorrect = $question.find('.wpProQuiz_incorrect').is(':visible');
                    
                    if (hasIncorrect) {
                        handleIncorrectAnswer($question);
                    } else if (hasCorrect) {
                        handleCorrectAnswer($question);
                    }
                }, 1500);
            }
        }
        
        // Modern approach: Watch for feedback elements using MutationObserver
        const feedbackObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        const $node = $(node);
                        if ($node.hasClass('wpProQuiz_incorrect') || $node.hasClass('wpProQuiz_correct')) {
                            const $question = $node.closest('.wpProQuiz_listItem');
                            const isCorrect = $node.hasClass('wpProQuiz_correct');
                            
                            log.info('Answer feedback received: ' + (isCorrect ? 'correct' : 'incorrect'));
                            
                            setTimeout(function() {
                                handleAnswerResult($question, isCorrect);
                            }, config.enforceHintDelay);
                        }
                    }
                });
            });
        });
        
        // Start observing for feedback elements
        feedbackObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // When user changes answer selection
        $(document).on('change', '.wpProQuiz_questionInput', function() {
            const $input = $(this);
            const $question = $input.closest('.wpProQuiz_listItem');
            
            // If this question previously had an incorrect answer, show check button
            if ($question.find('.wpProQuiz_incorrect').is(':visible')) {
                // Hide the feedback message but keep hint visible if shown
                $question.find('.wpProQuiz_incorrect, .wpProQuiz_correct').hide();
                
                // Make sure the check button is visible
                $question.find('.wpProQuiz_button[name="check"]').show()
                    .css('display', 'inline-block')
                    .prop('disabled', false);
                
                // Hide tooltip if it exists
                $question.find('.hint-tooltip').remove();
                
                // Hide inline hint message when user changes answer
                hideInlineHintMessage();
            }
        });
        
        // Prevent proceeding with Next button if answer is incorrect
        $(document).on('click', '.wpProQuiz_button[name="next"]', function(e) {
            const $question = $(this).closest('.wpProQuiz_listItem');
            
            if ($question.find('.wpProQuiz_incorrect').is(':visible')) {
                e.preventDefault();
                e.stopPropagation();
                
                // Show inline hint message and highlight hint button
                showInlineHintMessage();
                highlightHintButton($question);
                return false;
            }
        });
    }
    
    /**
     * Setup an individual question
     */
    function setupQuestion(index, element) {
        const $question = $(element);
        
        log.info('Setting up question:', index, element);
        
        // Mark question as processed
        $question.addClass('lilac-processed');
        
        // Enable all inputs for this question
        enableInputsForQuestion($question);
        
        // Set up event handlers for this specific question
        setupQuestionEventHandlers($question);
        
        // Always show hint message for every question
        showInlineHintMessage();
        
        // Check if there's already feedback visible and handle accordingly
        const hasCorrectFeedback = $question.find('.wpProQuiz_correct:visible, .wpProQuiz_response_correct:visible').length > 0;
        const hasIncorrectFeedback = $question.find('.wpProQuiz_incorrect:visible, .wpProQuiz_response_incorrect:visible').length > 0;
        
        if (hasIncorrectFeedback) {
            handleIncorrectAnswer($question);
        } else if (hasCorrectFeedback) {
            handleCorrectAnswer($question);
        }
    }
    
    /**
     * Handle the answer result (correct or incorrect)
     */
    function handleAnswerResult($question, isCorrect) {
        // Get hint status
        const hintViewed = $question.data('hint-viewed') === true || $question.attr('data-hint-viewed') === 'true';
        const hasHint = $question.attr('data-has-hint') === 'true';
        
        // If the answer is incorrect
        if (isCorrect === false) {
            log.info('Incorrect answer detected, enforcing hint view');
            
            // Hide the Next button
            $question.find('.wpProQuiz_button[name="next"]').hide()
                .css('display', 'none')
                .attr('style', 'display: none !important; visibility: hidden !important;');
            
            // Make sure the check button is visible for re-submission with !important overrides
            $question.find('.wpProQuiz_button[name="check"]')
                .css({
                    'display': 'inline-block !important',
                    'visibility': 'visible !important',
                    'opacity': '1 !important',
                    'pointer-events': 'auto !important',
                    'position': 'relative !important',
                    'z-index': '1000 !important',
                    'background-color': '#4CAF50 !important',
                    'color': 'white !important',
                    'border': '2px solid #2E7D32 !important',
                    'border-radius': '4px !important',
                    'padding': '8px 24px !important',
                    'cursor': 'pointer !important',
                    'font-size': '16px !important',
                    'font-weight': 'bold !important',
                    'margin': '0 0 0 10px !important',
                    'box-shadow': '0 2px 5px rgba(0,0,0,0.2) !important',
                    'float': 'left !important',
                    'line-height': 'normal !important',
                    'text-align': 'center !important',
                    'vertical-align': 'middle !important',
                    'white-space': 'nowrap !important',
                    'text-decoration': 'none !important',
                    'text-transform': 'none !important',
                    'min-width': '100px !important',
                    'box-sizing': 'border-box !important',
                    'transition': '0.3s !important'
                })
                .prop('disabled', false)
                .show();
            
            // Make sure inputs are enabled
            enableInputsForQuestion($question);
            
            // Show inline hint message and highlight hint button
            if (hasHint && !hintViewed) {
                showInlineHintMessage();
                highlightHintButton($question);
            }
        } 
        // If the answer is correct, show the Next button
        else if (isCorrect === true) {
            log.info('Correct answer detected, showing Next button');
            
            $question.find('.wpProQuiz_button[name="next"]').show()
                .css('display', 'inline-block')
                .removeAttr('style');
                
            // Hide any tooltip and inline hint message
            $question.find('.hint-tooltip').remove();
            hideInlineHintMessage();
        }
    }
    
    /**
     * Show inline hint message at bottom of quiz
     */
    function showInlineHintMessage() {
        // Remove existing hint message
        const existingMessage = document.getElementById('lilac-hint-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create inline hint message using user's HTML
        const hintMessage = document.createElement('div');
        hintMessage.id = 'lilac-hint-message';
        hintMessage.className = 'lilac-hint-message';
        hintMessage.innerHTML = `
            <div class="lilac-hint-message" style="background-color: rgb(255, 243, 224); border: 1px solid rgb(255, 152, 0); border-radius: 4px; padding: 10px 15px; margin: 15px 0px; text-align: right; font-size: 16px; display: flex; align-items: center; justify-content: space-between; direction: rtl;">
                <span style="font-weight:bold;color:#e74c3c;">
                    <img draggable="false" role="img" class="emoji" alt="❌" src="https://s.w.org/images/core/emoji/16.0.1/svg/274c.svg"> תשובה שגויה!
                </span>
                <span>לחץ על רמז לקבלת עזרה</span>
                <button type="button" class="lilac-force-hint" style="display: inline-block; visibility: visible; background-color: rgb(255, 152, 0); color: white; font-weight: bold; border: 2px solid rgb(230, 126, 34); border-radius: 4px; padding: 8px 24px; cursor: pointer; font-size: 16px; margin-right: 10px; box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 5px;">רמז</button>
            </div>
        `;
        
        // Find quiz container and append at bottom
        const quizContainer = document.querySelector('.wpProQuiz_content, .learndash-quiz-content, .quiz-content, .wpProQuiz_quiz');
        if (quizContainer) {
            quizContainer.appendChild(hintMessage);
        } else {
            // Fallback: append to body
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
     * Hide inline hint message
     */
    function hideInlineHintMessage() {
        const hintMessage = document.getElementById('lilac-hint-message');
        if (hintMessage) {
            hintMessage.remove();
            log.info('📘 Inline hint message hidden');
        }
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
        
        // Hide inline hint message since answer is correct
        hideInlineHintMessage();
        
        // Show correct answer indicator with next button
        showCorrectAnswerIndicator();
        
        // Allow progression
        state.hintViewed = true;
        state.canProceed = true;
        
        // Enable next button or check button
        enableNextButton();
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
        } else {
            // Fallback: create new indicator if hint message doesn't exist
            const correctIndicator = document.createElement('div');
            correctIndicator.id = 'lilac-correct-indicator';
            correctIndicator.style.cssText = `
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
            `;
            
            correctIndicator.innerHTML = `
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
            
            document.body.appendChild(correctIndicator);
            log.info('✅ Correct answer indicator created as fallback');
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
     * Enable all inputs in the quiz
     */
    function enableAllInputs() {
        $('.wpProQuiz_questionInput').prop('disabled', false)
            .removeAttr('disabled')
            .css('pointer-events', 'auto');
        
        $('.wpProQuiz_questionListItem label').css('pointer-events', 'auto');
    }
    
    /**
     * Highlight the hint button with tooltip
     */
    function highlightHintButton($question) {
        const $hintBtn = $question.find('.wpProQuiz_TipButton, .wpProQuiz_hint').first();
        
        if (!$hintBtn.length) {
            log.error('No hint button found for question', $question);
            return;
        }
        
        // Add highlighting
        $hintBtn.addClass('highlight')
            .css({
                'animation': 'pulse-button 1.5s infinite',
                'background-color': '#ffc107',
                'font-weight': 'bold',
                'border': '2px solid #ff9800',
                'box-shadow': '0 0 10px rgba(255, 193, 7, 0.5)',
                'position': 'relative',
                'z-index': '100'
            });
        
        // Add CSS for animation if not already added
        if (!$('#hint-animation-style').length) {
            $('<style id="hint-animation-style">@keyframes pulse-button {0% {transform: scale(1);} 50% {transform: scale(1.1);} 100% {transform: scale(1);}}</style>').appendTo('head');
        }
        
        // Remove any existing tooltips
        $question.find('.hint-tooltip').remove();
        
        // Add tooltip message
        const $tooltip = $('<div class="hint-tooltip">' + config.tooltipText + '</div>');
        $tooltip.insertAfter($hintBtn);
        
        // Style the tooltip
        $tooltip.css({
            'position': 'absolute',
            'background-color': '#ffc107',
            'color': '#333',
            'padding': '5px 10px',
            'border-radius': '4px',
            'font-size': '14px',
            'font-weight': 'bold',
            'z-index': '999',
            'margin-top': '5px',
            'box-shadow': '0 2px 5px rgba(0,0,0,0.2)',
            'max-width': '200px',
            'text-align': 'center'
        });
    }
    
    /**
     * Remove hint button highlight and tooltip
     */
    function removeHintHighlight($question) {
        const $hintBtn = $question.find('.wpProQuiz_TipButton, .wpProQuiz_hint').first();
        
        if ($hintBtn.length) {
            $hintBtn.removeClass('highlight')
                .css({
                    'animation': 'none',
                    'background-color': '',
                    'font-weight': '',
                    'border': '',
                    'box-shadow': '',
                    'position': '',
                    'z-index': ''
                });
        }
        
        // Remove tooltip
        $question.find('.hint-tooltip').remove();
    }
    
    /**
     * Remove any debug containers that might interfere with the quiz
     */
    function removeDebugContainers() {
        // Remove any debug containers that may exist from previous versions
        $('#media-debug-container, #quiz-debug-panel').remove();
    }
    
    /**
     * Set up a mutation observer to watch for dynamically added questions
     */
    function setupObserver() {
        // Check if MutationObserver is supported
        if (!window.MutationObserver) {
            log.error('MutationObserver not supported in this browser');
            return;
        }
        
        // Create an observer instance
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // If nodes were added
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    // Check for any new quiz questions
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const node = mutation.addedNodes[i];
                        
                        if (node.nodeType === 1) { // Element node
                            if ($(node).hasClass('wpProQuiz_listItem')) {
                                // Setup the new question
                                setupQuestion(0, node);
                            } else {
                                // Look for questions inside the added node
                                $(node).find('.wpProQuiz_listItem').each(setupQuestion);
                            }
                        }
                    }
                }
            });
        });
        
        // Start observing the entire document
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        log.info('MutationObserver setup complete');
    }
    
})(jQuery);
