/**
 * REBUILT UI Feedback System - Complete Rewrite
 * Provides real-time validation and visual feedback for quiz answers
 */

(function($) {
    'use strict';
    
    console.log('🔥 REBUILT UI FEEDBACK: Starting initialization...');
    
    // Global feedback state
    window.quizUIFeedbackRebuilt = {
        initialized: false,
        correctAnswers: {},
        activeValidations: {},
        feedbackElements: {},
        config: {
            showImmediate: true,
            persistentIndicators: true,
            autoValidate: true,
            debugMode: true
        }
    };
    
    const feedback = window.quizUIFeedbackRebuilt;
    
    /**
     * Initialize the rebuilt UI feedback system
     */
    function initializeFeedbackSystem() {
        console.log('🚀 REBUILT UI FEEDBACK: Initializing...');
        
        // Wait for DOM and other scripts
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startFeedbackSystem);
        } else {
            setTimeout(startFeedbackSystem, 100);
        }
    }
    
    /**
     * Start the feedback system
     */
    function startFeedbackSystem() {
        console.log('🎯 REBUILT UI FEEDBACK: Starting system...');
        
        // Load correct answers data
        loadCorrectAnswersData();
        
        // Set up answer monitoring
        setupAnswerMonitoring();
        
        // Create feedback styles
        createFeedbackStyles();
        
        // Set up periodic validation
        setInterval(validateVisibleQuestions, 1000);
        
        feedback.initialized = true;
        console.log('✅ REBUILT UI FEEDBACK: System ready');
    }
    
    /**
     * Load correct answers from multiple sources
     */
    function loadCorrectAnswersData() {
        console.log('📊 REBUILT UI FEEDBACK: Loading correct answers...');
        
        // Get quiz ID
        const quizId = getQuizId();
        
        if (quizId) {
            // Load from database
            loadFromDatabase(quizId);
        }
        
        // Load from existing global data
        loadFromGlobalData();
    }
    
    /**
     * Get quiz ID
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
     * Load from database
     */
    function loadFromDatabase(quizId) {
        const url = `/quiz-data-loader.php?action=load_all_questions&quiz_id=${quizId}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Object.values(data.data).forEach(question => {
                        feedback.correctAnswers[question.id] = {
                            correctIndex: question.correct_answer,
                            answers: question.answers,
                            text: question.text
                        };
                    });
                    console.log('✅ REBUILT UI FEEDBACK: Loaded', Object.keys(feedback.correctAnswers).length, 'correct answers');
                } else {
                    console.error('❌ REBUILT UI FEEDBACK: Database error:', data.message);
                }
            })
            .catch(error => {
                console.error('❌ REBUILT UI FEEDBACK: Database fetch error:', error);
            });
    }
    
    /**
     * Load from global data
     */
    function loadFromGlobalData() {
        // Check existing global objects
        if (typeof window.lilacQuizCorrectAnswers !== 'undefined') {
            Object.assign(feedback.correctAnswers, window.lilacQuizCorrectAnswers);
            console.log('📋 REBUILT UI FEEDBACK: Loaded from lilacQuizCorrectAnswers');
        }
        
        if (typeof window.quizAnalyzer !== 'undefined' && window.quizAnalyzer.correctAnswers) {
            Object.assign(feedback.correctAnswers, window.quizAnalyzer.correctAnswers);
            console.log('📋 REBUILT UI FEEDBACK: Loaded from quizAnalyzer');
        }
    }
    
    /**
     * Setup answer monitoring
     */
    function setupAnswerMonitoring() {
        console.log('👁️ REBUILT UI FEEDBACK: Setting up answer monitoring...');
        
        // Monitor radio button changes
        $(document).on('change', 'input[type="radio"][name*="question"]', function() {
            const questionElement = $(this).closest('.wpProQuiz_listItem, .quiz-question')[0];
            if (questionElement) {
                const questionId = getQuestionIdFromElement(questionElement);
                console.log('🎯 REBUILT UI FEEDBACK: Answer changed for question:', questionId);
                
                // Validate immediately
                setTimeout(() => {
                    validateQuestion(questionElement, questionId);
                }, 100);
            }
        });
        
        // Monitor checkbox changes
        $(document).on('change', 'input[type="checkbox"][name*="question"]', function() {
            const questionElement = $(this).closest('.wpProQuiz_listItem, .quiz-question')[0];
            if (questionElement) {
                const questionId = getQuestionIdFromElement(questionElement);
                console.log('🎯 REBUILT UI FEEDBACK: Checkbox changed for question:', questionId);
                
                setTimeout(() => {
                    validateQuestion(questionElement, questionId);
                }, 100);
            }
        });
        
        // Monitor quiz navigation
        $(document).on('click', '.wpProQuiz_button, .quiz-nav-button', function() {
            console.log('🔄 REBUILT UI FEEDBACK: Quiz navigation detected');
            setTimeout(validateAllVisibleQuestions, 500);
        });
    }
    
    /**
     * Get question ID from element
     */
    function getQuestionIdFromElement(element) {
        return element.getAttribute('data-question-id') ||
               element.getAttribute('data-quiz-question') ||
               element.querySelector('[data-question-id]')?.getAttribute('data-question-id') ||
               element.id?.match(/\d+/)?.[0];
    }
    
    /**
     * Create feedback styles
     */
    function createFeedbackStyles() {
        const styles = `
            <style id="rebuilt-feedback-styles">
                .rebuilt-feedback-correct {
                    background-color: #d4edda !important;
                    border: 2px solid #28a745 !important;
                    border-radius: 5px !important;
                }
                
                .rebuilt-feedback-incorrect {
                    background-color: #f8d7da !important;
                    border: 2px solid #dc3545 !important;
                    border-radius: 5px !important;
                }
                
                .rebuilt-feedback-indicator {
                    font-weight: bold !important;
                    margin-left: 10px !important;
                }
                
                .rebuilt-feedback-correct-indicator {
                    color: #28a745 !important;
                }
                
                .rebuilt-feedback-incorrect-indicator {
                    color: #dc3545 !important;
                }
                
                .rebuilt-feedback-overlay {
                    position: absolute;
                    top: 0;
                    right: 0;
                    padding: 5px 10px;
                    border-radius: 0 5px 0 5px;
                    font-weight: bold;
                    font-size: 12px;
                    z-index: 1000;
                }
                
                .rebuilt-feedback-overlay-correct {
                    background-color: #28a745;
                    color: white;
                }
                
                .rebuilt-feedback-overlay-incorrect {
                    background-color: #dc3545;
                    color: white;
                }
            </style>
        `;
        
        $('head').append(styles);
        console.log('🎨 REBUILT UI FEEDBACK: Styles created');
    }
    
    /**
     * Validate question
     */
    function validateQuestion(questionElement, questionId) {
        if (!questionId || !feedback.correctAnswers[questionId]) {
            console.log('⚠️ REBUILT UI FEEDBACK: No validation data for question:', questionId);
            return;
        }
        
        const correctData = feedback.correctAnswers[questionId];
        const selectedIndex = getSelectedAnswerIndex(questionElement);
        
        if (selectedIndex === -1) {
            console.log('⚠️ REBUILT UI FEEDBACK: No answer selected for question:', questionId);
            return;
        }
        
        const isCorrect = selectedIndex === correctData.correctIndex;
        
        console.log('🔍 REBUILT UI FEEDBACK: Validation result:', {
            questionId: questionId,
            selectedIndex: selectedIndex,
            correctIndex: correctData.correctIndex,
            isCorrect: isCorrect
        });
        
        // Store validation result
        feedback.activeValidations[questionId] = {
            selectedIndex: selectedIndex,
            correctIndex: correctData.correctIndex,
            isCorrect: isCorrect,
            timestamp: Date.now()
        };
        
        // Apply visual feedback
        applyVisualFeedback(questionElement, questionId, isCorrect, selectedIndex, correctData.correctIndex);
    }
    
    /**
     * Get selected answer index
     */
    function getSelectedAnswerIndex(questionElement) {
        const answerElements = questionElement.querySelectorAll('.wpProQuiz_questionListItem');
        
        for (let i = 0; i < answerElements.length; i++) {
            const input = answerElements[i].querySelector('input[type="radio"], input[type="checkbox"]');
            if (input && input.checked) {
                return i;
            }
        }
        
        return -1;
    }
    
    /**
     * Apply visual feedback
     */
    function applyVisualFeedback(questionElement, questionId, isCorrect, selectedIndex, correctIndex) {
        console.log('🎨 REBUILT UI FEEDBACK: Applying visual feedback for question:', questionId);
        
        const answerElements = questionElement.querySelectorAll('.wpProQuiz_questionListItem');
        
        // Clear previous feedback
        clearPreviousFeedback(questionElement);
        
        // Highlight selected answer
        if (answerElements[selectedIndex]) {
            const selectedElement = answerElements[selectedIndex];
            
            if (isCorrect) {
                selectedElement.classList.add('rebuilt-feedback-correct');
                addFeedbackIndicator(selectedElement, '✅ CORRECT', 'rebuilt-feedback-correct-indicator');
                addFeedbackOverlay(selectedElement, '✓', 'rebuilt-feedback-overlay-correct');
            } else {
                selectedElement.classList.add('rebuilt-feedback-incorrect');
                addFeedbackIndicator(selectedElement, '❌ WRONG', 'rebuilt-feedback-incorrect-indicator');
                addFeedbackOverlay(selectedElement, '✗', 'rebuilt-feedback-overlay-incorrect');
                
                // Also highlight the correct answer
                if (answerElements[correctIndex]) {
                    const correctElement = answerElements[correctIndex];
                    correctElement.classList.add('rebuilt-feedback-correct');
                    addFeedbackIndicator(correctElement, '✅ CORRECT ANSWER', 'rebuilt-feedback-correct-indicator');
                    addFeedbackOverlay(correctElement, '✓', 'rebuilt-feedback-overlay-correct');
                }
            }
        }
        
        // Store feedback elements for cleanup
        feedback.feedbackElements[questionId] = {
            questionElement: questionElement,
            timestamp: Date.now()
        };
    }
    
    /**
     * Clear previous feedback
     */
    function clearPreviousFeedback(questionElement) {
        const answerElements = questionElement.querySelectorAll('.wpProQuiz_questionListItem');
        
        answerElements.forEach(element => {
            // Remove classes
            element.classList.remove('rebuilt-feedback-correct', 'rebuilt-feedback-incorrect');
            
            // Remove indicators
            const indicators = element.querySelectorAll('.rebuilt-feedback-indicator');
            indicators.forEach(indicator => indicator.remove());
            
            // Remove overlays
            const overlays = element.querySelectorAll('.rebuilt-feedback-overlay');
            overlays.forEach(overlay => overlay.remove());
        });
    }
    
    /**
     * Add feedback indicator
     */
    function addFeedbackIndicator(element, text, className) {
        const indicator = document.createElement('span');
        indicator.className = `rebuilt-feedback-indicator ${className}`;
        indicator.textContent = text;
        element.appendChild(indicator);
    }
    
    /**
     * Add feedback overlay
     */
    function addFeedbackOverlay(element, text, className) {
        // Make element relative for positioning
        element.style.position = 'relative';
        
        const overlay = document.createElement('div');
        overlay.className = `rebuilt-feedback-overlay ${className}`;
        overlay.textContent = text;
        element.appendChild(overlay);
    }
    
    /**
     * Validate all visible questions
     */
    function validateAllVisibleQuestions() {
        const questionElements = document.querySelectorAll('.wpProQuiz_listItem:not([style*="display: none"])');
        
        questionElements.forEach(element => {
            const questionId = getQuestionIdFromElement(element);
            if (questionId) {
                validateQuestion(element, questionId);
            }
        });
    }
    
    /**
     * Validate visible questions periodically
     */
    function validateVisibleQuestions() {
        if (!feedback.initialized || !feedback.config.autoValidate) return;
        
        // Only validate if we have correct answers data
        if (Object.keys(feedback.correctAnswers).length === 0) return;
        
        const questionElements = document.querySelectorAll('.wpProQuiz_listItem');
        let validatedCount = 0;
        
        questionElements.forEach(element => {
            const questionId = getQuestionIdFromElement(element);
            if (questionId && feedback.correctAnswers[questionId]) {
                const selectedIndex = getSelectedAnswerIndex(element);
                if (selectedIndex !== -1) {
                    // Only validate if not already validated or if answer changed
                    const lastValidation = feedback.activeValidations[questionId];
                    if (!lastValidation || lastValidation.selectedIndex !== selectedIndex) {
                        validateQuestion(element, questionId);
                        validatedCount++;
                    }
                }
            }
        });
        
        if (validatedCount > 0) {
            console.log('🔄 REBUILT UI FEEDBACK: Auto-validated', validatedCount, 'questions');
        }
    }
    
    /**
     * Public API
     */
    window.quizUIFeedbackRebuilt.validateQuestion = validateQuestion;
    window.quizUIFeedbackRebuilt.validateAll = validateAllVisibleQuestions;
    window.quizUIFeedbackRebuilt.clearFeedback = function(questionElement) {
        clearPreviousFeedback(questionElement);
    };
    window.quizUIFeedbackRebuilt.getValidationResults = function() {
        return feedback.activeValidations;
    };
    
    // Initialize when ready
    $(document).ready(function() {
        initializeFeedbackSystem();
    });
    
    // Also initialize immediately if DOM is already ready
    if (document.readyState !== 'loading') {
        initializeFeedbackSystem();
    }
    
})(jQuery);
