/**
 * Quiz Question Detector - Higher Order Injection System
 * Identifies current question and logs answers to footer
 * Failsafe injection that works regardless of other JS files
 */

(function() {
    'use strict';
    
    console.log('🔍 QUIZ QUESTION DETECTOR - INITIALIZING');
    
    // Global state
    window.quizDetector = {
        quizId: null,
        currentQuestion: null,
        currentAnswers: [],
        questionHistory: [],
        initialized: false
    };
    
    // Create footer logger
    function createFooterLogger() {
        // Remove existing logger
        const existing = document.getElementById('quiz-question-logger');
        if (existing) existing.remove();
        
        const logger = document.createElement('div');
        logger.id = 'quiz-question-logger';
        logger.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 50, 100, 0.95);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            z-index: 99999;
            max-height: 250px;
            overflow-y: auto;
            border-top: 2px solid #00ff00;
            direction: ltr;
            text-align: left;
        `;
        
        logger.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: #ffff00;">🔍 QUIZ QUESTION DETECTOR - Quiz ID: <span id="quiz-id-display">Unknown</span></strong>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #ff0000; color: white; border: none; padding: 2px 8px; cursor: pointer;">×</button>
            </div>
            <div id="question-log-content">Scanning for questions...</div>
        `;
        
        document.body.appendChild(logger);
        return logger;
    }
    
    // Log to footer
    function logToFooter(message, type = 'info') {
        const logger = document.getElementById('quiz-question-logger') || createFooterLogger();
        const content = document.getElementById('question-log-content');
        
        const colors = {
            info: '#00ff00',
            question: '#ffff00', 
            answer: '#00ffff',
            correct: '#00ff00',
            error: '#ff0000'
        };
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.style.color = colors[type] || '#ffffff';
        logEntry.style.marginBottom = '2px';
        logEntry.innerHTML = `[${timestamp}] ${message}`;
        
        content.appendChild(logEntry);
        content.scrollTop = content.scrollHeight;
        
        // Keep only last 20 entries
        while (content.children.length > 20) {
            content.removeChild(content.firstChild);
        }
    }
    
    // Detect individual question ID from current question
    function detectQuestionId() {
        const result = {
            questionId: null,
            questionProId: null,
            questionPostId: null,
            questionText: null
        };
        
        // Method 1: Look for question data attributes
        const questionElement = document.querySelector('[data-question-id], [data-question-meta]');
        if (questionElement) {
            if (questionElement.dataset.questionId) {
                result.questionId = questionElement.dataset.questionId;
            }
            if (questionElement.dataset.questionMeta) {
                try {
                    const meta = JSON.parse(questionElement.dataset.questionMeta.replace(/&quot;/g, '"'));
                    if (meta.question_pro_id) result.questionProId = meta.question_pro_id;
                    if (meta.question_post_id) result.questionPostId = meta.question_post_id;
                } catch (e) {
                    console.log('Failed to parse question meta:', e);
                }
            }
        }
        
        // Method 2: Extract from form inputs
        const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
        for (const input of hiddenInputs) {
            if (input.name && input.name.includes('question') && input.value) {
                const match = input.value.match(/(\d+)/);
                if (match && !result.questionId) {
                    result.questionId = parseInt(match[1]);
                }
            }
        }
        
        // Method 3: Extract from URL or page context
        const url = window.location.href;
        const urlMatch = url.match(/question[_-]?(\d+)/i);
        if (urlMatch && !result.questionId) {
            result.questionId = parseInt(urlMatch[1]);
        }
        
        // Method 4: Get current question text for identification
        const questionTextElement = document.querySelector('.wpProQuiz_question_text, .question-text, [class*="question"] h3, [class*="question"] p');
        if (questionTextElement) {
            result.questionText = questionTextElement.textContent.trim().substring(0, 100);
        }
        
        return result;
    }

    // Detect quiz IDs from various sources
    function detectQuizIds() {
        const result = {
            proQuizId: null,
            learnDashId: null,
            questionProId: null,
            questionPostId: null
        };
        
        // Look for wpProQuiz_content with ID pattern
        const quizContent = document.querySelector('[id^="wpProQuiz_"]');
        if (quizContent) {
            const match = quizContent.id.match(/wpProQuiz_(\d+)/);
            if (match) {
                result.proQuizId = parseInt(match[1]);
            }
            
            // Check for data-quiz-meta attribute
            const quizMeta = quizContent.getAttribute('data-quiz-meta');
            if (quizMeta) {
                try {
                    const metaData = JSON.parse(quizMeta.replace(/&quot;/g, '"'));
                    if (metaData.quiz_pro_id) result.proQuizId = metaData.quiz_pro_id;
                    if (metaData.quiz_post_id) result.learnDashId = metaData.quiz_post_id;
                } catch (e) {
                    console.log('Failed to parse quiz meta:', e);
                }
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
    
    // Question ID detection
    function detectQuestionId() {
        let proQuizId = null;
        let postQuestionId = null;
        
        // Look for current visible question
        const currentQuestion = document.querySelector('.wpProQuiz_listItem:not([style*="display: none"])');
        if (currentQuestion) {
            proQuizId = currentQuestion.dataset.questionId || currentQuestion.dataset.pos;
        }
        
        // Look for question post ID in scripts
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
    
    // Fetch correct answers via AJAX (only once per question)
    function fetchCorrectAnswers(quizId, questionId) {
        const questionKey = `${quizId}-${questionId}`;
        
        if (window.quizDetector.processedQuestions.has(questionKey)) {
            return Promise.resolve(null);
        }
        
        window.quizDetector.processedQuestions.add(questionKey);
        
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
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                logToFooter(`✅ Correct answers: ${JSON.stringify(data.data)}`, '#00ff00');
                window.quizDetector.correctAnswers = data.data;
                return data.data;
            } else {
                logToFooter(`❌ No answers found: ${data.data || 'Question not in database'}`, '#ff9900');
                return null;
            }
        })
        .catch(error => {
            logToFooter(`❌ AJAX error: ${error.message}`, '#ff0000');
            return null;
        });
    }
    
    // Update quiz ID display
    function updateDisplay() {
        const display = document.getElementById('quiz-id-display');
        if (!display) return;
        ];
        
        let currentQuestion = null;
        
        for (const selector of questionSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                // Find the visible/active question
                for (const element of elements) {
                    if (element.offsetParent !== null && 
                        getComputedStyle(element).display !== 'none' && 
                        getComputedStyle(element).visibility !== 'hidden') { // Check if visible
                        currentQuestion = element;
                        break;
                    }
                }
                if (currentQuestion) break;
            }
        }
        
        return currentQuestion;
    }
    
    // Extract question text
    function extractQuestionText(questionElement) {
        const textSelectors = [
            '.wpProQuiz_question_text',
            '.question-text',
            '.quiz-question-text',
            'h3', 'h4', 'p'
        ];
        
        for (const selector of textSelectors) {
            const textElement = questionElement.querySelector(selector);
            if (textElement && textElement.textContent.trim()) {
                return textElement.textContent.trim();
            }
        }
        
        // Fallback: get first meaningful text
        const allText = questionElement.textContent.trim();
        const lines = allText.split('\n').filter(line => line.trim().length > 10);
        return lines[0] || 'Question text not found';
    }
    
    // Extract answers
    function extractAnswers(questionElement) {
        const answers = [];
        
        // Try different answer selectors
        const answerSelectors = [
            '.wpProQuiz_questionListItem',
            '.quiz-answer',
            '.answer-option',
            'label[for*="answer"]',
            'input[type="radio"] + label',
            'input[type="checkbox"] + label'
        ];
        
        for (const selector of answerSelectors) {
            const answerElements = questionElement.querySelectorAll(selector);
            if (answerElements.length > 0) {
                answerElements.forEach((element, index) => {
                    const text = element.textContent.trim();
                    const input = element.querySelector('input') || element.previousElementSibling;
                    const isSelected = input && input.checked;
                    
                    if (text && text.length > 2) {
                        answers.push({
                            index: index + 1,
                            text: text,
                            selected: isSelected,
                            element: element
                        });
                    }
                });
                break; // Use first successful selector
            }
        }
        
        return answers;
    }
    
    // Main scan function
    function scanAndLog() {
        // Detect and update quiz IDs
        const quizIds = detectQuizIds();
        updateQuizIdDisplay(quizIds);
        
        // Log detected IDs
        const detectedIds = [];
        if (quizIds.proQuizId) detectedIds.push(`ProQuiz: ${quizIds.proQuizId}`);
        if (quizIds.learnDashId) detectedIds.push(`LearnDash: ${quizIds.learnDashId}`);
        if (quizIds.questionProId) detectedIds.push(`Question: ${quizIds.questionProId}`);
        if (quizIds.questionPostId) detectedIds.push(`QPost: ${quizIds.questionPostId}`);
        
        if (detectedIds.length > 0) {
            logToFooter(`🆔 IDs detected: ${detectedIds.join(', ')}`, '#00ff00');
        }
        
        const question = detectCurrentQuestion();
        
        if (question) {
            const questionText = extractQuestionText(question);
            const answers = extractAnswers(question);
            
            logToFooter(`📝 Question: ${questionText}`, '#00ff00');
            
            if (answers.length > 0) {
                answers.forEach((answer, index) => {
                    logToFooter(`   ${index + 1}. ${answer}`, '#ffffff');
                });
            } else {
                logToFooter('   No answers detected', '#ff9900');
            }
        } else {
            logToFooter('No visible question found', '#ff0000');
        }
    }
    
    // Scan current question and answers
    function scanQuestion() {
        const currentQuestion = detectCurrentQuestion();
        const quizIds = detectQuizIds();
        const questionIds = detectQuestionId();
        
        updateQuizIdDisplay(quizIds);
        
        // Log question ID information and attempt to pre-fetch answers
        if (questionIds.questionId || questionIds.questionProId || questionIds.questionPostId) {
            let idInfo = '';
            if (questionIds.questionId) idInfo += `Q:${questionIds.questionId} `;
            if (questionIds.questionProId) idInfo += `ProQ:${questionIds.questionProId} `;
            if (questionIds.questionPostId) idInfo += `PostQ:${questionIds.questionPostId}`;
            logToFooter(`🆔 Question IDs: ${idInfo.trim()}`, '#00ff00');
            
            // Attempt to pre-fetch correct answers
            const primaryQuestionId = questionIds.questionId || questionIds.questionProId;
            const primaryQuizId = quizIds.proQuizId || quizIds.learnDashId;
            
            if (primaryQuestionId && primaryQuizId) {
                fetchCorrectAnswers(primaryQuizId, primaryQuestionId, questionIds.questionText)
                    .then(correctAnswers => {
                        if (correctAnswers) {
                            window.quizDetector.correctAnswers = correctAnswers;
                            logToFooter(`📋 Correct answers cached for Q:${primaryQuestionId}`, '#00ff00');
            
    // Scan for current question and answers with loop prevention
    function scanQuestion() {
        // Prevent excessive scanning
        if (window.quizDetector.disabled || window.quizDetector.scanCount > 20) {
            return;
        }
        
        window.quizDetector.scanCount = (window.quizDetector.scanCount || 0) + 1;
        
        const quizIds = detectQuizIds();
        updateQuizIdDisplay(quizIds);
        
        const questionId = detectQuestionId();
        
        // Only fetch answers once per question to prevent loops
        const questionKey = `${questionId.proQuizId}-${questionId.postQuestionId}`;
        if (questionId.proQuizId || questionId.postQuestionId) {
            if (!window.quizDetector.processedQuestions) {
                window.quizDetector.processedQuestions = new Set();
            }
            
            if (!window.quizDetector.processedQuestions.has(questionKey)) {
                window.quizDetector.processedQuestions.add(questionKey);
                logToFooter(`Question IDs: ProQ:${questionId.proQuizId || 'N/A'} PostQ:${questionId.postQuestionId || 'N/A'}`, '#00ff00');
                
                // Try to fetch answers for this question (only once)
                fetchCorrectAnswers(questionId.proQuizId, questionId.postQuestionId);
            }
        }
        
        // Find current question text (limit frequency)
        if (window.quizDetector.scanCount % 5 === 1) { // Only every 5th scan
            const questionSelectors = [
                '.wpProQuiz_question_text',
                '.wpProQuiz_listItem .wpProQuiz_question',
                '[class*="question"] .wpProQuiz_question_text',
                '.ld-quiz-question .wpProQuiz_question_text'
            ];
            
            let questionElement = null;
            for (const selector of questionSelectors) {
                questionElement = document.querySelector(selector);
                if (questionElement) break;
            }
            
            if (questionElement) {
                const questionText = questionElement.textContent.trim();
                logToFooter(`📝 Question: ${questionText.substring(0, 100)}...`, '#ffffff');
                
                // Find answers
                const answers = findAnswers();
                logToFooter(`📊 Found ${answers.length} answers`, '#00ff00');
                
                answers.forEach(answer => {
                    const status = answer.selected ? ' [SELECTED]' : '';
                    logToFooter(`  ${answer.index}. ${answer.text}${status}`, 'answer');
                });
            }
        }
    }
    
    // Start monitoring with strict limits
    function startMonitoring() {
        // Prevent multiple monitoring setups
        if (window.quizDetector.monitoring) {
            return;
        }
        window.quizDetector.monitoring = true;
        
        // Initial scan
        scanQuestion();
        
        // Set up periodic scanning with strict limit
        let scanCount = 0;
        const maxScans = 10; // Very limited
        
        const scanInterval = setInterval(() => {
            scanCount++;
            if (scanCount >= maxScans) {
                clearInterval(scanInterval);
                logToFooter('⚠️ Scan limit reached - stopping periodic scans', '#ff9900');
                return;
            }
            scanQuestion();
        }, 5000); // Much longer interval
        
        // Set up mutation observer with throttling
        let mutationTimeout = null;
        const observer = new MutationObserver((mutations) => {
            if (mutationTimeout) return; // Throttle mutations
            
            mutationTimeout = setTimeout(() => {
                scanQuestion();
                mutationTimeout = null;
            }, 500);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false // Reduced attribute monitoring
        });
        
        // Monitor clicks with throttling
        let clickTimeout = null;
        document.addEventListener('click', (e) => {
            if (e.target.matches('input[type="radio"], input[type="checkbox"], label')) {
                if (clickTimeout) return;
                clickTimeout = setTimeout(() => {
                    scanQuestion();
                    clickTimeout = null;
                }, 200);
            }
        });
    }
    
    // Initialize with retry mechanism
    function initWithRetry(attempts = 0) {
        const maxAttempts = 3; // Reduced to prevent loops
        
        // Prevent multiple initializations
        if (window.quizDetector.initialized) {
            return;
        }
        
        const quizContent = document.querySelector('[id^="wpProQuiz_"]');
        
        if (attempts >= maxAttempts) {
            // Force initialization even without quiz content
            startMonitoring();
            
            // Force initial quiz ID detection with fallback
            const quizIds = detectQuizIds();
            updateQuizIdDisplay(quizIds);
            
            logToFooter('🔍 Quiz detector initialized (max attempts)', '#ffff00');
            window.quizDetector.initialized = true;
            return;
        }
        
        if (quizContent || attempts === 0) {
            startMonitoring();
            
            // Force initial quiz ID detection
            const quizIds = detectQuizIds();
            updateQuizIdDisplay(quizIds);
            if (quizIds.proQuizId || quizIds.learnDashId) {
                logToFooter(`🆔 Initial IDs detected: ProQuiz:${quizIds.proQuizId || 'N/A'} | LearnDash:${quizIds.learnDashId || 'N/A'}`, '#00ff00');
            }
            
            logToFooter('🔍 Quiz detector initialized successfully', '#00ff00');
            window.quizDetector.initialized = true;
        } else {
            logToFooter(`⏳ Waiting for quiz content... (attempt ${attempts + 1}/${maxAttempts})`, '#ffff00');
            setTimeout(() => initWithRetry(attempts + 1), 1000);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWithRetry);
    } else {
        initWithRetry();
    }

    // Pre-fetch correct answers for current question
    async function fetchCorrectAnswers(quizId, questionId, questionText) {
        try {
            const response = await fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'lilac_get_correct_answers',
                    quiz_id: quizId,
                    question_id: questionId,
                    question_text: questionText,
                    nonce: window.lilacQuizNonce || ''
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    logToFooter(`✅ Pre-fetched answers for Q:${questionId}`, '#00ff00');
                    return data.data;
                } else {
                    logToFooter(`❌ Failed to fetch answers: ${data.data}`, '#ff9900');
                }
            }
        } catch (error) {
            logToFooter(`❌ Answer fetch error: ${error.message}`, '#ff0000');
        }
        return null;
    }

    // Expose global functions for console testing
    window.quizDetector.scan = scanQuestion;
    window.quizDetector.log = logToFooter;
    window.quizDetector.getHistory = () => window.quizDetector.questionHistory;
    window.quizDetector.detectIds = detectQuizIds;
    window.quizDetector.detectQuestionId = detectQuestionId;
    window.quizDetector.fetchAnswers = fetchCorrectAnswers;
    
})();
