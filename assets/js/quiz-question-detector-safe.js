/**
 * Quiz Question Detector - SAFE VERSION
 * Shows quiz/question detection and answer verification without loops
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
        processedQuestions: new Set(),
        correctAnswers: null
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
        quizIdDisplay.textContent = 'QUIZ DETECTOR - Loading...';
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
        
        // Keep only last 20 entries
        while (logContent.children.length > 20) {
            logContent.removeChild(logContent.firstChild);
        }
    }
    
    // Quiz ID detection
    function detectQuizIds() {
        let proQuizId = null;
        let learnDashId = null;
        
        // Method 1: wpProQuiz element ID
        const quizElement = document.querySelector('[id^="wpProQuiz_"]');
        if (quizElement) {
            const match = quizElement.id.match(/wpProQuiz_(\d+)/);
            if (match) {
                proQuizId = parseInt(match[1]);
            }
        }
        
        // Method 2: Body class for post ID
        const bodyClasses = document.body.className;
        const postIdMatch = bodyClasses.match(/postid-(\d+)/);
        if (postIdMatch) {
            learnDashId = parseInt(postIdMatch[1]);
        }
        
        return { proQuizId, learnDashId };
    }
    
    // Enhanced question ID detection
    function detectQuestionId() {
        let proQuizId = null;
        let postQuestionId = null;
        
        // Method 1: Look for wpProQuiz_questionList with data-question_id
        const questionList = document.querySelector('.wpProQuiz_questionList[data-question_id]');
        if (questionList) {
            proQuizId = parseInt(questionList.dataset.question_id);
            logToFooter(`🎯 Found question ID in questionList: ${proQuizId}`, '#00ff00');
        }
        
        // Method 2: Look for current visible question element
        if (!proQuizId) {
            const currentQuestion = document.querySelector('.wpProQuiz_listItem:not([style*="display: none"])');
            if (currentQuestion) {
                proQuizId = currentQuestion.dataset.questionId || currentQuestion.dataset.pos;
            }
        }
        
        // Method 3: Look for question input names (question_101_1657)
        if (!proQuizId) {
            const questionInput = document.querySelector('input[name*="question_"]');
            if (questionInput) {
                const nameMatch = questionInput.name.match(/question_\d+_(\d+)/);
                if (nameMatch) {
                    proQuizId = parseInt(nameMatch[1]);
                    logToFooter(`🎯 Found question ID in input name: ${proQuizId}`, '#00ff00');
                }
            }
        }
        
        // Method 4: Look for question post ID in scripts
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const content = script.textContent || script.innerText;
            const postMatch = content.match(/question[_-]?post[_-]?id['":\s]*(\d+)/i);
            if (postMatch) {
                postQuestionId = parseInt(postMatch[1]);
                break;
            }
        }
        
        return {
            proQuizId: proQuizId ? parseInt(proQuizId) : null,
            postQuestionId
        };
    }
    
    // Enhanced answer fetching with multiple methods
    function fetchCorrectAnswers(quizId, questionId) {
        const questionKey = `${quizId}-${questionId}`;
        
        if (window.quizDetector.processedQuestions.has(questionKey)) {
            return Promise.resolve(null);
        }
        
        window.quizDetector.processedQuestions.add(questionKey);
        
        logToFooter(`🔍 Fetching answers for Quiz:${quizId} Question:${questionId}`, '#ffff00');
        
        // Method 1: Try our custom AJAX endpoint
        const ajaxUrl = window.ajaxurl || '/wp-admin/admin-ajax.php';
        const formData = new FormData();
        formData.append('action', 'get_quiz_answers');
        formData.append('quiz_id', quizId || '');
        formData.append('question_id', questionId || '');
        formData.append('nonce', window.quiz_nonce || '');
        
        return fetch(ajaxUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            logToFooter(`📡 AJAX Response status: ${response.status}`, '#00ff00');
            return response.json();
        })
        .then(data => {
            logToFooter(`📋 AJAX Response data: ${JSON.stringify(data)}`, '#00ff00');
            
            if (data.success && data.data) {
                logToFooter(`✅ Correct answers found: ${JSON.stringify(data.data)}`, '#00ff00');
                window.quizDetector.correctAnswers = data.data;
                
                // Display answer array in debugger
                if (Array.isArray(data.data)) {
                    data.data.forEach((answer, index) => {
                        logToFooter(`  Answer ${index + 1}: ${answer.text} (Correct: ${answer.correct})`, '#ffffff');
                    });
                }
                
                return data.data;
            } else {
                logToFooter(`❌ No answers in response: ${data.data || data.message || 'Unknown error'}`, '#ff9900');
                
                // Method 2: Try direct database query if AJAX fails
                return tryDirectDatabaseQuery(quizId, questionId);
            }
        })
        .catch(error => {
            logToFooter(`❌ AJAX error: ${error.message}`, '#ff0000');
            
            // Method 2: Try direct database query if AJAX fails
            return tryDirectDatabaseQuery(quizId, questionId);
        });
    }
    
    // Try direct database query as fallback
    function tryDirectDatabaseQuery(quizId, questionId) {
        logToFooter(`🔄 Trying direct database query for Q:${questionId}`, '#ffff00');
        
        // Try alternative endpoint
        const formData = new FormData();
        formData.append('action', 'lilac_get_question_answers');
        formData.append('question_id', questionId);
        
        return fetch('/wp-admin/admin-ajax.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                logToFooter(`✅ Direct query success: ${JSON.stringify(data.data)}`, '#00ff00');
                return data.data;
            } else {
                logToFooter(`❌ Direct query failed: ${data.data || 'No data'}`, '#ff9900');
                return null;
            }
        })
        .catch(error => {
            logToFooter(`❌ Direct query error: ${error.message}`, '#ff0000');
            return null;
        });
    }
    
    // Update quiz ID display
    function updateDisplay() {
        const display = document.getElementById('quiz-id-display');
        if (!display) return;
        
        const quizIds = detectQuizIds();
        const questionIds = detectQuestionId();
        
        let displayText = 'QUIZ DETECTOR - ';
        const parts = [];
        
        if (quizIds.proQuizId) parts.push(`Quiz:${quizIds.proQuizId}`);
        if (quizIds.learnDashId) parts.push(`Post:${quizIds.learnDashId}`);
        if (questionIds.proQuizId) parts.push(`Q:${questionIds.proQuizId}`);
        if (questionIds.postQuestionId) parts.push(`QPost:${questionIds.postQuestionId}`);
        
        if (parts.length === 0) {
            displayText += 'No IDs detected';
            display.style.color = '#ff0000';
        } else {
            displayText += parts.join(' | ');
            display.style.color = '#00ff00';
            
            // Try to fetch answers for new questions
            if (questionIds.proQuizId || questionIds.postQuestionId) {
                fetchCorrectAnswers(quizIds.proQuizId || quizIds.learnDashId, questionIds.proQuizId || questionIds.postQuestionId);
            }
        }
        
        display.textContent = displayText;
    }
    
    // Manual scan function (call when needed)
    function manualScan() {
        logToFooter('🔍 Manual scan triggered', '#ffff00');
        updateDisplay();
    }
    
    // Initialize
    function init() {
        if (window.quizDetector.initialized) {
            return;
        }
        
        window.quizDetector.initialized = true;
        createFooterLogger();
        
        // Initial scan
        updateDisplay();
        logToFooter('🔍 Safe quiz detector initialized', '#00ff00');
        
        // Add click listener for manual scanning
        document.addEventListener('click', (e) => {
            if (e.target.matches('input[type="radio"], input[type="checkbox"], button, .wpProQuiz_button')) {
                setTimeout(manualScan, 500); // Delay to let DOM update
            }
        });
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose methods for manual testing
    window.quizDetector.scan = manualScan;
    window.quizDetector.detectIds = detectQuizIds;
    window.quizDetector.detectQuestionId = detectQuestionId;
    window.quizDetector.fetchAnswers = fetchCorrectAnswers;

})();
