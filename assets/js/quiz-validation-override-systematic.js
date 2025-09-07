/**
 * SYSTEMATIC Quiz Validation Override
 * Automatically fixes ALL incorrect validations using database correct answers
 */

(function() {
    'use strict';
    
    console.log('🔧 SYSTEMATIC VALIDATION OVERRIDE: Starting...');
    
    // Global state
    window.systematicValidationOverride = {
        initialized: false,
        correctAnswers: {},
        overrideCount: 0,
        debugMode: true
    };
    
    const override = window.systematicValidationOverride;
    
    /**
     * Initialize systematic validation override
     */
    function initializeSystematicOverride() {
        console.log('🚀 SYSTEMATIC OVERRIDE: Initializing...');
        
        // Load all correct answers from database
        loadAllCorrectAnswers();
        
        // Set up validation monitoring
        setupValidationMonitoring();
        
        // Create status indicator
        createStatusIndicator();
        
        override.initialized = true;
        console.log('✅ SYSTEMATIC OVERRIDE: System ready');
    }
    
    /**
     * Load ALL correct answers from database
     */
    function loadAllCorrectAnswers() {
        console.log('📊 SYSTEMATIC OVERRIDE: Loading all correct answers from database...');
        
        // Get quiz ID
        const quizId = getQuizId();
        
        if (!quizId) {
            console.error('❌ SYSTEMATIC OVERRIDE: No quiz ID found');
            return;
        }
        
        // Load from quiz-data-loader.php (your existing endpoint)
        const url = `/quiz-data-loader.php?action=load_all_questions&quiz_id=${quizId}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    // Process all questions
                    Object.values(data.data).forEach(question => {
                        override.correctAnswers[question.id] = {
                            correctIndex: question.correct_answer,
                            answers: question.answers,
                            text: question.text
                        };
                    });
                    
                    console.log('✅ SYSTEMATIC OVERRIDE: Loaded correct answers for', Object.keys(override.correctAnswers).length, 'questions');
                    updateStatusIndicator(`✅ ${Object.keys(override.correctAnswers).length} Questions Loaded`);
                    
                    // Apply overrides to existing questions on page
                    applyOverridesToExistingQuestions();
                    
                } else {
                    console.error('❌ SYSTEMATIC OVERRIDE: Failed to load correct answers:', data.message);
                    updateStatusIndicator('❌ Failed to Load');
                }
            })
            .catch(error => {
                console.error('❌ SYSTEMATIC OVERRIDE: Database error:', error);
                updateStatusIndicator('❌ Database Error');
            });
    }
    
    /**
     * Get quiz ID from various sources
     */
    function getQuizId() {
        // Try multiple methods
        let quizId = null;
        
        // From URL
        const urlMatch = window.location.href.match(/quiz[_-]?id[=\/](\d+)/i);
        if (urlMatch) quizId = urlMatch[1];
        
        // From post ID
        if (!quizId && typeof window.post_id !== 'undefined') {
            quizId = window.post_id;
        }
        
        // From body class
        if (!quizId) {
            const bodyClass = document.body.className;
            const classMatch = bodyClass.match(/postid-(\d+)/);
            if (classMatch) quizId = classMatch[1];
        }
        
        return quizId;
    }
    
    /**
     * Setup validation monitoring for all questions
     */
    function setupValidationMonitoring() {
        console.log('👁️ SYSTEMATIC OVERRIDE: Setting up validation monitoring...');
        
        // Monitor answer selections
        document.addEventListener('change', function(e) {
            if (e.target.type === 'radio' && e.target.name.includes('question')) {
                const questionElement = e.target.closest('.wpProQuiz_listItem');
                if (questionElement) {
                    setTimeout(() => {
                        applyValidationOverride(questionElement);
                    }, 100);
                }
            }
        });
        
        // Monitor for dynamically loaded questions
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && (node.classList.contains('wpProQuiz_listItem') || node.querySelector('.wpProQuiz_listItem'))) {
                        setTimeout(() => {
                            applyOverridesToExistingQuestions();
                        }, 200);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Apply overrides to all existing questions on page
     */
    function applyOverridesToExistingQuestions() {
        console.log('🔄 SYSTEMATIC OVERRIDE: Applying overrides to existing questions...');
        
        const questionElements = document.querySelectorAll('.wpProQuiz_listItem');
        let processedCount = 0;
        
        questionElements.forEach(questionElement => {
            if (applyValidationOverride(questionElement)) {
                processedCount++;
            }
        });
        
        if (processedCount > 0) {
            console.log('✅ SYSTEMATIC OVERRIDE: Applied overrides to', processedCount, 'questions');
            updateStatusIndicator(`✅ ${processedCount} Overrides Applied`);
        }
    }
    
    /**
     * Apply validation override to a specific question
     */
    function applyValidationOverride(questionElement) {
        const questionId = getQuestionId(questionElement);
        
        if (!questionId || !override.correctAnswers[questionId]) {
            return false; // No override data for this question
        }
        
        const correctData = override.correctAnswers[questionId];
        const selectedInput = questionElement.querySelector('input[type="radio"]:checked');
        
        if (!selectedInput) {
            return false; // No answer selected
        }
        
        // Get selected answer index
        const allInputs = questionElement.querySelectorAll('input[type="radio"]');
        const selectedIndex = Array.from(allInputs).indexOf(selectedInput);
        
        const isCorrectAnswer = selectedIndex === correctData.correctIndex;
        
        console.log('🔍 SYSTEMATIC OVERRIDE: Question', questionId, {
            selectedIndex: selectedIndex,
            correctIndex: correctData.correctIndex,
            shouldBeCorrect: isCorrectAnswer
        });
        
        // Find existing feedback elements
        const incorrectFeedback = questionElement.querySelector('.wpProQuiz_incorrect');
        const correctFeedback = questionElement.querySelector('.wpProQuiz_correct');
        
        if (isCorrectAnswer && incorrectFeedback) {
            // Fix incorrect feedback to correct
            console.log('✅ SYSTEMATIC OVERRIDE: Fixing incorrect → correct for Q' + questionId);
            
            incorrectFeedback.className = incorrectFeedback.className.replace('wpProQuiz_incorrect', 'wpProQuiz_correct');
            incorrectFeedback.innerHTML = '✅ כל הכבוד! תשובה נכונה';
            incorrectFeedback.style.cssText = `
                background-color: #d4edda !important;
                color: #155724 !important;
                border: 1px solid #c3e6cb !important;
                padding: 10px !important;
                border-radius: 5px !important;
                margin-top: 10px !important;
            `;
            
            // Style selected answer as correct
            const selectedAnswerElement = selectedInput.closest('.wpProQuiz_questionListItem');
            if (selectedAnswerElement) {
                selectedAnswerElement.style.cssText = `
                    background-color: #d4edda !important;
                    border: 2px solid #28a745 !important;
                    border-radius: 5px !important;
                `;
            }
            
            override.overrideCount++;
            updateStatusIndicator(`✅ ${override.overrideCount} Corrections Applied`);
            return true;
            
        } else if (!isCorrectAnswer && correctFeedback) {
            // Fix correct feedback to incorrect
            console.log('❌ SYSTEMATIC OVERRIDE: Fixing correct → incorrect for Q' + questionId);
            
            correctFeedback.className = correctFeedback.className.replace('wpProQuiz_correct', 'wpProQuiz_incorrect');
            correctFeedback.innerHTML = `❌ תשובה שגויה! התשובה הנכונה היא: ${correctData.correctIndex + 1}`;
            correctFeedback.style.cssText = `
                background-color: #f8d7da !important;
                color: #721c24 !important;
                border: 1px solid #f5c6cb !important;
                padding: 10px !important;
                border-radius: 5px !important;
                margin-top: 10px !important;
            `;
            
            // Style selected answer as incorrect
            const selectedAnswerElement = selectedInput.closest('.wpProQuiz_questionListItem');
            if (selectedAnswerElement) {
                selectedAnswerElement.style.cssText = `
                    background-color: #f8d7da !important;
                    border: 2px solid #dc3545 !important;
                    border-radius: 5px !important;
                `;
            }
            
            // Highlight correct answer
            const correctAnswerElement = allInputs[correctData.correctIndex]?.closest('.wpProQuiz_questionListItem');
            if (correctAnswerElement) {
                correctAnswerElement.style.cssText = `
                    background-color: #d4edda !important;
                    border: 2px solid #28a745 !important;
                    border-radius: 5px !important;
                `;
                
                // Add correct indicator
                if (!correctAnswerElement.querySelector('.correct-indicator')) {
                    const indicator = document.createElement('span');
                    indicator.className = 'correct-indicator';
                    indicator.innerHTML = ' ← התשובה הנכונה';
                    indicator.style.cssText = `
                        color: #28a745 !important;
                        font-weight: bold !important;
                        margin-right: 10px !important;
                    `;
                    correctAnswerElement.appendChild(indicator);
                }
            }
            
            override.overrideCount++;
            updateStatusIndicator(`✅ ${override.overrideCount} Corrections Applied`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get question ID from element
     */
    function getQuestionId(questionElement) {
        // Try to extract question ID from input names
        const inputs = questionElement.querySelectorAll('input[type="radio"]');
        if (inputs.length > 0) {
            const inputName = inputs[0].name;
            const match = inputName.match(/question_(\d+)/);
            if (match) {
                return match[1];
            }
        }
        
        // Fallback methods
        return questionElement.getAttribute('data-question-id') ||
               questionElement.querySelector('[data-question-id]')?.getAttribute('data-question-id');
    }
    
    /**
     * Create status indicator
     */
    function createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'systematic-override-status';
        indicator.innerHTML = '🔧 Systematic Override Loading...';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: bold;
            z-index: 99999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        // Add click handler for details
        indicator.addEventListener('click', function() {
            console.log('📊 SYSTEMATIC OVERRIDE STATUS:');
            console.log('  Initialized:', override.initialized);
            console.log('  Questions loaded:', Object.keys(override.correctAnswers).length);
            console.log('  Overrides applied:', override.overrideCount);
            console.log('  Correct answers data:', override.correctAnswers);
        });
        
        document.body.appendChild(indicator);
    }
    
    /**
     * Update status indicator
     */
    function updateStatusIndicator(message) {
        const indicator = document.getElementById('systematic-override-status');
        if (indicator) {
            indicator.innerHTML = `🔧 ${message}`;
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSystematicOverride);
    } else {
        initializeSystematicOverride();
    }
    
    console.log('✅ SYSTEMATIC VALIDATION OVERRIDE: Script loaded');
    
})();
