/**
 * Live Quiz Integration - Real-time answer verification
 * Loads all quiz data and provides instant feedback
 */

(function($) {
    'use strict';
    
    // Prevent multiple initializations
    if (window.LilacLiveQuizIntegration && window.LilacLiveQuizIntegration.initialized) {
        return;
    }
    
    window.LilacLiveQuizIntegration = {
        initialized: false,
        allQuestions: {},
        currentQuizId: null,
        debugMode: true
    };
    
    /**
     * Initialize the live integration system
     */
    function initLiveIntegration() {
        console.log('🔴 Initializing Live Quiz Integration...');
        
        // Detect current quiz
        detectCurrentQuiz();
        
        // Load all quiz data
        loadAllQuizData();
        
        // Set up real-time monitoring
        startRealTimeMonitoring();
        
        window.LilacLiveQuizIntegration.initialized = true;
        console.log('✅ Live Quiz Integration initialized');
    }
    
    /**
     * Detect current quiz ID from page
     */
    function detectCurrentQuiz() {
        // Try multiple methods to detect quiz ID
        let quizId = null;
        
        // Method 1: Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('quiz_id')) {
            quizId = urlParams.get('quiz_id');
        }
        
        // Method 2: Check page elements
        const quizElements = $('.wpProQuiz_quiz, [data-quiz-id]');
        if (quizElements.length > 0) {
            quizId = quizElements.first().attr('data-quiz-id') || 
                     quizElements.first().find('[data-quiz-id]').attr('data-quiz-id');
        }
        
        // Method 3: Check global variables
        if (typeof window.wpProQuizGlobal !== 'undefined' && window.wpProQuizGlobal.quiz) {
            quizId = window.wpProQuizGlobal.quiz.id;
        }
        
        // Method 4: Extract from script tags or forms
        $('script').each(function() {
            const scriptContent = $(this).html();
            const match = scriptContent.match(/quiz[_-]?id["\s]*[:=]\s*["\']?(\d+)/i);
            if (match) {
                quizId = match[1];
                return false;
            }
        });
        
        window.LilacLiveQuizIntegration.currentQuizId = quizId;
        console.log('🎯 Detected Quiz ID:', quizId);
        
        return quizId;
    }
    
    /**
     * Load all quiz data via AJAX
     */
    function loadAllQuizData() {
        console.log('📥 Loading all quiz data...');
        
        // Use the quiz data loader endpoint
        $.ajax({
            url: window.location.origin + '/quiz-data-loader.php',
            method: 'GET',
            dataType: 'json',
            data: {
                action: 'load_all_questions',
                quiz_id: window.LilacLiveQuizIntegration.currentQuizId
            },
            success: function(response) {
                if (response.success && response.data) {
                    window.LilacLiveQuizIntegration.allQuestions = response.data;
                    console.log('✅ Loaded quiz data:', Object.keys(response.data).length, 'questions');
                    
                    // Update LilacQuizAnalyzer if it exists
                    if (window.LilacQuizAnalyzer) {
                        window.LilacQuizAnalyzer.correctAnswers = {};
                        Object.keys(response.data).forEach(qId => {
                            const question = response.data[qId];
                            if (question.correct_answer !== null) {
                                window.LilacQuizAnalyzer.correctAnswers[qId] = question.correct_answer;
                            }
                        });
                        console.log('✅ Updated LilacQuizAnalyzer with', Object.keys(window.LilacQuizAnalyzer.correctAnswers).length, 'answers');
                    }
                } else {
                    console.error('❌ Failed to load quiz data:', response.message || 'Unknown error');
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ AJAX error loading quiz data:', error);
                // Fallback: try to load from existing systems
                loadFromExistingSystems();
            }
        });
    }
    
    /**
     * Fallback: Load from existing quiz systems
     */
    function loadFromExistingSystems() {
        console.log('🔄 Using fallback data loading...');
        
        // Try to get data from existing systems
        if (window.quizAnswerDetection && window.quizAnswerDetection.questionData) {
            const existingData = window.quizAnswerDetection.questionData;
            Object.keys(existingData).forEach(qId => {
                const question = existingData[qId];
                window.LilacLiveQuizIntegration.allQuestions[qId] = {
                    id: qId,
                    text: question.question_text || '',
                    correct_answer: question.correct_answers ? question.correct_answers[0] : null,
                    answers: question.answers || []
                };
            });
            console.log('✅ Loaded fallback data:', Object.keys(window.LilacLiveQuizIntegration.allQuestions).length, 'questions');
        }
    }
    
    /**
     * Start real-time monitoring of quiz interactions
     */
    function startRealTimeMonitoring() {
        console.log('👁️ Starting real-time monitoring...');
        
        // Monitor answer selections
        $(document).on('change', '.wpProQuiz_questionInput', function() {
            const questionElement = $(this).closest('.wpProQuiz_question, .wpProQuiz_listItem');
            const questionId = extractQuestionId(questionElement);
            const selectedValue = $(this).val();
            
            if (questionId && window.LilacLiveQuizIntegration.allQuestions[questionId]) {
                const questionData = window.LilacLiveQuizIntegration.allQuestions[questionId];
                const isCorrect = parseInt(selectedValue) === questionData.correct_answer;
                
                console.log('🎯 Answer selected:', {
                    questionId: questionId,
                    selected: selectedValue,
                    correct: questionData.correct_answer,
                    isCorrect: isCorrect
                });
                
                // Provide visual feedback
                if (window.LilacLiveQuizIntegration.debugMode) {
                    showAnswerFeedback(questionElement, isCorrect, questionData);
                }
            }
        });
        
        // Monitor question changes (for multi-question quizzes)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // Check if new questions appeared
                    $(mutation.addedNodes).find('.wpProQuiz_question, .wpProQuiz_listItem').each(function() {
                        const questionId = extractQuestionId($(this));
                        if (questionId) {
                            console.log('👁️ New question detected:', questionId);
                            updateQuestionDisplay($(this), questionId);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
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
        
        return questionId;
    }
    
    /**
     * Show visual feedback for answer selection
     */
    function showAnswerFeedback(questionElement, isCorrect, questionData) {
        // Remove existing feedback
        questionElement.find('.lilac-live-feedback').remove();
        
        // Create feedback element
        const feedbackHtml = `
            <div class="lilac-live-feedback" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: ${isCorrect ? '#27ae60' : '#e74c3c'};
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            ">
                ${isCorrect ? '✅ נכון' : '❌ לא נכון'}
                <br>
                <small>תשובה נכונה: ${questionData.correct_answer}</small>
            </div>
        `;
        
        questionElement.css('position', 'relative').append(feedbackHtml);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            questionElement.find('.lilac-live-feedback').fadeOut();
        }, 3000);
    }
    
    /**
     * Update question display with loaded data
     */
    function updateQuestionDisplay(questionElement, questionId) {
        if (window.LilacLiveQuizIntegration.allQuestions[questionId]) {
            const questionData = window.LilacLiveQuizIntegration.allQuestions[questionId];
            
            // Add question info to debugger if available
            if (window.quizDebuggerEnhanced && window.quizDebuggerEnhanced.debugData) {
                window.quizDebuggerEnhanced.debugData.currentQuestion = {
                    id: questionId,
                    text: questionData.text,
                    correctAnswer: questionData.correct_answer,
                    correctAnswerText: questionData.answers && questionData.answers[questionData.correct_answer] 
                        ? questionData.answers[questionData.correct_answer].text 
                        : `Answer ${questionData.correct_answer}`
                };
            }
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLiveIntegration);
    } else {
        initLiveIntegration();
    }
    
    // Also initialize after a delay to catch dynamic content
    setTimeout(initLiveIntegration, 2000);
    
})(jQuery);
