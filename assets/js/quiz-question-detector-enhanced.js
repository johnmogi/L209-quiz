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
        currentQuestionIndex: 0,
        loadTime: 0
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
            background: #1a1a1a;
            padding: 5px 10px;
            margin-bottom: 5px;
            border-radius: 3px;
            border: 1px solid #333;
        `;
        quizIdDisplay.innerHTML = '<strong style="color: #ffff00;">LILAC QUIZ DETECTOR - ENHANCED</strong>';
        
        logger.appendChild(quizIdDisplay);
        document.body.appendChild(logger);
        
        return logger;
    }
    
    // Log to footer
    function logToFooter(message, type = 'info') {
        const logger = document.getElementById('quiz-detector-log') || createFooterLogger();
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '#00ff00',
            warn: '#ffff00', 
            error: '#ff0000',
            success: '#00ffff'
        };
        
        const logEntry = document.createElement('div');
        logEntry.style.color = colors[type] || colors.info;
        logEntry.innerHTML = `[${timestamp}] ${message}`;
        
        logger.appendChild(logEntry);
        logger.scrollTop = logger.scrollHeight;
        
        // Keep only last 20 entries
        const entries = logger.querySelectorAll('div:not(#quiz-id-display)');
        if (entries.length > 20) {
            entries[0].remove();
        }
    }
    
    // Detect quiz questions and answers
    function detectQuizData() {
        const startTime = performance.now();
        logToFooter('🔍 Starting quiz detection...', 'info');
        
        // Find quiz container
        const quizContainer = document.querySelector('.wpProQuiz_content, .wpProQuiz_quiz, [id^="wpProQuiz_"]');
        if (!quizContainer) {
            logToFooter('❌ Quiz container not found', 'error');
            return false;
        }
        
        // Extract quiz ID
        const quizIdMatch = quizContainer.id?.match(/wpProQuiz_(\d+)/) || 
                           document.body.className.match(/quiz-(\d+)/) ||
                           window.location.href.match(/quiz[_-]?(\d+)/);
        
        if (quizIdMatch) {
            window.quizDetector.quizId = parseInt(quizIdMatch[1]);
            logToFooter(`📊 Quiz ID detected: ${window.quizDetector.quizId}`, 'success');
        }
        
        // Find all questions
        const questionElements = quizContainer.querySelectorAll('.wpProQuiz_question, .wpProQuiz_listItem, [class*="question"]');
        logToFooter(`📝 Found ${questionElements.length} question elements`, 'info');
        
        const questions = [];
        
        questionElements.forEach((questionEl, index) => {
            const questionText = questionEl.querySelector('.wpProQuiz_question_text, .question-text, h3, h4')?.textContent?.trim() || 
                                questionEl.textContent?.trim()?.substring(0, 100) + '...' ||
                                `Question ${index + 1}`;
            
            // Find answer options
            const answerElements = questionEl.querySelectorAll('.wpProQuiz_questionListItem, .answer-option, input[type="radio"], input[type="checkbox"]');
            const answers = [];
            
            answerElements.forEach((answerEl, ansIndex) => {
                let answerText = '';
                
                // Try different methods to get answer text
                const label = answerEl.closest('label') || answerEl.nextElementSibling;
                if (label && label.textContent) {
                    answerText = label.textContent.trim();
                } else if (answerEl.textContent) {
                    answerText = answerEl.textContent.trim();
                } else {
                    answerText = `Answer ${ansIndex + 1}`;
                }
                
                // For now, mark as unknown - will be determined by AJAX
                answers.push({
                    index: ansIndex,
                    text: answerText,
                    correct: false, // Will be updated by AJAX
                    element: answerEl
                });
            });
            
            if (answers.length > 0) {
                questions.push({
                    index: index,
                    question_id: index + 1,
                    question_text: questionText,
                    answers: answers,
                    element: questionEl
                });
            }
        });
        
        window.quizDetector.allQuestions = questions;
        window.quizDetector.loadTime = performance.now() - startTime;
        window.quizDetector.initialized = true;
        
        logToFooter(`✅ Detection complete: ${questions.length} questions in ${Math.round(window.quizDetector.loadTime)}ms`, 'success');
        logToFooter(`🎯 Total answers found: ${questions.reduce((sum, q) => sum + q.answers.length, 0)}`, 'info');
        
        // Try to load correct answers via AJAX
        loadCorrectAnswers();
        
        return true;
    }
    
    // Load correct answers from backend
    function loadCorrectAnswers() {
        if (!window.quizDetector.quizId) {
            logToFooter('⚠️ No quiz ID available for AJAX request', 'warn');
            return;
        }
        
        logToFooter('📡 Loading correct answers via AJAX...', 'info');
        
        // Simulate AJAX request (replace with actual endpoint)
        const ajaxUrl = '/wp-admin/admin-ajax.php';
        const data = new FormData();
        data.append('action', 'get_quiz_answers');
        data.append('quiz_id', window.quizDetector.quizId);
        
        fetch(ajaxUrl, {
            method: 'POST',
            body: data
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                window.quizDetector.correctAnswers = data.data;
                updateCorrectAnswers(data.data);
                logToFooter('✅ Correct answers loaded successfully', 'success');
            } else {
                logToFooter('⚠️ AJAX response received but no valid data', 'warn');
            }
        })
        .catch(error => {
            logToFooter(`❌ AJAX failed: ${error.message}`, 'error');
            // Fallback: try to detect from existing page data
            detectCorrectAnswersFromPage();
        });
    }
    
    // Update questions with correct answer information
    function updateCorrectAnswers(correctData) {
        if (!correctData || !window.quizDetector.allQuestions) return;
        
        window.quizDetector.allQuestions.forEach((question, qIndex) => {
            const correctInfo = correctData[qIndex] || correctData[question.question_id];
            if (correctInfo && correctInfo.correct_answers) {
                question.answers.forEach((answer, aIndex) => {
                    answer.correct = correctInfo.correct_answers.includes(aIndex);
                });
            }
        });
        
        const totalCorrect = window.quizDetector.allQuestions.reduce((sum, q) => 
            sum + q.answers.filter(a => a.correct).length, 0);
        
        logToFooter(`🎯 Updated ${totalCorrect} correct answers`, 'success');
    }
    
    // Fallback: try to detect correct answers from page elements
    function detectCorrectAnswersFromPage() {
        logToFooter('🔍 Attempting fallback correct answer detection...', 'info');
        
        // Look for hidden elements or data attributes that might contain answers
        const hiddenAnswers = document.querySelectorAll('[data-correct], [data-answer], .correct-answer');
        if (hiddenAnswers.length > 0) {
            logToFooter(`📋 Found ${hiddenAnswers.length} potential correct answer indicators`, 'info');
        }
        
        // This would need to be customized based on the specific quiz implementation
        logToFooter('⚠️ Fallback detection not implemented for this quiz type', 'warn');
    }
    
    // Initialize detection
    function initDetection() {
        logToFooter('🚀 Initializing Quiz Detector Enhanced...', 'info');
        
        // Wait for quiz to be ready
        const checkReady = () => {
            const quizContainer = document.querySelector('.wpProQuiz_content, .wpProQuiz_quiz, [id^="wpProQuiz_"]');
            if (quizContainer) {
                detectQuizData();
            } else {
                logToFooter('⏳ Waiting for quiz to load...', 'warn');
                setTimeout(checkReady, 1000);
            }
        };
        
        checkReady();
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDetection);
    } else {
        initDetection();
    }
    
    // Also try after a delay to catch dynamically loaded content
    setTimeout(initDetection, 2000);
    
})();
