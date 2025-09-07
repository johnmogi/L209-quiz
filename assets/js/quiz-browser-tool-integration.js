/**
 * Quiz Browser Tool Integration - REBUILT
 * Brings the reliable Quiz Browser Tool data directly into the frontend
 */

// Use immediate function to avoid jQuery dependency issues
(function() {
    'use strict';
    
    console.log('🧪 QUIZ BROWSER TOOL INTEGRATION: Starting REBUILT version...');
    console.log('🧪 jQuery available:', typeof jQuery !== 'undefined');
    console.log('🧪 Document ready state:', document.readyState);
    
    // Global state
    window.quizBrowserToolIntegration = {
        initialized: false,
        questions: {},
        currentQuizId: null,
        debugMode: true
    };
    
    const integration = window.quizBrowserToolIntegration;
    
    /**
     * Initialize Quiz Browser Tool Integration
     */
    function initializeIntegration() {
        console.log('🚀 QUIZ BROWSER TOOL: Initializing integration...');
        
        try {
            // Get current quiz ID
            integration.currentQuizId = getCurrentQuizId();
            console.log('🔍 QUIZ BROWSER TOOL: Quiz ID detection result:', integration.currentQuizId);
            
            if (!integration.currentQuizId) {
                console.error('❌ QUIZ BROWSER TOOL: No quiz ID found');
                console.log('🔍 Debug info - window.post_id:', window.post_id);
                console.log('🔍 Debug info - body className:', document.body.className);
                console.log('🔍 Debug info - URL:', window.location.href);
                return;
            }
            
            console.log('🆔 QUIZ BROWSER TOOL: Quiz ID:', integration.currentQuizId);
            
            // Create integration panel first
            createIntegrationPanel();
            console.log('🎨 QUIZ BROWSER TOOL: Panel created');
            
            // Load questions using the same method as quiz-browser-tool.php
            loadQuestionsFromDatabase();
            console.log('📊 QUIZ BROWSER TOOL: Loading questions...');
            
            // Monitor quiz interactions
            monitorQuizInteractions();
            console.log('👁️ QUIZ BROWSER TOOL: Monitoring setup');
            
            integration.initialized = true;
            console.log('✅ QUIZ BROWSER TOOL: Integration ready');
            
        } catch (error) {
            console.error('❌ QUIZ BROWSER TOOL: Initialization error:', error);
            console.error('❌ Stack trace:', error.stack);
        }
    }
    
    /**
     * Get current quiz ID using same logic as quiz-browser-tool.php
     */
    function getCurrentQuizId() {
        // Try multiple methods
        let quizId = null;
        
        // From post ID (most reliable)
        if (typeof window.post_id !== 'undefined') {
            quizId = window.post_id;
        }
        
        // From body class
        if (!quizId) {
            const bodyClass = document.body.className;
            const classMatch = bodyClass.match(/postid-(\d+)/);
            if (classMatch) quizId = classMatch[1];
        }
        
        // From URL
        if (!quizId) {
            const urlMatch = window.location.href.match(/quiz[_-]?id[=\/](\d+)/i);
            if (urlMatch) quizId = urlMatch[1];
        }
        
        return quizId;
    }
    
    /**
     * Load questions using the exact same database query as quiz-browser-tool.php
     */
    function loadQuestionsFromDatabase() {
        console.log('📊 QUIZ BROWSER TOOL: Loading questions from database...');
        
        // Use direct API call (skip AJAX since it's failing)
        loadQuestionsDirectly();
    }
    
    /**
     * Fallback: Load questions directly using the same PHP logic
     */
    function loadQuestionsDirectly() {
        console.log('🔄 QUIZ BROWSER TOOL: Loading questions directly...');
        
        // Create a direct request to our PHP endpoint
        const url = `/quiz-browser-tool-api.php?quiz_id=${integration.currentQuizId}`;
        console.log('🔗 QUIZ BROWSER TOOL: API URL:', url);
        
        updateIntegrationStatus('🔄 Loading questions from database...');
        
        fetch(url)
            .then(response => {
                console.log('📡 QUIZ BROWSER TOOL: API Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('📊 QUIZ BROWSER TOOL: API Response data:', data);
                if (data.success) {
                    console.log('✅ QUIZ BROWSER TOOL: Questions loaded successfully:', data.count);
                    processQuestionData(data.questions);
                } else {
                    console.error('❌ QUIZ BROWSER TOOL: Direct load failed:', data.message);
                    updateIntegrationStatus(`❌ Failed to load: ${data.message}`);
                }
            })
            .catch(error => {
                console.error('❌ QUIZ BROWSER TOOL: Database error:', error);
                updateIntegrationStatus(`❌ Database error: ${error.message}`);
            });
    }
    
    /**
     * Process question data using the same parsing logic as quiz-browser-tool.php
     */
    function processQuestionData(questions) {
        console.log('🔍 QUIZ BROWSER TOOL: Processing', questions.length, 'questions...');
        
        questions.forEach(q => {
            const answers = parseAnswers(q.answer_data);
            const correctAnswers = answers.filter(a => a.correct);
            
            integration.questions[q.question_id] = {
                id: q.question_id,
                quiz_id: q.quiz_id,
                text: cleanQuestionText(q.question),
                answers: answers,
                correctAnswers: correctAnswers,
                correctIndex: correctAnswers.length > 0 ? answers.findIndex(a => a.correct) : -1
            };
        });
        
        console.log('✅ QUIZ BROWSER TOOL: Processed', Object.keys(integration.questions).length, 'questions');
        updateIntegrationPanel();
        
        // Apply correct validation to existing questions
        applyCorrectValidation();
    }
    
    /**
     * Parse answers using the exact same logic as quiz-browser-tool.php
     */
    function parseAnswers(rawData) {
        const answers = [];
        
        if (!rawData) return answers;
        
        // Extract answers with proper encoding (same regex as PHP)
        const answerMatches = rawData.match(/s:\d+:"\x00\*\x00_answer";s:(\d+):"([^"]*)"/g);
        const correctMatches = rawData.match(/s:\d+:"\x00\*\x00_correct";b:([01])/g);
        
        if (answerMatches) {
            answerMatches.forEach((match, i) => {
                const answerMatch = match.match(/s:\d+:"([^"]*)"/);
                if (answerMatch) {
                    const answerText = answerMatch[1].trim();
                    const isCorrect = correctMatches && correctMatches[i] && correctMatches[i].includes('b:1');
                    
                    if (answerText) {
                        answers.push({
                            letter: String.fromCharCode(65 + i), // A, B, C, D
                            text: answerText,
                            correct: isCorrect,
                            index: i
                        });
                    }
                }
            });
        }
        
        return answers;
    }
    
    /**
     * Clean question text using the same logic as quiz-browser-tool.php
     */
    function cleanQuestionText(questionText) {
        if (!questionText || !questionText.trim()) {
            return "[Question text not available]";
        }
        
        // Remove HTML tags and clean up
        const cleaned = questionText.replace(/<[^>]*>/g, '').trim();
        return cleaned || "[Question text not available]";
    }
    
    /**
     * Create integration panel showing Quiz Browser Tool data
     */
    function createIntegrationPanel() {
        console.log('🎨 QUIZ BROWSER TOOL: Creating integration panel...');
        
        // Create panel with vanilla JS to avoid jQuery dependency
        const panel = document.createElement('div');
        panel.id = 'quiz-browser-integration-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 99999;
            font-family: Arial, sans-serif;
            font-size: 12px;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 14px;">🧪 Quiz Browser Tool</h3>
                <button id="integration-toggle" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Hide</button>
            </div>
            <div id="integration-content">
                <div id="integration-status">Loading questions...</div>
                <div id="integration-current-question" style="margin-top: 10px;"></div>
                <div id="integration-validation" style="margin-top: 10px;"></div>
                <div id="integration-actions" style="margin-top: 10px;">
                    <button id="integration-show-correct" style="background: #27ae60; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Show Correct</button>
                    <button id="integration-validate" style="background: #f39c12; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Validate</button>
                    <button id="integration-refresh" style="background: #3498db; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Refresh</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Panel interactions with vanilla JS
        const toggleBtn = document.getElementById('integration-toggle');
        const content = document.getElementById('integration-content');
        
        toggleBtn.addEventListener('click', function() {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                this.textContent = 'Hide';
            } else {
                content.style.display = 'none';
                this.textContent = 'Show';
            }
        });
        
        document.getElementById('integration-show-correct').addEventListener('click', showAllCorrectAnswers);
        document.getElementById('integration-validate').addEventListener('click', validateCurrentQuestion);
        document.getElementById('integration-refresh').addEventListener('click', refreshIntegration);
        
        console.log('🎨 QUIZ BROWSER TOOL: Integration panel created successfully');
    }
    
    /**
     * Monitor quiz interactions
     */
    function monitorQuizInteractions() {
        console.log('👁️ QUIZ BROWSER TOOL: Setting up interaction monitoring...');
        
        // Monitor answer selections with vanilla JS
        document.addEventListener('change', function(event) {
            const target = event.target;
            if (target.type === 'radio' || target.type === 'checkbox') {
                const questionElement = target.closest('.wpProQuiz_listItem');
                if (questionElement) {
                    const questionId = getQuestionIdFromElement(questionElement);
                    console.log('🎯 QUIZ BROWSER TOOL: Answer selected for question:', questionId);
                    
                    setTimeout(() => {
                        validateQuestionWithBrowserToolData(questionElement, questionId);
                    }, 100);
                }
            }
        });
    }
    
    /**
     * Get question ID from element
     */
    function getQuestionIdFromElement(element) {
        const inputs = element.querySelectorAll('input[type="radio"]');
        if (inputs.length > 0) {
            const inputName = inputs[0].name;
            const match = inputName.match(/question_(\d+)/);
            if (match) {
                return match[1];
            }
        }
        return null;
    }
    
    /**
     * Validate question using Quiz Browser Tool data
     */
    function validateQuestionWithBrowserToolData(questionElement, questionId) {
        if (!questionId || !integration.questions[questionId]) {
            console.log('⚠️ QUIZ BROWSER TOOL: No data for question:', questionId);
            return;
        }
        
        const questionData = integration.questions[questionId];
        const selectedInput = questionElement.querySelector('input[type="radio"]:checked');
        
        if (!selectedInput) return;
        
        // Get selected answer index
        const allInputs = questionElement.querySelectorAll('input[type="radio"]');
        const selectedIndex = Array.from(allInputs).indexOf(selectedInput);
        
        const isCorrect = selectedIndex === questionData.correctIndex;
        
        console.log('🔍 QUIZ BROWSER TOOL: Validation for Q' + questionId, {
            selectedIndex: selectedIndex,
            correctIndex: questionData.correctIndex,
            isCorrect: isCorrect,
            correctAnswer: questionData.correctAnswers[0]?.text
        });
        
        // Override LearnDash validation
        overrideLearnDashValidation(questionElement, isCorrect, questionData, selectedIndex);
        
        // Update integration panel
        updateCurrentQuestionDisplay(questionId, questionData, selectedIndex, isCorrect);
    }
    
    /**
     * Override LearnDash validation with Quiz Browser Tool data
     */
    function overrideLearnDashValidation(questionElement, isCorrect, questionData, selectedIndex) {
        // Find existing feedback
        const incorrectFeedback = questionElement.querySelector('.wpProQuiz_incorrect');
        const correctFeedback = questionElement.querySelector('.wpProQuiz_correct');
        
        if (isCorrect && incorrectFeedback) {
            // Fix incorrect feedback to correct
            console.log('✅ QUIZ BROWSER TOOL: Overriding incorrect → correct');
            
            incorrectFeedback.className = incorrectFeedback.className.replace('wpProQuiz_incorrect', 'wpProQuiz_correct');
            incorrectFeedback.innerHTML = '✅ כל הכבוד! תשובה נכונה (Quiz Browser Tool)';
            incorrectFeedback.style.cssText = `
                background-color: #d4edda !important;
                color: #155724 !important;
                border: 1px solid #c3e6cb !important;
                padding: 10px !important;
                border-radius: 5px !important;
                margin-top: 10px !important;
            `;
            
        } else if (!isCorrect && correctFeedback) {
            // Fix correct feedback to incorrect
            console.log('❌ QUIZ BROWSER TOOL: Overriding correct → incorrect');
            
            correctFeedback.className = correctFeedback.className.replace('wpProQuiz_correct', 'wpProQuiz_incorrect');
            correctFeedback.innerHTML = `❌ תשובה שגויה! התשובה הנכונה היא: ${questionData.correctAnswers[0]?.letter} (Quiz Browser Tool)`;
            correctFeedback.style.cssText = `
                background-color: #f8d7da !important;
                color: #721c24 !important;
                border: 1px solid #f5c6cb !important;
                padding: 10px !important;
                border-radius: 5px !important;
                margin-top: 10px !important;
            `;
        }
    }
    
    /**
     * Show all correct answers using Quiz Browser Tool data
     */
    function showAllCorrectAnswers() {
        console.log('🎯 QUIZ BROWSER TOOL: Showing all correct answers...');
        
        const questionElements = document.querySelectorAll('.wpProQuiz_listItem');
        let highlightedCount = 0;
        
        questionElements.forEach(questionElement => {
            const questionId = getQuestionIdFromElement(questionElement);
            if (questionId && integration.questions[questionId]) {
                const questionData = integration.questions[questionId];
                highlightCorrectAnswer(questionElement, questionData.correctIndex, questionData.correctAnswers[0]);
                highlightedCount++;
            }
        });
        
        updateIntegrationStatus(`✅ Highlighted ${highlightedCount} correct answers`);
    }
    
    /**
     * Highlight correct answer
     */
    function highlightCorrectAnswer(questionElement, correctIndex, correctAnswer) {
        const answerElements = questionElement.querySelectorAll('.wpProQuiz_questionListItem');
        
        // Clear previous highlights
        answerElements.forEach(el => {
            el.style.backgroundColor = '';
            el.style.border = '';
            const indicators = el.querySelectorAll('.browser-tool-indicator');
            indicators.forEach(indicator => indicator.remove());
        });
        
        // Highlight correct answer
        if (answerElements[correctIndex]) {
            answerElements[correctIndex].style.cssText = `
                background-color: #d4edda !important;
                border: 2px solid #27ae60 !important;
                border-radius: 5px !important;
            `;
            
            // Add indicator
            const indicator = document.createElement('span');
            indicator.className = 'browser-tool-indicator';
            indicator.innerHTML = ` ✅ CORRECT (${correctAnswer?.letter})`;
            indicator.style.cssText = `
                color: #27ae60 !important;
                font-weight: bold !important;
                margin-right: 10px !important;
            `;
            answerElements[correctIndex].appendChild(indicator);
        }
    }
    
    /**
     * Apply correct validation to existing questions
     */
    function applyCorrectValidation() {
        console.log('🔄 QUIZ BROWSER TOOL: Applying correct validation...');
        
        const questionElements = document.querySelectorAll('.wpProQuiz_listItem');
        questionElements.forEach(questionElement => {
            const questionId = getQuestionIdFromElement(questionElement);
            if (questionId) {
                validateQuestionWithBrowserToolData(questionElement, questionId);
            }
        });
    }
    
    /**
     * Update integration panel status
     */
    function updateIntegrationStatus(message) {
        const statusElement = document.getElementById('integration-status');
        if (statusElement) {
            statusElement.innerHTML = message;
        }
        console.log('📊 QUIZ BROWSER TOOL STATUS:', message);
    }
    
    /**
     * Update integration panel
     */
    function updateIntegrationPanel() {
        const questionCount = Object.keys(integration.questions).length;
        updateIntegrationStatus(`✅ Loaded ${questionCount} questions with correct answers`);
    }
    
    /**
     * Update current question display
     */
    function updateCurrentQuestionDisplay(questionId, questionData, selectedIndex, isCorrect) {
        const status = isCorrect ? '✅ CORRECT' : '❌ WRONG';
        const color = isCorrect ? '#27ae60' : '#e74c3c';
        
        const html = `
            <div style="color: ${color}; font-weight: bold;">
                Q${questionId}: ${status}<br>
                Selected: ${selectedIndex} | Correct: ${questionData.correctIndex} (${questionData.correctAnswers[0]?.letter})<br>
                Answer: ${questionData.correctAnswers[0]?.text}
            </div>
        `;
        
        $('#integration-validation').html(html);
    }
    
    /**
     * Validate current question
     */
    function validateCurrentQuestion() {
        const questionElement = document.querySelector('.wpProQuiz_listItem');
        if (questionElement) {
            const questionId = getQuestionIdFromElement(questionElement);
            if (questionId) {
                validateQuestionWithBrowserToolData(questionElement, questionId);
            }
        }
    }
    
    /**
     * Refresh integration
     */
    function refreshIntegration() {
        console.log('🔄 QUIZ BROWSER TOOL: Refreshing integration...');
        integration.questions = {};
        loadQuestionsFromDatabase();
    }
    
    // Initialize when ready with better error handling
    function waitForJQuery() {
        if (typeof jQuery !== 'undefined') {
            console.log('🧪 QUIZ BROWSER TOOL: jQuery found, using document ready...');
            jQuery(document).ready(function() {
                console.log('🧪 QUIZ BROWSER TOOL: Document ready, scheduling initialization...');
                setTimeout(function() {
                    try {
                        initializeIntegration();
                    } catch (error) {
                        console.error('❌ QUIZ BROWSER TOOL: Initialization failed:', error);
                    }
                }, 1000);
            });
        } else {
            console.log('🧪 QUIZ BROWSER TOOL: jQuery not found, using DOMContentLoaded...');
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    console.log('🧪 QUIZ BROWSER TOOL: DOMContentLoaded triggered...');
                    setTimeout(function() {
                        try {
                            initializeIntegration();
                        } catch (error) {
                            console.error('❌ QUIZ BROWSER TOOL: DOMContentLoaded initialization failed:', error);
                        }
                    }, 1000);
                });
            } else {
                console.log('🧪 QUIZ BROWSER TOOL: Document already loaded, initializing immediately...');
                setTimeout(function() {
                    try {
                        initializeIntegration();
                    } catch (error) {
                        console.error('❌ QUIZ BROWSER TOOL: Immediate initialization failed:', error);
                    }
                }, 500);
            }
        }
    }
    
    // Start initialization
    waitForJQuery();
    
})();
