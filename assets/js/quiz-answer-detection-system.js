/**
 * Quiz Answer Detection System
 * Integrates with debugger to properly identify correct answers
 */

(function($) {
    'use strict';
    
    // Prevent multiple initializations
    if (window.quizAnswerDetection && window.quizAnswerDetection.initialized) {
        return;
    }
    
    // Initialize answer detection system
    window.quizAnswerDetection = {
        initialized: false,
        correctAnswers: {},
        questionData: {}
    };
    
    /**
     * Initialize the answer detection system
     */
    function initAnswerDetection() {
        console.log('🎯 Initializing Quiz Answer Detection System...');
        
        // Wait for debugger to be ready
        waitForDebugger();
        
        // Setup answer checking
        setupAnswerChecking();
        
        window.quizAnswerDetection.initialized = true;
        console.log('✅ Quiz Answer Detection System initialized');
    }
    
    /**
     * Wait for database loader to be available
     */
    function waitForDebugger() {
        const checkLoader = () => {
            if (window.quizDatabaseLoader && window.quizDatabaseLoader.initialized) {
                console.log('🔍 Database loader found, using correct answer data...');
                extractAnswerDataFromDatabase();
            } else {
                console.log('⏳ Waiting for database loader...');
                setTimeout(checkLoader, 1000);
            }
        };
        
        checkLoader();
    }
    
    /**
     * Extract correct answer data from database loader
     */
    function extractAnswerDataFromDatabase() {
        if (!window.quizDatabaseLoader || !window.quizDatabaseLoader.questionMap) {
            console.log('❌ No database loader data available');
            return;
        }
        
        const questionMap = window.quizDatabaseLoader.questionMap;
        console.log('📊 Processing questions from database loader');
        
        Object.keys(questionMap).forEach(questionId => {
            const questionData = questionMap[questionId];
            
            window.quizAnswerDetection.questionData[questionId] = {
                question_text: questionData.question_text,
                answers: questionData.answers,
                correct_answers: questionData.correct_index !== -1 ? [questionData.correct_index] : []
            };
            
            console.log('✅ Question ' + questionId + ' has correct answer at index: ' + questionData.correct_index);
        });
    }
    
    /**
     * Setup answer checking functionality
     */
    function setupAnswerChecking() {
        // Listen for check button clicks
        $(document).on('click', '.wpProQuiz_button[name="check"]', function() {
            const $question = $(this).closest('.wpProQuiz_listItem');
            setTimeout(() => checkAnswerCorrectness($question), 500);
        });
        
        // Also check when feedback appears using modern MutationObserver
        if (window.MutationObserver) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            const $node = $(node);
                            if ($node.hasClass('wpProQuiz_incorrect') || $node.hasClass('wpProQuiz_correct')) {
                                const $question = $node.closest('.wpProQuiz_listItem');
                                setTimeout(() => checkAnswerCorrectness($question), 100);
                            }
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
    
    /**
     * Check if the selected answer is correct using debugger data
     */
    function checkAnswerCorrectness($question) {
        const questionId = getQuestionId($question);
        const selectedAnswerIndex = getSelectedAnswerIndex($question);
        
        if (questionId === null || selectedAnswerIndex === null) {
            console.log('⚠️ Could not determine question ID or selected answer');
            return;
        }
        
        const questionData = window.quizAnswerDetection.questionData[questionId];
        if (!questionData) {
            console.log('⚠️ No question data found for question ' + questionId);
            return;
        }
        
        const isCorrect = questionData.correct_answers.includes(selectedAnswerIndex);
        
        console.log('🔍 Question ' + questionId + ', Answer ' + selectedAnswerIndex + 
                   ', Correct: ' + isCorrect);
        
        // Update UI based on correctness
        updateAnswerFeedback($question, isCorrect, selectedAnswerIndex);
    }
    
    /**
     * Update answer feedback based on correctness
     */
    function updateAnswerFeedback($question, isCorrect, selectedAnswerIndex) {
        // Remove existing feedback
        $question.find('.quiz-feedback-message').remove();
        $question.find('.wpProQuiz_questionListItem').removeClass('correct-answer incorrect-answer');
        
        // Get or create feedback area
        const $feedbackArea = getOrCreateFeedbackArea($question);
        
        if (isCorrect) {
            // Show correct feedback
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
            const $selectedAnswer = $question.find('.wpProQuiz_questionInput').eq(selectedAnswerIndex);
            $selectedAnswer.closest('.wpProQuiz_questionListItem').addClass('correct-answer');
            
            // Enable next button
            $question.find('.wpProQuiz_button[name="next"]').show().prop('disabled', false);
            
        } else {
            // Show incorrect feedback
            $feedbackArea.html(`
                <div class="quiz-feedback-message incorrect-feedback">
                    <div class="feedback-icon">❌</div>
                    <div class="feedback-text">
                        <strong>תשובה שגויה!</strong>
                        <span>נסה שוב</span>
                    </div>
                </div>
            `).show();
            
            // Highlight incorrect answer
            const $selectedAnswer = $question.find('.wpProQuiz_questionInput').eq(selectedAnswerIndex);
            $selectedAnswer.closest('.wpProQuiz_questionListItem').addClass('incorrect-answer');
            
            // Hide next button
            $question.find('.wpProQuiz_button[name="next"]').hide().prop('disabled', true);
            
            // Allow re-selection
            setTimeout(() => {
                $question.find('.wpProQuiz_questionInput').prop('disabled', false);
            }, 1000);
        }
    }
    
    /**
     * Get question ID from element
     */
    function getQuestionId($question) {
        // Try various methods to get question ID
        let questionId = $question.data('question-id');
        
        if (!questionId) {
            questionId = $question.find('.wpProQuiz_questionList').data('question-id');
        }
        
        if (!questionId) {
            questionId = $question.index();
        }
        
        return questionId;
    }
    
    /**
     * Get selected answer index
     */
    function getSelectedAnswerIndex($question) {
        const $selectedInput = $question.find('.wpProQuiz_questionInput:checked');
        if ($selectedInput.length === 0) {
            return null;
        }
        
        // Find the index of the selected input among all inputs in this question
        const $allInputs = $question.find('.wpProQuiz_questionInput');
        return $allInputs.index($selectedInput);
    }
    
    /**
     * Get or create feedback area
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
     * Add required styles
     */
    function addAnswerDetectionStyles() {
        if ($('#quiz-answer-detection-styles').length === 0) {
            const css = `
                <style id="quiz-answer-detection-styles">
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
                    
                    .feedback-icon {
                        font-size: 24px;
                    }
                    
                    .feedback-text {
                        flex: 1;
                        text-align: right;
                    }
                    
                    .feedback-next-btn {
                        background: #2196f3;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    }
                </style>
            `;
            
            $('head').append(css);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnswerDetection);
    } else {
        initAnswerDetection();
    }
    
    // Add styles
    addAnswerDetectionStyles();
    
    // Also initialize after a delay for dynamic content
    setTimeout(initAnswerDetection, 2000);
    
})(jQuery);
