/**
 * REBUILT Quiz Debug System - Complete Rewrite
 * Shows correct answers, validates responses, and provides real-time feedback
 */

(function($) {
    'use strict';
    
    console.log('🔥 REBUILT QUIZ DEBUG: Starting initialization...');
    
    // Global debug state
    window.quizDebugRebuilt = {
        initialized: false,
        questions: {},
        correctAnswers: {},
        currentQuestion: null,
        validationResults: {},
        debugMode: true
    };
    
    const debug = window.quizDebugRebuilt;
    
    /**
     * Initialize the rebuilt debug system
     */
    function initializeDebugSystem() {
        console.log('🚀 REBUILT DEBUG: Initializing system...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startDebugSystem);
        } else {
            startDebugSystem();
        }
    }
    
    /**
     * Start the debug system
     */
    function startDebugSystem() {
        console.log('🎯 REBUILT DEBUG: Starting debug system...');
        
        // Create debug panel
        createDebugPanel();
        
        // Load quiz data
        loadQuizData();
        
        // Monitor quiz interactions
        monitorQuizInteractions();
        
        // Set up periodic monitoring
        setInterval(monitorQuizState, 2000);
        
        debug.initialized = true;
        console.log('✅ REBUILT DEBUG: System initialized successfully');
    }
    
    /**
     * Create floating debug panel
     */
    function createDebugPanel() {
        const panel = $(`
            <div id="quiz-debug-panel" style="
                position: fixed;
                top: 10px;
                right: 10px;
                width: 350px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                z-index: 99999;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; font-size: 14px;">🔥 Quiz Debug (Rebuilt)</h3>
                    <button id="debug-toggle" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Hide</button>
                </div>
                <div id="debug-content">
                    <div id="debug-status">Initializing...</div>
                    <div id="debug-current-question" style="margin-top: 10px;"></div>
                    <div id="debug-validation" style="margin-top: 10px;"></div>
                    <div id="debug-actions" style="margin-top: 10px;">
                        <button id="debug-show-answers" style="background: #28a745; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Show Answers</button>
                        <button id="debug-validate-current" style="background: #ffc107; border: none; color: black; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Validate</button>
                        <button id="debug-refresh" style="background: #17a2b8; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Refresh</button>
                    </div>
                </div>
            </div>
        `);
        
        $('body').append(panel);
        
        // Panel interactions
        $('#debug-toggle').click(function() {
            const content = $('#debug-content');
            if (content.is(':visible')) {
                content.hide();
                $(this).text('Show');
            } else {
                content.show();
                $(this).text('Hide');
            }
        });
        
        $('#debug-show-answers').click(showAllCorrectAnswers);
        $('#debug-validate-current').click(validateCurrentQuestion);
        $('#debug-refresh').click(refreshDebugData);
        
        console.log('🎨 REBUILT DEBUG: Debug panel created');
    }
    
    /**
     * Load quiz data from multiple sources
     */
    function loadQuizData() {
        console.log('📊 REBUILT DEBUG: Loading quiz data...');
        updateDebugStatus('Loading quiz data...');
        
        // Get quiz ID
        const quizId = getQuizId();
        console.log('🆔 REBUILT DEBUG: Quiz ID:', quizId);
        
        if (!quizId) {
            updateDebugStatus('❌ No quiz ID found');
            return;
        }
        
        // Load from database
        loadFromDatabase(quizId);
        
        // Scan DOM for questions
        scanDOMForQuestions();
        
        // Load LearnDash data if available
        loadLearnDashData();
    }
    
    /**
     * Get quiz ID from various sources
     */
    function getQuizId() {
        // Try multiple methods to get quiz ID
        let quizId = null;
        
        // Method 1: From URL
        const urlMatch = window.location.href.match(/quiz[_-]?id[=\/](\d+)/i);
        if (urlMatch) quizId = urlMatch[1];
        
        // Method 2: From post ID
        if (!quizId && typeof window.post_id !== 'undefined') {
            quizId = window.post_id;
        }
        
        // Method 3: From body class
        if (!quizId) {
            const bodyClass = document.body.className;
            const classMatch = bodyClass.match(/postid-(\d+)/);
            if (classMatch) quizId = classMatch[1];
        }
        
        // Method 4: From quiz elements
        if (!quizId) {
            const quizElement = document.querySelector('[data-quiz-id]');
            if (quizElement) quizId = quizElement.getAttribute('data-quiz-id');
        }
        
        return quizId;
    }
    
    /**
     * Load data from database
     */
    function loadFromDatabase(quizId) {
        const url = `/quiz-data-loader.php?action=load_all_questions&quiz_id=${quizId}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    debug.correctAnswers = {};
                    Object.values(data.data).forEach(question => {
                        debug.correctAnswers[question.id] = {
                            correctIndex: question.correct_answer,
                            answers: question.answers,
                            text: question.text
                        };
                    });
                    console.log('✅ REBUILT DEBUG: Database data loaded:', Object.keys(debug.correctAnswers).length, 'questions');
                    updateDebugStatus(`✅ Loaded ${Object.keys(debug.correctAnswers).length} questions from DB`);
                } else {
                    console.error('❌ REBUILT DEBUG: Database error:', data.message);
                    updateDebugStatus('❌ Database load failed');
                }
            })
            .catch(error => {
                console.error('❌ REBUILT DEBUG: Database fetch error:', error);
                updateDebugStatus('❌ Database connection failed');
            });
    }
    
    /**
     * Scan DOM for quiz questions
     */
    function scanDOMForQuestions() {
        console.log('🔍 REBUILT DEBUG: Scanning DOM for questions...');
        
        const questionElements = document.querySelectorAll('.wpProQuiz_listItem, .quiz-question, [data-question-id]');
        console.log('📝 REBUILT DEBUG: Found question elements:', questionElements.length);
        
        questionElements.forEach((element, index) => {
            const questionId = getQuestionIdFromElement(element);
            if (questionId) {
                debug.questions[questionId] = {
                    element: element,
                    index: index,
                    answers: getAnswersFromElement(element)
                };
            }
        });
        
        updateDebugStatus(`🔍 Scanned ${questionElements.length} question elements`);
    }
    
    /**
     * Get question ID from element
     */
    function getQuestionIdFromElement(element) {
        // Try multiple attributes
        return element.getAttribute('data-question-id') ||
               element.getAttribute('data-quiz-question') ||
               element.querySelector('[data-question-id]')?.getAttribute('data-question-id') ||
               element.id?.match(/\d+/)?.[0];
    }
    
    /**
     * Get answers from question element
     */
    function getAnswersFromElement(element) {
        const answers = [];
        const answerElements = element.querySelectorAll('.wpProQuiz_questionListItem, .quiz-answer');
        
        answerElements.forEach((answerEl, index) => {
            const input = answerEl.querySelector('input[type="radio"], input[type="checkbox"]');
            const label = answerEl.querySelector('label');
            
            answers.push({
                index: index,
                text: label ? label.textContent.trim() : '',
                input: input,
                element: answerEl,
                selected: input ? input.checked : false
            });
        });
        
        return answers;
    }
    
    /**
     * Load LearnDash data if available
     */
    function loadLearnDashData() {
        // Check for LearnDash global data
        if (typeof window.learndash_quiz_data !== 'undefined') {
            console.log('📚 REBUILT DEBUG: LearnDash data found:', window.learndash_quiz_data);
        }
        
        // Check for other quiz data
        if (typeof window.lilacQuizCorrectAnswers !== 'undefined') {
            console.log('🎯 REBUILT DEBUG: Lilac quiz data found:', window.lilacQuizCorrectAnswers);
        }
    }
    
    /**
     * Monitor quiz interactions
     */
    function monitorQuizInteractions() {
        console.log('👁️ REBUILT DEBUG: Setting up interaction monitoring...');
        
        // Monitor answer selections
        $(document).on('change', 'input[type="radio"], input[type="checkbox"]', function() {
            const questionElement = $(this).closest('.wpProQuiz_listItem, .quiz-question')[0];
            if (questionElement) {
                const questionId = getQuestionIdFromElement(questionElement);
                console.log('🎯 REBUILT DEBUG: Answer selected for question:', questionId);
                
                // Update current question
                debug.currentQuestion = questionId;
                updateCurrentQuestionDisplay();
                
                // Auto-validate after selection
                setTimeout(() => validateQuestion(questionId), 500);
            }
        });
        
        // Monitor quiz submission
        $(document).on('click', '.wpProQuiz_button, .quiz-submit', function() {
            console.log('📤 REBUILT DEBUG: Quiz submission detected');
            validateAllQuestions();
        });
    }
    
    /**
     * Monitor quiz state periodically
     */
    function monitorQuizState() {
        if (!debug.initialized) return;
        
        // Update current question if changed
        const currentQuestionElement = document.querySelector('.wpProQuiz_listItem.current, .quiz-question.active');
        if (currentQuestionElement) {
            const questionId = getQuestionIdFromElement(currentQuestionElement);
            if (questionId && questionId !== debug.currentQuestion) {
                debug.currentQuestion = questionId;
                updateCurrentQuestionDisplay();
            }
        }
    }
    
    /**
     * Show all correct answers
     */
    function showAllCorrectAnswers() {
        console.log('🎯 REBUILT DEBUG: Showing all correct answers...');
        
        Object.keys(debug.correctAnswers).forEach(questionId => {
            const correctData = debug.correctAnswers[questionId];
            const questionElement = debug.questions[questionId]?.element;
            
            if (questionElement && correctData) {
                highlightCorrectAnswer(questionElement, correctData.correctIndex);
            }
        });
        
        updateDebugStatus('✅ All correct answers highlighted');
    }
    
    /**
     * Highlight correct answer in question
     */
    function highlightCorrectAnswer(questionElement, correctIndex) {
        const answerElements = questionElement.querySelectorAll('.wpProQuiz_questionListItem');
        
        // Remove previous highlights
        answerElements.forEach(el => {
            el.style.backgroundColor = '';
            el.style.border = '';
        });
        
        // Highlight correct answer
        if (answerElements[correctIndex]) {
            answerElements[correctIndex].style.backgroundColor = '#d4edda';
            answerElements[correctIndex].style.border = '2px solid #28a745';
            answerElements[correctIndex].style.borderRadius = '5px';
            
            // Add correct indicator
            let indicator = answerElements[correctIndex].querySelector('.correct-indicator');
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.className = 'correct-indicator';
                indicator.innerHTML = ' ✅ CORRECT';
                indicator.style.color = '#28a745';
                indicator.style.fontWeight = 'bold';
                answerElements[correctIndex].appendChild(indicator);
            }
        }
    }
    
    /**
     * Validate current question
     */
    function validateCurrentQuestion() {
        if (debug.currentQuestion) {
            validateQuestion(debug.currentQuestion);
        } else {
            updateDebugStatus('❌ No current question to validate');
        }
    }
    
    /**
     * Validate specific question
     */
    function validateQuestion(questionId) {
        console.log('🔍 REBUILT DEBUG: Validating question:', questionId);
        
        const questionData = debug.questions[questionId];
        const correctData = debug.correctAnswers[questionId];
        
        if (!questionData || !correctData) {
            console.log('❌ REBUILT DEBUG: Missing data for question:', questionId);
            return;
        }
        
        // Find selected answer
        let selectedIndex = -1;
        questionData.answers.forEach((answer, index) => {
            if (answer.input && answer.input.checked) {
                selectedIndex = index;
            }
        });
        
        // Compare with correct answer
        const isCorrect = selectedIndex === correctData.correctIndex;
        
        // Store validation result
        debug.validationResults[questionId] = {
            selectedIndex: selectedIndex,
            correctIndex: correctData.correctIndex,
            isCorrect: isCorrect,
            timestamp: new Date()
        };
        
        // Update display
        updateValidationDisplay(questionId, isCorrect, selectedIndex, correctData.correctIndex);
        
        console.log('📊 REBUILT DEBUG: Validation result:', {
            questionId: questionId,
            selectedIndex: selectedIndex,
            correctIndex: correctData.correctIndex,
            isCorrect: isCorrect
        });
    }
    
    /**
     * Validate all questions
     */
    function validateAllQuestions() {
        console.log('🔍 REBUILT DEBUG: Validating all questions...');
        
        Object.keys(debug.questions).forEach(questionId => {
            validateQuestion(questionId);
        });
        
        updateDebugStatus('✅ All questions validated');
    }
    
    /**
     * Update debug status
     */
    function updateDebugStatus(message) {
        $('#debug-status').html(message);
        console.log('📊 REBUILT DEBUG STATUS:', message);
    }
    
    /**
     * Update current question display
     */
    function updateCurrentQuestionDisplay() {
        if (!debug.currentQuestion) {
            $('#debug-current-question').html('No current question');
            return;
        }
        
        const correctData = debug.correctAnswers[debug.currentQuestion];
        const questionData = debug.questions[debug.currentQuestion];
        
        let html = `<strong>Current Question:</strong> ${debug.currentQuestion}<br>`;
        
        if (correctData) {
            html += `<strong>Correct Answer:</strong> ${correctData.correctIndex} (${correctData.answers[correctData.correctIndex]?.text || 'Unknown'})<br>`;
        }
        
        if (questionData) {
            const selectedAnswer = questionData.answers.find(a => a.selected);
            if (selectedAnswer) {
                html += `<strong>Selected:</strong> ${selectedAnswer.index} (${selectedAnswer.text})<br>`;
            }
        }
        
        $('#debug-current-question').html(html);
    }
    
    /**
     * Update validation display
     */
    function updateValidationDisplay(questionId, isCorrect, selectedIndex, correctIndex) {
        const status = isCorrect ? '✅ CORRECT' : '❌ WRONG';
        const color = isCorrect ? '#28a745' : '#dc3545';
        
        const html = `
            <div style="color: ${color}; font-weight: bold;">
                Q${questionId}: ${status}<br>
                Selected: ${selectedIndex} | Correct: ${correctIndex}
            </div>
        `;
        
        $('#debug-validation').html(html);
    }
    
    /**
     * Refresh debug data
     */
    function refreshDebugData() {
        console.log('🔄 REBUILT DEBUG: Refreshing data...');
        updateDebugStatus('Refreshing...');
        
        // Clear existing data
        debug.questions = {};
        debug.correctAnswers = {};
        debug.validationResults = {};
        
        // Reload data
        loadQuizData();
        scanDOMForQuestions();
        
        updateDebugStatus('✅ Data refreshed');
    }
    
    // Ensure jQuery is available and initialize
    function ensureInitialization() {
        if (typeof jQuery !== 'undefined' && jQuery) {
            console.log('✅ REBUILT DEBUG: jQuery available, initializing...');
            initializeDebugSystem();
        } else {
            console.log('⏳ REBUILT DEBUG: Waiting for jQuery...');
            setTimeout(ensureInitialization, 100);
        }
    }
    
    // Start initialization process
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureInitialization);
    } else {
        ensureInitialization();
    }
    
    // Fallback initialization after page load
    window.addEventListener('load', function() {
        if (!debug.initialized) {
            console.log('🔄 REBUILT DEBUG: Fallback initialization...');
            ensureInitialization();
        }
    });
    
})(jQuery);
