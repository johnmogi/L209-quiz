/**
 * Quiz Answer Sync - Syncs correct answers from backend to live quiz
 * Fixes mismatches between quiz-browser-tool.php and live quiz interface
 */

(function($) {
    'use strict';
    
    window.LilacAnswerSync = {
        initialized: false,
        correctAnswers: {},
        questionMapping: {}
    };
    
    /**
     * Initialize answer sync system
     */
    function initAnswerSync() {
        console.log('🔄 Initializing Answer Sync...');
        
        loadCorrectAnswers();
        setupAnswerCorrection();
        
        window.LilacAnswerSync.initialized = true;
        console.log('✅ Answer Sync initialized');
    }
    
    /**
     * Load correct answers from the same source as quiz-browser-tool.php
     */
    function loadCorrectAnswers() {
        $.ajax({
            url: window.location.origin + '/quiz-data-loader.php',
            method: 'GET',
            dataType: 'json',
            data: {
                action: 'load_all_questions',
                quiz_id: 0
            },
            success: function(response) {
                if (response.success && response.data) {
                    window.LilacAnswerSync.correctAnswers = {};
                    
                    Object.keys(response.data).forEach(qId => {
                        const question = response.data[qId];
                        if (question.correct_answer !== null) {
                            window.LilacAnswerSync.correctAnswers[qId] = {
                                correctIndex: question.correct_answer,
                                questionText: question.text,
                                answers: question.answers
                            };
                        }
                    });
                    
                    console.log('✅ Loaded correct answers for', Object.keys(window.LilacAnswerSync.correctAnswers).length, 'questions');
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
     * Setup answer correction monitoring
     */
    function setupAnswerCorrection() {
        // Monitor for new questions appearing
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    $(mutation.addedNodes).find('.wpProQuiz_question, .wpProQuiz_listItem').each(function() {
                        correctQuestionAnswers($(this));
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
    }
    
    /**
     * Apply answer corrections to all visible questions
     */
    function applyAnswerCorrections() {
        $('.wpProQuiz_question, .wpProQuiz_listItem').each(function() {
            correctQuestionAnswers($(this));
        });
    }
    
    /**
     * Correct answers for a specific question element
     */
    function correctQuestionAnswers(questionElement) {
        const questionId = extractQuestionId(questionElement);
        
        if (!questionId || !window.LilacAnswerSync.correctAnswers[questionId]) {
            return;
        }
        
        const correctData = window.LilacAnswerSync.correctAnswers[questionId];
        const correctIndex = correctData.correctIndex;
        
        // Find answer options
        const answerInputs = questionElement.find('.wpProQuiz_questionInput');
        
        if (answerInputs.length > correctIndex) {
            // Remove existing correct answer indicators
            questionElement.find('.lilac-sync-indicator').remove();
            
            // Add correct answer indicator to the right answer
            const correctInput = answerInputs.eq(correctIndex);
            const correctLabel = correctInput.closest('label, .wpProQuiz_questionListItem');
            
            if (correctLabel.length) {
                // Add visual indicator matching quiz-browser-tool.php style
                correctLabel.append(`
                    <span class="lilac-sync-indicator" style="
                        background: #d5f4e6;
                        color: #27ae60;
                        font-weight: bold;
                        padding: 5px;
                        border-radius: 3px;
                        margin-left: 10px;
                        font-size: 11px;
                    ">✓ CORRECT</span>
                `);
                
                console.log('✅ Synced answer for question', questionId, '- correct answer is option', correctIndex);
                
                // Update any existing quiz systems
                updateQuizSystems(questionId, correctIndex);
            }
        }
    }
    
    /**
     * Update existing quiz systems with correct answer
     */
    function updateQuizSystems(questionId, correctIndex) {
        // Update LilacQuizAnalyzer
        if (window.LilacQuizAnalyzer && window.LilacQuizAnalyzer.correctAnswers) {
            window.LilacQuizAnalyzer.correctAnswers[questionId] = correctIndex;
        }
        
        // Update quizAnswerDetection
        if (window.quizAnswerDetection && window.quizAnswerDetection.questionData) {
            if (!window.quizAnswerDetection.questionData[questionId]) {
                window.quizAnswerDetection.questionData[questionId] = {};
            }
            window.quizAnswerDetection.questionData[questionId].correct_answers = [correctIndex];
        }
        
        // Update LilacLiveQuizIntegration
        if (window.LilacLiveQuizIntegration && window.LilacLiveQuizIntegration.allQuestions) {
            if (window.LilacLiveQuizIntegration.allQuestions[questionId]) {
                window.LilacLiveQuizIntegration.allQuestions[questionId].correct_answer = correctIndex;
            }
        }
    }
    
    /**
     * Extract question ID from DOM element
     */
    function extractQuestionId(questionElement) {
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
        
        // Method 4: Try to match question text with backend data (enhanced matching)
        if (!questionId) {
            const questionText = questionElement.find('.wpProQuiz_question_text, .question-text, h5').text().trim();
            if (questionText && questionText.length > 10) {
                // Search for matching question text in our data
                Object.keys(window.LilacAnswerSync.correctAnswers).forEach(qId => {
                    const correctData = window.LilacAnswerSync.correctAnswers[qId];
                    if (correctData.questionText) {
                        // More flexible matching for Hebrew text
                        const cleanBackendText = correctData.questionText.replace(/[^\u05D0-\u05EA\s]/g, '').trim();
                        const cleanQuestionText = questionText.replace(/[^\u05D0-\u05EA\s]/g, '').trim();
                        
                        if (cleanBackendText && cleanQuestionText && 
                            (cleanQuestionText.includes(cleanBackendText.substring(0, Math.min(20, cleanBackendText.length))) ||
                             cleanBackendText.includes(cleanQuestionText.substring(0, Math.min(20, cleanQuestionText.length))))) {
                            questionId = qId;
                            console.log('🎯 Matched question by text:', qId, cleanQuestionText.substring(0, 30));
                            return false;
                        }
                    }
                });
            }
        }
        
        return questionId;
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnswerSync);
    } else {
        initAnswerSync();
    }
    
    // Also initialize after delays to catch dynamic content
    setTimeout(initAnswerSync, 2000);
    setTimeout(initAnswerSync, 5000);
    
})(jQuery);
