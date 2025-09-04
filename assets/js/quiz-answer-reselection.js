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

// IMMEDIATE TEST - This should show up right away
console.log('🚀 LILAC QUIZ SCRIPT LOADED - VERSION 2.0 - CLICK COUNTER TEST');

// Global click counter for debugging
window.lilacClickCounter = 0;

// IMMEDIATE click counter setup - no waiting for document ready
if (typeof jQuery !== 'undefined') {
    console.log('✅ jQuery found - setting up click counter NOW');
    jQuery(document).on('click.lilacDebug', function(e) {
        window.lilacClickCounter++;
        const target = e.target;
        const classes = target.className || '';
        const id = target.id || '';
        const tagName = target.tagName;
        const text = jQuery(target).text().substring(0, 50);
        
        console.log(`🖱️ CLICK #${window.lilacClickCounter}: ${tagName}${id ? '#' + id : ''}${classes ? '.' + classes.replace(/\s+/g, '.') : ''} - "${text}"`);
        
        // Special logging for quiz elements
        if (classes.includes('wpProQuiz') || classes.includes('lilac')) {
            console.log(`   📍 Quiz Element Details:`, {
                element: target,
                classes: classes,
                closest_question: jQuery(target).closest('.wpProQuiz_listItem').length ? 'Found' : 'Not found',
                is_locked: jQuery(target).closest('.wpProQuiz_listItem').hasClass('lilac-locked'),
                is_correct_locked: jQuery(target).closest('.wpProQuiz_listItem').hasClass('lilac-correct-locked')
            });
        }
    });
} else {
    console.error('❌ jQuery not available for click counter');
}

    // Quiz Data Retrieval Function
    function retrieveQuizAnswers(quizId, questionId) {
        console.log(`[LilacQuiz] Retrieving answers for quiz ID: ${quizId}, question ID: ${questionId}`);
        
        // This would normally be an AJAX call to a PHP endpoint
        // For now, we'll simulate the data structure with question-specific data
        const quizData = {
            quiz_id: quizId,
            question_id: questionId,
            questions: [{
                id: questionId,
                correct_answers: ['Answer A', 'Answer B'], // Simulated correct answers
                hints: ['This is a hint for question ' + questionId]
            }],
            status: 'success',
            timestamp: new Date().toISOString()
        };
        
        // Display in footer
        displayQuizDataInFooter(quizData);
        
        return quizData;
    }
    
    function displayQuizDataInFooter(quizData) {
        // Remove existing debug info
        $('#lilac-quiz-debug').remove();
        
        // Get quiz progress information
        const position = getCurrentQuestionPosition();
        const meta = window.lilacQuizMeta || {};
        
        // Create debug container with enhanced quiz information
        const debugHtml = `
            <div id="lilac-quiz-debug" style="
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0,0,0,0.9);
                color: #00ff00;
                font-family: monospace;
                font-size: 12px;
                padding: 10px;
                z-index: 9999;
                max-height: 250px;
                overflow-y: auto;
                border-top: 2px solid #00ff00;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong>LILAC Quiz Debug - Quiz ID: ${quizData.quiz_id} | Q: ${position.current}/${position.total} (${position.progress}%) | Source: ${quizData.source || 'Custom'}</strong>
                    <button onclick="$('#lilac-quiz-debug').remove()" style="background: #ff0000; color: white; border: none; padding: 2px 8px; cursor: pointer;">×</button>
                </div>
                <div id="quiz-debug-content">
                    <div style="color: #ffff00; font-weight: bold;">📊 QUIZ OVERVIEW:</div>
                    <div>Total Questions in Quiz: ${position.total} ${position.total === 30 ? '(Full Set)' : position.total < 30 ? '(Partial)' : '(Extended)'}</div>
                    <div>Current Question: ${position.current} of ${position.total}</div>
                    <div>Progress: ${position.progress}% complete</div>
                    <div>Questions with Hints: ${meta.questionsWithHints || 'Unknown'}</div>
                    <div>Visible Questions: ${meta.visibleQuestions || 'Unknown'}</div>
                    <div style="color: #ffff00; font-weight: bold; margin-top: 8px;">🔍 CURRENT DATA:</div>
                    <div>Status: ${quizData.status}</div>
                    <div>Data Source: ${quizData.source || 'Custom System'}</div>
                    <div>Question ID: ${quizData.question_id || 'Unknown'}</div>
                    <div>Correct Answers: ${quizData.questions[0] ? (quizData.questions[0].correct_answers.length > 0 ? quizData.questions[0].correct_answers.join(', ') : 'No correct answers found') : 'None'}</div>
                    <div>All Answers: ${quizData.questions[0] && quizData.questions[0].all_answers ? quizData.questions[0].all_answers.length : 0} total</div>
                    <div style="color: #ffff00; font-weight: bold; margin-top: 8px;">⚡ SYSTEM:</div>
                    <div>Click Counter: ${window.lilacClickCounter || 0}</div>
                    <div>Last Updated: ${quizData.timestamp ? new Date(quizData.timestamp).toLocaleTimeString() : 'N/A'}</div>
                    <div>Last Scan: ${meta.lastScanned ? new Date(meta.lastScanned).toLocaleTimeString() : 'N/A'}</div>
                </div>
            </div>
        `;
        
        $('body').append(debugHtml);
        
        console.log(`[LilacQuiz] 📊 Debug: Quiz:${quizData.quiz_id} | Q:${position.current}/${position.total} | ${quizData.source || 'Custom'}`);
    }
    
    // Make functions globally available for console testing
    window.lilacQuizDebug = {
        retrieveQuizAnswers: retrieveQuizAnswers,
        displayQuizDataInFooter: displayQuizDataInFooter,
        showDebugInfo: function(quizId = 1) {
            console.log('[LilacQuiz] Manual debug trigger for quiz ID:', quizId);
            retrieveQuizAnswers(quizId);
        }
    };

    // Main plugin code
(function($) {
    console.log('[LilacQuiz] *** SCRIPT LOADED - ENHANCED SYSTEM STARTING ***');
    
    // Prevent multiple initializations
    if (window.lilacQuizInitialized) {
        console.log('[LilacQuiz] Already initialized, skipping...');
        return;
    }
    
    console.log('[LilacQuiz] *** DOCUMENT READY - INITIALIZING ***');
    $('input.wpProQuiz_QuestionButton[name="check"]').each(function() {
        this.setAttribute('style', 'position: absolute !important; opacity: 0.5 !important;');
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
     * Extract question data from the DOM and fetch answers for current question
     */
    function extractQuestionData() {
        log.info('Scanning for question data...');
        
        // Count total questions in the quiz
        const totalQuestions = $('.wpProQuiz_listItem').length;
        const visibleQuestions = $('.wpProQuiz_listItem:visible').length;
        
        console.log(`[LilacQuiz] 📊 Quiz Analysis: ${totalQuestions} total questions, ${visibleQuestions} currently visible`);
        
        // Get all quiz questions
        $('.wpProQuiz_listItem').each(function(index) {
            const $question = $(this);
            const questionIndex = $question.index();
            const questionId = questionIndex + 1;
            
            // Store basic question information
            questionData[questionId] = {
                id: questionId,
                element: $question,
                answers: [],
                hasHint: $question.find('.wpProQuiz_TipButton, .wpProQuiz_hint').length > 0,
                correctAnswerFound: false,
                isVisible: $question.is(':visible')
            };
        });
        
        // Store quiz metadata
        window.lilacQuizMeta = {
            totalQuestions: totalQuestions,
            visibleQuestions: visibleQuestions,
            questionsWithHints: Object.values(questionData).filter(q => q.hasHint).length,
            lastScanned: new Date().toISOString()
        };
        
        // Auto-trigger quiz data retrieval for current question
        if (totalQuestions > 0) {
            console.log(`[LilacQuiz] Quiz detected with ${totalQuestions} questions, retrieving data for current question...`);
            fetchAnswersForCurrentQuestion();
            
            // Set up question change monitoring
            setupQuestionChangeDetection();
        }
    }

    /**
     * Monitor for question changes and fetch new data when questions change
     */
    function setupQuestionChangeDetection() {
        let currentQuestionId = getCurrentQuestionId();
        console.log(`[LilacQuiz] Setting up question change detection. Current question: ${currentQuestionId}`);
        
        // Monitor for DOM changes that indicate question navigation
        const observer = new MutationObserver(function(mutations) {
            const newQuestionId = getCurrentQuestionId();
            
            if (newQuestionId !== currentQuestionId) {
                console.log(`[LilacQuiz] 🔄 Question changed: ${currentQuestionId} → ${newQuestionId}`);
                currentQuestionId = newQuestionId;
                
                // Fetch answers for the new question
                setTimeout(() => {
                    fetchAnswersForCurrentQuestion();
                }, 500); // Small delay to ensure DOM is stable
            }
        });
        
        // Observe the quiz container for changes
        const quizContainer = document.querySelector('.wpProQuiz_content') || document.body;
        observer.observe(quizContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        // Also monitor for Next/Back button clicks and answer selections
        $(document).on('click', '.wpProQuiz_button[name="next"], .wpProQuiz_button[name="back"], .lilac-force-next', function() {
            console.log('[LilacQuiz] Navigation button clicked, checking for question change...');
            
            setTimeout(() => {
                const newQuestionId = getCurrentQuestionId();
                if (newQuestionId !== currentQuestionId) {
                    console.log(`[LilacQuiz] 🔄 Question changed via button: ${currentQuestionId} → ${newQuestionId}`);
                    currentQuestionId = newQuestionId;
                    fetchAnswersForCurrentQuestion();
                }
            }, 1000); // Longer delay for navigation
        });

        // Monitor for answer selections to trigger DOM extraction and debugging
        $(document).on('click', '.wpProQuiz_questionInput, .wpProQuiz_questionListItem', function() {
            console.log('[LilacQuiz] Answer interaction detected, triggering DOM extraction and debugging...');
            
            setTimeout(() => {
                const currentQuestionId = getCurrentQuestionId();
                
                // Trigger debugging immediately
                debugCurrentAnswerState(currentQuestionId);
                
                // Extract DOM answers
                const domAnswers = extractAnswersFromDOM(currentQuestionId);
                if (domAnswers && domAnswers.length > 0) {
                    const quizId = getFallbackQuizId();
                    displayQuizDataFromDOM(quizId, currentQuestionId, domAnswers);
                }
            }, 500); // Short delay to let DOM update
        });

        // Monitor for check button clicks to debug answer validation
        $(document).on('click', '.wpProQuiz_button[name="check"]', function() {
            console.log('[LilacQuiz] 🔍 Check button clicked - debugging answer validation...');
            
            // Capture state before submission
            const currentQuestionId = getCurrentQuestionId();
            const preSubmissionState = debugCurrentAnswerState(currentQuestionId);
            
            // Multiple analysis points to catch validation changes
            setTimeout(() => {
                console.log('[LilacQuiz] 🔍 IMMEDIATE POST-SUBMISSION Analysis (500ms):');
                debugCurrentAnswerState(currentQuestionId);
            }, 500);
            
            setTimeout(() => {
                console.log('[LilacQuiz] 🔍 DELAYED POST-SUBMISSION Analysis (1500ms):');
                const postSubmissionState = debugCurrentAnswerState(currentQuestionId);
                
                // Enhanced comparison analysis
                console.log('[LilacQuiz] 📊 COMPREHENSIVE SUBMISSION ANALYSIS:');
                console.log('   Pre-submission selected:', preSubmissionState.selectedAnswers);
                console.log('   Post-submission feedback:', postSubmissionState.feedbackMessages);
                
                // Deep validation analysis
                performValidationInversionAnalysis(currentQuestionId, preSubmissionState, postSubmissionState);
                
            }, 1500);
            
            setTimeout(() => {
                console.log('[LilacQuiz] 🔍 FINAL POST-SUBMISSION Analysis (3000ms):');
                debugCurrentAnswerState(currentQuestionId);
            }, 3000);
        });

        // Add global debugging function for manual testing
        window.lilacDebugAnswer = function(questionId) {
            if (!questionId) questionId = getCurrentQuestionId();
            return debugCurrentAnswerState(questionId);
        };
    }

    /**
     * Perform comprehensive validation inversion analysis
     */
    function performValidationInversionAnalysis(questionId, preState, postState) {
        console.log('[LilacQuiz] 🔬 PERFORMING VALIDATION INVERSION ANALYSIS:');
        
        // Get current AJAX data if available
        const ajaxData = window.currentQuestionData;
        
        // Analyze feedback patterns
        const feedbackAnalysis = {
            hasCorrectFeedback: postState.feedbackMessages.some(msg => 
                msg.includes('נכונה') || msg.includes('כל הכבוד') || msg.includes('correct')
            ),
            hasWrongFeedback: postState.feedbackMessages.some(msg => 
                msg.includes('שגויה') || msg.includes('incorrect') || msg.includes('wrong')
            ),
            feedbackMessages: postState.feedbackMessages
        };
        
        // Analyze DOM validation markers
        const domAnalysis = {
            correctMarkers: postState.allAnswers.filter(a => 
                a.hasCorrectClass || a.hasCorrectResult || a.parentHasCorrect
            ),
            incorrectMarkers: postState.allAnswers.filter(a => 
                a.hasIncorrectResult || a.parentHasIncorrect
            ),
            selectedAnswers: postState.allAnswers.filter(a => a.isSelected)
        };
        
        console.log('   📝 Feedback Analysis:', feedbackAnalysis);
        console.log('   🎯 DOM Analysis:', domAnalysis);
        
        // Check for validation inversion patterns
        const inversionChecks = [];
        
        // Pattern 1: Selected answer matches AJAX correct but got wrong feedback
        if (ajaxData && ajaxData.correctAnswers) {
            const selectedTexts = postState.selectedAnswers.map(a => a.text);
            const ajaxCorrectTexts = ajaxData.correctAnswers.map(a => 
                typeof a === 'string' ? a : a.text
            );
            
            const hasMatchingCorrect = selectedTexts.some(selected => 
                ajaxCorrectTexts.some(correct => 
                    selected.trim().toLowerCase() === correct.trim().toLowerCase() ||
                    selected.includes(correct) || correct.includes(selected)
                )
            );
            
            if (hasMatchingCorrect && feedbackAnalysis.hasWrongFeedback) {
                inversionChecks.push({
                    type: 'AJAX_FEEDBACK_MISMATCH',
                    severity: 'HIGH',
                    description: 'Selected answer matches AJAX correct data but received wrong feedback',
                    selectedAnswers: selectedTexts,
                    ajaxCorrect: ajaxCorrectTexts,
                    feedback: feedbackAnalysis.feedbackMessages
                });
            }
        }
        
        // Pattern 2: DOM shows correct markers but feedback says wrong
        if (domAnalysis.correctMarkers.length > 0 && feedbackAnalysis.hasWrongFeedback) {
            inversionChecks.push({
                type: 'DOM_FEEDBACK_MISMATCH',
                severity: 'MEDIUM',
                description: 'DOM shows correct answer markers but feedback indicates wrong answer',
                domCorrectMarkers: domAnalysis.correctMarkers.map(a => a.text),
                feedback: feedbackAnalysis.feedbackMessages
            });
        }
        
        // Pattern 3: Selected answers have correct DOM markers but wrong feedback
        const selectedWithCorrectMarkers = domAnalysis.selectedAnswers.filter(a => 
            a.hasCorrectClass || a.hasCorrectResult || a.parentHasCorrect
        );
        
        if (selectedWithCorrectMarkers.length > 0 && feedbackAnalysis.hasWrongFeedback) {
            inversionChecks.push({
                type: 'SELECTED_CORRECT_WRONG_FEEDBACK',
                severity: 'HIGH',
                description: 'Selected answers have correct DOM markers but received wrong feedback',
                selectedCorrectAnswers: selectedWithCorrectMarkers.map(a => a.text),
                feedback: feedbackAnalysis.feedbackMessages
            });
        }
        
        // Report findings
        if (inversionChecks.length > 0) {
            console.log('[LilacQuiz] 🚨 VALIDATION INVERSION DETECTED:');
            inversionChecks.forEach((check, index) => {
                console.log(`   ${index + 1}. ${check.type} (${check.severity}):`);
                console.log(`      ${check.description}`);
                console.log(`      Details:`, check);
            });
            
            // Store inversion data for further analysis
            window.lilacValidationInversions = window.lilacValidationInversions || [];
            window.lilacValidationInversions.push({
                questionId,
                timestamp: new Date().toISOString(),
                inversions: inversionChecks,
                preState,
                postState
            });
            
        } else {
            console.log('[LilacQuiz] ✅ No validation inversion detected - validation appears consistent');
        }
        
        return inversionChecks;
    }

    /**
     * Fix answer marking system to correctly identify and mark right/wrong answers
     */
    function fixAnswerMarkingSystem(questionId) {
        console.log(`[LilacQuiz] 🔧 FIXING Answer Marking System for Question ${questionId}`);
        
        const $questionList = $(`.wpProQuiz_questionList[data-question_id="${questionId}"]`);
        if ($questionList.length === 0) {
            console.log('   ❌ No question list found for fixing');
            return false;
        }

        // Get AJAX correct answers if available
        const ajaxData = window.currentQuestionData;
        let correctAnswerTexts = [];
        
        if (ajaxData && ajaxData.correctAnswers) {
            correctAnswerTexts = ajaxData.correctAnswers.map(a => 
                typeof a === 'string' ? a.trim() : (a.text || '').trim()
            );
            console.log('   🎯 Using AJAX correct answers:', correctAnswerTexts);
        }

        // Get selected answers
        const selectedAnswers = [];
        $questionList.find('.wpProQuiz_questionListItem').each(function() {
            const $item = $(this);
            const isSelected = $item.hasClass('is-selected') || $item.find('input:checked').length > 0;
            if (isSelected) {
                const text = $item.find('.wpProQuiz_questionListItemText').text().trim();
                selectedAnswers.push({ element: $item, text: text });
            }
        });

        console.log('   📝 Selected answers:', selectedAnswers.map(a => a.text));

        // Check if selected answers should be correct based on AJAX data
        let shouldBeCorrect = false;
        if (correctAnswerTexts.length > 0 && selectedAnswers.length > 0) {
            shouldBeCorrect = selectedAnswers.some(selected => 
                correctAnswerTexts.some(correct => 
                    selected.text.toLowerCase().includes(correct.toLowerCase()) ||
                    correct.toLowerCase().includes(selected.text.toLowerCase()) ||
                    selected.text.trim() === correct.trim()
                )
            );
        }

        console.log('   🔍 Should selected answers be correct?', shouldBeCorrect);

        // Get current feedback to determine actual validation result
        const feedbackMessages = [];
        $('.wpProQuiz_response').each(function() {
            const text = $(this).text().trim();
            if (text) feedbackMessages.push(text);
        });

        const hasCorrectFeedback = feedbackMessages.some(msg => 
            msg.includes('נכונה') || msg.includes('כל הכבוד') || msg.includes('correct')
        );
        const hasWrongFeedback = feedbackMessages.some(msg => 
            msg.includes('שגויה') || msg.includes('incorrect') || msg.includes('wrong')
        );

        console.log('   💬 Feedback analysis:', { hasCorrectFeedback, hasWrongFeedback, messages: feedbackMessages });

        // Detect validation inversion
        const hasInversion = (shouldBeCorrect && hasWrongFeedback) || (!shouldBeCorrect && hasCorrectFeedback);
        
        if (hasInversion) {
            console.log('   🚨 VALIDATION INVERSION DETECTED - Applying fix...');
            
            // Apply visual correction to DOM elements
            $questionList.find('.wpProQuiz_questionListItem').each(function() {
                const $item = $(this);
                const text = $item.find('.wpProQuiz_questionListItemText').text().trim();
                const isSelected = $item.hasClass('is-selected') || $item.find('input:checked').length > 0;
                
                if (isSelected) {
                    // Determine if this answer should be marked as correct
                    const shouldBeCorrectAnswer = correctAnswerTexts.some(correct => 
                        text.toLowerCase().includes(correct.toLowerCase()) ||
                        correct.toLowerCase().includes(text.toLowerCase()) ||
                        text.trim() === correct.trim()
                    );
                    
                    if (shouldBeCorrectAnswer) {
                        // Mark as correct (override wrong marking)
                        $item.removeClass('wpProQuiz_answerIncorrect')
                             .addClass('wpProQuiz_answerCorrect');
                        
                        // Add correct status indicator
                        if ($item.find('.ld-quiz-question-item__status--correct').length === 0) {
                            $item.append('<span class="ld-quiz-question-item__status--correct" style="color: green; font-weight: bold;">✓</span>');
                        }
                        
                        // Update visual styling
                        $item.css({
                            'background-color': '#d4edda',
                            'border-color': '#c3e6cb',
                            'color': '#155724'
                        });
                        
                        console.log(`   ✅ Fixed: Marked "${text}" as CORRECT`);
                    } else {
                        // Mark as incorrect
                        $item.removeClass('wpProQuiz_answerCorrect')
                             .addClass('wpProQuiz_answerIncorrect');
                        
                        // Remove any correct indicators
                        $item.find('.ld-quiz-question-item__status--correct').remove();
                        
                        // Update visual styling
                        $item.css({
                            'background-color': '#f8d7da',
                            'border-color': '#f5c6cb',
                            'color': '#721c24'
                        });
                        
                        console.log(`   ❌ Fixed: Marked "${text}" as INCORRECT`);
                    }
                }
            });
            
            // Update feedback messages if needed
            if (shouldBeCorrect && hasWrongFeedback) {
                $('.wpProQuiz_response').each(function() {
                    const $response = $(this);
                    const text = $response.text();
                    
                    if (text.includes('שגויה') || text.includes('incorrect')) {
                        $response.html('<span style="color: green; font-weight: bold;">✓ תשובה נכונה! (מתוקן אוטומטית)</span>');
                        console.log('   📝 Updated feedback message to correct');
                    }
                });
            }
            
            // Store correction data
            window.lilacAnswerCorrections = window.lilacAnswerCorrections || [];
            window.lilacAnswerCorrections.push({
                questionId,
                timestamp: new Date().toISOString(),
                correctionType: shouldBeCorrect ? 'wrong_to_correct' : 'correct_to_wrong',
                selectedAnswers: selectedAnswers.map(a => a.text),
                ajaxCorrectAnswers: correctAnswerTexts,
                originalFeedback: feedbackMessages
            });
            
            console.log('   ✅ Answer marking system fixed successfully');
            return true;
            
        } else {
            console.log('   ✅ No validation inversion detected - answer marking is correct');
            return false;
        }
    }

    /**
     * Auto-trigger answer marking fix after validation
     */
    function autoFixAnswerMarking() {
        // Monitor for validation completion and auto-fix if needed
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // Check if feedback elements were added/modified
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const $target = $(mutation.target);
                    
                    // If feedback response was updated
                    if ($target.hasClass('wpProQuiz_response') || $target.find('.wpProQuiz_response').length > 0) {
                        setTimeout(() => {
                            const currentQuestionId = getCurrentQuestionId();
                            console.log('[LilacQuiz] 🔧 Auto-triggering answer marking fix...');
                            fixAnswerMarkingSystem(currentQuestionId);
                        }, 1000); // Delay to ensure DOM is stable
                    }
                }
            });
        });
        
        // Observe the quiz container for feedback changes
        const quizContainer = document.querySelector('.wpProQuiz_content') || document.body;
        observer.observe(quizContainer, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        console.log('[LilacQuiz] 🔧 Auto-fix answer marking system activated');
    }

    // Add global function for manual answer fixing
    window.lilacFixAnswers = function(questionId) {
        if (!questionId) questionId = getCurrentQuestionId();
        return fixAnswerMarkingSystem(questionId);
    };

    /**
     * Fetch answers for the currently visible question using existing LearnDash system
     */
    function fetchAnswersForCurrentQuestion() {
        // PRIMARY: Use existing LearnDash detection system if available
        if (window.quizDetector && window.quizDetector.detectIds && window.quizDetector.detectQuestionId) {
            console.log('[LilacQuiz] 🎯 Using existing LearnDash detection system');
            
            const quizIds = window.quizDetector.detectIds();
            const questionIds = window.quizDetector.detectQuestionId();
            
            const quizId = quizIds.proQuizId || quizIds.learnDashId || 1;
            const questionId = questionIds.proQuizId || questionIds.postQuestionId || 1;
            
            console.log(`[LilacQuiz] LearnDash detected - Quiz:${quizId} Question:${questionId}`);
            
            // Try to get existing answer data from LearnDash system
            if (window.quizDetector.correctAnswers) {
                console.log('[LilacQuiz] ✅ Using cached answers from LearnDash system');
                displayQuizDataFromLearnDash(quizId, questionId, window.quizDetector.correctAnswers);
                return;
            }
            
            // Trigger LearnDash fetch if no cached data
            if (window.quizDetector.fetchAnswers) {
                console.log('[LilacQuiz] 🔄 Triggering LearnDash answer fetch');
                window.quizDetector.fetchAnswers(quizId, questionId)
                    .then(data => {
                        if (data) {
                            displayQuizDataFromLearnDash(quizId, questionId, data);
                        } else {
                            fallbackAnswerFetch(quizId, questionId);
                        }
                    })
                    .catch(() => {
                        fallbackAnswerFetch(quizId, questionId);
                    });
                return;
            }
        }
        
        // FALLBACK: Use our custom detection if LearnDash system unavailable
        console.log('[LilacQuiz] ⚠️ LearnDash system unavailable, using fallback');
        const quizId = getFallbackQuizId();
        const questionId = getFallbackQuestionId();
        fallbackAnswerFetch(quizId, questionId);
    }

    /**
     * Display quiz data from LearnDash system
     */
    function displayQuizDataFromLearnDash(quizId, questionId, answerData) {
        console.log(`[LilacQuiz] 🔍 DEBUGGING LearnDash Data:`, answerData);
        
        // Handle both array format and object format from AJAX
        let answers = [];
        let correctAnswers = [];
        
        if (Array.isArray(answerData)) {
            answers = answerData;
            correctAnswers = answerData.filter(a => a.correct).map(a => a.text);
        } else if (answerData && answerData.answers) {
            // Handle AJAX response format: {question_id, answers: [...]}
            answers = answerData.answers;
            correctAnswers = answerData.answers.filter(a => a.correct).map(a => a.text);
            console.log(`[LilacQuiz] 📋 AJAX Format - Question: ${answerData.question_text}`);
            console.log(`[LilacQuiz] 📝 All Answers:`, answers);
            console.log(`[LilacQuiz] ✅ Correct Answers:`, correctAnswers);
        }
        
        const quizData = {
            quiz_id: quizId,
            question_id: questionId,
            questions: [{
                id: questionId,
                correct_answers: correctAnswers,
                all_answers: answers,
                source: 'LearnDash System',
                raw_data: answerData // Include raw data for debugging
            }],
            status: 'success',
            timestamp: new Date().toISOString(),
            source: 'LearnDash Detection System'
        };
        
        displayQuizDataInFooter(quizData);
        
        // Additional debugging: Check current DOM state
        setTimeout(() => {
            debugCurrentAnswerState(questionId);
        }, 1000);
    }

    /**
     * Fallback answer fetching when LearnDash system fails
     */
    function fallbackAnswerFetch(quizId, questionId) {
        console.log(`[LilacQuiz] 🔄 Fallback fetch for Quiz:${quizId} Question:${questionId}`);
        
        // Try DOM-based answer detection first
        const domAnswers = extractAnswersFromDOM(questionId);
        if (domAnswers && domAnswers.length > 0) {
            console.log(`[LilacQuiz] ✅ Found ${domAnswers.length} answers from DOM`);
            displayQuizDataFromDOM(quizId, questionId, domAnswers);
        } else {
            // Final fallback to simulated data
            retrieveQuizAnswers(quizId, questionId);
        }
    }

    /**
     * Extract answers directly from DOM elements
     */
    function extractAnswersFromDOM(questionId) {
        console.log(`[LilacQuiz] 🔍 Extracting answers from DOM for question ${questionId}`);
        
        const answers = [];
        
        // Find the question list with matching data-question_id
        const $questionList = $(`.wpProQuiz_questionList[data-question_id="${questionId}"]`);
        if (!$questionList.length) {
            console.log(`[LilacQuiz] ❌ No question list found for ID ${questionId}`);
            return null;
        }
        
        console.log(`[LilacQuiz] 📋 Found question list for ID ${questionId}`);
        
        // Extract all answer options
        $questionList.find('.wpProQuiz_questionListItem').each(function(index) {
            const $item = $(this);
            const $input = $item.find('.wpProQuiz_questionInput');
            const $label = $item.find('label');
            
            if ($input.length && $label.length) {
                const value = $input.val();
                const text = $label.text().trim().replace(/^\d+\.\s*/, ''); // Remove number prefix
                const isSelected = $item.hasClass('is-selected') || $input.is(':checked');
                
                // Check if this answer has correct status indicator
                const $correctStatus = $item.find('.ld-quiz-question-item__status--correct');
                const hasCorrectIndicator = $correctStatus.length > 0;
                
                const answer = {
                    value: value,
                    text: text,
                    position: index,
                    isSelected: isSelected,
                    hasCorrectIndicator: hasCorrectIndicator,
                    correct: false // Will be determined by feedback
                };
                
                answers.push(answer);
                console.log(`[LilacQuiz] 📝 Answer ${index + 1}: "${text}" (Selected: ${isSelected}, Has Indicator: ${hasCorrectIndicator})`);
            }
        });
        
        console.log(`[LilacQuiz] 📊 Extracted ${answers.length} answers from DOM`);
        return answers.length > 0 ? answers : null;
    }

    /**
     * Display quiz data extracted from DOM
     */
    function displayQuizDataFromDOM(quizId, questionId, domAnswers) {
        const quizData = {
            quiz_id: quizId,
            question_id: questionId,
            questions: [{
                id: questionId,
                correct_answers: domAnswers.filter(a => a.hasCorrectIndicator).map(a => a.text),
                all_answers: domAnswers,
                source: 'DOM Extraction'
            }],
            status: 'success',
            timestamp: new Date().toISOString(),
            source: 'DOM-based Detection'
        };
        
        displayQuizDataInFooter(quizData);
        console.log(`[LilacQuiz] ✅ DOM extraction complete: ${domAnswers.length} answers found`);
    }

    /**
     * Get quiz ID using fallback methods
     */
    function getFallbackQuizId() {
        // Try to find quiz ID from form or other elements
        const $quizForm = $('.wpProQuiz_content form');
        if ($quizForm.length) {
            const formAction = $quizForm.attr('action') || '';
            const quizIdMatch = formAction.match(/quiz[_-]?(\d+)/i);
            if (quizIdMatch) {
                return parseInt(quizIdMatch[1]);
            }
        }
        
        // Try body class
        const bodyClasses = document.body.className;
        const postIdMatch = bodyClasses.match(/postid-(\d+)/);
        if (postIdMatch) {
            return parseInt(postIdMatch[1]);
        }
        
        return 1; // Default
    }

    /**
     * Get question ID using fallback methods
     */
    function getFallbackQuestionId() {
        return getCurrentQuestionId();
    }

    /**
     * Get the current question ID from the visible question
     */
    function getCurrentQuestionId() {
        // Try to find question ID from visible question
        const $currentQuestion = $('.wpProQuiz_listItem:visible').first();
        if ($currentQuestion.length) {
            const questionIndex = $currentQuestion.index();
            return questionIndex + 1;
        }
        
        // Fallback: look for question input names
        const $questionInput = $('input[name*="question_"]:visible').first();
        if ($questionInput.length) {
            const nameMatch = $questionInput.attr('name').match(/question_\d+_(\d+)/);
            if (nameMatch) {
                return parseInt(nameMatch[1]);
            }
        }
        
        // Default to question 1
        return 1;
    }

    /**
     * Get current question position in the quiz
     */
    function getCurrentQuestionPosition() {
        const totalQuestions = window.lilacQuizMeta ? window.lilacQuizMeta.totalQuestions : $('.wpProQuiz_listItem').length;
        const currentQuestionId = getCurrentQuestionId();
        return {
            current: currentQuestionId,
            total: totalQuestions,
            progress: totalQuestions > 0 ? Math.round((currentQuestionId / totalQuestions) * 100) : 0
        };
    }

    /**
     * Debug current answer state for validation analysis
     */
    function debugCurrentAnswerState(questionId) {
        console.log(`[LilacQuiz] 🔍 DEBUGGING Answer State for Question ${questionId}:`);
        
        const $questionList = $(`.wpProQuiz_questionList[data-question_id="${questionId}"]`);
        if ($questionList.length === 0) {
            console.log('   ❌ No question list found for this question ID');
            return { selectedAnswers: [], allAnswers: [], feedbackMessages: [] };
        }

        // Get selected answers
        const selectedAnswers = [];
        $questionList.find('.wpProQuiz_questionListItem').each(function() {
            const $item = $(this);
            const isSelected = $item.hasClass('is-selected') || $item.find('input:checked').length > 0;
            if (isSelected) {
                const text = $item.find('.wpProQuiz_questionListItemText').text().trim();
                const value = $item.find('input').val();
                selectedAnswers.push({ text, value });
            }
        });

        // Get all answers with their validation states
        const allAnswers = [];
        $questionList.find('.wpProQuiz_questionListItem').each(function() {
            const $item = $(this);
            const text = $item.find('.wpProQuiz_questionListItemText').text().trim();
            const value = $item.find('input').val();
            const isSelected = $item.hasClass('is-selected') || $item.find('input:checked').length > 0;
            
            // Check multiple indicators for correct answers
            const hasCorrectClass = $item.find('.ld-quiz-question-item__status--correct').length > 0;
            const hasCorrectResult = $item.hasClass('wpProQuiz_answerCorrect');
            const hasIncorrectResult = $item.hasClass('wpProQuiz_answerIncorrect');
            const parentHasCorrect = $item.closest('.wpProQuiz_answerCorrect').length > 0;
            const parentHasIncorrect = $item.closest('.wpProQuiz_answerIncorrect').length > 0;
            
            allAnswers.push({ 
                text, 
                value, 
                isSelected, 
                hasCorrectClass,
                hasCorrectResult,
                hasIncorrectResult,
                parentHasCorrect,
                parentHasIncorrect
            });
        });

        // Get feedback messages
        const feedbackMessages = [];
        $('.wpProQuiz_response').each(function() {
            const text = $(this).text().trim();
            if (text) feedbackMessages.push(text);
        });

        // Get result classes
        const correctResults = $('.wpProQuiz_answerCorrect').length;
        const incorrectResults = $('.wpProQuiz_answerIncorrect').length;

        console.log('   📝 Selected Answers:', selectedAnswers);
        console.log('   📋 All Answers (with validation states):', allAnswers);
        console.log('   💬 Feedback Messages:', feedbackMessages);
        console.log('   ✅ Correct Results:', correctResults);
        console.log('   ❌ Incorrect Results:', incorrectResults);

        // Advanced validation analysis
        const validationAnalysis = analyzeAnswerValidation(selectedAnswers, allAnswers, feedbackMessages);
        console.log('   🔬 Validation Analysis:', validationAnalysis);

        // Compare with AJAX correct answers if available
        if (window.currentQuestionData && window.currentQuestionData.correctAnswers) {
            console.log('   🎯 AJAX Correct Answers:', window.currentQuestionData.correctAnswers);
            
            const inversionCheck = checkValidationInversion(selectedAnswers, window.currentQuestionData.correctAnswers, feedbackMessages);
            if (inversionCheck.hasInversion) {
                console.log('   🚨 VALIDATION INVERSION DETECTED:', inversionCheck.reason);
            }
        }

        return { selectedAnswers, allAnswers, feedbackMessages, validationAnalysis };
    }

    /**
     * Analyze answer validation patterns to detect issues
     */
    function analyzeAnswerValidation(selectedAnswers, allAnswers, feedbackMessages) {
        const analysis = {
            selectedCount: selectedAnswers.length,
            totalAnswers: allAnswers.length,
            correctMarkedAnswers: allAnswers.filter(a => a.hasCorrectClass || a.hasCorrectResult || a.parentHasCorrect),
            incorrectMarkedAnswers: allAnswers.filter(a => a.hasIncorrectResult || a.parentHasIncorrect),
            hasWrongFeedback: feedbackMessages.some(msg => msg.includes('שגויה')),
            hasCorrectFeedback: feedbackMessages.some(msg => msg.includes('נכונה')),
            possibleIssues: []
        };

        // Detect potential issues
        if (analysis.selectedCount === 0) {
            analysis.possibleIssues.push('No answers selected');
        }

        if (analysis.correctMarkedAnswers.length === 0 && analysis.hasCorrectFeedback) {
            analysis.possibleIssues.push('Got correct feedback but no answers marked as correct in DOM');
        }

        if (analysis.correctMarkedAnswers.length > 0 && analysis.hasWrongFeedback) {
            analysis.possibleIssues.push('DOM shows correct answers but feedback says wrong');
        }

        return analysis;
    }

    /**
     * Check for validation inversion between AJAX data and feedback
     */
    function checkValidationInversion(selectedAnswers, ajaxCorrectAnswers, feedbackMessages) {
        const hasWrongFeedback = feedbackMessages.some(msg => msg.includes('שגויה'));
        const hasCorrectFeedback = feedbackMessages.some(msg => msg.includes('נכונה'));
        
        if (selectedAnswers.length === 0 || ajaxCorrectAnswers.length === 0) {
            return { hasInversion: false, reason: 'Insufficient data for comparison' };
        }

        const selectedTexts = selectedAnswers.map(a => a.text);
        
        // Enhanced matching logic to handle different answer formats
        const isSelectedInCorrect = selectedTexts.some(selectedText => {
            return ajaxCorrectAnswers.some(correctAnswer => {
                // Handle both string and object formats
                const correctText = typeof correctAnswer === 'string' ? correctAnswer : correctAnswer.text;
                
                if (!correctText) return false;
                
                // Multiple matching strategies
                const exactMatch = correctText.trim() === selectedText.trim();
                const containsMatch = correctText.includes(selectedText) || selectedText.includes(correctText);
                const caseInsensitiveMatch = correctText.toLowerCase().includes(selectedText.toLowerCase()) ||
                                           selectedText.toLowerCase().includes(correctText.toLowerCase());
                
                return exactMatch || containsMatch || caseInsensitiveMatch;
            });
        });
        
        // Check for validation inversion
        if (isSelectedInCorrect && hasWrongFeedback) {
            console.log('[LilacQuiz] 🚨 INVERSION: Selected correct answer but got wrong feedback');
            console.log('   Selected:', selectedTexts);
            console.log('   AJAX Correct:', ajaxCorrectAnswers);
            console.log('   Feedback:', feedbackMessages);
            
            return { 
                hasInversion: true, 
                reason: 'Selected answer matches AJAX correct but got wrong feedback - VALIDATION INVERTED' 
            };
        } 
        
        if (!isSelectedInCorrect && hasCorrectFeedback) {
            console.log('[LilacQuiz] 🚨 INVERSION: Selected wrong answer but got correct feedback');
            console.log('   Selected:', selectedTexts);
            console.log('   AJAX Correct:', ajaxCorrectAnswers);
            console.log('   Feedback:', feedbackMessages);
            
            return { 
                hasInversion: true, 
                reason: 'Selected answer does not match AJAX correct but got correct feedback - VALIDATION INVERTED' 
            };
        }

        return { hasInversion: false, reason: 'Validation appears consistent' };
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
            // Lock question permanently after correct answer
            $question.addClass('lilac-correct-locked');
            
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

            // Disable all inputs permanently after correct answer
            $question.find('.wpProQuiz_questionInput').prop('disabled', true)
                .closest('.wpProQuiz_questionListItem')
                .css({
                    'pointer-events': 'none',
                    'cursor': 'not-allowed',
                    'opacity': '0.6'
                });
            
            // Hide check button to prevent resubmission
            $question.find('.wpProQuiz_button[name="check"]').css({
                'display': 'none',
                'visibility': 'hidden'
            });

            // Show the Next button with !important to prevent override
            const $nextButton = $question.find('.wpProQuiz_button[name="next"]');
            $nextButton.attr('style', 
                'float: left !important; ' +
                'margin: 0px 10px !important; ' +
                'display: inline-block !important; ' +
                'visibility: visible !important; ' +
                'opacity: 1 !important; ' +
                'pointer-events: auto !important;'
            ).prop('disabled', false).show();
            
            // Set up persistent monitoring to keep next button visible
            const keepNextVisible = setInterval(function() {
                const $btn = $question.find('.wpProQuiz_button[name="next"]');
                if ($btn.length && !$btn.is(':visible')) {
                    $btn.attr('style', 
                        'float: left !important; ' +
                        'margin: 0px 10px !important; ' +
                        'display: inline-block !important; ' +
                        'visibility: visible !important; ' +
                        'opacity: 1 !important; ' +
                        'pointer-events: auto !important;'
                    ).show();
                }
                // Stop monitoring if question is no longer visible (navigated away)
                if (!$question.is(':visible')) {
                    clearInterval(keepNextVisible);
                }
            }, 500);
            
        } else {
            // For incorrect answers, lock the question until hint is viewed
            console.log('[LilacQuiz] Incorrect answer - locking question until hint is viewed');
            
            // Lock the question - require hint viewing before reselection
            $question.addClass('lilac-locked');
            
            // Disable answer selection until hint is viewed
            $question.find('.wpProQuiz_questionInput').prop('disabled', true);
            $question.find('.wpProQuiz_questionListItem').css({
                'pointer-events': 'none',
                'cursor': 'not-allowed',
                'opacity': '0.7'
            });
            
            // Hide check button until hint is viewed
            $question.find('.wpProQuiz_button[name="check"]').css({
                'display': 'none'
            });
            
            // Hide native next button on wrong answers - use attr for stronger override
            $question.find('.wpProQuiz_button[name="next"]').attr('style', 
                'display: none !important; visibility: hidden !important;'
            ).hide();
            
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
            
            // Add wrong answer message that requires hint viewing
            const $hintMessage = $('<div class="lilac-hint-message" style="background-color: rgb(255, 243, 224); border: 1px solid rgb(255, 152, 0); border-radius: 4px; padding: 10px 15px; margin: 15px 0px; text-align: right; font-size: 16px; direction: rtl;">' +
                '<span>תשובה שגויה! חובה לצפות ברמז לפני בחירת תשובה נוספת</span>' +
            '</div>');
            $responseArea.append($hintMessage);
            
            // Change hint box color from blue to orange
            changeHintBoxesToOrange();
            
            // Show the original orange hint button for debugging
            const $hintButton = $question.find('.wpProQuiz_button[name="tip"]');
            $hintButton.css({
                'display': 'inline-block',
                'visibility': 'visible',
                'opacity': '1'
            });
        }
    }

    /**
     * Handle hint viewing - unlock question after viewing hint
     */
    function handleHintViewing($question) {
        console.log('[LilacQuiz] Hint clicked, showing modal and unlocking question');
        
        // Show hint modal
        showHintModal($question);
        
        // Remove lock to allow answer reselection
        $question.removeClass('lilac-locked');
        
        // Re-enable answer selection
        $question.find('.wpProQuiz_questionInput').prop('disabled', false);
        $question.find('.wpProQuiz_questionListItem').css({
            'pointer-events': 'auto',
            'cursor': 'pointer',
            'opacity': '1'
        });
        
        // Show check button again
        $question.find('.wpProQuiz_button[name="check"]').css({
            'display': 'inline-block',
            'visibility': 'visible',
            'opacity': '1'
        }).prop('disabled', false);
        
        // Remove hint message
        $question.find('.lilac-hint-message').remove();
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

                // Block interactions on locked questions - force hint viewing or prevent resubmission
                $(document).on('click',
                    '.lilac-locked .wpProQuiz_questionListItem label, ' +
                    '.lilac-locked .wpProQuiz_questionInput, ' +
                    '.lilac-correct-locked .wpProQuiz_questionListItem label, ' +
                    '.lilac-correct-locked .wpProQuiz_questionInput',
                function(e) {
                    const $question = $(this).closest('.wpProQuiz_listItem');
                    if ($question.hasClass('lilac-correct-locked')) {
                        console.log(' [LilacQuiz] Blocked - question already answered correctly');
                    } else {
                        console.log(' [LilacQuiz] Blocked - must view hint first');
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });

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
     * Show the Next button for a question with persistent styling
     */
    function showNextButton($question) {
        const $nextButton = $question.find('.wpProQuiz_button[name="next"]');
        if ($nextButton.length) {
            $nextButton.attr('style', 
                'float: left !important; ' +
                'margin: 0px 10px !important; ' +
                'display: inline-block !important; ' +
                'visibility: visible !important; ' +
                'opacity: 1 !important; ' +
                'pointer-events: auto !important;'
            ).prop('disabled', false).show().css({
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
        
        // Wait for LearnDash quiz to be fully loaded
        function waitForQuizDOM() {
            // Check if quiz is in loading state
            const loadingElement = document.querySelector('.wpProQuiz_loadQuiz');
            if (loadingElement && loadingElement.style.display !== 'none') {
                console.log('[LilacQuiz] Quiz still loading, waiting...');
                setTimeout(waitForQuizDOM, 500);
                return;
            }
            
            // Try multiple selectors to find questions - updated for current DOM structure
            let $questions = $('.wpProQuiz_listItem');
            console.log('[LilacQuiz] Found', $questions.length, 'total .wpProQuiz_listItem questions');
            
            if ($questions.length === 0) {
                // Try alternative selectors for different quiz layouts
                $questions = $('.wpProQuiz_quiz .wpProQuiz_list > li');
                console.log('[LilacQuiz] Trying .wpProQuiz_quiz .wpProQuiz_list > li, found', $questions.length, 'questions');
            }
            
            if ($questions.length === 0) {
                // Try even more generic selector
                $questions = $('.wpProQuiz_quiz li');
                console.log('[LilacQuiz] Trying .wpProQuiz_quiz li, found', $questions.length, 'questions');
            }
            
            // Debug: Check if quiz container exists at all
            const quizContainer = document.querySelector('#wpProQuiz_101');
            const quizList = document.querySelector('.wpProQuiz_list');
            const allLi = document.querySelectorAll('.wpProQuiz_quiz li');
            const questionFieldsets = document.querySelectorAll('.wpProQuiz_question');
            console.log('[LilacQuiz] Debug - Quiz container:', !!quizContainer, 'Quiz list:', !!quizList, 'All li:', allLi.length, 'Fieldsets:', questionFieldsets.length);
            
            // If jQuery fails, try native DOM
            if ($questions.length === 0 && allLi.length > 0) {
                $questions = $(allLi);
                console.log('[LilacQuiz] Using native DOM selector, found', $questions.length, 'questions');
            }
            
            // Check if we have visible quiz content
            const hasVisibleQuiz = document.querySelector('.wpProQuiz_quiz:not([style*="display: none"])');
            const hasQuestionText = document.querySelector('.wpProQuiz_question_text');
            
            console.log('[LilacQuiz] Found', $questions.length, 'questions for injection');
            console.log('[LilacQuiz] Has visible quiz:', !!hasVisibleQuiz, 'Has question text:', !!hasQuestionText);
            
            if ($questions.length === 0 || !hasVisibleQuiz || !hasQuestionText) {
                console.log('[LilacQuiz] Quiz not ready yet, retrying in 500ms...');
                setTimeout(waitForQuizDOM, 500);
                return;
            }
            
            // Questions found, proceed with injection
            doHintBoxInjection($questions);
        }
        
        // Start waiting for DOM
        waitForQuizDOM();
        
        // Function to inject hint boxes - moved inside waitForQuizDOM scope
        function doHintBoxInjection($questions) {
            console.log('[LilacQuiz] Starting hint box injection for', $questions.length, 'questions');
            
            $questions.each(function(index) {
                const $question = $(this);
                if ($question.find('.lilac-initial-hint-box').length) {
                    console.log('[LilacQuiz] Question', index + 1, 'already has hint box, skipping');
                    return;
                }
                
                // Determine hint box color based on question state
                let hintBoxClass = 'lilac-hint-blue';
                let backgroundColor = 'linear-gradient(135deg, #4a90e2, #5ba0f2)';
                let borderColor = '#3a7bc8';
                
                // Check if question was answered incorrectly (orange state)
                if ($question.hasClass('lilac-locked') || $question.hasClass('lilac-correct-locked')) {
                    hintBoxClass = 'lilac-hint-orange';
                    backgroundColor = 'linear-gradient(135deg, #ff8c00, #ffa500)';
                    borderColor = '#ff6b00';
                }
                
                // Create hint box for each question
                const $hintBox = $(`
                    <div class="lilac-initial-hint-box ${hintBoxClass}" data-question-index="${index}" style="
                        background: ${backgroundColor} !important;
                        color: white !important;
                        padding: 15px 20px !important;
                        margin: 15px 0 !important;
                        border-radius: 8px !important;
                        font-size: 16px !important;
                        font-weight: bold !important;
                        text-align: center !important;
                        box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3) !important;
                        border: 2px solid ${borderColor} !important;
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
                
                // Add click handler to show hint and unlock if needed
                $hintBox.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[LilacQuiz] Hint box clicked for question', index + 1);
                    
                    // Hide any existing native hint popups first
                    $('.wpProQuiz_tipp').hide();
                    
                    // If question is locked, unlock it after viewing hint
                    if ($question.hasClass('lilac-locked') || $question.hasClass('lilac-correct-locked')) {
                        console.log('[LilacQuiz] Question is locked, unlocking after hint viewing');
                        handleHintViewing($question);
                    } else {
                        // Just show the modal if not locked
                        console.log('[LilacQuiz] Showing hint modal for unlocked question');
                        showHintModal($question);
                    }
                });
                
                // Insert hint box at the bottom of the question
                $question.append($hintBox);
                console.log(`[LilacQuiz] Added ${hintBoxClass} hint box to question ${index + 1}`);
            });
            
            console.log('[LilacQuiz] Hint box injection completed successfully');
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
        
        // Add click handler to show hint and unlock if needed
        $hintBox.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[LilacQuiz] Hint box clicked for question', questionIndex + 1);
            
            // Hide any existing native hint popups first
            $('.wpProQuiz_tipp').hide();
            
            // If question is locked, unlock it after viewing hint
            if ($question.hasClass('lilac-locked')) {
                console.log('[LilacQuiz] Question is locked, unlocking after hint viewing');
                handleHintViewing($question);
            } else {
                // Just show the modal if not locked
                showHintModal($question);
            }
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
        
        // Check for any already-correct answers and handle them
        $('.wpProQuiz_listItem').each(function() {
            const $question = $(this);
            if ($question.find('.wpProQuiz_correct').is(':visible')) {
                log.info('Found correct answer already selected, forcing Next button visibility');
                // Only show next button if question is not locked (meaning it's actually correct)
                if (!$question.hasClass('lilac-locked') && !$question.hasClass('lilac-correct-locked')) {
                    showNextButton($question);
                }
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
            
            // Don't process if question is locked - force hint viewing first
            if ($question.hasClass('lilac-locked') || $question.hasClass('lilac-correct-locked')) {
                console.log('[LilacQuiz] 🔒 Answer click blocked - question is locked');
                e.preventDefault();
                e.stopPropagation();
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

    // Initialize the plugin when DOM is ready
    $(document).ready(function() {
        console.log('[LilacQuiz] DOM ready - initializing plugin...');
        
        // Extract question data and set up monitoring
        extractQuestionData();
        
        // Style buttons for consistency
        styleAllButtons();
        
        // Set up answer reselection functionality
        setupAnswerReselection();
        
        // Activate auto-fix answer marking system
        autoFixAnswerMarking();
        
        // Mark as initialized
        window.lilacQuizInitialized = true;
        
        console.log('[LilacQuiz] *** PLUGIN INITIALIZATION COMPLETE ***');
    });
    
    // Force immediate initialization - don't wait for document ready
    console.log('[LilacQuiz] *** FORCING IMMEDIATE INITIALIZATION ***');
    
    function initializeQuizSystem() {
        console.log('[LilacQuiz] *** INITIALIZING QUIZ SYSTEM ***');
        if (window.lilacQuizInitialized) {
            console.log('[LilacQuiz] Already initialized, skipping...');
            return;
        }
        
        // Extract question data and set up monitoring
        extractQuestionData();
        
        // Style buttons for consistency
        styleAllButtons();
        
        // Set up answer reselection functionality
        setupAnswerReselection();
        
        // Activate auto-fix answer marking system
        autoFixAnswerMarking();
        
        // Mark as initialized
        window.lilacQuizInitialized = true;
        
        console.log('[LilacQuiz] *** PLUGIN INITIALIZATION COMPLETE ***');
    }
    
    // Document ready handler
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
