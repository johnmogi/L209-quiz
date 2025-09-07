/**
 * LILAC Quiz Unified System
 * Consolidates all quiz answer detection and display functionality
 * Replaces: quiz-answer-fix.js, quiz-integrated-analyzer.js, quiz-comprehensive-system.js
 */

(function($) {
    'use strict';
    
    console.log('🔧 LILAC Quiz Unified System: Starting...');
    
    // Single source of truth for quiz data
    const QuizSystem = {
        initialized: false,
        quizData: null,
        correctAnswers: {},
        
        init: function() {
            if (this.initialized) {
                console.log('🔧 Unified system already initialized');
                return;
            }
            
            console.log('🔧 Initializing unified quiz system...');
            
            // Try to load quiz data, retry if not available
            const dataLoaded = this.loadQuizData();
            if (!dataLoaded) {
                // Retry after delay
                setTimeout(() => {
                    console.log('🔧 Retrying quiz data load...');
                    this.loadQuizData();
                }, 500);
            }
            
            // Run answer fix immediately and with delays
            this.fixAnswerDisplay();
            setTimeout(() => this.fixAnswerDisplay(), 1000);
            setTimeout(() => this.fixAnswerDisplay(), 3000);
            
            // Set up limited mutation observer
            this.setupObserver();
            
            this.initialized = true;
            console.log('🔧 Unified system initialization complete');
        },
        
        loadQuizData: function() {
            // Use embedded quiz data as single source of truth
            if (typeof window.lilacQuizData !== 'undefined' && window.lilacQuizData.questions) {
                this.quizData = window.lilacQuizData;
                
                // Build correct answers lookup
                this.correctAnswers = {};
                this.quizData.questions.forEach((question, index) => {
                    if (question.answers && Array.isArray(question.answers)) {
                        question.answers.forEach((answer, answerIndex) => {
                            if (answer.is_correct) {
                                this.correctAnswers[question.id] = answerIndex + 1; // 1-based
                                this.correctAnswers[index] = answerIndex + 1; // Also by position
                            }
                        });
                    }
                });
                
                console.log('🔧 Loaded quiz data:', this.quizData.questions.length, 'questions');
                console.log('🔧 Correct answers:', this.correctAnswers);
                
                // Make functions globally available
                window.lilacIsAnswerCorrect = this.isAnswerCorrect.bind(this);
                window.lilacGetCorrectAnswer = this.getCorrectAnswer.bind(this);
                
                // Also make data available for debugger
                window.lilacQuizCorrectAnswers = this.correctAnswers;
                
                return true; // Data loaded successfully
            } else {
                console.log('🔧 Quiz data not yet available, will retry...');
                return false; // Data not available yet
            }
        },
        
        isAnswerCorrect: function(questionIndex, selectedAnswer) {
            // Convert to integers for reliable comparison
            const qIndex = parseInt(questionIndex);
            const selected = parseInt(selectedAnswer);
            const correct = parseInt(this.correctAnswers[qIndex] || this.correctAnswers[qIndex - 1]);
            
            const isCorrect = selected === correct;
            console.log('🔧 Answer check: Q' + qIndex + ', Selected: ' + selected + ', Correct: ' + correct + ', Result: ' + isCorrect);
            
            return isCorrect;
        },
        
        getCorrectAnswer: function(questionIndex) {
            const qIndex = parseInt(questionIndex);
            const correct = this.correctAnswers[qIndex] || this.correctAnswers[qIndex - 1];
            console.log('🔧 Get correct answer for Q' + qIndex + ':', correct);
            return correct;
        },
        
        fixAnswerDisplay: function() {
            console.log('🔧 Running unified answer display fix...');
            
            // Hide incorrect "Correct answer" labels
            $('.wpProQuiz_content .ld-quiz-question-item__status--missed').each(function() {
                const $this = $(this);
                const text = $this.text().trim();
                if ((text === 'Correct answer' || text === 'תשובה נכונה') && 
                    !$this.hasClass('lilac-unified-processed')) {
                    $this.hide();
                    $this.addClass('lilac-unified-processed');
                    console.log('🔧 Hidden incorrect label');
                }
            });
            
            // Mark actual correct answers if quiz data is available
            if (this.quizData && this.quizData.questions) {
                $('.wpProQuiz_questionList').each((questionIndex, questionElement) => {
                    const $question = $(questionElement);
                    const questionData = this.quizData.questions[questionIndex];
                    
                    if (!questionData) return;
                    
                    // Find and mark the correct answer
                    if (questionData.answers && Array.isArray(questionData.answers)) {
                        questionData.answers.forEach((answer, answerIndex) => {
                            if (answer.is_correct) {
                                const $answerItem = $question.find('.wpProQuiz_questionListItem').eq(answerIndex);
                                
                                // Only add indicator if not already present
                                if (!$answerItem.find('.lilac-unified-correct').length) {
                                    const $indicator = $('<span class="lilac-unified-correct">✓ נכון</span>');
                                    $indicator.css({
                                        'color': '#4CAF50',
                                        'font-weight': 'bold',
                                        'background': '#E8F5E8',
                                        'padding': '2px 6px',
                                        'border-radius': '3px',
                                        'margin-left': '10px',
                                        'display': 'inline-block'
                                    });
                                    $answerItem.append($indicator);
                                    console.log('🔧 Marked correct answer for Q' + (questionIndex + 1));
                                }
                            }
                        });
                    }
                });
            }
        },
        
        setupObserver: function() {
            let observerCount = 0;
            const maxRuns = 5; // Reduced limit
            
            const observer = new MutationObserver((mutations) => {
                if (observerCount >= maxRuns) {
                    observer.disconnect();
                    console.log('🔧 Observer stopped after', maxRuns, 'runs');
                    return;
                }
                
                let shouldFix = false;
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1 && 
                                (node.classList.contains('wpProQuiz_questionList') ||
                                 node.querySelector && node.querySelector('.wpProQuiz_questionList'))) {
                                shouldFix = true;
                            }
                        });
                    }
                });
                
                if (shouldFix) {
                    observerCount++;
                    setTimeout(() => this.fixAnswerDisplay(), 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Auto-disconnect after 8 seconds
            setTimeout(() => {
                observer.disconnect();
                console.log('🔧 Observer auto-disconnected');
            }, 8000);
        }
    };
    
    // Simple immediate initialization
    console.log('🔧 Attempting immediate initialization...');
    QuizSystem.init();
    
    // Backup initialization with jQuery ready
    if (typeof $ !== 'undefined') {
        $(document).ready(() => {
            console.log('🔧 jQuery DOM ready, re-initializing...');
            QuizSystem.init();
        });
    }
    
    // Final fallback with delay
    setTimeout(() => {
        console.log('🔧 Delayed fallback initialization...');
        QuizSystem.init();
    }, 1000);
    
})(jQuery);
