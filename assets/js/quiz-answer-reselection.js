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
    //remove check button
    $(function() {
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
                                z-index: 9999;
                                left: 0;
                                top: 0;
                                width: 100%;
                                height: 100%;
                                background-color: rgba(0,0,0,0.5);
                            }
                            .lilac-modal-content {
                                background-color: #fefefe;
                                margin: 15% auto;  /* Changed from 5% to 15% */
                                padding: 20px;
                                border: 1px solid #888;
                                width: 90%;
                                max-width: 800px;
                                max-height: 60vh;  /* Reduced from 80vh */
                                overflow-y: auto;
                                border-radius: 8px;
                                position: relative;
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
                            
                            /* Override LearnDash green border for correct incomplete answers */
                            .learndash-wrapper .wpProQuiz_content .wpProQuiz_questionListItem.wpProQuiz_answerCorrectIncomplete label {
                                border-color: inherit !important;
                            }
                            
                            /* Ultra-strong selectors to override LearnDash styles */
                            .wpProQuiz_content .wpProQuiz_questionListItem.lilac-correct-answer,
                            .learndash-wrapper .wpProQuiz_content .wpProQuiz_questionListItem.lilac-correct-answer,
                            .wpProQuiz_questionListItem.lilac-correct-answer,
                            div.wpProQuiz_questionListItem.lilac-correct-answer {
                                border: 2px solid #4CAF50 !important;
                                background-color: #e8f5e8 !important;
                                border-radius: 4px !important;
                                box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3) !important;
                            }
                            
                            .wpProQuiz_content .wpProQuiz_questionListItem.lilac-wrong-answer,
                            .learndash-wrapper .wpProQuiz_content .wpProQuiz_questionListItem.lilac-wrong-answer,
                            .wpProQuiz_questionListItem.lilac-wrong-answer,
                            div.wpProQuiz_questionListItem.lilac-wrong-answer {
                                border: 2px solid #f44336 !important;
                                background-color: #ffebee !important;
                                border-radius: 4px !important;
                                box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3) !important;
                            }
                            
                            /* Override any inline styles that might conflict */
                            .wpProQuiz_questionListItem.lilac-correct-answer[style] {
                                border: 2px solid #4CAF50 !important;
                                background-color: #e8f5e8 !important;
                                box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3) !important;
                            }
                            
                            .wpProQuiz_questionListItem.lilac-wrong-answer[style] {
                                border: 2px solid #f44336 !important;
                                background-color: #ffebee !important;
                                box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3) !important;
                            }
                            
                            /* Clear any LearnDash native styling when we apply our classes */
                            .wpProQuiz_content .wpProQuiz_questionListItem.lilac-correct-answer label,
                            .learndash-wrapper .wpProQuiz_content .wpProQuiz_questionListItem.lilac-correct-answer label {
                                border: none !important;
                                background: transparent !important;
                            }
                            
                            .wpProQuiz_content .wpProQuiz_questionListItem.lilac-wrong-answer label,
                            .learndash-wrapper .wpProQuiz_content .wpProQuiz_questionListItem.lilac-wrong-answer label {
                                border: none !important;
                                background: transparent !important;
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
        }
    }

    /**
     * Create initial hint boxes for all questions with multiple attempts
     */
    function createInitialHintBoxes() {
        let attempts = 0;
        const maxAttempts = 5;
        
        function attemptCreation() {
            attempts++;
            console.log('[LilacQuiz] Attempting to create hint boxes, attempt:', attempts);
            
            const $questions = $('.wpProQuiz_listItem');
            console.log('[LilacQuiz] Found questions:', $questions.length);
            
            if ($questions.length === 0 && attempts < maxAttempts) {
                console.log('[LilacQuiz] No questions found yet, retrying in 500ms');
                setTimeout(attemptCreation, 500);
                return;
            }
            
            $questions.each(function() {
                const $question = $(this);
                console.log('[LilacQuiz] Creating initial hint box for question:', $question.index());
                createInitialHintBox($question);
                
                if ($question.find('.wpProQuiz_correct').is(':visible')) {
                    log.info('Found correct answer already selected, forcing Next button visibility');
                    showNextButton($question);
                }
            });
            
            // If we still have no questions after max attempts, try one more time with a longer delay
            if ($questions.length === 0 && attempts >= maxAttempts) {
                console.log('[LilacQuiz] Still no questions found after max attempts, trying once more with longer delay');
                setTimeout(function() {
                    $('.wpProQuiz_listItem').each(function() {
                        const $question = $(this);
                        console.log('[LilacQuiz] Final attempt - creating hint box for question:', $question.index());
                        createInitialHintBox($question);
                    });
                }, 2000);
            }
        }
        
        // Start immediately, then retry if needed
        attemptCreation();
    }

    /**
     * Create initial hint request box for each question
     */
    function createInitialHintBox($question) {
        console.log('[LilacQuiz] Creating hint box for question');
        
        // Remove any existing hint boxes and messages
        $question.find('.lilac-hint-box, .lilac-correct-answer-message, .lilac-hint-message').remove();
        
        // Create initial hint request box
        const $hintBox = $('<div class="lilac-hint-box" style="background-color: rgb(240, 248, 255); border: 1px solid rgb(33, 150, 243); border-radius: 4px; padding: 10px 15px; margin: 15px 0px; text-align: right; font-size: 16px; display: flex; align-items: center; justify-content: space-between; direction: rtl; z-index: 1000; position: relative;">' +
            '<span style="font-weight:bold;color:#2196F3;">💡 רוצה רמז?</span>' +
            '<span>לחץ כאן לקבלת עזרה</span>' +
            '<button type="button" class="lilac-request-hint" style="display: inline-block; visibility: visible; background-color: rgb(33, 150, 243); color: white; font-weight: bold; border: 2px solid rgb(25, 118, 210); border-radius: 4px; padding: 8px 24px; cursor: pointer; font-size: 16px; margin-right: 10px; box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 5px;">רמז</button>' +
            '</div>');
        
        // Try multiple insertion points
        const $firstBtn = $question.find('input.wpProQuiz_button').first();
        const $questionList = $question.find('.wpProQuiz_questionList');
        const $responseArea = $question.find('.wpProQuiz_response');
        
        if ($firstBtn.length) {
            console.log('[LilacQuiz] Inserting hint box before first button');
            $hintBox.insertBefore($firstBtn);
        } else if ($responseArea.length) {
            console.log('[LilacQuiz] Inserting hint box before response area');
            $hintBox.insertBefore($responseArea);
        } else if ($questionList.length) {
            console.log('[LilacQuiz] Inserting hint box after question list');
            $hintBox.insertAfter($questionList);
        } else {
            console.log('[LilacQuiz] Appending hint box to question');
            $question.append($hintBox);
        }
        
        console.log('[LilacQuiz] Hint box created and inserted');
    }

    /**
     * Handle the result of an answer submission
     */
    function handleAnswerResult($question, isCorrect, questionId) {
        // Remove any previous messages and hint boxes
        $question.find('.lilac-correct-answer-message, .lilac-hint-message, .lilac-hint-box').remove();

        if (isCorrect) {
            // Remove any locks when answer is correct
            $question.removeClass('lilac-locked');
            
            // Clear all previous wrong answer styling (red borders, etc.)
            $question.find('.wpProQuiz_questionListItem').removeClass('lilac-wrong-answer lilac-correct-answer').removeAttr('style');
            
            // Style the correct answer with green - force application
            const $correctAnswer = $question.find('.wpProQuiz_questionInput:checked').closest('.wpProQuiz_questionListItem');
            $correctAnswer.addClass('lilac-correct-answer').attr('data-lilac-styled', 'correct');
            
            console.log('[LilacQuiz] Applied green styling to correct answer:', $correctAnswer.length);
            
            // Transform hint box to success message with Next button
            const $successMessage = $('<div class="lilac-hint-box" style="background-color: rgb(232, 245, 233); border: 1px solid rgb(76, 175, 80); border-radius: 4px; padding: 10px 15px; margin: 15px 0px; text-align: right; font-size: 16px; display: flex; align-items: center; justify-content: space-between; direction: rtl;">' +
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

            // Disable all inputs after correct answer but keep the correct one visible
            $question.find('.wpProQuiz_questionInput').prop('disabled', true);
            $question.find('.wpProQuiz_questionListItem').not('.lilac-correct-answer').css({
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
            // For incorrect answers, lock the question
            console.log('[LilacQuiz] Incorrect answer - locking question and showing hint prompt');
            
            // Apply lock
            $question.addClass('lilac-locked');
            
            // Style the wrong answer with red - force application
            const $wrongAnswer = $question.find('.wpProQuiz_questionInput:checked').closest('.wpProQuiz_questionListItem');
            $wrongAnswer.addClass('lilac-wrong-answer').attr('data-lilac-styled', 'wrong');
            
            // Disable answer selection
            $question.find('.wpProQuiz_questionInput').prop('disabled', true);
            $question.find('.wpProQuiz_questionListItem').css({
                'pointer-events': 'none',
                'cursor': 'not-allowed',
                'opacity': '0.7'
            });
            
            // Hide check button
            $question.find('.wpProQuiz_button[name="check"]').css({
                'display': 'none'
            });
            
            // Transform hint box to error message
            const $hintMessage = $('<div class="lilac-hint-box" style="background-color: rgb(255, 243, 224); border: 1px solid rgb(255, 152, 0); border-radius: 4px; padding: 10px 15px; margin: 15px 0px; text-align: right; font-size: 16px; display: flex; align-items: center; justify-content: space-between; direction: rtl;">' +
                '<span style="font-weight:bold;color:#e74c3c;">❌ תשובה שגויה!</span>' +
                '<span>לחץ על רמז לקבלת עזרה</span>' +
                '<button type="button" class="lilac-force-hint" style="display: inline-block; visibility: visible; background-color: rgb(255, 152, 0); color: white; font-weight: bold; border: 2px solid rgb(230, 126, 34); border-radius: 4px; padding: 8px 24px; cursor: pointer; font-size: 16px; margin-right: 10px; box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 5px;">רמז</button>' +
                '</div>');
            
            // Insert above the native buttons
            const $firstBtn = $question.find('input.wpProQuiz_button').first();
            if ($firstBtn.length) {
                $hintMessage.insertBefore($firstBtn);
            } else {
                $question.append($hintMessage);
            }
            
            // Make sure hint button is visible
            const $hintButton = $question.find('.wpProQuiz_button[name="tip"]');
            $hintButton.prop('disabled', false).css({
                'float': 'left',
                'display': 'inline-block',
                'margin': '5px',
                'visibility': 'visible',
                'opacity': '1',
                'pointer-events': 'auto',
                'cursor': 'pointer',
                'background-color': 'rgb(23, 162, 184)'
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
        
        // Clear all previous answer styling (both correct and wrong) - use jQuery to force removal
        $question.find('.wpProQuiz_questionListItem').each(function() {
            const $item = $(this);
            $item.removeClass('lilac-wrong-answer lilac-correct-answer');
            $item.removeAttr('style'); // Remove any inline styles
            $item.css({
                'border': 'none',
                'background-color': 'transparent',
                'box-shadow': 'none',
                'pointer-events': 'auto',
                'cursor': 'pointer',
                'opacity': '1'
            });
        });
        
        console.log('[LilacQuiz] Cleared all red/green styling after hint viewed');
        
        // Re-enable answer selection
        $question.find('.wpProQuiz_questionInput').prop('disabled', false);
        
        // Clear any previous selection to ensure fresh start
        $question.find('.wpProQuiz_questionInput').prop('checked', false);
    }

    /**
     * Set up event handlers for quiz interaction
     */
    function setupEventHandlers() {
        // Remove any existing handlers
        $(document).off('click.simplifiedCheck');

        // Handle check button clicks - let native quiz process first
        $(document).on('click.simplifiedCheck', 'input.wpProQuiz_button[name="check"]', function(e) {
            const $question = $(this).closest('.wpProQuiz_listItem');
            const $selected = $question.find('.wpProQuiz_questionInput:checked');

            if (!$selected.length) return;

            console.log('[LilacQuiz] Check button clicked, waiting for quiz calculation...');
            
            // Let the native quiz handle the check first
            // Then watch for the result
            watchForAnswerResult($question);
        });

        // Block interactions on locked questions
        $(document).on('click', 
            '.lilac-locked .wpProQuiz_questionListItem label, ' +
            '.lilac-locked .wpProQuiz_questionInput', 
        function(e) {
            console.log('🔒 [LilacQuiz] Blocked - must view hint first');
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        });

        // Handle hint button clicks - both native and our custom button
        $(document).on('click', '.wpProQuiz_button[name="tip"], .wpProQuiz_TipButton, .lilac-force-hint, .lilac-request-hint', function(e) {
            e.preventDefault();
            const $question = $(this).closest('.wpProQuiz_listItem');
            
            // Check if clicking our custom hint button or initial request button
            if ($(this).hasClass('lilac-force-hint') || $(this).hasClass('lilac-request-hint')) {
                console.log('[LilacQuiz] Custom hint button clicked');
                
                // Show modal and unlock if locked
                handleHintViewing($question);
                
                // Don't trigger native button, we handle it ourselves
                return false;
            }
            
            // For native hint button, also show our modal if question is locked
            if ($question.hasClass('lilac-locked')) {
                handleHintViewing($question);
            }
        });

        // Handle answer selection changes
        $(document).on('change', '.wpProQuiz_questionInput', function() {
            const $question = $(this).closest('.wpProQuiz_listItem');
            const $selectedAnswer = $(this).closest('.wpProQuiz_questionListItem');
            
            // Remove any previous messages
            $question.find('.lilac-correct-answer-message').remove();
            
            // For locked questions, add persistent tooltip instead of temporary colors
            if ($question.hasClass('lilac-locked')) {
                // Add persistent tooltip for wrong answer
                if (!$selectedAnswer.hasClass('lilac-has-wrong-tooltip')) {
                    $selectedAnswer.addClass('lilac-has-wrong-tooltip');
                    
                    // Create persistent tooltip that won't disappear after hint viewing
                    const $tooltip = $('<div class="lilac-wrong-tooltip" style="position: absolute; top: -30px; right: 5px; background: #f44336; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold; z-index: 1000; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">תשובה שגויה</div>');
                    
                    // Position tooltip
                    $selectedAnswer.css('position', 'relative').append($tooltip);
                    
                    console.log('[LilacQuiz] Added persistent wrong answer tooltip');
                }
                
                // Gentle hint button animation
                const $hintButton = $question.find('.lilac-force-hint, .wpProQuiz_button[name="tip"]');
                if ($hintButton.length) {
                    $hintButton.css({
                        'animation': 'lilac-gentle-pulse 2s ease-in-out 3',
                        'box-shadow': '0 0 10px rgba(255, 152, 0, 0.5)'
                    });
                    
                    setTimeout(() => {
                        $hintButton.css({
                            'animation': '',
                            'box-shadow': ''
                        });
                    }, 6000);
                }
            }
        });

        // Handle next button in success message
        $(document).on('click', '.lilac-force-next', function(e) {
            e.preventDefault();
            const $question = $(this).closest('.wpProQuiz_listItem');
            $question.find('.wpProQuiz_button[name="next"]').trigger('click');
        });
    }

    /**
     * Watch for answer result after quiz calculation
     */
    function watchForAnswerResult($question) {
        let checkCount = 0;
        const maxChecks = 30; // Increased to 3 seconds
        
        const checkInterval = setInterval(function() {
            checkCount++;

            // First priority: Look for answer state classes
            const $selected = $question.find('.wpProQuiz_questionInput:checked');
            if ($selected.length) {
                const $wrapper = $selected.closest('.wpProQuiz_questionListItem');
                const classes = $wrapper.attr('class') || '';
                
                // Only log every 5th check to reduce console spam
                if (checkCount % 5 === 1) {
                    console.log('[LilacQuiz] Checking classes:', classes);
                }
                
                // Check if quiz has applied result classes
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
            
            if (checkCount >= maxChecks) {
                console.log('[LilacQuiz] Timeout waiting for answer result after 3 seconds');
                clearInterval(checkInterval);
                
                // As a fallback, check one more time for any answer indicators
                const $anyIncorrect = $question.find('.wpProQuiz_answerIncorrect');
                const $anyCorrect = $question.find('.wpProQuiz_answerCorrect, .wpProQuiz_answerCorrectIncomplete');
                
                if ($anyIncorrect.length) {
                    handleAnswerResult($question, false);
                } else if ($anyCorrect.length) {
                    handleAnswerResult($question, true);
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
     * Initialize the quiz answer reselection functionality
     */
    function initQuizAnswerReselection() {
        log.info('Initializing quiz answer reselection');
        
        // Scan for all existing questions and extract data
        extractQuestionData();
        
        // Apply consistent styling to all buttons
        styleAllButtons();
        
        // Set up event handlers
        setupEventHandlers();
        
        // Add click-to-check behavior to answer items
        setupAnswerClickToCheck();
        
        // Create initial hint boxes for all questions - with multiple attempts to ensure DOM is ready
        createInitialHintBoxes();
    }

    /**
     * Setup click-to-check behavior on answer items
     */
    function setupAnswerClickToCheck() {
        // Use event delegation for answer list items
        $(document).on('click', '.wpProQuiz_questionListItem', function(e) {
            const $listItem = $(this);
            const $question = $listItem.closest('.wpProQuiz_listItem');
            
            // Don't process if question is locked
            if ($question.hasClass('lilac-locked')) {
                return false;
            }
            
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
                    
                    // Check for new quiz questions and create hint boxes
                    $addedNodes.find('.wpProQuiz_listItem').each(function() {
                        const $question = $(this);
                        if (!$question.find('.lilac-hint-box').length) {
                            console.log('[LilacQuiz] New question detected, creating hint box');
                            createInitialHintBox($question);
                        }
                    });
                    
                    // Also check if the added node itself is a quiz question
                    $addedNodes.filter('.wpProQuiz_listItem').each(function() {
                        const $question = $(this);
                        if (!$question.find('.lilac-hint-box').length) {
                            console.log('[LilacQuiz] New question detected (direct), creating hint box');
                            createInitialHintBox($question);
                        }
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

    // Initialize the plugin
    $(document).ready(function() {
        initQuizAnswerReselection();
        setupObserver();
        setupAnswerObserver();
        
        // Check if first question needs immediate processing
        setTimeout(function() {
            const $firstQuestion = $('.wpProQuiz_listItem').first();
            if ($firstQuestion.length) {
                const $checked = $firstQuestion.find('.wpProQuiz_questionInput:checked');
                if ($checked.length) {
                    const $wrapper = $checked.closest('.wpProQuiz_questionListItem');
                    if ($wrapper.hasClass('wpProQuiz_answerCorrect') || 
                        $wrapper.hasClass('wpProQuiz_answerCorrectIncomplete')) {
                        console.log('[LilacQuiz] First question already has correct answer');
                        handleAnswerResult($firstQuestion, true);
                    }
                }
            }
        }, 1000);
    });

})(jQuery);
