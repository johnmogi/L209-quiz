/**
 * LILAC Quiz Master System - Single Unified Source
 * Combines all quiz functionality: debugger, answer detection, correct answer display, and live analysis
 * Replaces all previous quiz scripts to eliminate conflicts
 */

(function($) {
    'use strict';
    
    console.log('🎯 LILAC Quiz Master System: Initializing...');
    
    // Global state management
    window.LilacQuizMaster = {
        // Core data
        quizId: null,
        questions: [],
        correctAnswers: {},
        
        // UI elements
        debugger: null,
        analyzer: null,
        
        // State flags
        initialized: false,
        debuggerVisible: false,
        
        // Initialize the entire system
        init: function() {
            console.log('🎯 Master System: Starting initialization...');
            
            this.detectQuizId();
            this.loadQuizData();
            this.createDebugger();
            this.createAnalyzer();
            this.setupEventListeners();
            this.setupMutationObserver();
            
            // Delayed initialization for dynamic content
            setTimeout(() => {
                this.detectQuestions();
                this.updateAllDisplays();
            }, 500);
            
            this.initialized = true;
            console.log('🎯 Master System: Initialization complete');
        },
        
        // Detect current quiz ID
        detectQuizId: function() {
            // Method 1: WordPress post ID from body classes
            const bodyClasses = $('body').attr('class') || '';
            const postIdMatch = bodyClasses.match(/postid-(\d+)/);
            if (postIdMatch) {
                this.quizId = postIdMatch[1];
                return;
            }
            
            // Method 2: From embedded quiz data
            if (window.lilacQuizData && window.lilacQuizData.quiz_id) {
                this.quizId = window.lilacQuizData.quiz_id;
                return;
            }
            
            // Method 3: Default fallback
            this.quizId = '11702';
            console.log('🎯 Master System: Using default quiz ID:', this.quizId);
        },
        
        // Load quiz data from server
        loadQuizData: function() {
            const self = this;
            
            // Try embedded data first
            if (window.lilacQuizData && window.lilacQuizData.questions) {
                console.log('🎯 Master System: Using embedded quiz data');
                this.processQuizData(window.lilacQuizData);
                return;
            }
            
            // Load from server
            $.ajax({
                url: '/simple-quiz-data.php?quiz_id=' + this.quizId,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log('🎯 Master System: Loaded quiz data from server:', data);
                    if (data.success && data.questions) {
                        self.processQuizData(data);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('🎯 Master System: Failed to load quiz data:', error);
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
                window.lilacIsAnswerCorrect = (questionIndex, answerValue) => {
                    const questionId = Object.keys(this.correctAnswers)[questionIndex];
                    return this.correctAnswers[questionId] === answerValue;
                };
                window.lilacGetCorrectAnswer = (questionIndex) => {
                    const questionId = Object.keys(this.correctAnswers)[questionIndex];
                    return this.correctAnswers[questionId];
                };
            }
            
            this.updateAllDisplays();
        },
        
        // Detect questions on the page
        detectQuestions: function() {
            const self = this;
            this.questions = [];
            
            $('.wpProQuiz_questionListItem, .wpProQuiz_list_item').each(function(index) {
                const $question = $(this);
                
                // Skip if already processed
                if ($question.data('lilac-processed')) return;
                
                const questionData = self.extractQuestionData($question, index);
                if (questionData) {
                    self.questions.push(questionData);
                    $question.data('lilac-processed', true);
                }
            });
            
            console.log('🎯 Master System: Detected', this.questions.length, 'questions');
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
        
        // Create debugger UI
        createDebugger: function() {
            // Remove existing debugger
            $('.lilac-quiz-debugger').remove();
            
            const debuggerHtml = `
                <div class="lilac-quiz-debugger" style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.9);
                    color: #fff;
                    padding: 15px;
                    border-radius: 8px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    z-index: 999999;
                    min-width: 280px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    border: 2px solid #4CAF50;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #4CAF50; font-size: 14px;">🔧 Quiz Debugger (Master)</h4>
                        <button id="toggle-debugger" style="
                            background: #4CAF50;
                            border: none;
                            color: white;
                            padding: 4px 8px;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 10px;
                        ">Hide</button>
                    </div>
                    <div id="debugger-content">
                        <div id="debugger-stats"></div>
                        <div id="debugger-functions" style="margin-top: 10px; font-size: 11px;"></div>
                    </div>
                </div>
            `;
            
            // Only show for admin users
            if ($('body').hasClass('admin-bar') || $('body').hasClass('logged-in')) {
                $('body').append(debuggerHtml);
                this.debugger = $('.lilac-quiz-debugger');
                this.debuggerVisible = true;
                
                // Bind debugger events
                $('#toggle-debugger').on('click', () => {
                    const $content = $('#debugger-content');
                    if ($content.is(':visible')) {
                        $content.hide();
                        $('#toggle-debugger').text('Show');
                    } else {
                        $content.show();
                        $('#toggle-debugger').text('Hide');
                        this.updateDebugger();
                    }
                });
            }
        },
        
        // Create analyzer footer
        createAnalyzer: function() {
            // Remove existing analyzer
            $('.lilac-footer-analyzer').remove();
            
            const analyzerHtml = `
                <div class="lilac-footer-analyzer" style="
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: #ffffff;
                    color: #333333;
                    padding: 15px 20px;
                    z-index: 999998;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
                    border-top: 3px solid #2196F3;
                ">
                    <div style="max-width: 1200px; margin: 0 auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                <h3 style="margin: 0 15px 0 0; color: #2196F3; font-size: 18px;">🎯 Live Quiz Analyzer</h3>
                                <div id="analyzer-stats" style="display: flex; gap: 20px; font-size: 14px; color: #333;">
                                    <span>Quiz: <strong id="quiz-id-display">Loading...</strong></span>
                                    <span>Questions: <strong id="questions-count">0</strong></span>
                                    <span>Answers: <strong id="answers-loaded">0</strong></span>
                                    <span id="processing-status">Status: Initializing</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <button id="refresh-analyzer" style="
                                    background: #4CAF50;
                                    border: none;
                                    color: white;
                                    padding: 8px 15px;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    font-size: 12px;
                                ">Refresh</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(analyzerHtml);
            $('body').css('padding-bottom', '80px');
            
            // Bind analyzer events
            $('#refresh-analyzer').on('click', () => {
                this.refresh();
            });
        },
        
        // Update debugger display
        updateDebugger: function() {
            if (!this.debugger || !this.debuggerVisible) return;
            
            const questionsCount = this.questions.length;
            const hintButtons = $('.wpProQuiz_questionListItem .wpProQuiz_tip').length;
            const answersCount = Object.keys(this.correctAnswers).length;
            
            const stats = `
                <div style="line-height: 1.4;">
                    <div>Quiz Container: ${$('.wpProQuiz_content').length > 0 ? '✅' : '❌'}</div>
                    <div>Questions: ${questionsCount}</div>
                    <div>Hint Buttons: ${hintButtons}</div>
                    <div>Custom Hint: ${$('.lilac-hint-button').length > 0 ? '✅' : '❌'}</div>
                    <div>Master System: ✅</div>
                    <div>Quiz Data: ${answersCount > 0 ? '✅' : '❌'}</div>
                </div>
            `;
            
            const functions = `
                <div style="color: #90EE90;">
                    Global Functions Available:<br>
                    • lilacIsAnswerCorrect: ${typeof window.lilacIsAnswerCorrect === 'function' ? '✅' : '❌'}<br>
                    • lilacGetCorrectAnswer: ${typeof window.lilacGetCorrectAnswer === 'function' ? '✅' : '❌'}<br>
                    • lilacQuizCorrectAnswers: ${typeof window.lilacQuizCorrectAnswers === 'object' ? '✅' : '❌'}
                </div>
            `;
            
            $('#debugger-stats').html(stats);
            $('#debugger-functions').html(functions);
        },
        
        // Update analyzer display
        updateAnalyzer: function() {
            $('#quiz-id-display').text(this.quizId || 'Unknown');
            $('#questions-count').text(this.questions.length);
            $('#answers-loaded').text(Object.keys(this.correctAnswers).length);
            
            const status = Object.keys(this.correctAnswers).length > 0 ? 'Ready ✅' : 'Loading...';
            $('#processing-status').html('Status: ' + status);
        },
        
        // Update all displays
        updateAllDisplays: function() {
            this.updateDebugger();
            this.updateAnalyzer();
            this.fixAnswerDisplay();
        },
        
        // Fix answer display (remove incorrect "Correct answer" labels)
        fixAnswerDisplay: function() {
            console.log('🎯 Master System: Fixing answer display...');
            
            // Hide all incorrect "Correct answer" labels
            $('.ld-quiz-question-item__status--missed').each(function() {
                const $this = $(this);
                const text = $this.text().trim();
                if (text.includes('Correct answer') || text.includes('תשובה נכונה')) {
                    $this.hide();
                }
            });
            
            // Show correct answers based on our data
            this.questions.forEach((question, questionIndex) => {
                if (!question.correctAnswer) return;
                
                const $questionElement = question.element;
                if (!$questionElement || !$questionElement.length) return;
                
                // Find the correct answer option
                question.answers.forEach((answer, answerIndex) => {
                    if (answer.value === question.correctAnswer) {
                        const $answerItem = $questionElement.find('.wpProQuiz_questionListItem').eq(answerIndex);
                        if ($answerItem.length === 0) return;
                        
                        // Remove existing status
                        $answerItem.find('.lilac-correct-indicator').remove();
                        
                        // Add correct answer indicator
                        const $indicator = $('<span class="lilac-correct-indicator"></span>').css({
                            'color': '#4CAF50',
                            'font-weight': 'bold',
                            'background': '#E8F5E8',
                            'padding': '2px 6px',
                            'border-radius': '3px',
                            'margin-left': '10px',
                            'display': 'inline-block',
                            'font-size': '12px'
                        }).text('✓ תשובה נכונה');
                        
                        $answerItem.append($indicator);
                        $answerItem.addClass('quiz-correct-answer');
                        
                        console.log('🎯 Master System: Marked correct answer for question', question.id);
                    }
                });
            });
        },
        
        // Setup event listeners
        setupEventListeners: function() {
            const self = this;
            
            // Monitor answer selections
            $(document).on('change click', '.wpProQuiz_questionInput', function() {
                if ($(this).is(':checked') || $(this).is(':selected')) {
                    setTimeout(() => {
                        self.handleAnswerSelection($(this));
                    }, 100);
                }
            });
        },
        
        // Setup mutation observer for dynamic content
        setupMutationObserver: function() {
            const self = this;
            
            const observer = new MutationObserver(function(mutations) {
                let shouldUpdate = false;
                
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) {
                                if ($(node).hasClass('wpProQuiz_content') || 
                                    $(node).find('.wpProQuiz_content').length > 0 ||
                                    $(node).hasClass('wpProQuiz_questionListItem') ||
                                    $(node).find('.wpProQuiz_questionListItem').length > 0) {
                                    shouldUpdate = true;
                                }
                            }
                        });
                    }
                });
                
                if (shouldUpdate) {
                    setTimeout(() => {
                        self.detectQuestions();
                        self.updateAllDisplays();
                    }, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        // Handle answer selection
        handleAnswerSelection: function($input) {
            const $questionContainer = $input.closest('.wpProQuiz_questionListItem');
            const questionIndex = $('.wpProQuiz_questionListItem').index($questionContainer);
            
            if (questionIndex >= 0 && questionIndex < this.questions.length) {
                const question = this.questions[questionIndex];
                const selectedAnswer = parseInt($input.val()) || 1;
                
                this.showAnswerFeedback($questionContainer, question, selectedAnswer);
            }
        },
        
        // Show answer feedback
        showAnswerFeedback: function($container, question, selectedAnswer) {
            if (!question.correctAnswer) return;
            
            const isCorrect = (selectedAnswer === question.correctAnswer);
            
            // Remove existing feedback
            $container.find('.lilac-answer-feedback').remove();
            
            const feedbackColor = isCorrect ? '#4CAF50' : '#f44336';
            const feedbackIcon = isCorrect ? '✅' : '❌';
            const feedbackText = isCorrect ? 'Correct Answer!' : `Wrong! Correct answer: ${question.correctAnswer}`;
            
            const $feedback = $(`
                <div class="lilac-answer-feedback" style="
                    background: ${feedbackColor};
                    color: white;
                    padding: 8px 12px;
                    border-radius: 5px;
                    margin: 10px 0;
                    font-weight: bold;
                    animation: slideInFromTop 0.3s ease-out;
                ">
                    ${feedbackIcon} ${feedbackText}
                </div>
            `);
            
            $container.append($feedback);
            
            // Update status
            $('#processing-status').html(`Last: Q${question.id} → ${isCorrect ? 'Correct' : 'Wrong'}`);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                $feedback.fadeOut(500, function() {
                    $(this).remove();
                });
            }, 5000);
        },
        
        // Refresh the entire system
        refresh: function() {
            console.log('🎯 Master System: Refreshing...');
            this.questions = [];
            this.correctAnswers = {};
            
            this.detectQuizId();
            this.loadQuizData();
            this.detectQuestions();
            this.updateAllDisplays();
        }
    };
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInFromTop {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .lilac-answer-feedback {
            animation: slideInFromTop 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        console.log('🎯 LILAC Quiz Master System: DOM Ready - Starting...');
        window.LilacQuizMaster.init();
        
        // Additional initialization after LearnDash loads
        setTimeout(function() {
            window.LilacQuizMaster.detectQuestions();
            window.LilacQuizMaster.updateAllDisplays();
        }, 2000);
    });
    
})(jQuery);
