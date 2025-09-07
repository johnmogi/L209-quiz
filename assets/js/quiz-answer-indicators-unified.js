/**
 * LILAC Quiz Answer Indicators - Unified System
 * Consolidates correct/incorrect answer indicators from 3 separate scripts into ONE
 * Combines: quiz-answer-fix.js + quiz-comprehensive-system.js + quiz-integrated-analyzer.js
 */

(function($) {
    'use strict';
    
    console.log('🔧 LILAC Quiz Answer Indicators Unified: Starting...');
    
    // Global state
    window.LilacAnswerIndicators = {
        currentQuiz: null,
        questions: [],
        correctAnswers: {},
        initialized: false,
        
        // Initialize the unified system
        init: function() {
            console.log('🔧 Answer Indicators: Initializing unified system...');
            
            this.detectQuizId();
            this.loadCorrectAnswers();
            this.setupAnswerFix();
            this.setupAnswerFeedback();
            this.setupMutationObserver();
            
            // Delayed initialization for dynamic content
            setTimeout(() => {
                this.detectQuestions();
                this.fixAnswerDisplay();
            }, 500);
            
            this.initialized = true;
            console.log('🔧 Answer Indicators: Unified system initialized');
        },
        
        // Detect current quiz ID
        detectQuizId: function() {
            // Method 1: WordPress post ID from body classes
            const bodyClasses = $('body').attr('class') || '';
            const postIdMatch = bodyClasses.match(/postid-(\d+)/);
            if (postIdMatch) {
                this.currentQuiz = postIdMatch[1];
                return;
            }
            
            // Method 2: From embedded quiz data
            if (window.lilacQuizData && window.lilacQuizData.quiz_id) {
                this.currentQuiz = window.lilacQuizData.quiz_id;
                return;
            }
            
            // Method 3: Default fallback
            this.currentQuiz = '11702';
            console.log('🔧 Answer Indicators: Using quiz ID:', this.currentQuiz);
        },
        
        // Load correct answers from server or embedded data
        loadCorrectAnswers: function() {
            const self = this;
            
            // Try embedded data first (from quiz-integrated-analyzer functionality)
            if (window.lilacQuizData && window.lilacQuizData.questions) {
                console.log('🔧 Answer Indicators: Using embedded quiz data');
                this.processQuizData(window.lilacQuizData);
                return;
            }
            
            // Load from server (from quiz-integrated-analyzer functionality)
            $.ajax({
                url: '/simple-quiz-data.php?quiz_id=' + this.currentQuiz,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log('🔧 Answer Indicators: Loaded quiz data from server:', data);
                    if (data.success && data.questions) {
                        self.processQuizData(data);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('🔧 Answer Indicators: Failed to load quiz data:', error);
                }
            });
        },
        
        // Process loaded quiz data
        processQuizData: function(data) {
            this.correctAnswers = {};
            
            if (data.questions) {
                data.questions.forEach((q, index) => {
                    if (q.correct_answer) {
                        this.correctAnswers[q.question_id || index] = q.correct_answer;
                    }
                });
                
                // Make available globally for compatibility
                window.lilacQuizCorrectAnswers = this.correctAnswers;
            }
            
            this.fixAnswerDisplay();
        },
        
        // Detect questions on the page
        detectQuestions: function() {
            const self = this;
            this.questions = [];
            
            $('.wpProQuiz_questionListItem, .wpProQuiz_list_item, .wpProQuiz_questionList').each(function(index) {
                const $question = $(this);
                
                // Skip if already processed
                if ($question.data('lilac-processed')) return;
                
                const questionData = self.extractQuestionData($question, index);
                if (questionData) {
                    self.questions.push(questionData);
                    $question.data('lilac-processed', true);
                }
            });
            
            console.log('🔧 Answer Indicators: Detected', this.questions.length, 'questions');
        },
        
        // Extract question data from DOM element
        extractQuestionData: function($element, index) {
            // Get question ID
            let questionId = $element.find('input[name*="question_pro_id"]').val() ||
                           $element.attr('data-question-id') ||
                           ('q' + (index + 1));
            
            // Get question text
            const questionText = $element.find('.wpProQuiz_question_text, .question-text, h5').first().text().trim();
            
            // Get answers
            const answers = [];
            $element.find('.wpProQuiz_questionInput').each(function(idx) {
                const $input = $(this);
                const $label = $input.closest('label').length ? $input.closest('label') : $input.next('label');
                const answerText = $label.text().trim();
                
                if (answerText) {
                    answers.push({
                        value: parseInt($input.val()) || (idx + 1),
                        text: answerText,
                        element: $input
                    });
                }
            });
            
            return {
                id: questionId,
                text: questionText,
                answers: answers,
                element: $element,
                correctAnswer: this.correctAnswers[questionId] || null
            };
        },
        
        // Setup answer fix - AGGRESSIVE FALSE POSITIVE REMOVAL
        setupAnswerFix: function() {
            // Run aggressive cleanup immediately and continuously
            this.fixAnswerDisplay();
            
            // Run cleanup multiple times with different delays
            setTimeout(() => this.fixAnswerDisplay(), 100);
            setTimeout(() => this.fixAnswerDisplay(), 500);
            setTimeout(() => this.fixAnswerDisplay(), 1000);
            setTimeout(() => this.fixAnswerDisplay(), 2000);
            setTimeout(() => this.fixAnswerDisplay(), 3000);
            setTimeout(() => this.fixAnswerDisplay(), 5000);
        },
        
        // Main answer display fix function - REMOVE ALL FALSE POSITIVES
        fixAnswerDisplay: function() {
            console.log('🔧 Answer Indicators: REMOVING ALL false positive indicators...');
            
            // AGGRESSIVE REMOVAL - Hide ALL "Correct answer" labels completely
            $('.ld-quiz-question-item__status--missed').each(function() {
                const $this = $(this);
                if ($this.text().includes('Correct answer') || $this.text().includes('תשובה נכונה')) {
                    $this.hide();
                    console.log('🔧 Answer Indicators: Hidden false positive label');
                }
            });
            
            // Remove any elements with "Correct answer" text
            $('*').filter(function() {
                return $(this).text().includes('Correct answer') && 
                       !$(this).hasClass('quiz-verified-correct');
            }).hide();
            
            // Additional aggressive cleanup
            setTimeout(() => {
                $('.ld-quiz-question-item__status--missed').hide();
                $('*:contains("Correct answer")').not('.quiz-verified-correct').hide();
                console.log('🔧 Answer Indicators: Aggressive cleanup completed');
            }, 100);
            
            // Continue aggressive cleanup every 2 seconds
            setInterval(() => {
                $('.ld-quiz-question-item__status--missed').hide();
                $('*:contains("Correct answer")').not('.quiz-verified-correct').hide();
            }, 2000);
        },
        
        // Setup answer feedback system (from quiz-comprehensive-system.js)
        setupAnswerFeedback: function() {
            console.log('🔧 Answer Indicators: Setting up answer feedback system...');
            
            // Monitor answer selections
            $(document).on('change', '.wpProQuiz_questionList input[type="radio"], .wpProQuiz_questionList input[type="checkbox"]', (e) => {
                const $selectedAnswer = $(e.target);
                const $questionContainer = $selectedAnswer.closest('.wpProQuiz_questionList');
                
                console.log('🔧 Answer Indicators: Answer selected:', $selectedAnswer.val());
                
                // Clear previous feedback
                $questionContainer.find('.lilac-answer-feedback').remove();
                
                // Add feedback based on answer correctness
                setTimeout(() => {
                    const isCorrect = $selectedAnswer.closest('li').hasClass('wpProQuiz_correct') || 
                                    $selectedAnswer.data('correct') === true;
                    
                    const feedbackHtml = isCorrect ? 
                        '<div class="lilac-answer-feedback correct" style="color: #4CAF50; font-weight: bold; margin: 5px 0;">✅ תשובה נכונה!</div>' :
                        '<div class="lilac-answer-feedback incorrect" style="color: #f44336; font-weight: bold; margin: 5px 0;">❌ תשובה לא נכונה</div>';
                    
                    $questionContainer.append(feedbackHtml);
                    
                    console.log('🔧 Answer Indicators: Feedback added:', isCorrect ? 'Correct' : 'Incorrect');
                    
                    // Auto-hide feedback after 3 seconds
                    setTimeout(() => {
                        $questionContainer.find('.lilac-answer-feedback').fadeOut(500, function() {
                            $(this).remove();
                        });
                    }, 3000);
                }, 100);
            });
        },
        
        // Setup mutation observer for dynamic content (consolidated from all 3 scripts)
        setupMutationObserver: function() {
            const self = this;
            
            const observer = new MutationObserver(function(mutations) {
                let shouldFix = false;
                let shouldRedetect = false;
                
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) { // Element node
                                if ($(node).hasClass('wpProQuiz_content') || 
                                    $(node).find('.wpProQuiz_content').length > 0 ||
                                    $(node).hasClass('wpProQuiz_questionList') ||
                                    $(node).find('.wpProQuiz_questionList').length > 0 ||
                                    $(node).hasClass('wpProQuiz_questionListItem') ||
                                    $(node).find('.wpProQuiz_questionListItem').length > 0) {
                                    shouldFix = true;
                                    shouldRedetect = true;
                                }
                            }
                        });
                    }
                });
                
                if (shouldRedetect) {
                    setTimeout(() => {
                        self.detectQuestions();
                    }, 100);
                }
                
                if (shouldFix) {
                    setTimeout(() => {
                        self.fixAnswerDisplay();
                    }, 100);
                }
            });
            
            // Start observing
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        // Refresh the entire system
        refresh: function() {
            console.log('🔧 Answer Indicators: Refreshing unified system...');
            this.questions = [];
            this.correctAnswers = {};
            
            this.detectQuizId();
            this.loadCorrectAnswers();
            this.detectQuestions();
            this.fixAnswerDisplay();
        }
    };
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        console.log('🔧 LILAC Answer Indicators: DOM Ready - Starting unified system...');
        window.LilacAnswerIndicators.init();
        
        // Additional initialization after LearnDash loads
        setTimeout(function() {
            window.LilacAnswerIndicators.detectQuestions();
            window.LilacAnswerIndicators.fixAnswerDisplay();
        }, 2000);
    });
    
    console.log('🔧 LILAC Quiz Answer Indicators Unified: Loaded');
    
})(jQuery);
