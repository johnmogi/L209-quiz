/**
 * Quiz Answer Correction System
 * Fixes the mismatch between backend correct answers and live quiz display
 */

(function($) {
    'use strict';
    
    // Prevent multiple initializations
    if (window.LilacAnswerCorrection && window.LilacAnswerCorrection.initialized) {
        return;
    }
    
    window.LilacAnswerCorrection = {
        initialized: false,
        correctAnswers: {},
        questionMapping: {}
    };
    
    /**
     * Initialize the answer correction system
     */
    function initAnswerCorrection() {
        console.log('🔧 Initializing Answer Correction System...');
        
        // Load correct answers from backend
        loadCorrectAnswers();
        
        // Set up real-time correction
        startAnswerCorrection();
        
        window.LilacAnswerCorrection.initialized = true;
        console.log('✅ Answer Correction System initialized');
    }
    
    /**
     * Load correct answers from the quiz data loader
     */
    function loadCorrectAnswers() {
        $.ajax({
            url: window.location.origin + '/quiz-data-loader.php',
            method: 'GET',
            dataType: 'json',
            data: {
                action: 'load_all_questions',
                quiz_id: 0 // Most questions are in quiz_id 0
            },
            success: function(response) {
                if (response.success && response.data) {
                    window.LilacAnswerCorrection.correctAnswers = {};
                    
                    Object.keys(response.data).forEach(qId => {
                        const question = response.data[qId];
                        if (question.correct_answer !== null) {
                            window.LilacAnswerCorrection.correctAnswers[qId] = {
                                correctIndex: question.correct_answer,
                                questionText: question.text,
                                answers: question.answers
                            };
                        }
                    });
                    
                    console.log('✅ Loaded correct answers for', Object.keys(window.LilacAnswerCorrection.correctAnswers).length, 'questions');
                    
                    // Update existing systems
                    updateExistingSystems();
                    
                    // Apply corrections immediately
                    applyAnswerCorrections();
                } else {
                    console.error('❌ Failed to load correct answers');
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ AJAX error loading correct answers:', error);
            }
        });
    }
    
    /**
     * Update existing quiz systems with correct answers
     */
    function updateExistingSystems() {
        // Update LilacQuizAnalyzer
        if (window.LilacQuizAnalyzer) {
            if (!window.LilacQuizAnalyzer.correctAnswers) {
                window.LilacQuizAnalyzer.correctAnswers = {};
            }
            
            Object.keys(window.LilacAnswerCorrection.correctAnswers).forEach(qId => {
                const correctData = window.LilacAnswerCorrection.correctAnswers[qId];
                window.LilacQuizAnalyzer.correctAnswers[qId] = correctData.correctIndex;
            });
            
            console.log('✅ Updated LilacQuizAnalyzer with correct answers');
        }
        
        // Update quizAnswerDetection
        if (window.quizAnswerDetection) {
            if (!window.quizAnswerDetection.questionData) {
                window.quizAnswerDetection.questionData = {};
            }
            
            Object.keys(window.LilacAnswerCorrection.correctAnswers).forEach(qId => {
                const correctData = window.LilacAnswerCorrection.correctAnswers[qId];
                window.quizAnswerDetection.questionData[qId] = {
                    question_text: correctData.questionText,
                    correct_answers: [correctData.correctIndex],
                    answers: correctData.answers
                };
            });
            
            console.log('✅ Updated quizAnswerDetection with correct answers');
        }
    }
    
    /**
     * Start real-time answer correction
     */
    function startAnswerCorrection() {
        // Monitor for question changes and apply corrections
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // Check if new questions appeared
                    $(mutation.addedNodes).find('.wpProQuiz_question, .wpProQuiz_listItem').each(function() {
                        applyQuestionCorrection($(this));
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Apply corrections to existing questions
        setTimeout(applyAnswerCorrections, 1000);
        setTimeout(applyAnswerCorrections, 3000);
        setTimeout(applyAnswerCorrections, 5000);
    }
    
    /**
     * Apply answer corrections to all visible questions
     */
    function applyAnswerCorrections() {
        $('.wpProQuiz_question, .wpProQuiz_listItem').each(function() {
            applyQuestionCorrection($(this));
        });
    }
    
    /**
     * Apply correction to a specific question element
     */
    function applyQuestionCorrection(questionElement) {
        const questionId = extractQuestionId(questionElement);
        
        if (!questionId || !window.LilacAnswerCorrection.correctAnswers[questionId]) {
            return;
        }
        
        const correctData = window.LilacAnswerCorrection.correctAnswers[questionId];
        const correctIndex = correctData.correctIndex;
        
        // Find answer options
        const answerInputs = questionElement.find('.wpProQuiz_questionInput');
        
        if (answerInputs.length > correctIndex) {
            // Remove existing correct answer indicators
            questionElement.find('.lilac-correct-indicator').remove();
            
            // Add correct answer indicator to the right answer
            const correctInput = answerInputs.eq(correctIndex);
            const correctLabel = correctInput.closest('label, .wpProQuiz_questionListItem');
            
            if (correctLabel.length) {
                // Add visual indicator
                correctLabel.append(`
                    <span class="lilac-correct-indicator" style="
                        color: #27ae60;
                        font-weight: bold;
                        margin-left: 10px;
                        background: #d5f4e6;
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 11px;
                    ">✓ CORRECT</span>
                `);
                
                console.log('✅ Applied correction to question', questionId, '- correct answer is option', correctIndex);
            }
        }
    }
    
    /**
     * Extract question ID from DOM element
     */
    function extractQuestionId(questionElement) {
        // Try multiple methods to extract question ID
        let questionId = null;
        
        // Method 1: Look for data attributes
        questionId = questionElement.attr('data-question-id') || 
                    questionElement.find('[data-question-id]').attr('data-question-id');
        
        // Method 2: Parse from input names
        if (!questionId) {
            const inputElement = questionElement.find('[name*="question"]').first();
            if (inputElement.length) {
                const nameAttr = inputElement.attr('name');
                const match = nameAttr.match(/question[_\[\]]*(\d+)/);
                if (match) {
                    questionId = match[1];
                }
            }
        }
        
        // Method 3: Look for ID in classes or other attributes
        if (!questionId) {
            const classList = questionElement.attr('class') || '';
            const match = classList.match(/question[_-](\d+)/);
            if (match) {
                questionId = match[1];
            }
        }
        
        // Method 4: Try to match question text with backend data
        if (!questionId) {
            const questionText = questionElement.find('.wpProQuiz_question_text, .question-text').text().trim();
            if (questionText) {
                // Search for matching question text in our data
                Object.keys(window.LilacAnswerCorrection.correctAnswers).forEach(qId => {
                    const correctData = window.LilacAnswerCorrection.correctAnswers[qId];
                    if (correctData.questionText && questionText.includes(correctData.questionText.substring(0, 50))) {
                        questionId = qId;
                        return false;
                    }
                });
            }
        }
        
        return questionId;
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnswerCorrection);
    } else {
        initAnswerCorrection();
    }
    
    // Also initialize after delays to catch dynamic content
    setTimeout(initAnswerCorrection, 2000);
    setTimeout(initAnswerCorrection, 5000);
    
})(jQuery);
