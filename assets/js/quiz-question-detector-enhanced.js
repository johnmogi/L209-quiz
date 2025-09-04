/**
 * Quiz Question Detector - ENHANCED VERSION
 * Improved initialization and backend integration
 */

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.quizDetector && window.quizDetector.initialized) {
        return;
    }
    
    // Initialize detector namespace
    window.quizDetector = {
        initialized: false,
        quizId: null,
        postId: null,
        correctAnswers: null,
        allQuestions: [],
        currentQuestionIndex: 0
    };
    
    // Create footer logger
    function createFooterLogger() {
        if (document.getElementById('quiz-detector-log')) {
            return;
        }
        
        const logger = document.createElement('div');
        logger.id = 'quiz-detector-log';
        logger.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 999999;
            border-top: 2px solid #00ff00;
        `;
        
        // Add quiz ID display
        const quizIdDisplay = document.createElement('div');
        quizIdDisplay.id = 'quiz-id-display';
        quizIdDisplay.style.cssText = `
            color: #ffff00;
            font-weight: bold;
            margin-bottom: 5px;
            padding: 5px;
            background: rgba(255, 255, 0, 0.1);
            border: 1px solid #ffff00;
        `;
        quizIdDisplay.textContent = 'QUIZ DETECTOR - Initializing...';
        logger.appendChild(quizIdDisplay);
        
        const logContent = document.createElement('div');
        logContent.id = 'quiz-log-content';
        logger.appendChild(logContent);
        
        document.body.appendChild(logger);
    }
    
    // Log messages to footer
    function logToFooter(message, color = '#00ff00') {
        createFooterLogger();
        const logContent = document.getElementById('quiz-log-content');
        if (!logContent) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.style.color = color;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
        
        // Keep only last 15 entries
        while (logContent.children.length > 15) {
            logContent.removeChild(logContent.firstChild);
        }
    }
    
    // Enhanced Quiz ID detection with multiple methods
    function detectQuizIds() {
        let proQuizId = null;
        let postId = null;
        
        // Method 1: wpProQuiz element ID
        const quizElement = document.querySelector('[id^="wpProQuiz_"]');
        if (quizElement) {
            const match = quizElement.id.match(/wpProQuiz_(\d+)/);
            if (match) {
                proQuizId = parseInt(match[1]);
                logToFooter(`🎯 Found ProQuiz ID from element: ${proQuizId}`, '#00ff00');
            }
        }
        
        // Method 2: Body class for post ID
        const bodyClasses = document.body.className;
        const postIdMatch = bodyClasses.match(/postid-(\d+)/);
        if (postIdMatch) {
            postId = parseInt(postIdMatch[1]);
            logToFooter(`📄 Found Post ID from body class: ${postId}`, '#00ff00');
        }
        
        // Method 3: Check URL for quiz ID
        const urlMatch = window.location.href.match(/quiz[es]*\/.*?(\d+)/);
        if (urlMatch && !proQuizId) {
            proQuizId = parseInt(urlMatch[1]);
            logToFooter(`🔗 Found Quiz ID from URL: ${proQuizId}`, '#00ff00');
        }
        
        // Method 4: Check for quiz data in scripts
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const content = script.textContent || script.innerText;
            if (content.includes('Quiz ID:')) {
                const match = content.match(/Quiz ID:\s*(\d+)/);
                if (match && !proQuizId) {
                    proQuizId = parseInt(match[1]);
                    logToFooter(`📜 Found Quiz ID from script: ${proQuizId}`, '#00ff00');
                    break;
                }
            }
        }
        
        return { proQuizId, postId };
    }
    
    // Fetch ALL quiz data at once
    function fetchAllQuizData(quizId, postId) {
        logToFooter(`🚀 Fetching ALL quiz data for Quiz:${quizId} Post:${postId}`, '#ffff00');
        
        const ajaxUrl = window.ajaxurl || '/wp-admin/admin-ajax.php';
        const formData = new FormData();
        formData.append('action', 'get_quiz_answers');
        formData.append('quiz_id', quizId || postId || '');
        formData.append('nonce', window.lilacQuizNonce || '');
        
        return fetch(ajaxUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            logToFooter(`📡 AJAX Response status: ${response.status}`, response.ok ? '#00ff00' : '#ff9900');
            return response.json();
        })
        .then(data => {
            logToFooter(`📋 AJAX Response: ${JSON.stringify(data).substring(0, 200)}...`, '#00ff00');
            
            if (data.success && data.data) {
                if (data.data.questions && Array.isArray(data.data.questions)) {
                    // Multiple questions response
                    window.quizDetector.allQuestions = data.data.questions;
                    window.quizDetector.quizId = data.data.quiz_id;
                    
                    logToFooter(`✅ Loaded ${data.data.questions.length} questions from database`, '#00ff00');
                    
                    // Create simplified correctAnswers format for compatibility
                    const answers = [];
                    data.data.questions.forEach((question, qIndex) => {
                        question.answers.forEach((answer, aIndex) => {
                            if (answer.correct) {
                                answers.push({
                                    index: aIndex,
                                    text: answer.text,
                                    correct: true,
                                    questionIndex: qIndex,
                                    questionId: question.question_id
                                });
                            }
                        });
                    });
                    
                    window.quizDetector.correctAnswers = { answers: answers };
                    
                    logToFooter(`🎯 Found ${answers.length} correct answers across all questions`, '#00ff00');
                    return data.data;
                } else if (data.data.answers) {
                    // Single question response
                    window.quizDetector.correctAnswers = data.data;
                    logToFooter(`✅ Single question data loaded`, '#00ff00');
                    return data.data;
                }
            } else {
                logToFooter(`❌ No quiz data in response: ${data.data || data.message || 'Unknown error'}`, '#ff9900');
                return null;
            }
        })
        .catch(error => {
            logToFooter(`❌ AJAX error: ${error.message}`, '#ff0000');
            return null;
        });
    }
    
    // Update display with current status
    function updateDisplay() {
        const display = document.getElementById('quiz-id-display');
        if (!display) return;
        
        const ids = detectQuizIds();
        window.quizDetector.quizId = ids.proQuizId;
        window.quizDetector.postId = ids.postId;
        
        let displayText = 'QUIZ DETECTOR - ';
        const parts = [];
        
        if (ids.proQuizId) parts.push(`Quiz:${ids.proQuizId}`);
        if (ids.postId) parts.push(`Post:${ids.postId}`);
        
        if (window.quizDetector.correctAnswers) {
            const answerCount = window.quizDetector.correctAnswers.answers ? 
                window.quizDetector.correctAnswers.answers.length : 0;
            parts.push(`Answers:${answerCount}`);
        }
        
        if (parts.length === 0) {
            displayText += 'No IDs detected';
            display.style.color = '#ff0000';
        } else {
            displayText += parts.join(' | ');
            display.style.color = '#00ff00';
        }
        
        display.textContent = displayText;
    }
    
    // Initialize the enhanced detector
    function init() {
        if (window.quizDetector.initialized) {
            return;
        }
        
        window.quizDetector.initialized = true;
        createFooterLogger();
        
        logToFooter('🚀 Enhanced quiz detector initializing...', '#ffff00');
        
        // Detect IDs immediately
        const ids = detectQuizIds();
        window.quizDetector.quizId = ids.proQuizId;
        window.quizDetector.postId = ids.postId;
        
        updateDisplay();
        
        // Fetch all quiz data if we have an ID
        if (ids.proQuizId || ids.postId) {
            fetchAllQuizData(ids.proQuizId, ids.postId)
                .then(result => {
                    if (result) {
                        updateDisplay();
                        logToFooter('✅ Enhanced quiz detector ready with full data!', '#00ff00');
                    } else {
                        logToFooter('⚠️ Quiz detector ready but no answer data loaded', '#ffaa00');
                    }
                });
        } else {
            logToFooter('⚠️ No quiz IDs detected - will retry on user interaction', '#ffaa00');
        }
        
        // Add interaction listeners for retry
        document.addEventListener('click', (e) => {
            if (e.target.matches('input[type="radio"], input[type="checkbox"], button, .wpProQuiz_button')) {
                setTimeout(() => {
                    if (!window.quizDetector.correctAnswers) {
                        logToFooter('🔄 Retrying quiz data fetch after user interaction...', '#ffff00');
                        const ids = detectQuizIds();
                        if (ids.proQuizId || ids.postId) {
                            fetchAllQuizData(ids.proQuizId, ids.postId)
                                .then(result => {
                                    if (result) {
                                        updateDisplay();
                                        logToFooter('✅ Quiz data loaded after retry!', '#00ff00');
                                    }
                                });
                        }
                    }
                }, 500);
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose methods for debugging
    window.quizDetector.scan = updateDisplay;
    window.quizDetector.detectIds = detectQuizIds;
    window.quizDetector.fetchData = fetchAllQuizData;
    window.quizDetector.refresh = function() {
        window.quizDetector.correctAnswers = null;
        window.quizDetector.allQuestions = [];
        const ids = detectQuizIds();
        if (ids.proQuizId || ids.postId) {
            return fetchAllQuizData(ids.proQuizId, ids.postId);
        }
    };

})();
