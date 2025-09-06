/**
 * Quiz Hint Enforcement - Complete System with Debugger and Answer Correction
 * Version: 2025-09-06 - Restored Working Configuration
 */

(function($) {
    'use strict';
    
    // Global namespace
    window.QuizHintSystem = {
        initialized: false,
        debugMode: true,
        correctAnswers: {},
        debugPanel: null
    };
    
    /**
     * Initialize the complete system
     */
    function initializeSystem() {
        console.log('🚀 Quiz Hint System: Initializing...');
        
        // Create persistent debugger
        createDebugger();
        
        // Initialize answer correction
        initAnswerCorrection();
        
        // Setup quiz monitoring
        setupQuizMonitoring();
        
        window.QuizHintSystem.initialized = true;
        console.log('✅ Quiz Hint System: Fully initialized');
    }
    
    /**
     * Create persistent debugger that won't disappear
     */
    function createDebugger() {
        // Remove any existing debugger
        $('.lilac-debug-info').remove();
        
        const debugPanel = $(`
            <div class="lilac-debug-info" style="
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
                z-index: 99999;
                max-width: 400px;
                border: 2px solid #00ff00;
            ">
                <div style="font-weight: bold; color: #00ff00; margin-bottom: 10px;">
                    🔧 LILAC QUIZ DEBUGGER
                </div>
                <div class="debug-content">
                    <div>Status: <span class="debug-status">Loading...</span></div>
                    <div>Quiz ID: <span class="debug-quiz-id">-</span></div>
                    <div>Questions: <span class="debug-questions">0</span></div>
                    <div>Correct Answers: <span class="debug-correct">0</span></div>
                    <div>AJAX Status: <span class="debug-ajax">Checking...</span></div>
                </div>
                <div style="margin-top: 10px;">
                    <button class="debug-btn-refresh" style="background: #007cba; color: white; border: none; padding: 5px 10px; margin-right: 5px; cursor: pointer;">Refresh</button>
                    <button class="debug-btn-fix" style="background: #dc3232; color: white; border: none; padding: 5px 10px; margin-right: 5px; cursor: pointer;">Fix Answers</button>
                    <button class="debug-btn-toggle" style="background: #46b450; color: white; border: none; padding: 5px 10px; cursor: pointer;">Toggle</button>
                </div>
            </div>
        `);
        
        $('body').append(debugPanel);
        window.QuizHintSystem.debugPanel = debugPanel;
        
        // Setup debugger controls
        debugPanel.find('.debug-btn-refresh').on('click', function() {
            updateDebugInfo();
            loadCorrectAnswers();
        });
        
        debugPanel.find('.debug-btn-fix').on('click', function() {
            forceAnswerCorrection();
        });
        
        debugPanel.find('.debug-btn-toggle').on('click', function() {
            debugPanel.find('.debug-content').toggle();
        });
        
        // Update debug info immediately
        updateDebugInfo();
        
        console.log('🔧 Debugger created and persistent');
    }
    
    /**
     * Update debugger information
     */
    function updateDebugInfo() {
        const debugPanel = window.QuizHintSystem.debugPanel;
        if (!debugPanel) return;
        
        const quizId = getQuizId();
        const questions = $('.wpProQuiz_question').length;
        const correctIndicators = $('.lilac-correct-indicator').length;
        
        debugPanel.find('.debug-status').text('Active').css('color', '#46b450');
        debugPanel.find('.debug-quiz-id').text(quizId || 'Not found');
        debugPanel.find('.debug-questions').text(questions);
        debugPanel.find('.debug-correct').text(correctIndicators);
        
        // Test AJAX
        testAjaxConnection();
    }
    
    /**
     * Test AJAX connection
     */
    function testAjaxConnection() {
        const debugPanel = window.QuizHintSystem.debugPanel;
        if (!debugPanel) return;
        
        debugPanel.find('.debug-ajax').text('Testing...').css('color', '#ffb900');
        
        $.ajax({
            url: lilac_quiz_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'get_quiz_answers',
                quiz_id: getQuizId() || 11702,
                nonce: lilac_quiz_ajax.nonce
            },
            success: function(response) {
                debugPanel.find('.debug-ajax').text('Connected').css('color', '#46b450');
                if (response.success && response.data.questions) {
                    window.QuizHintSystem.correctAnswers = response.data.questions;
                    applyCorrectAnswers();
                }
            },
            error: function(xhr, status, error) {
                debugPanel.find('.debug-ajax').text('Error: ' + error).css('color', '#dc3232');
                console.error('AJAX Error:', error);
            }
        });
    }
    
    /**
     * Initialize answer correction system
     */
    function initAnswerCorrection() {
        console.log('🎯 Initializing answer correction...');
        
        // Load correct answers immediately
        loadCorrectAnswers();
        
        // Setup observers for dynamic content
        if (window.MutationObserver) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length > 0) {
                        // Check if quiz content was added
                        const hasQuizContent = Array.from(mutation.addedNodes).some(node => 
                            node.nodeType === 1 && (
                                node.classList?.contains('wpProQuiz_question') ||
                                node.querySelector?.('.wpProQuiz_question')
                            )
                        );
                        
                        if (hasQuizContent) {
                            setTimeout(() => {
                                applyCorrectAnswers();
                                updateDebugInfo();
                            }, 500);
                        }
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    /**
     * Load correct answers from backend
     */
    function loadCorrectAnswers() {
        const quizId = getQuizId();
        if (!quizId) {
            console.log('No quiz ID found, using default');
            return;
        }
        
        console.log('📡 Loading correct answers for quiz:', quizId);
        
        $.ajax({
            url: lilac_quiz_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'get_quiz_answers',
                quiz_id: quizId,
                nonce: lilac_quiz_ajax.nonce
            },
            success: function(response) {
                console.log('✅ AJAX Response:', response);
                
                if (response.success && response.data.questions) {
                    window.QuizHintSystem.correctAnswers = response.data.questions;
                    console.log('📚 Loaded correct answers:', response.data.questions.length);
                    applyCorrectAnswers();
                } else {
                    console.error('❌ Invalid response format:', response);
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ AJAX Error:', error);
                console.error('Response:', xhr.responseText);
                
                // Fallback: Use hardcoded correct answers for testing
                useHardcodedAnswers();
            }
        });
    }
    
    /**
     * Apply correct answer indicators to the quiz
     */
    function applyCorrectAnswers() {
        console.log('🎯 Applying correct answers...');
        
        // Remove existing indicators
        $('.lilac-correct-indicator').remove();
        
        const questions = $('.wpProQuiz_question');
        console.log('Found questions:', questions.length);
        
        questions.each(function(index) {
            const questionElement = $(this);
            const questionText = questionElement.find('.wpProQuiz_question_text').text().trim();
            
            console.log(`Processing question ${index + 1}:`, questionText.substring(0, 50) + '...');
            
            // Find matching question in our data
            const matchingQuestion = findMatchingQuestion(questionText);
            
            if (matchingQuestion && matchingQuestion.answers) {
                console.log('✅ Found matching question with', matchingQuestion.answers.length, 'answers');
                
                const answerItems = questionElement.find('.wpProQuiz_questionListItem');
                
                answerItems.each(function(answerIndex) {
                    const answerElement = $(this);
                    const answerText = answerElement.find('label').text().trim();
                    
                    // Check if this answer is correct
                    const isCorrect = matchingQuestion.answers.some(answer => 
                        answer.correct && (
                            answerText.includes(answer.text) || 
                            answer.text.includes(answerText.substring(0, 20))
                        )
                    );
                    
                    if (isCorrect) {
                        console.log('✅ Marking answer as correct:', answerText.substring(0, 30));
                        
                        // Add correct indicator
                        const indicator = $('<span class="lilac-correct-indicator" style="color: #46b450; font-weight: bold; margin-left: 10px;">✓ CORRECT</span>');
                        answerElement.find('label').append(indicator);
                        
                        // Add visual styling
                        answerElement.addClass('correct-answer').css({
                            'background-color': '#e8f5e8',
                            'border-left': '4px solid #46b450'
                        });
                    }
                });
            } else {
                console.log('❌ No matching question found for:', questionText.substring(0, 50));
            }
        });
        
        updateDebugInfo();
    }
    
    /**
     * Force answer correction (for debug button)
     */
    function forceAnswerCorrection() {
        console.log('🔧 Force applying answer correction...');
        
        // Clear cache and reload
        window.QuizHintSystem.correctAnswers = {};
        loadCorrectAnswers();
        
        setTimeout(() => {
            applyCorrectAnswers();
        }, 1000);
    }
    
    /**
     * Find matching question in our correct answers data
     */
    function findMatchingQuestion(questionText) {
        const questions = window.QuizHintSystem.correctAnswers;
        
        if (!questions || !Array.isArray(questions)) {
            return null;
        }
        
        return questions.find(q => {
            const qText = q.question_text || '';
            return qText.includes(questionText.substring(0, 30)) || 
                   questionText.includes(qText.substring(0, 30));
        });
    }
    
    /**
     * Get current quiz ID
     */
    function getQuizId() {
        // Try multiple methods to get quiz ID
        const quizElement = $('#wpProQuiz_101, [id^="wpProQuiz_"]');
        if (quizElement.length) {
            const id = quizElement.attr('id').replace('wpProQuiz_', '');
            if (id && id !== '101') return id;
        }
        
        // Check for quiz ID in page
        const quizIdMatch = document.body.className.match(/quiz-(\d+)/);
        if (quizIdMatch) {
            return quizIdMatch[1];
        }
        
        // Check JavaScript variables
        if (window.lilac_quiz_data && window.lilac_quiz_data.quiz_id) {
            return window.lilac_quiz_data.quiz_id;
        }
        
        // Default fallback
        return '11702';
    }
    
    /**
     * Setup quiz monitoring for dynamic changes
     */
    function setupQuizMonitoring() {
        // Monitor for quiz navigation
        $(document).on('click', '.wpProQuiz_button', function() {
            setTimeout(() => {
                applyCorrectAnswers();
                updateDebugInfo();
            }, 500);
        });
        
        // Monitor for answer selection
        $(document).on('change', '.wpProQuiz_questionInput', function() {
            setTimeout(() => {
                updateDebugInfo();
            }, 100);
        });
    }
    
    /**
     * Hardcoded answers for testing when AJAX fails
     */
    function useHardcodedAnswers() {
        console.log('🔧 Using hardcoded answers for testing...');
        
        window.QuizHintSystem.correctAnswers = [
            {
                question_text: 'האם שוטר רשאי לדרוש מרוכב אופניים עם מנוע עזר להיבדק בבדיקת דם',
                answers: [
                    { text: 'כן', correct: true },
                    { text: 'לא', correct: false }
                ]
            }
        ];
        
        applyCorrectAnswers();
    }
    
    // Initialize when document is ready
    $(document).ready(function() {
        // Small delay to ensure all other scripts are loaded
        setTimeout(initializeSystem, 1000);
        
        // Also initialize on window load as backup
        $(window).on('load', function() {
            if (!window.QuizHintSystem.initialized) {
                setTimeout(initializeSystem, 500);
            }
        });
    });
    
    // Expose functions globally for debugging
    window.QuizAnswerSync = {
        init: initializeSystem,
        loadAnswers: loadCorrectAnswers,
        applyAnswers: applyCorrectAnswers,
        forceCorrection: forceAnswerCorrection
    };
    
})(jQuery);
