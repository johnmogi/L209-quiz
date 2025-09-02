'use strict';
/**
 * LearnDash Quiz - Answer Reselection
 * 
 * Enables users to reselect and submit answers after incorrect submission
 * Part of the Enforce Hint feature for the Lilac Quiz Sidebar plugin
 * Version 1.2.1 - Enhanced Next button visibility
 */

// Check for jQuery
if (typeof jQuery === 'undefined') {
    console.error('Lilac Quiz: jQuery is not loaded!');
}

// Main plugin code
(function($) {
    console.log('[LilacQuiz] *** SCRIPT LOADED - ENHANCED SYSTEM STARTING ***');
    
    //remove check button
    $(function() {
        console.log('[LilacQuiz] *** DOCUMENT READY - INITIALIZING ***');
        $('input.wpProQuiz_QuestionButton[name="check"]').each(function() {
            this.setAttribute('style', 'position: absolute !important; opacity: 0.5 !important;');
        });
    });
    
    // Configuration
    const config = {
        debug: false,                  // Disable debug logging by default
        enforceHintDelay: 300,        // Delay before processing hint enforcement (ms)
        highlightNext: true,          // Whether to highlight the Next button
        highlightHintOnSelection: true, // Enable hint highlighting
        tooltipText: 'Incorrect - please try again',  // Simplified message
        answerDetection: true,       // Keep answer detection enabled
        forceHideNextButton: false,  // Show next button after any answer
        strictLogging: false,        // Keep detailed logging off
        enableAnswerValidation: true, // Enable basic validation without hints
        enableVisualDebugger: false  // Disable visual debugger by default
    };
    
    // Store for question data
    const questionData = {};
    
    // Logger - only log in development
    const log = {
        info: function() { if (config.strictLogging) console.log(...arguments); },
        answer: function() { if (config.strictLogging) console.log(...arguments); },
        error: function() { console.error(...arguments); },
        questionSummary: function() { if (config.strictLogging) console.log(...arguments); },
        warn: function() { console.warn(...arguments); }
    };
    
    /**
     * Extract question data from the DOM
     */
    function extractQuestionData() {
        log.info('Scanning for question data...');
        
        // Get all quiz questions
        $('.wpProQuiz_listItem').each(function(index) {
                                    const $question = $(this);
            const questionIndex = $question.index();
            const questionId = questionIndex + 1;
            
            // Store basic question information
            questionData[questionId] = {
                id: questionId,
                hasHint: $question.find('.wpProQuiz_TipButton, .wpProQuiz_hint').length > 0,
                correctAnswerFound: false
            };
        });
    }

    /**
     * Style all buttons in the quiz for consistent appearance
     */
    function styleAllButtons() {
        // Style all quiz buttons for consistency
        $('.wpProQuiz_button, .wpProQuiz_QuestionButton').each(function() {
            const $btn = $(this);
            const btnName = $btn.attr('name');
            
            // Common button styling
            $btn.css({
                'display': 'inline-block',
                'border': 'none',
                'border-radius': '4px',
                'padding': '8px 15px',
                'margin': '5px',
                'font-size': '16px',
                'font-weight': 'bold',
                'cursor': 'pointer',
                'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
                'transition': 'all 0.3s ease'
            });
            
            // Button-specific styling
            if (btnName === 'check') {
                $btn.css('background-color', '#28a745');
            } else if (btnName === 'next') {
                $btn.css('background-color', '#007bff');
            } else if (btnName === 'back') {
                $btn.css('background-color', '#6c757d');
            }
        });
    }

    /**
     * Show hint in a modal
     */
    function showHintModal($question) {
        // Hide any existing native hint popups first
        $('.wpProQuiz_tipp').hide();
        
        const $hintContent = $question.find('.wpProQuiz_tipp');
        if ($hintContent.length) {
            // Create modal container if it doesn't exist
            if (!$('#lilac-hint-modal').length) {
                $('body').append(`
                    <div id="lilac-hint-modal" class="lilac-modal">
                        <div class="lilac-modal-content">
                            <span class="lilac-modal-close">&times;</span>
                            <div class="lilac-modal-body"></div>
                        </div>
                    </div>
                `);
                
                // Add modal styles if not already added
                if (!$('#lilac-modal-styles').length) {
                    $('<style id="lilac-modal-styles">')
                        .text(`
                            .lilac-modal {
                                display: none;
                                position: fixed;
                                z-index: 10000;
                                left: 0;
                                top: 0;
                                width: 100%;
                                height: 100%;
                                background-color: rgba(0,0,0,0.6);
                            }
                            .lilac-modal-content {
                                background-color: #fefefe;
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                padding: 20px;
                                border: 1px solid #888;
                                width: 90%;
                                max-width: 800px;
                                max-height: 70vh;
                                overflow-y: auto;
                                border-radius: 8px;
                                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                            }
                            .lilac-modal-close {
                                color: #aaa;
                                float: right;
                                font-size: 28px;
                                font-weight: bold;
                                cursor: pointer;
                            }
                            .lilac-modal-close:hover {
                                color: black;
                            }
                            .lilac-modal-body {
                                margin-top: 20px;
                                direction: rtl;
                                text-align: right;
                            }
                            
                            /* Hide native hint popups */
                            .wpProQuiz_tipp {
                                display: none !important;
                            }
                            
                            /* Override LearnDash green border for correct incomplete answers */
                            .learndash-wrapper .wpProQuiz_content .wpProQuiz_questionListItem.wpProQuiz_answerCorrectIncomplete label {
                                border-color: inherit !important;
                            }
                        `)
                        .appendTo('head');
                }
            }
            
            // Show modal with hint content
            const $modal = $('#lilac-hint-modal');
            $modal.find('.lilac-modal-body').html($hintContent.html());
            $modal.fadeIn(200);
            
            // Handle close button
            $modal.find('.lilac-modal-close').off('click').on('click', function() {
                $modal.fadeOut(200);
            });
            
            // Close on outside click
            $(window).off('click.lilac-modal').on('click.lilac-modal', function(e) {
                if ($(e.target).is($modal)) {
                    $modal.fadeOut(200);
                }
            });
        } else {
            // Show custom hint if no native hint content exists
            showCustomHint($question, $('.wpProQuiz_listItem').index($question) + 1);
        }
    }

    /**
     * Handle the result of an answer submission
     */
    function handleAnswerResult($question, isCorrect, questionId) {
        // Remove any previous messages
        $question.find('.lilac-correct-answer-message').remove();

        if (isCorrect) {
            // Remove any locks when answer is correct
            $question.removeClass('lilac-locked');
            
            // Add success message with Next button
            const $successMessage = $('<div class="lilac-correct-answer-message" style="background-color: rgb(232, 245, 233); border: 1px solid rgb(76, 175, 80); border-radius: 4px; padding: 10px 15px; margin: 15px 0px; text-align: right; font-size: 16px; display: flex; align-items: center; justify-content: space-between; direction: rtl;">' +
                '<span style="font-weight:bold;color:#4CAF50;">✓ תשובה נכונה!</span>' +
                '<span>לחץ על הבא להמשיך</span>' +
                '<button type="button" class="lilac-force-next" style="display: inline-block; visibility: visible; background-color: rgb(46, 89, 217); color: white; font-weight: bold; border: 2px solid rgb(24, 53, 155); border-radius: 4px; padding: 8px 24px; cursor: pointer; font-size: 16px; margin-right: 10px; box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 5px;">הבא</button>' +
                '</div>');
            
            // Insert above the native buttons
            const $firstBtn = $question.find('input.wpProQuiz_button').first();
            if ($firstBtn.length) {
                $successMessage.insertBefore($firstBtn);
            } else {
                $question.append($successMessage);
            }

            // Disable all inputs after correct answer
            $question.find('.wpProQuiz_questionInput').prop('disabled', true)
                .closest('.wpProQuiz_questionListItem')
                .css({
                    'pointer-events': 'none',
                    'cursor': 'not-allowed',
                    'opacity': '0.6'
                });

            // Show the Next button
            const $nextButton = $question.find('.wpProQuiz_button[name="next"]');
            $nextButton.css({
                'float': 'left',
                'margin': '0px 10px',
                'display': 'inline-block',
                'visibility': 'visible',
                'opacity': '1',
                'pointer-events': 'auto'
            }).prop('disabled', false);
            
        } else {
            // For incorrect answers, allow reselection without locking
            console.log('[LilacQuiz] Incorrect answer - allowing reselection');
            
            // Don't lock the question - allow immediate reselection
            // $question.addClass('lilac-locked'); // REMOVED
            
            // Keep answer selection enabled for reselection
            $question.find('.wpProQuiz_questionInput').prop('disabled', false);
            $question.find('.wpProQuiz_questionListItem').css({
                'pointer-events': 'auto',
                'cursor': 'pointer',
                'opacity': '1'
            });
            
            // Keep check button visible and enabled
            $question.find('.wpProQuiz_button[name="check"]').css({
                'display': 'inline-block',
                'visibility': 'visible',
                'opacity': '1'
            }).prop('disabled', false);
            
            // Remove any existing hint messages to prevent duplicates
            $question.find('.lilac-hint-message').remove();
            
            // Add hint message to existing response area or create new one
            let $responseArea = $question.find('.wpProQuiz_response');
            if (!$responseArea.length) {
                $responseArea = $('<div class="wpProQuiz_response"></div>');
                $question.find('.wpProQuiz_questionList').after($responseArea);
            }
            
            // Clear any existing content in response area to prevent duplicates
            $responseArea.empty();
            
            // Add wrong answer message without the orange hint button
            const $hintMessage = $('<div class="lilac-hint-message" style="background-color: rgb(255, 243, 224); border: 1px solid rgb(255, 152, 0); border-radius: 4px; padding: 10px 15px; margin: 15px 0px; text-align: right; font-size: 16px; direction: rtl;">' +
                '<span>תשובה שגויה! לחץ על הרמז הכחול למטה לקבלת עזרה</span>' +
            '</div>');
            $responseArea.append($hintMessage);
            
            // Change hint box color from blue to orange
            changeHintBoxesToOrange();
            
            // Hide the original orange hint button
            const $hintButton = $question.find('.wpProQuiz_button[name="tip"]');
            $hintButton.css({
                'display': 'none !important',
                'visibility': 'hidden',
                'opacity': '0'
            });
        }
    }

    /**
     * Handle hint button clicks - simplified
     */
    function handleHintViewing($question) {
        console.log('[LilacQuiz] Hint clicked, showing modal and unlocking question');
        
        // Show the hint modal FIRST
        showHintModal($question);
        
        // Remove lock
        $question.removeClass('lilac-locked');
        
        // Remove hint message
        $question.find('.lilac-hint-message').remove();
        
        // Re-enable answer selection
        $question.find('.wpProQuiz_questionInput').prop('disabled', false);
        $question.find('.wpProQuiz_questionListItem').css({
            'pointer-events': 'auto',
            'cursor': 'pointer',
            'opacity': '1'
        });
        
        // Clear any previous selection to ensure fresh start
        $question.find('.wpProQuiz_questionInput').prop('checked', false);
    }

    /**
     * Set up event handlers for quiz interaction
     */
    function setupEventHandlers() {
        console.log('[LilacQuiz] *** SETTING UP EVENT HANDLERS ***');
        
        // Remove any existing handlers
        $(document).off('click.simplifiedCheck');

        // Handle check button clicks - enhanced detection system
        $(document).on('click.simplifiedCheck', 'input.wpProQuiz_button[name="check"]', function(e) {
            console.log('[LilacQuiz] *** CHECK BUTTON CLICKED ***');
            
            const $question = $(this).closest('.wpProQuiz_listItem');
            const $selected = $question.find('.wpProQuiz_questionInput:checked');

            if (!$selected.length) {
                console.log('[LilacQuiz] No answer selected');
                return;
            }

            console.log('[LilacQuiz] Selected answer:', $selected.val());
            console.log('[LilacQuiz] *** STARTING ENHANCED DETECTION ***');
            
            // Immediate MutationObserver setup
            setupEarlyAnswerDetection($question);
            
            // Let the native quiz handle the check first
            // Then watch for the result with enhanced detection
            console.log('[LilacQuiz] Starting enhanced polling system...');
            watchForAnswerResult($question);
        });

        // Handle hint button clicks - both native and our custom button, plus initial hint boxes
        $(document).on('click', '.wpProQuiz_button[name="tip"], .wpProQuiz_TipButton, .lilac-force-hint, .lilac-clickable-hint', function(e) {
            e.preventDefault();
            const $question = $(this).closest('.wpProQuiz_listItem');
            
            // Check if clicking our custom hint button or initial hint box
            if ($(this).hasClass('lilac-force-hint') || $(this).hasClass('lilac-clickable-hint')) {
                console.log('[LilacQuiz] Custom hint button or initial hint box clicked');
                
                // If clicking initial hint box, just show modal (no unlocking needed)
                if ($(this).hasClass('lilac-clickable-hint')) {
                    console.log('[LilacQuiz] Initial hint box clicked - showing modal');
                    showHintModal($question);
                } else {
                    // Custom hint button after wrong answer - unlock and show modal
                    if ($question.hasClass('lilac-locked')) {
                        handleHintViewing($question);
                    } else {
                        // Just show the modal if not locked
                        showHintModal($question);
                    }
                }
            } else {
                // Native hint button clicked
                console.log('[LilacQuiz] Native hint button clicked');
                handleHintViewing($question);
            }
        });

        // Handle answer selection (remove messages)
        $(document).on('change', '.wpProQuiz_questionInput', function() {
            const $question = $(this).closest('.wpProQuiz_listItem');
            $question.find('.lilac-correct-answer-message').remove();
        });

        // Handle next button in success message
        $(document).on('click', '.lilac-force-next', function(e) {
            e.preventDefault();
            const $question = $(this).closest('.wpProQuiz_listItem');
            const $nextButton = $question.find('.wpProQuiz_button[name="next"]');
            if ($nextButton.length) {
                $nextButton.trigger('click');
            }
        });

        // Handle answer selection (remove messages)
        $(document).on('change', '.wpProQuiz_questionInput', function() {
            const $question = $(this).closest('.wpProQuiz_listItem');
            $question.find('.lilac-correct-answer-message').remove();
        });

        // Handle next button in success message
        $(document).on('click', '.lilac-force-next', function(e) {
            e.preventDefault();
            const $question = $(this).closest('.wpProQuiz_listItem');
            const $nextButton = $question.find('.wpProQuiz_button[name="next"]');
            if ($nextButton.length) {
                $nextButton.trigger('click');
            }
        });
    }

/**
 * Early detection system - monitors DOM changes to catch answer results before LearnDash fully processes them
 */
function setupEarlyAnswerDetection($question) {
    console.log('[LilacQuiz] *** MUTATION OBSERVER SETUP ***');
    
    const questionElement = $question[0];
    if (!questionElement) {
        console.log('[LilacQuiz] ERROR: No question element');
        return;
    }
    
    let detectionComplete = false;
    
    const observer = new MutationObserver(function(mutations) {
        if (detectionComplete) return;
        
        console.log('[LilacQuiz] *** MUTATIONS:', mutations.length, '***');
        
        mutations.forEach(function(mutation) {
            if (detectionComplete) return;
            
            // Class changes on answer elements
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const $target = $(mutation.target);
                const classes = $target.attr('class') || '';
                
                console.log('[LilacQuiz] Class change:', mutation.target.tagName, classes);
                
                if ($target.hasClass('wpProQuiz_questionListItem')) {
                    if (classes.includes('wpProQuiz_answerCorrect')) {
                        console.log('[LilacQuiz] *** CORRECT DETECTED ***');
                        detectionComplete = true;
                        observer.disconnect();
                        handleAnswerResult($question, true);
                        return;
                    } else if (classes.includes('wpProQuiz_answerIncorrect')) {
                        console.log('[LilacQuiz] *** INCORRECT DETECTED ***');
                        detectionComplete = true;
                        observer.disconnect();
                        handleAnswerResult($question, false);
                        return;
                    }
                }
            }
            
            // New elements added
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                Array.from(mutation.addedNodes).forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const $node = $(node);
                        const className = node.className || '';
                        
                        console.log('[LilacQuiz] Element added:', node.tagName, className);
                        
                        // Check for status elements
                        if (className.includes('ld-quiz-question-item__status--correct') || 
                            $node.find('.ld-quiz-question-item__status--correct').length) {
                            console.log('[LilacQuiz] *** CORRECT STATUS ADDED ***');
                            detectionComplete = true;
                            observer.disconnect();
                            handleAnswerResult($question, true);
                            return;
                        } else if (className.includes('ld-quiz-question-item__status--incorrect') || 
                                  $node.find('.ld-quiz-question-item__status--incorrect').length) {
                            console.log('[LilacQuiz] *** INCORRECT STATUS ADDED ***');
                            detectionComplete = true;
                            observer.disconnect();
                            handleAnswerResult($question, false);
                            return;
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(questionElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
    
    console.log('[LilacQuiz] Observer active for 8 seconds');
    setTimeout(() => {
        if (!detectionComplete) {
            console.log('[LilacQuiz] Observer timeout - starting polling fallback');
            observer.disconnect();
            watchForAnswerResult($question);
        }
    }, 8000);
    
    return observer;
}

    /**
     * Watch for answer result after check button is clicked
     * Enhanced with backup detection system for LearnDash status elements
     */
    function watchForAnswerResult($question) {
        console.log('[LilacQuiz] *** POLLING FALLBACK STARTED ***');
        let checkCount = 0;
        const maxChecks = 30; // 3 seconds max
        
        const checkInterval = setInterval(function() {
            checkCount++;
            
            // First priority: Check selected answer for result classes
            const $selected = $question.find('.wpProQuiz_questionInput:checked');
            if ($selected.length) {
                const $wrapper = $selected.closest('.wpProQuiz_questionListItem');
                const classes = $wrapper.attr('class') || '';
                
                // Only log every 5th check to reduce console spam
                if (checkCount % 5 === 1) {
                    console.log('[LilacQuiz] Checking classes:', classes);
                }
                
                // BACKUP SYSTEM: Check for new LearnDash status elements first
                const $statusElement = $selected.closest('label').find('.ld-quiz-question-item__status');
                if ($statusElement.length) {
                    const $correctStatus = $statusElement.find('.ld-quiz-question-item__status--correct');
                    const $incorrectStatus = $statusElement.find('.ld-quiz-question-item__status--incorrect');
                    
                    if ($correctStatus.is(':visible') || $correctStatus.css('display') !== 'none') {
                        console.log('[LilacQuiz] Correct answer detected via NEW status element!');
                        clearInterval(checkInterval);
                        handleAnswerResult($question, true);
                        return;
                    } else if ($incorrectStatus.is(':visible') || $incorrectStatus.css('display') !== 'none') {
                        console.log('[LilacQuiz] Incorrect answer detected via NEW status element!');
                        clearInterval(checkInterval);
                        handleAnswerResult($question, false);
                        return;
                    }
                }
                
                // Original system: Check if quiz has applied result classes
                if ($wrapper.hasClass('wpProQuiz_answerCorrect') || 
                    $wrapper.hasClass('wpProQuiz_answerCorrectIncomplete')) {
                    console.log('[LilacQuiz] Correct answer detected! Classes:', classes);
                    clearInterval(checkInterval);
                    handleAnswerResult($question, true);
                    return;
                } else if ($wrapper.hasClass('wpProQuiz_answerIncorrect')) {
                    console.log('[LilacQuiz] Incorrect answer detected! Classes:', classes);
                    clearInterval(checkInterval);
                    handleAnswerResult($question, false);
                    return;
                }
            }
            
            // Second priority: Check for native response area with content
            const $response = $question.find('.wpProQuiz_response');
            if ($response.length && $response.text().trim().length > 0) {
                // Response area has content, now check the answer classes one more time
                const $selected = $question.find('.wpProQuiz_questionInput:checked');
                if ($selected.length) {
                    const $wrapper = $selected.closest('.wpProQuiz_questionListItem');
                    
                    if ($wrapper.hasClass('wpProQuiz_answerIncorrect')) {
                        console.log('[LilacQuiz] Incorrect answer detected via response area');
                        clearInterval(checkInterval);
                        handleAnswerResult($question, false);
                        return;
                    } else if ($wrapper.hasClass('wpProQuiz_answerCorrect') || 
                              $wrapper.hasClass('wpProQuiz_answerCorrectIncomplete')) {
                        console.log('[LilacQuiz] Correct answer detected via response area');
                        clearInterval(checkInterval);
                        handleAnswerResult($question, true);
                        return;
                    }
                }
            }
            
            // Third priority: Check all answer items for the incorrect class
            const $incorrectAnswer = $question.find('.wpProQuiz_answerIncorrect');
            if ($incorrectAnswer.length) {
                console.log('[LilacQuiz] Found incorrect answer marker on element');
                clearInterval(checkInterval);
                handleAnswerResult($question, false);
                return;
            }
            
            // Fourth priority: Check for any visible status elements (backup system)
            const $allStatusElements = $question.find('.ld-quiz-question-item__status');
            if ($allStatusElements.length) {
                const $visibleCorrect = $allStatusElements.find('.ld-quiz-question-item__status--correct:visible');
                const $visibleIncorrect = $allStatusElements.find('.ld-quiz-question-item__status--incorrect:visible');
                
                if ($visibleCorrect.length) {
                    console.log('[LilacQuiz] Backup detection: Correct answer found via visible status');
                    clearInterval(checkInterval);
                    handleAnswerResult($question, true);
                    return;
                } else if ($visibleIncorrect.length) {
                    console.log('[LilacQuiz] Backup detection: Incorrect answer found via visible status');
                    clearInterval(checkInterval);
                    handleAnswerResult($question, false);
                    return;
                }
            }
            
            if (checkCount >= maxChecks) {
                console.log('[LilacQuiz] Timeout waiting for answer result after 3 seconds');
                clearInterval(checkInterval);
                
                // Enhanced fallback: Check both old classes AND new status elements
                const $anyIncorrect = $question.find('.wpProQuiz_answerIncorrect');
                const $anyCorrect = $question.find('.wpProQuiz_answerCorrect, .wpProQuiz_answerCorrectIncomplete');
                
                // Also check status elements as final fallback
                const $finalStatusCheck = $question.find('.ld-quiz-question-item__status');
                const $finalCorrect = $finalStatusCheck.find('.ld-quiz-question-item__status--correct');
                const $finalIncorrect = $finalStatusCheck.find('.ld-quiz-question-item__status--incorrect');
                
                if ($anyIncorrect.length || $finalIncorrect.length) {
                    console.log('[LilacQuiz] Final fallback: Incorrect answer detected');
                    handleAnswerResult($question, false);
                } else if ($anyCorrect.length || $finalCorrect.length) {
                    console.log('[LilacQuiz] Final fallback: Correct answer detected');
                    handleAnswerResult($question, true);
                } else {
                    console.log('[LilacQuiz] No answer result detected after timeout - system may need manual intervention');
                }
            }
        }, 100);
    }

    /**
     * Show the Next button for a question
     */
    function showNextButton($question) {
        const $nextButton = $question.find('.wpProQuiz_button[name="next"]');
        if ($nextButton.length) {
            $nextButton.show().css({
                    'display': 'inline-block',
                    'visibility': 'visible',
                    'opacity': '1',
                'pointer-events': 'auto'
            });
        }
    }

    /**
     * Inject initial hint boxes for all questions
     */
    function injectInitialHintBoxes() {
        console.log('[LilacQuiz] *** INJECTING INITIAL HINT BOXES ***');
        
        // Function to inject hint boxes
        function doInjection() {
            // Try multiple selectors to find quiz questions
            let $visibleQuestions = $('.wpProQuiz_listItem:visible');
            
            // If no visible questions found, try without :visible filter
            if ($visibleQuestions.length === 0) {
                $visibleQuestions = $('.wpProQuiz_listItem');
                console.log(`[LilacQuiz] No :visible questions, found ${$visibleQuestions.length} total questions`);
            }
            
            // Try alternative selectors if still no questions
            if ($visibleQuestions.length === 0) {
                $visibleQuestions = $('.wpProQuiz_question, .wpProQuiz_questionListItem, [data-question-id]');
                console.log(`[LilacQuiz] Trying alternative selectors, found ${$visibleQuestions.length} questions`);
            }
            
            console.log(`[LilacQuiz] Found ${$visibleQuestions.length} questions for injection`);
            
            if ($visibleQuestions.length === 0) {
                console.log('[LilacQuiz] No questions found with any selector, retrying...');
                return false;
            }
            
            $visibleQuestions.each(function(index) {
                const $question = $(this);
                
                // Skip if hint box already exists
                if ($question.find('.lilac-initial-hint-box').length) {
                    return;
                }
                
                // Create hint box for each question
                const $hintBox = $(`
                    <div class="lilac-initial-hint-box lilac-hint-blue" data-question-index="${index}" style="
                        background: linear-gradient(135deg, #4a90e2, #5ba0f2) !important;
                        color: white !important;
                        padding: 15px 20px !important;
                        margin: 15px 0 !important;
                        border-radius: 8px !important;
                        font-size: 16px !important;
                        font-weight: bold !important;
                        text-align: center !important;
                        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3) !important;
                        border: 2px solid #3a7bc8 !important;
                        position: relative !important;
                        z-index: 1000 !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        animation: lilac-hint-pulse 2s infinite !important;
                        cursor: pointer !important;
                    ">
                        💡 רמז זמין! לחץ כאן לקבלת עזרה בשאלה זו
                    </div>
                `);
                
                // Add click handler to show hint
                $hintBox.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[LilacQuiz] Hint box clicked for question', index + 1);
                    
                    // Hide any existing native hint popups first
                    $question.find('.wpProQuiz_tipp').hide();
                    
                    // Show our custom modal instead of triggering native hint
                    showHintModal($question);
                });
                
                // Insert hint box at the bottom of the question
                $question.append($hintBox);
                console.log(`[LilacQuiz] Added hint box to question ${index + 1}`);
            });
            
            return true;
        }
        
        // Try immediate injection
        if (!doInjection()) {
            // If no questions found, try multiple times with increasing delays
            let attempts = 0;
            const maxAttempts = 10;
            
            const retryInterval = setInterval(function() {
                attempts++;
                console.log(`[LilacQuiz] Injection attempt ${attempts}/${maxAttempts}`);
                
                if (doInjection() || attempts >= maxAttempts) {
                    clearInterval(retryInterval);
                    if (attempts >= maxAttempts) {
                        console.log('[LilacQuiz] Max injection attempts reached');
                    }
                }
            }, 500);
        }
        
        // Add CSS animation for pulsing effect and color states
        if (!$('#lilac-hint-animations').length) {
            $('head').append(`
                <style id="lilac-hint-animations">
                    @keyframes lilac-hint-pulse {
                        0% { transform: scale(1); opacity: 0.9; }
                        50% { transform: scale(1.02); opacity: 1; }
                        100% { transform: scale(1); opacity: 0.9; }
                    }
                    .lilac-initial-hint-box:hover {
                        transform: scale(1.05) !important;
                        cursor: pointer !important;
                    }
                    .lilac-hint-blue:hover {
                        box-shadow: 0 6px 20px rgba(74, 144, 226, 0.5) !important;
                    }
                    .lilac-hint-orange:hover {
                        box-shadow: 0 6px 20px rgba(255, 140, 0, 0.5) !important;
                    }
                    .lilac-hint-orange {
                        background: linear-gradient(135deg, #ff8c00, #ffa500) !important;
                        box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3) !important;
                        border: 2px solid #ff6b00 !important;
                    }
                    /* Make hint boxes persistent - always visible */
                    .lilac-initial-hint-box {
                        position: sticky !important;
                        bottom: 10px !important;
                    }
                </style>
            `);
        }
        
        console.log('[LilacQuiz] Initial hint boxes injection setup completed');
        
        // Set up wrong answer detection to change hint box color
        setupWrongAnswerDetection();
    }
    
    /**
     * Setup detection for wrong answers to change hint box color
     */
    function setupWrongAnswerDetection() {
        // Monitor for answer selection and validation (replacing deprecated DOMNodeInserted)
        $(document).on('click', '.wpProQuiz_questionInput', function() {
            const $question = $(this).closest('.wpProQuiz_listItem');
            setTimeout(function() {
                // Check if this question now shows incorrect feedback
                if ($question.find('.wpProQuiz_incorrect:visible').length > 0) {
                    console.log('[LilacQuiz] Wrong answer detected via click, changing hint box to orange');
                    changeHintBoxesToOrange();
                }
            }, 100);
        });
        
        // Also monitor for any changes in the quiz area using MutationObserver
        if (window.MutationObserver) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        // Check for incorrect feedback
                        $(mutation.addedNodes).find('.wpProQuiz_incorrect:visible').each(function() {
                            console.log('[LilacQuiz] Wrong answer detected via mutation, changing hint box to orange');
                            changeHintBoxesToOrange();
                        });
                        
                        // Check for new questions and inject hint boxes
                        $(mutation.addedNodes).find('.wpProQuiz_listItem:visible').each(function() {
                            const $question = $(this);
                            if (!$question.find('.lilac-initial-hint-box').length) {
                                console.log('[LilacQuiz] New question detected, injecting hint box');
                                injectHintBoxForQuestion($question);
                            }
                        });
                        
                        // Re-inject hint boxes for existing visible questions that lost them
                        setTimeout(function() {
                            $('.wpProQuiz_listItem:visible').each(function() {
                                const $question = $(this);
                                if (!$question.find('.lilac-initial-hint-box').length) {
                                    console.log('[LilacQuiz] Re-injecting missing hint box');
                                    injectHintBoxForQuestion($question);
                                }
                            });
                        }, 100);
                    }
                });
            });
            
            // Observe the quiz container
            const quizContainer = document.querySelector('.wpProQuiz_quiz, .wpProQuiz_content');
            if (quizContainer) {
                observer.observe(quizContainer, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
                console.log('[LilacQuiz] MutationObserver setup for quiz container');
            }
        }
        
        // Periodic check to ensure hint boxes remain visible
        setInterval(function() {
            $('.wpProQuiz_listItem:visible').each(function() {
                const $question = $(this);
                if (!$question.find('.lilac-initial-hint-box').length) {
                    console.log('[LilacQuiz] Periodic check: Re-injecting missing hint box');
                    injectHintBoxForQuestion($question);
                }
            });
        }, 2000);
    }
    
    /**
     * Change all hint boxes from blue to orange
     */
    function changeHintBoxesToOrange() {
        $('.lilac-initial-hint-box.lilac-hint-blue').each(function() {
            $(this).removeClass('lilac-hint-blue').addClass('lilac-hint-orange');
            // Update the styling to orange
            $(this).css({
                'background': 'linear-gradient(135deg, #ff9800, #f57c00) !important',
                'border': '2px solid #e65100 !important',
                'box-shadow': '0 4px 12px rgba(255, 152, 0, 0.3) !important'
            });
            console.log('[LilacQuiz] Changed hint box to orange');
        });
    }
    
    /**
     * Inject hint box for a single question
     */
    function injectHintBoxForQuestion($question) {
        // Skip if hint box already exists
        if ($question.find('.lilac-initial-hint-box').length) {
            return;
        }
        
        const questionIndex = $('.wpProQuiz_listItem').index($question);
        console.log(`[LilacQuiz] Injecting hint box for question ${questionIndex + 1}`);
        
        // Create hint box for this question
        const $hintBox = $(`
            <div class="lilac-initial-hint-box lilac-hint-blue" data-question-index="${questionIndex}" style="
                background: linear-gradient(135deg, #4a90e2, #5ba0f2) !important;
                color: white !important;
                padding: 15px 20px !important;
                margin: 15px 0 !important;
                border-radius: 8px !important;
                font-size: 16px !important;
                font-weight: bold !important;
                text-align: center !important;
                box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3) !important;
                border: 2px solid #3a7bc8 !important;
                position: relative !important;
                z-index: 1000 !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                animation: lilac-hint-pulse 2s infinite !important;
                cursor: pointer !important;
                direction: rtl !important;
            ">
                💡 רמז זמין! לחץ כאן לקבלת עזרה בשאלה זו
            </div>
        `);
        
        // Add click handler to show hint
        $hintBox.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[LilacQuiz] Hint box clicked for question', questionIndex + 1);
            
            // Hide any existing native hint popups first
            $('.wpProQuiz_tipp').hide();
            
            // Show our custom modal instead of triggering native hint
            showHintModal($question);
        });
        
        // Insert hint box at the bottom of the question
        $question.append($hintBox);
        console.log(`[LilacQuiz] Added hint box to question ${questionIndex + 1}`);
    }

    /**
     * Show custom hint when no native hint button exists
     */
    function showCustomHint($question, questionNumber) {
        console.log('[LilacQuiz] Showing custom hint for question', questionNumber);
        
        // Remove any existing custom hints
        $question.find('.lilac-custom-hint').remove();
        
        // Create custom hint display
        const $customHint = $(`
            <div class="lilac-custom-hint" style="
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border: 2px solid #45a049;
                font-size: 14px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                position: relative;
                animation: lilac-hint-appear 0.3s ease-out;
            ">
                <strong>💡 רמז לשאלה ${questionNumber}:</strong><br>
                קרא את השאלה שוב בעיון ובדוק את כל האפשרויות לפני שתבחר תשובה.
                <button onclick="$(this).parent().remove()" style="
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                ">×</button>
            </div>
        `);
        
        // Insert hint after the question
        $question.append($customHint);
        
        // Add animation styles if not already present
        if (!$('#lilac-custom-hint-animations').length) {
            $('head').append(`
                <style id="lilac-custom-hint-animations">
                    @keyframes lilac-hint-appear {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
            `);
        }
    }

    /**
     * Initialize the quiz answer reselection functionality
     */
    function initQuizAnswerReselection() {
        console.log('[LilacQuiz] *** INIT FUNCTION CALLED ***');
        window.lilacQuizInitialized = true;
        log.info('Initializing quiz answer reselection');
        
        // Inject initial hint boxes if body has enforce hint class
        injectInitialHintBoxes();
        
        // Scan for all existing questions and extract data
        extractQuestionData();
        
        // Apply consistent styling to all buttons
        styleAllButtons();
        
        // Set up event handlers
        setupEventHandlers();
        
        // Add click-to-check behavior to answer items
        setupAnswerClickToCheck();
        
        // Check for any already-correct answers and handle them
        $('.wpProQuiz_listItem').each(function() {
            const $question = $(this);
            if ($question.find('.wpProQuiz_correct').is(':visible')) {
                log.info('Found correct answer already selected, forcing Next button visibility');
                showNextButton($question);
            }
        });
    }

    /**
     * Setup click-to-check behavior on answer items
     */
    function setupAnswerClickToCheck() {
        // Use event delegation for answer list items
        $(document).on('click', '.wpProQuiz_questionListItem', function(e) {
            const $listItem = $(this);
            const $question = $listItem.closest('.wpProQuiz_listItem');
            
            // Allow processing even if question was previously locked
            // if ($question.hasClass('lilac-locked')) {
            //     return false;
            // }
            
            // Don't process if clicking directly on the radio button (let it handle naturally)
            if ($(e.target).is('input[type="radio"]')) {
                return;
            }
            
            // Find the radio button in this list item
            const $radio = $listItem.find('input[type="radio"]');
            if ($radio.length && !$radio.prop('disabled')) {
                // Select the radio button
                $radio.prop('checked', true).trigger('change');
                
                // Small delay then trigger check
                setTimeout(function() {
                    const $checkButton = $question.find('input.wpProQuiz_button[name="check"]');
                    if ($checkButton.length && !$checkButton.prop('disabled')) {
                        console.log('[LilacQuiz] Auto-checking from answer click');
                        $checkButton.trigger('click');
                    }
                }, 100);
            }
        });
        
        // Add hover effect to show it's clickable
        $('<style>')
            .text(`
                .wpProQuiz_questionListItem:not(.lilac-locked .wpProQuiz_questionListItem) {
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .wpProQuiz_questionListItem:not(.lilac-locked .wpProQuiz_questionListItem):hover {
                    background-color: rgba(0, 0, 0, 0.05);
                }
            `)
            .appendTo('head');
    }

    /**
     * Set up a mutation observer to watch for dynamically added questions
     */
    function setupObserver() {
        log.info('MutationObserver setup complete');
        
        // Create a mutation observer to watch for dynamically added elements
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Convert added nodes to jQuery collection for easier filtering
                    const $addedNodes = $(mutation.addedNodes).filter(function() {
                        return this.nodeType === 1; // Only process Element nodes
                    });
                    
                    // Style any hint buttons in the added nodes
                    $addedNodes.find('.wpProQuiz_TipButton, .wpProQuiz_hint, .lilac-show-hint').css({
                        'visibility': 'visible !important',
                        'display': 'inline-block !important',
                        'opacity': '1',
                        'background-color': '#ff9800',
                        'color': 'white',
                        'font-weight': 'bold',
                        'border': '2px solid #e67e22',
                        'border-radius': '4px',
                        'padding': '8px 24px',
                        'cursor': 'pointer',
                        'font-size': '16px',
                        'margin-right': '10px',
                        'box-shadow': '0 3px 5px rgba(0,0,0,0.2)',
                        'pointer-events': 'auto',
                        'z-index': '1000'
                    });
                }
            });
        });
        
        // Start observing the entire document
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Set up answer observer for detecting answer changes
     */
    function setupAnswerObserver() {
        // Disabled - this was causing premature triggering
        return;
    }

    // Force immediate initialization - don't wait for document ready
    console.log('[LilacQuiz] *** FORCING IMMEDIATE INITIALIZATION ***');
    
    function initializeQuizSystem() {
        console.log('[LilacQuiz] *** INITIALIZING QUIZ SYSTEM ***');
        if (window.lilacQuizInitialized) {
            return;
        }
        
        window.lilacQuizInitialized = true;
        
        // Force initial hint boxes immediately
        console.log('[LilacQuiz] *** INJECTING INITIAL HINT BOXES ***');
        injectInitialHintBoxes();
        
        // Initialize core functionality
        initQuizAnswerReselection();
        setupObserver();
        setupAnswerObserver();
        
        console.log('[LilacQuiz] *** SYSTEM INITIALIZATION COMPLETE ***');
    }
    
    // Try immediate initialization
    initializeQuizSystem();
    
    // Also try on document ready
    $(document).ready(function() {
        console.log('[LilacQuiz] *** DOCUMENT READY TRIGGERED ***');
        if (!window.lilacQuizInitialized) {
            initializeQuizSystem();
        }
    });
    
    // Multiple fallback timers
    setTimeout(initializeQuizSystem, 500);
    setTimeout(initializeQuizSystem, 1000);
    setTimeout(initializeQuizSystem, 2000);

})(jQuery);
