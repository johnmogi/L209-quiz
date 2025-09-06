/**
 * Quiz UI Feedback System
 * Provides visual feedback for answer selection, correct/incorrect responses, and hint management
 */

(function($) {
    'use strict';
    
    // Prevent multiple initializations
    if (window.quizUIFeedback && window.quizUIFeedback.initialized) {
        return;
    }
    
    // Initialize feedback system namespace
    window.quizUIFeedback = {
        initialized: false,
        currentQuestionId: null,
        feedbackState: {},
        updateAnswerData: function(answerData) {
            console.log('🔄 UI Feedback system received answer data update:', answerData);
            // Store the answer data for validation
            if (answerData && typeof answerData === 'object') {
                window.lilacQuizCorrectAnswers = answerData;
                console.log('✅ Correct answer data stored:', window.lilacQuizCorrectAnswers);
            }
        },
        debugDataAvailability: function() {
            console.log('🔍 Current data availability:', {
                timestamp: new Date().toISOString(),
                lilacQuizCorrectAnswers: {
                    exists: typeof window.lilacQuizCorrectAnswers !== 'undefined',
                    data: window.lilacQuizCorrectAnswers
                },
                quizAnalyzer: {
                    exists: typeof window.quizAnalyzer !== 'undefined',
                    hasQuestions: typeof window.quizAnalyzer !== 'undefined' && window.quizAnalyzer.questions,
                    questions: typeof window.quizAnalyzer !== 'undefined' ? window.quizAnalyzer.questions : null
                }
            });
        },
        testValidation: function(questionId, selectedIndex) {
            console.log('🧪 Manual validation test:', {
                questionId: questionId,
                selectedIndex: selectedIndex,
                selectedType: typeof selectedIndex
            });
            
            if (typeof window.lilacQuizCorrectAnswers !== 'undefined' && 
                window.lilacQuizCorrectAnswers[questionId]) {
                
                const correctAnswer = window.lilacQuizCorrectAnswers[questionId];
                console.log('🧪 Testing against lilacQuizCorrectAnswers:', {
                    correctAnswer: correctAnswer,
                    correctType: typeof correctAnswer,
                    strictEqual: selectedIndex === correctAnswer,
                    looseEqual: selectedIndex == correctAnswer,
                    numberEqual: Number(selectedIndex) === Number(correctAnswer),
                    stringEqual: String(selectedIndex) === String(correctAnswer)
                });
            }
            
            if (typeof window.quizAnalyzer !== 'undefined' && window.quizAnalyzer.questions) {
                const question = window.quizAnalyzer.questions.find(q => q.id == questionId);
                if (question && question.correctAnswer) {
                    console.log('🧪 Testing against quizAnalyzer:', {
                        correctAnswer: question.correctAnswer,
                        correctType: typeof question.correctAnswer,
                        strictEqual: selectedIndex === question.correctAnswer,
                        looseEqual: selectedIndex == question.correctAnswer,
                        numberEqual: Number(selectedIndex) === Number(question.correctAnswer),
                        stringEqual: String(selectedIndex) === String(question.correctAnswer)
                    });
                }
            }
        }
    };
    
    /**
     * Initialize the UI feedback system
     */
    function initUIFeedback() {
        console.log('🎯 Initializing Quiz UI Feedback System...');
        
        // Debug initial data availability
        window.quizUIFeedback.debugDataAvailability();
        
        setupEventListeners();
        setupAnswerFeedback();
        fixHintButtonDuplication();
        
        // Set up periodic data availability monitoring
        setInterval(function() {
            window.quizUIFeedback.debugDataAvailability();
        }, 5000); // Check every 5 seconds
        
        window.quizUIFeedback.initialized = true;
        console.log('✅ Quiz UI Feedback System initialized');
    }
    
    /**
     * Setup event listeners for quiz interactions
     */
    function setupEventListeners() {
        // Listen for answer selections
        $(document).on('click change', '.wpProQuiz_questionInput', handleAnswerSelection);
        
        // Listen for check button clicks
        $(document).on('click', '.wpProQuiz_button[name="check"]', handleCheckButton);
        
        // Listen for hint button clicks
        $(document).on('click', '.wpProQuiz_TipButton, .wpProQuiz_hint', handleHintClick);
        
        // Watch for feedback insertion using modern MutationObserver
        if (window.MutationObserver) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            const $node = $(node);
                            if ($node.hasClass('wpProQuiz_incorrect') || $node.hasClass('wpProQuiz_correct')) {
                                handleFeedbackDisplay.call(node);
                            }
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
        
        // Continuous monitoring for UI fixes
        setInterval(function() {
            fixHintButtonDuplication();
            ensureProperFeedbackDisplay();
        }, 1000);
    }
    
    /**
     * Handle answer selection with immediate visual feedback
     */
    function handleAnswerSelection(e) {
        const $input = $(this);
        const $question = $input.closest('.wpProQuiz_listItem');
        const questionId = getQuestionId($question);
        
        console.log('📝 Answer selected for question:', questionId, 'Input:', $input.val());
        
        // Debug data availability at time of selection
        window.quizUIFeedback.debugDataAvailability();
        
        // Clear previous selection highlights
        $question.find('.wpProQuiz_questionListItem').removeClass('selected-answer');
        
        // Highlight selected answer
        $input.closest('.wpProQuiz_questionListItem').addClass('selected-answer');
        
        // Show visual feedback that answer was selected
        showAnswerSelectionFeedback($input);
        
        // Trigger validation after a short delay to allow LearnDash to process
        setTimeout(function() {
            console.log('🔄 Triggering delayed validation for question:', questionId);
            detectAndEnhanceFeedback($question);
        }, 500);
    }
    
    /**
     * Show visual feedback when answer is selected
     */
    function showAnswerSelectionFeedback($input) {
        const $container = $input.closest('.wpProQuiz_questionListItem');
        
        // Add selection animation
        $container.addClass('answer-selecting');
        
        setTimeout(function() {
            $container.removeClass('answer-selecting');
        }, 300);
        
        // Enable check button if not already enabled
        const $question = $input.closest('.wpProQuiz_listItem');
        const $checkButton = $question.find('.wpProQuiz_button[name="check"]');
        $checkButton.prop('disabled', false).show();
    }
    
    /**
     * Handle check button click and prepare for feedback
     */
    function handleCheckButton(e) {
        const $button = $(this);
        const $question = $button.closest('.wpProQuiz_listItem');
        const questionId = getQuestionId($question);
        
        console.log('🔍 Check button clicked for question:', questionId);
        
        // Clear any existing feedback
        clearExistingFeedback($question);
        
        // Show loading state
        showCheckingFeedback($question);
        
        // Wait for LearnDash to process and show our feedback
        setTimeout(function() {
            detectAndEnhanceFeedback($question);
        }, 500);
    }
    
    /**
     * Clear existing feedback displays
     */
    function clearExistingFeedback($question) {
        $question.find('.quiz-feedback-message').remove();
        $question.find('.wpProQuiz_questionListItem').removeClass('correct-answer incorrect-answer');
    }
    
    /**
     * Show checking/loading feedback
     */
    function showCheckingFeedback($question) {
        const $feedbackArea = getOrCreateFeedbackArea($question);
        $feedbackArea.html(`
            <div class="quiz-feedback-message checking">
                <div class="feedback-spinner"></div>
                <span>בודק תשובה...</span>
            </div>
        `).show();
    }
    
    /**
     * Detect and validate answer using database correct answer data
     */
    function detectAndEnhanceFeedback($question) {
        console.log('🚀 detectAndEnhanceFeedback called for question');
        
        // First try to validate using database correct answer data
        const isCorrectByDatabase = validateAnswerAgainstDatabase($question);
        console.log('📊 Database validation result:', isCorrectByDatabase);
        
        if (isCorrectByDatabase !== null) {
            if (isCorrectByDatabase) {
                console.log('✅ Showing correct feedback (database validation)');
                showCorrectAnswerFeedback($question);
            } else {
                console.log('❌ Showing incorrect feedback (database validation)');
                showIncorrectAnswerFeedback($question);
            }
            return;
        }
        
        // Fallback to LearnDash DOM feedback if database validation fails
        console.log('🔄 Falling back to DOM feedback detection');
        const $correct = $question.find('.wpProQuiz_correct:visible');
        const $incorrect = $question.find('.wpProQuiz_incorrect:visible');
        
        console.log('🔍 DOM feedback elements:', {
            correctElements: $correct.length,
            incorrectElements: $incorrect.length
        });
        
        if ($correct.length > 0) {
            console.log('✅ Showing correct feedback (DOM detection)');
            showCorrectAnswerFeedback($question);
        } else if ($incorrect.length > 0) {
            console.log('❌ Showing incorrect feedback (DOM detection)');
            showIncorrectAnswerFeedback($question);
        } else {
            console.log('⏳ No feedback elements found, retrying in 200ms');
            // Retry detection
            setTimeout(function() {
                detectAndEnhanceFeedback($question);
            }, 200);
        }
    }
    
    /**
     * Validate selected answer against database correct answer data
     */
    function validateAnswerAgainstDatabase($question) {
        try {
            // Get question ID
            const questionId = getQuestionId($question);
            console.log('🔍 Starting validation for question:', questionId);
            
            // Get selected answer
            const $selectedInput = $question.find('.wpProQuiz_questionInput:checked');
            if ($selectedInput.length === 0) {
                console.log('❌ No answer selected');
                return null; // No answer selected
            }
            
            // Get selected answer index (1-based)
            const $allInputs = $question.find('.wpProQuiz_questionInput');
            const selectedIndex = $allInputs.index($selectedInput) + 1;
            
            // Debug selected input details
            console.log('🔍 Selected input details:', {
                selectedInputValue: $selectedInput.val(),
                selectedInputName: $selectedInput.attr('name'),
                selectedInputId: $selectedInput.attr('id'),
                selectedIndex: selectedIndex,
                totalInputs: $allInputs.length
            });
            
            // Debug all inputs
            const allInputsDebug = [];
            $allInputs.each(function(index) {
                allInputsDebug.push({
                    index: index + 1,
                    value: $(this).val(),
                    name: $(this).attr('name'),
                    id: $(this).attr('id'),
                    checked: $(this).is(':checked')
                });
            });
            console.log('🔍 All inputs:', allInputsDebug);
            
            // Check if we have correct answer data loaded
            if (typeof window.lilacQuizCorrectAnswers !== 'undefined' && 
                window.lilacQuizCorrectAnswers[questionId]) {
                
                const correctAnswer = window.lilacQuizCorrectAnswers[questionId];
                // Use loose equality to handle type mismatches (string vs number)
                const isCorrect = selectedIndex == correctAnswer;
                
                console.log('🎯 Database validation:', {
                    questionId: questionId,
                    selectedIndex: selectedIndex,
                    correctAnswer: correctAnswer,
                    isCorrect: isCorrect,
                    dataType: typeof correctAnswer,
                    selectedType: typeof selectedIndex,
                    strictEqual: selectedIndex === correctAnswer,
                    looseEqual: selectedIndex == correctAnswer
                });
                
                return isCorrect;
            }
            
            // Check if we have quiz analyzer data
            if (typeof window.quizAnalyzer !== 'undefined' && 
                window.quizAnalyzer.questions) {
                
                const question = window.quizAnalyzer.questions.find(q => q.id == questionId);
                if (question && question.correctAnswer) {
                    // Use loose equality to handle type mismatches (string vs number)
                    const isCorrect = selectedIndex == question.correctAnswer;
                    
                    console.log('🎯 Analyzer validation:', {
                        questionId: questionId,
                        selectedIndex: selectedIndex,
                        correctAnswer: question.correctAnswer,
                        isCorrect: isCorrect,
                        dataType: typeof question.correctAnswer,
                        selectedType: typeof selectedIndex,
                        strictEqual: selectedIndex === question.correctAnswer,
                        looseEqual: selectedIndex == question.correctAnswer
                    });
                    
                    return isCorrect;
                }
            }
            
            // Debug what data is actually available
            console.log('⚠️ No database validation data available for question:', questionId);
            console.log('🔍 Available data sources:', {
                hasLilacQuizCorrectAnswers: typeof window.lilacQuizCorrectAnswers !== 'undefined',
                lilacQuizCorrectAnswersKeys: typeof window.lilacQuizCorrectAnswers !== 'undefined' ? Object.keys(window.lilacQuizCorrectAnswers) : null,
                hasQuizAnalyzer: typeof window.quizAnalyzer !== 'undefined',
                hasQuizAnalyzerQuestions: typeof window.quizAnalyzer !== 'undefined' && window.quizAnalyzer.questions,
                quizAnalyzerQuestionIds: typeof window.quizAnalyzer !== 'undefined' && window.quizAnalyzer.questions ? window.quizAnalyzer.questions.map(q => q.id) : null
            });
            return null; // No validation data available
            
        } catch (error) {
            console.error('❌ Error in database validation:', error);
            return null;
        }
    }
    
    /**
     * Show correct answer feedback (כל הכבוד! תשובה נכונה)
     */
    function showCorrectAnswerFeedback($question) {
        const $feedbackArea = getOrCreateFeedbackArea($question);
        
        $feedbackArea.html(`
            <div class="quiz-feedback-message correct-feedback">
                <div class="feedback-icon">✅</div>
                <div class="feedback-text">
                    <strong>כל הכבוד! תשובה נכונה</strong>
                </div>
                <button class="feedback-next-btn">הבא</button>
            </div>
        `).show();
        
        // Highlight correct answer
        highlightCorrectAnswer($question);
        
        // Enable next button
        enableNextButton($question);
        
        console.log('✅ Correct answer feedback displayed');
    }
    
    /**
     * Show incorrect answer feedback (תשובה שגויה! רמז לקבלת עזרה)
     */
    function showIncorrectAnswerFeedback($question) {
        const $feedbackArea = getOrCreateFeedbackArea($question);
        
        $feedbackArea.html(`
            <div class="quiz-feedback-message incorrect-feedback">
                <div class="feedback-icon">❌</div>
                <div class="feedback-text">
                    <strong>תשובה שגויה!</strong>
                    <span>רמז לקבלת עזרה</span>
                </div>
                <button class="feedback-hint-btn">רמז</button>
            </div>
        `).show();
        
        // Highlight incorrect answer
        highlightIncorrectAnswer($question);
        
        // Setup hint button functionality
        setupHintButtonFunctionality($question);
        
        // Hide next button
        hideNextButton($question);
        
        console.log('❌ Incorrect answer feedback displayed');
    }
    
    /**
     * Get or create feedback area for question
     */
    function getOrCreateFeedbackArea($question) {
        let $feedbackArea = $question.find('.quiz-feedback-area');
        
        if ($feedbackArea.length === 0) {
            $feedbackArea = $('<div class="quiz-feedback-area"></div>');
            
            // Insert after question buttons or at end of question
            const $buttons = $question.find('p:has(.wpProQuiz_QuestionButton)');
            if ($buttons.length > 0) {
                $buttons.after($feedbackArea);
            } else {
                $question.append($feedbackArea);
            }
        }
        
        return $feedbackArea;
    }
    
    /**
     * Highlight the correct answer
     */
    function highlightCorrectAnswer($question) {
        const $selectedInput = $question.find('.wpProQuiz_questionInput:checked');
        if ($selectedInput.length > 0) {
            $selectedInput.closest('.wpProQuiz_questionListItem').addClass('correct-answer');
        }
    }
    
    /**
     * Highlight the incorrect answer
     */
    function highlightIncorrectAnswer($question) {
        const $selectedInput = $question.find('.wpProQuiz_questionInput:checked');
        if ($selectedInput.length > 0) {
            $selectedInput.closest('.wpProQuiz_questionListItem').addClass('incorrect-answer');
        }
    }
    
    /**
     * Setup hint button functionality in feedback
     */
    function setupHintButtonFunctionality($question) {
        $question.find('.feedback-hint-btn').off('click').on('click', function() {
            showHintPopup($question);
        });
    }
    
    /**
     * Show hint popup (fix duplication issue)
     */
    function showHintPopup($question) {
        // First, ensure we have only one hint button
        fixHintButtonDuplication();
        
        // Find or create hint content
        let $hintContent = $question.find('.wpProQuiz_tipp');
        
        if ($hintContent.length === 0) {
            // Create default hint content
            $hintContent = $(`
                <div class="wpProQuiz_tipp quiz-hint-popup" style="display: none;">
                    <div class="hint-content">
                        <h5 class="wpProQuiz_header">רמז</h5>
                        <p>נסה לחשוב על התשובה הנכונה. אם אתה מתקשה, פנה למורה לעזרה.</p>
                        <button class="hint-close-btn">סגור רמז</button>
                    </div>
                </div>
            `);
            $question.append($hintContent);
        }
        
        // Show hint with animation
        $hintContent.slideDown(300);
        
        // Setup close functionality
        $hintContent.find('.hint-close-btn').off('click').on('click', function() {
            $hintContent.slideUp(300);
        });
        
        console.log('💡 Hint popup displayed');
    }
    
    /**
     * Fix hint button duplication issue
     */
    function fixHintButtonDuplication() {
        $('.wpProQuiz_listItem').each(function() {
            const $question = $(this);
            const $hintButtons = $question.find('.wpProQuiz_TipButton');
            
            if ($hintButtons.length > 1) {
                // Keep only the first hint button
                $hintButtons.slice(1).remove();
                console.log('🔧 Fixed hint button duplication');
            }
            
            // Ensure hint button is visible and properly styled
            $hintButtons.first().show().css({
                'display': 'inline-block',
                'visibility': 'visible',
                'opacity': '1'
            });
        });
    }
    
    /**
     * Enable next button
     */
    function enableNextButton($question) {
        const $nextButton = $question.find('.wpProQuiz_button[name="next"]');
        $nextButton.show().prop('disabled', false);
    }
    
    /**
     * Hide next button
     */
    function hideNextButton($question) {
        const $nextButton = $question.find('.wpProQuiz_button[name="next"]');
        $nextButton.hide().prop('disabled', true);
    }
    
    /**
     * Handle feedback display from LearnDash
     */
    function handleFeedbackDisplay(e) {
        const $feedback = $(e.target);
        const $question = $feedback.closest('.wpProQuiz_listItem');
        
        if ($question.length > 0) {
            setTimeout(function() {
                if ($feedback.hasClass('wpProQuiz_correct')) {
                    showCorrectAnswerFeedback($question);
                } else if ($feedback.hasClass('wpProQuiz_incorrect')) {
                    showIncorrectAnswerFeedback($question);
                }
            }, 100);
        }
    }
    
    /**
     * Handle hint button clicks
     */
    function handleHintClick(e) {
        e.preventDefault();
        const $question = $(this).closest('.wpProQuiz_listItem');
        showHintPopup($question);
    }
    
    /**
     * Ensure proper feedback display
     */
    function ensureProperFeedbackDisplay() {
        $('.wpProQuiz_listItem:visible').each(function() {
            const $question = $(this);
            const $correct = $question.find('.wpProQuiz_correct:visible');
            const $incorrect = $question.find('.wpProQuiz_incorrect:visible');
            
            // If LearnDash feedback exists but our enhanced feedback doesn't
            if (($correct.length > 0 || $incorrect.length > 0) && 
                $question.find('.quiz-feedback-message').length === 0) {
                
                if ($correct.length > 0) {
                    showCorrectAnswerFeedback($question);
                } else {
                    showIncorrectAnswerFeedback($question);
                }
            }
        });
    }
    
    /**
     * Setup answer feedback styling
     */
    function setupAnswerFeedback() {
        // Add CSS for answer feedback
        const feedbackCSS = `
            <style id="quiz-ui-feedback-styles">
                .selected-answer {
                    background-color: #e3f2fd !important;
                    border: 2px solid #2196f3 !important;
                    border-radius: 4px;
                }
                
                .answer-selecting {
                    animation: answerPulse 0.3s ease-in-out;
                }
                
                @keyframes answerPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                    100% { transform: scale(1); }
                }
                
                .correct-answer {
                    background-color: #e8f5e8 !important;
                    border: 2px solid #4caf50 !important;
                    border-radius: 4px;
                }
                
                .incorrect-answer {
                    background-color: #ffebee !important;
                    border: 2px solid #f44336 !important;
                    border-radius: 4px;
                }
                
                .quiz-feedback-area {
                    margin: 15px 0;
                    text-align: center;
                }
                
                .quiz-feedback-message {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 15px;
                    border-radius: 8px;
                    font-size: 16px;
                    direction: rtl;
                }
                
                .correct-feedback {
                    background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
                    border: 2px solid #4caf50;
                    color: #2e7d32;
                }
                
                .incorrect-feedback {
                    background: linear-gradient(135deg, #ffebee, #ffcdd2);
                    border: 2px solid #f44336;
                    color: #c62828;
                }
                
                .checking {
                    background: linear-gradient(135deg, #fff3e0, #ffe0b2);
                    border: 2px solid #ff9800;
                    color: #ef6c00;
                }
                
                .feedback-icon {
                    font-size: 24px;
                }
                
                .feedback-text {
                    flex: 1;
                    text-align: right;
                }
                
                .feedback-next-btn, .feedback-hint-btn {
                    background: #2196f3;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .feedback-hint-btn {
                    background: #ff9800;
                    animation: hintPulse 2s infinite;
                }
                
                @keyframes hintPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .feedback-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #ff9800;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .quiz-hint-popup {
                    background: white;
                    border: 2px solid #ffeb3b;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    direction: rtl;
                    text-align: right;
                }
                
                .hint-close-btn {
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                }
            </style>
        `;
        
        if ($('#quiz-ui-feedback-styles').length === 0) {
            $('head').append(feedbackCSS);
        }
    }
    
    /**
     * Get question ID from element
     */
    function getQuestionId($question) {
        // Try multiple methods to get question ID
        let questionId = null;
        
        // Method 1: Check data attributes
        questionId = $question.data('question-id') || 
                    $question.find('.wpProQuiz_questionList').data('question-id');
        
        if (questionId) {
            return parseInt(questionId);
        }
        
        // Method 2: Extract from form input names
        const $inputs = $question.find('.wpProQuiz_questionInput');
        if ($inputs.length > 0) {
            const inputName = $inputs.first().attr('name');
            if (inputName) {
                const match = inputName.match(/question_(\d+)/);
                if (match) {
                    return parseInt(match[1]);
                }
            }
        }
        
        // Method 3: Extract from question list class or ID
        const classList = $question.attr('class') || '';
        const idAttr = $question.attr('id') || '';
        
        let match = classList.match(/question[_-](\d+)/) || idAttr.match(/question[_-](\d+)/);
        if (match) {
            return parseInt(match[1]);
        }
        
        // Method 4: Look for hidden input with question ID
        const $hiddenInput = $question.find('input[name*="question"]').first();
        if ($hiddenInput.length > 0) {
            const hiddenName = $hiddenInput.attr('name');
            match = hiddenName.match(/question[_\[\]]*(\d+)/);
            if (match) {
                return parseInt(match[1]);
            }
        }
        
        // Method 5: Use index as fallback
        const index = $question.index();
        console.log('⚠️ Using fallback index for question ID:', index);
        return index;
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUIFeedback);
    } else {
        initUIFeedback();
    }
    
    // Also initialize after a delay for dynamic content
    setTimeout(initUIFeedback, 1000);
    
})(jQuery);
