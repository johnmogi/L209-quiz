/**
 * LearnDash Quiz - Answer Reselection
 * 
 * Enables users to reselect and submit answers after incorrect submission
 * Part of the Enforce Hint feature for the Lilac Quiz Sidebar plugin
 */
(function($) {
    'use strict';
    
    // Configuration
    const config = {
        debug: false,                // Set to false to disable debug messages
        enforceHintDelay: 300,       // Delay in ms after checking answer before handling result
        observerDelay: 1000,         // Delay before setting up MutationObserver
        tooltipText: 'טעית! להמשך חובה לקחת רמז!',  // Hebrew text: You're wrong! You must take a hint to continue!
        answerDetection: true        // Enable answer detection
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
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        log.info('DOM ready, starting initialization');
        initQuizAnswerReselection();
    });
    
    // Also initialize after a delay to catch dynamically loaded content
    setTimeout(function() {
        initQuizAnswerReselection();
    }, config.observerDelay);
    
    // Immediate execution for quiz-enforce-hint pages (after function is defined)
    $(document).ready(function() {
        if ($('body').hasClass('quiz-enforce-hint')) {
            log.info('Quiz enforce hint detected, immediate injection on ready');
            setTimeout(function() {
                if (typeof injectInitialHintBoxes === 'function') {
                    injectInitialHintBoxes();
                }
            }, 100);
        }
    });
    
    /**
     * Initialize the quiz answer reselection functionality
     */
    function initQuizAnswerReselection() {
        log.info('Initializing hint enforcement module');
        
        // Check if hint enforcement is active via body class
        if (!$('body').hasClass('quiz-enforce-hint')) {
            log.info('Hint enforcement not active - quiz-enforce-hint class not found');
            return;
        }
        
        log.info('Hint enforcement active - proceeding with initialization');
        
        // Remove any debug containers that may interfere
        removeDebugContainers();
        
        // Extract question data from the DOM
        extractQuestionData();
        
        // Apply consistent styling to all buttons
        styleAllButtons();
        
        // Inject initial hint boxes immediately
        injectInitialHintBoxes();
        
        // Set up event handlers
        setupEventHandlers();
        
        // Add click-to-check behavior to answer items
        setupAnswerClickToCheck();
        
        // Set up MutationObserver to watch for DOM changes
        setupObserver();
        
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
        });
        
        // Detect when answer is checked and LearnDash displays correct/incorrect
        $(document).on('DOMNodeInserted', '.wpProQuiz_incorrect, .wpProQuiz_correct', function(e) {
            const $feedback = $(this);
            const $question = $feedback.closest('.wpProQuiz_listItem');
            const isCorrect = $feedback.hasClass('wpProQuiz_correct');
            
            log.info('Answer feedback received: ' + (isCorrect ? 'correct' : 'incorrect'));
            
            // Wait a short delay to allow LearnDash to complete its processing
            setTimeout(function() {
                handleAnswerResult($question, isCorrect);
            }, config.enforceHintDelay);
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
            }
        });
        
        // Prevent proceeding with Next button if answer is incorrect
        $(document).on('click', '.wpProQuiz_button[name="next"]', function(e) {
            const $question = $(this).closest('.wpProQuiz_listItem');
            
            if ($question.find('.wpProQuiz_incorrect').is(':visible')) {
                e.preventDefault();
                e.stopPropagation();
                
                // Show tooltip to take hint
                highlightHintButton($question);
                return false;
            }
        });
    }
    
    /**
     * Setup an individual question
     */
    function setupQuestion(index, element) {
        const $question = element ? $(element) : $(this);
        
        // Ensure inputs are always enabled
        enableInputsForQuestion($question);
        
        // Store hint status
        $question.attr('data-has-hint', $question.find('.wpProQuiz_hint, .wpProQuiz_TipButton').length > 0 ? 'true' : 'false');
        $question.attr('data-hint-viewed', 'false');
        
        // Make hint button more visible from the start
        const $hintBtn = $question.find('.wpProQuiz_TipButton, .wpProQuiz_hint').first();
        if ($hintBtn.length) {
            $hintBtn.css({
                'visibility': 'visible',
                'display': 'inline-block',
                'background-color': '#e0e0e0',
                'color': '#333',
                'font-weight': 'bold',
                'opacity': '1'
            });
        }
        
        // Check if question is already answered
        setTimeout(function() {
            if ($question.find('.wpProQuiz_incorrect').is(':visible')) {
                handleAnswerResult($question, false);
            } else if ($question.find('.wpProQuiz_correct').is(':visible')) {
                handleAnswerResult($question, true);
            }
        }, config.enforceHintDelay);
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
            
            // Check if initial hint message exists and update it
            const $existingHintMessage = $question.find('.lilac-hint-message');
            if ($existingHintMessage.length) {
                // Update existing hint message to show incorrect answer styling
                $existingHintMessage.removeClass('lilac-initial-hint').html(
                    '<span style="font-weight:bold;color:#e74c3c;">❌ תשובה שגויה!</span>' +
                    '<span>לחץ על רמז לקבלת עזרה</span>' +
                    '<button type="button" class="lilac-force-hint" style="display: inline-block; visibility: visible; background-color: rgb(255, 152, 0); color: white; font-weight: bold; border: 2px solid rgb(230, 126, 34); border-radius: 4px; padding: 8px 24px; cursor: pointer; font-size: 16px; margin-right: 10px; box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 5px;">רמז</button>'
                ).css({
                    'background-color': 'rgb(255, 243, 224)',
                    'border': '1px solid rgb(255, 152, 0)'
                });
                
                // Re-attach click handler for updated button
                $question.find('.lilac-force-hint').off('click').on('click', function() {
                    const $tipBtn = $question.find('.wpProQuiz_TipButton, .wpProQuiz_hint');
                    if ($tipBtn.length) {
                        $tipBtn.click();
                    }
                });
            }
            
            // If there's a hint and it hasn't been viewed, highlight it
            if (hasHint && !hintViewed) {
                highlightHintButton($question);
            }
        } 
        // If the answer is correct, show the Next button
        else if (isCorrect === true) {
            log.info('Correct answer detected, showing Next button');
            
            $question.find('.wpProQuiz_button[name="next"]').show()
                .css('display', 'inline-block')
                .removeAttr('style');
                
            // Hide any tooltip
            $question.find('.hint-tooltip').remove();
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
     * Inject initial hint boxes immediately for all questions
     */
    function injectInitialHintBoxes() {
        log.info('Injecting initial hint boxes for all questions');
        
        // Debug: Log current state
        log.info('Body classes:', $('body').attr('class'));
        log.info('Questions found:', $('.wpProQuiz_listItem').length);
        
        $('.wpProQuiz_listItem').each(function(index) {
            const $question = $(this);
            log.info(`Processing question ${index + 1}`);
            
            // Skip if question already has a hint message
            if ($question.find('.lilac-hint-message').length) {
                log.info(`Question ${index + 1} already has hint message, skipping`);
                return;
            }
            
            // Check if question has hint content available
            const $hintContent = $question.find('.wpProQuiz_tipp, .wpProQuiz_TipButton, .wpProQuiz_hint');
            log.info(`Question ${index + 1} hint elements found:`, $hintContent.length);
            
            if (!$hintContent.length) {
                log.info(`No hint content found for question ${index + 1}, skipping`);
                return;
            }
            
            // Find or create response area
            let $responseArea = $question.find('.wpProQuiz_response');
            if (!$responseArea.length) {
                log.info(`Creating response area for question ${index + 1}`);
                $responseArea = $('<div class="wpProQuiz_response" style="display: block;"></div>');
                $question.find('.wpProQuiz_questionList').after($responseArea);
            } else {
                // Make sure response area is visible
                $responseArea.show().css('display', 'block');
            }
            
            // Add initial hint message with debug styling
            const $initialHintMessage = $('<div class="lilac-hint-message lilac-initial-hint" style="background-color: rgb(240, 248, 255) !important; border: 2px solid rgb(33, 150, 243) !important; border-radius: 4px; padding: 15px; margin: 15px 0px; text-align: right; font-size: 16px; display: flex !important; align-items: center; justify-content: space-between; direction: rtl; z-index: 9999; position: relative;">' +
                '<span style="font-weight:bold;color:#2196F3;">💡 רמז זמין</span>' +
                '<span>לחץ על רמז לקבלת עזרה</span>' +
                '<button type="button" class="lilac-force-hint" style="display: inline-block !important; visibility: visible !important; background-color: rgb(33, 150, 243) !important; color: white !important; font-weight: bold; border: 2px solid rgb(25, 118, 210); border-radius: 4px; padding: 8px 24px; cursor: pointer; font-size: 16px; margin-right: 10px; box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 5px;">רמז</button>' +
                '</div>');
            
            // Prepend the message to the response area
            $responseArea.prepend($initialHintMessage);
            
            // Make the hint button work
            $question.find('.lilac-force-hint').off('click').on('click', function() {
                log.info(`Hint button clicked for question ${index + 1}`);
                const $tipBtn = $question.find('.wpProQuiz_TipButton, .wpProQuiz_hint');
                if ($tipBtn.length) {
                    $tipBtn.click();
                } else {
                    log.info('No tip button found to click');
                }
            });
            
            log.info(`Added initial hint box for question ${index + 1}`);
        });
        
        log.info('Finished injecting initial hint boxes');
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
                                margin: 15% auto;
                                padding: 20px;
                                border: 1px solid #888;
                                width: 90%;
                                max-width: 800px;
                                max-height: 60vh;
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
        }
    }

    /**
     * Remove any debug containers that might interfere with the quiz
     */
    function removeDebugContainers() {
        // Remove any debug containers that may exist from previous versions
        $('#media-debug-container, #quiz-debug-panel').remove();
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

            log.info('Check button clicked, waiting for quiz calculation...');
            
            // Let the native quiz handle the check first
            // Then watch for the result
            watchForAnswerResult($question);
        });

        // Block interactions on locked questions
        $(document).on('click', '.lilac-locked .wpProQuiz_questionListItem label, ' +
            '.lilac-locked .wpProQuiz_questionInput', function(e) {
            log.info('Blocked - must view hint first');
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        });

        // Handle hint button clicks - both native and our custom button
        $(document).on('click', '.wpProQuiz_button[name="tip"], .wpProQuiz_TipButton, .lilac-force-hint', function(e) {
            e.preventDefault();
            const $question = $(this).closest('.wpProQuiz_listItem');
            
            // Check if clicking our custom hint button
            if ($(this).hasClass('lilac-force-hint')) {
                log.info('Custom hint button clicked');
                // Unlock the question and show modal if question is locked
                if ($question.hasClass('lilac-locked')) {
                    handleHintViewing($question);
                }
                // Don't trigger native button, we handle it ourselves
                return false;
            }
            
            // For native hint button, also show our modal if question is locked
            if ($question.hasClass('lilac-locked')) {
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
            $question.find('.wpProQuiz_button[name="next"]').trigger('click');
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
                        log.info('Auto-checking from answer click');
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

})(jQuery);
