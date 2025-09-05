/**
 * Quiz Database Answer Loader
 * Properly queries LearnDash database for correct answer data
 */

(function($) {
    'use strict';

    // Global variables
    window.lilacQuizAnswerLoader = {
        isLoaded: false,
        correctAnswers: {},
        currentQuizId: null,
        totalQuestions: 0,
        loadedQuestions: 0
    };

    /**
     * Initialize the answer loader
     */
    function initAnswerLoader() {
        console.log('LILAC: Initializing Enhanced Quiz Database Answer Loader');
        
        // Try to detect current quiz
        detectCurrentQuiz();
        
        // Load answers if quiz is detected
        if (window.lilacQuizAnswerLoader.currentQuizId) {
            loadCorrectAnswersFromDatabase();
        } else {
            // Retry detection after a short delay
            setTimeout(() => {
                detectCurrentQuiz();
                if (window.lilacQuizAnswerLoader.currentQuizId) {
                    loadCorrectAnswersFromDatabase();
                }
            }, 1000);
        }
    }

    /**
     * Enhanced quiz detection with multiple fallback methods
     */
    function detectCurrentQuiz() {
        let quizId = null;
        
        // Method 1: Check LearnDash JavaScript variables
        if (typeof learndash_quiz_data !== 'undefined' && learndash_quiz_data.quiz_id) {
            quizId = learndash_quiz_data.quiz_id;
            console.log('LILAC: Quiz ID from learndash_quiz_data:', quizId);
        }
        
        // Method 2: Check global quiz variables
        if (!quizId && typeof window.quiz_id !== 'undefined') {
            quizId = window.quiz_id;
            console.log('LILAC: Quiz ID from window.quiz_id:', quizId);
        }
        
        // Method 3: Extract from URL patterns
        if (!quizId) {
            const urlPatterns = [
                /\/quiz\/(\d+)/,
                /\/quizzes\/[^\/]+\/(\d+)/,
                /quiz_id=(\d+)/,
                /postid-(\d+)/
            ];
            
            for (const pattern of urlPatterns) {
                const match = window.location.href.match(pattern);
                if (match) {
                    quizId = match[1];
                    console.log('LILAC: Quiz ID from URL pattern:', quizId);
                    break;
                }
            }
        }
        
        // Method 4: Check body classes for quiz post
        if (!quizId) {
            const bodyClasses = document.body.className;
            const quizMatch = bodyClasses.match(/postid-(\d+)/);
            if (quizMatch && (bodyClasses.includes('single-sfwd-quiz') || bodyClasses.includes('quiz'))) {
                quizId = quizMatch[1];
                console.log('LILAC: Quiz ID from body classes:', quizId);
            }
        }
        
        // Method 5: Check meta tags
        if (!quizId) {
            const metaTags = document.querySelectorAll('meta[name*="quiz"], meta[property*="quiz"]');
            metaTags.forEach(meta => {
                const content = meta.getAttribute('content');
                if (content && /^\d+$/.test(content)) {
                    quizId = content;
                    console.log('LILAC: Quiz ID from meta tags:', quizId);
                }
            });
        }
        
        if (quizId) {
            window.lilacQuizAnswerLoader.currentQuizId = parseInt(quizId);
            console.log('LILAC: Successfully detected quiz ID:', quizId);
        } else {
            console.warn('LILAC: Could not detect quiz ID - will retry');
        }
    }

    /**
     * Enhanced AJAX loader with better error handling and progress tracking
     */
    function loadCorrectAnswersFromDatabase() {
        const quizId = window.lilacQuizAnswerLoader.currentQuizId;
        
        if (!quizId) {
            console.error('LILAC: No quiz ID available for loading answers');
            return;
        }

        console.log('LILAC: Loading correct answers for quiz ID:', quizId);

        // Show loading indicator if debugger is available
        if (typeof window.lilacQuizDebugger !== 'undefined') {
            window.lilacQuizDebugger.log('Loading quiz answers from database...', 'info');
        }

        // Prepare AJAX data
        const ajaxData = {
            action: 'get_quiz_correct_answers',
            quiz_id: quizId
        };

        // Add nonce with multiple fallback sources
        const nonceSources = [
            () => typeof lilac_quiz_ajax !== 'undefined' ? lilac_quiz_ajax.nonce : null,
            () => typeof window.lilacQuizNonce !== 'undefined' ? window.lilacQuizNonce : null,
            () => typeof lilacQuizData !== 'undefined' ? lilacQuizData.nonce : null,
            () => $('meta[name="lilac-quiz-nonce"]').attr('content')
        ];

        for (const getNonce of nonceSources) {
            const nonce = getNonce();
            if (nonce) {
                ajaxData.nonce = nonce;
                break;
            }
        }

        // Determine AJAX URL
        const ajaxUrl = (typeof lilac_quiz_ajax !== 'undefined') ? 
            lilac_quiz_ajax.ajax_url : 
            '/wp-admin/admin-ajax.php';

        // Make AJAX request with enhanced error handling
        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: ajaxData,
            timeout: 30000, // 30 second timeout
            success: function(response) {
                handleSuccessResponse(response);
            },
            error: function(xhr, status, error) {
                handleErrorResponse(xhr, status, error);
            }
        });
    }

    /**
     * Handle successful AJAX response
     */
    function handleSuccessResponse(response) {
        if (response.success && response.data) {
            window.lilacQuizAnswerLoader.correctAnswers = response.data;
            window.lilacQuizAnswerLoader.isLoaded = true;
            window.lilacQuizAnswerLoader.totalQuestions = Object.keys(response.data).length;
            window.lilacQuizAnswerLoader.loadedQuestions = window.lilacQuizAnswerLoader.totalQuestions;
            
            console.log(`LILAC: Successfully loaded ${window.lilacQuizAnswerLoader.totalQuestions} correct answers`);
            
            // Log sample data for verification
            const sampleKey = Object.keys(response.data)[0];
            if (sampleKey) {
                console.log('LILAC: Sample answer data:', response.data[sampleKey]);
            }
            
            // Update debugger with loaded data
            updateDebuggerWithAnswerData(response.data);
            
            // Update UI feedback systems
            updateUIFeedbackSystems(response.data);
            
            // Trigger custom event for other components
            $(document).trigger('lilac:answersLoaded', [response.data]);
            
            // Log success to debugger
            if (typeof window.lilacQuizDebugger !== 'undefined') {
                window.lilacQuizDebugger.log(
                    `Database answers loaded: ${window.lilacQuizAnswerLoader.totalQuestions} questions`, 
                    'success'
                );
            }
            
        } else {
            console.error('LILAC: Invalid response format:', response);
            if (typeof window.lilacQuizDebugger !== 'undefined') {
                window.lilacQuizDebugger.log('Failed to load database answers: Invalid response', 'error');
            }
        }
    }

    /**
     * Handle AJAX error response
     */
    function handleErrorResponse(xhr, status, error) {
        console.error('LILAC: AJAX error loading correct answers:', {
            status: status,
            error: error,
            response: xhr.responseText
        });
        
        if (typeof window.lilacQuizDebugger !== 'undefined') {
            window.lilacQuizDebugger.log(`Database load error: ${error}`, 'error');
        }
        
        // Attempt fallback methods
        attemptFallbackMethods();
    }

    /**
     * Attempt fallback answer detection methods
     */
    function attemptFallbackMethods() {
        console.log('LILAC: Attempting fallback answer detection methods');
        
        // Try to extract from LearnDash global variables
        if (typeof window.learndash_quiz_data !== 'undefined') {
            console.log('LILAC: Found LearnDash quiz data, attempting extraction');
            // Implementation for extracting from LearnDash data
        }
        
        // Try to detect from DOM patterns
        setTimeout(() => {
            detectAnswersFromDOM();
        }, 2000);
    }

    /**
     * Detect answers from DOM patterns (fallback method)
     */
    function detectAnswersFromDOM() {
        console.log('LILAC: Attempting DOM-based answer detection');
        
        const questions = document.querySelectorAll('.wpProQuiz_question');
        if (questions.length > 0) {
            console.log(`LILAC: Found ${questions.length} questions in DOM`);
            // Implementation for DOM-based detection
        }
    }

    /**
     * Update debugger with enhanced answer data
     */
    function updateDebuggerWithAnswerData(answerData) {
        if (typeof window.lilacQuizDebugger === 'undefined') {
            console.log('LILAC: Debugger not available, storing data for later use');
            return;
        }

        // Convert enhanced database format to debugger format
        const debuggerData = {};
        
        Object.keys(answerData).forEach(questionId => {
            const questionData = answerData[questionId];
            
            debuggerData[questionId] = {
                questionText: questionData.question_text,
                correctAnswer: questionData.correct_answer,
                answers: questionData.answers,
                answerType: questionData.answer_type,
                hint: questionData.hint,
                questionProId: questionData.question_pro_id,
                source: 'enhanced_database'
            };
        });

        // Update debugger with enhanced data
        if (window.lilacQuizDebugger.updateQuestionData) {
            window.lilacQuizDebugger.updateQuestionData(debuggerData);
            console.log('LILAC: Updated debugger with enhanced database answer data');
        }
    }

    /**
     * Update UI feedback systems with new answer data
     */
    function updateUIFeedbackSystems(answerData) {
        // Trigger update for answer detection system
        if (typeof window.lilacAnswerDetection !== 'undefined') {
            window.lilacAnswerDetection.updateAnswerData(answerData);
        }
        
        // Trigger update for UI feedback system
        if (typeof window.lilacUIFeedback !== 'undefined') {
            window.lilacUIFeedback.updateAnswerData(answerData);
        }
    }
    /**
     * Enhanced function to get correct answer for a specific question
     */
    function getCorrectAnswer(questionId) {
        if (!window.lilacQuizAnswerLoader.isLoaded) {
            console.warn('LILAC: Answers not loaded yet for question:', questionId);
            return null;
        }

        const questionData = window.lilacQuizAnswerLoader.correctAnswers[questionId];
        if (!questionData) {
            console.warn('LILAC: No answer data found for question:', questionId);
            return null;
        }

        return questionData.correct_answer;
    }

    /**
     * Get comprehensive question data
     */
    function getQuestionData(questionId) {
        if (!window.lilacQuizAnswerLoader.isLoaded) {
            return null;
        }
        
        return window.lilacQuizAnswerLoader.correctAnswers[questionId] || null;
    }

    /**
     * Get loading statistics
     */
    function getLoadingStats() {
        return {
            isLoaded: window.lilacQuizAnswerLoader.isLoaded,
            totalQuestions: window.lilacQuizAnswerLoader.totalQuestions,
            loadedQuestions: window.lilacQuizAnswerLoader.loadedQuestions,
            currentQuizId: window.lilacQuizAnswerLoader.currentQuizId
        };
    }

    // Enhanced Public API
    window.lilacQuizAnswerLoader.getCorrectAnswer = getCorrectAnswer;
    window.lilacQuizAnswerLoader.getQuestionData = getQuestionData;
    window.lilacQuizAnswerLoader.getLoadingStats = getLoadingStats;
    window.lilacQuizAnswerLoader.reload = loadCorrectAnswersFromDatabase;
    window.lilacQuizAnswerLoader.detectQuiz = detectCurrentQuiz;

    // Initialize when DOM is ready
    $(document).ready(function() {
        initAnswerLoader();
    });

    // Also try to initialize on window load (fallback)
    $(window).on('load', function() {
        if (!window.lilacQuizAnswerLoader.isLoaded) {
            initAnswerLoader();
        }
    });

    // Retry initialization if LearnDash loads later
    $(document).on('learndash:quiz:loaded', function() {
        if (!window.lilacQuizAnswerLoader.isLoaded) {
            console.log('LILAC: LearnDash quiz loaded, retrying answer loader');
            initAnswerLoader();
        }
    });

})(jQuery);
