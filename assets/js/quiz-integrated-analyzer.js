// LILAC Integrated Quiz Analyzer - Footer Integration
// Combines live quiz analysis with LearnDash quiz footer

(function($) {
    'use strict';

    window.LilacQuizAnalyzer = {
        currentQuiz: null,
        questions: [],
        correctAnswers: {},
        
        init: function() {
            this.createFooterAnalyzer();
            this.loadCorrectAnswers();
            
            // Delay quiz detection to allow page to fully load
            setTimeout(() => {
                this.detectQuizData();
                this.updateAnalyzer();
            }, 500);
            
            // Monitor for dynamic content changes
            this.setupMutationObserver();
        },

        setupMutationObserver: function() {
            const self = this;
            const observer = new MutationObserver(function(mutations) {
                let shouldRedetect = false;
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Check if new quiz content was added
                        for (let node of mutation.addedNodes) {
                            if (node.nodeType === 1 && (
                                node.classList.contains('wpProQuiz_questionListItem') ||
                                node.querySelector && node.querySelector('.wpProQuiz_questionListItem')
                            )) {
                                shouldRedetect = true;
                                break;
                            }
                        }
                    }
                });
                
                if (shouldRedetect) {
                    setTimeout(() => {
                        self.detectQuizData();
                        self.updateAnalyzer();
                    }, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        loadCorrectAnswers: function() {
            // Load answers via AJAX from our PHP script
            const self = this;
            const quizId = this.extractQuizId();
            
            $.ajax({
                url: '/get-quiz-answers.php?quiz_id=' + quizId,
                type: 'GET',
                dataType: 'text',
                success: function(data) {
                    try {
                        // Execute the JavaScript to load answers
                        eval(data);
                        self.correctAnswers = window.lilacQuizCorrectAnswers || {};
                        self.updateAnalyzer();
                    } catch (e) {
                        console.error('LILAC: Error loading answers:', e);
                    }
                },
                error: function() {
                    console.error('LILAC: Failed to load correct answers for quiz', quizId);
                }
            });
        },

        detectQuizData: function() {
            const self = this;
            
            // Get current quiz ID
            const quizId = this.extractQuizId();
            if (quizId) {
                this.currentQuiz = quizId;
            }

            // Detect all questions on the page - try multiple selectors
            const questionSelectors = [
                '.wpProQuiz_questionListItem',
                '.wpProQuiz_list_item',
                '.wpProQuiz_question',
                '.question-item',
                '[data-question-id]',
                '.learndash-question'
            ];

            let questionsFound = 0;
            questionSelectors.forEach(selector => {
                $(selector).each(function(index) {
                    const $question = $(this);
                    // Skip if already processed
                    if ($question.data('lilac-processed')) return;
                    
                    const questionData = self.extractQuestionData($question, questionsFound);
                    if (questionData) {
                        self.questions.push(questionData);
                        $question.data('lilac-processed', true);
                        questionsFound++;
                    }
                });
            });

        },

        extractQuizId: function() {
            
            // Method 1: Get from WordPress post ID (most reliable for quiz posts)
            const bodyClasses = $('body').attr('class') || '';
            const postIdMatch = bodyClasses.match(/postid-(\d+)/);
            if (postIdMatch) {
                return postIdMatch[1];
            }

            // Method 2: Get from single-sfwd_quiz class (LearnDash quiz post type)
            if (bodyClasses.includes('single-sfwd_quiz')) {
                // Look for quiz ID in various places
                const quizIdMatch = bodyClasses.match(/quiz-id-(\d+)|quiz_(\d+)|postid-(\d+)/);
                if (quizIdMatch) {
                    const quizId = quizIdMatch[1] || quizIdMatch[2] || quizIdMatch[3];
                    return quizId;
                }
            }

            // Method 3: Get from article or post element
            const articleId = $('article[id*="post-"]').attr('id');
            if (articleId) {
                const match = articleId.match(/post-(\d+)/);
                if (match) {
                    return match[1];
                }
            }

            // Method 4: Get from URL patterns
            const url = window.location.href;
            const urlPatterns = [
                /\/quiz\/.*?(\d+)/i,
                /quiz[_-](\d+)/i,
                /quizzes\/.*?quiz_id[=:](\d+)/i,
                /p=(\d+)/i,
                /post_id[=:](\d+)/i
            ];
            
            for (let pattern of urlPatterns) {
                const match = url.match(pattern);
                if (match) {
                    return match[1];
                }
            }

            // Method 5: Check for LearnDash quiz data in window
            if (window.learndash_quiz_data && window.learndash_quiz_data.quiz_id) {
                return window.learndash_quiz_data.quiz_id;
            }

            // Method 6: Look for quiz ID in page meta or hidden inputs
            const metaQuizId = $('meta[name="quiz-id"], meta[property="quiz:id"]').attr('content');
            if (metaQuizId) {
                return metaQuizId;
            }

            const hiddenQuizId = $('input[name*="quiz_id"], input[name*="quiz-id"]').val();
            if (hiddenQuizId) {
                return hiddenQuizId;
            }

            return '11702'; // Default quiz ID
        },

        extractQuestionData: function($questionElement, index) {
            // Extract real question ID from LearnDash structure
            let questionId = null;
            
            // Method 1: Look for question pro ID in data attributes or hidden inputs
            questionId = $questionElement.find('input[name*="question_pro_id"]').val() ||
                        $questionElement.find('[data-question-pro-id]').attr('data-question-pro-id') ||
                        $questionElement.attr('data-question-pro-id');

            // Method 2: Extract from form field names
            if (!questionId) {
                const inputName = $questionElement.find('input[name*="question_"]').attr('name');
                if (inputName) {
                    const match = inputName.match(/question_(\d+)/);
                    if (match) questionId = match[1];
                }
            }

            // Method 3: Look in the question container ID or classes
            if (!questionId) {
                const elementId = $questionElement.attr('id');
                if (elementId) {
                    const match = elementId.match(/question[_-](\d+)/i);
                    if (match) questionId = match[1];
                }
            }

            // Method 4: Check parent elements for question ID
            if (!questionId) {
                const $parent = $questionElement.closest('[id*="question"], [class*="question"]');
                if ($parent.length) {
                    const parentId = $parent.attr('id') || $parent.attr('class');
                    const match = parentId.match(/(\d+)/);
                    if (match) questionId = match[1];
                }
            }

            // Method 5: Look for script tags with question data
            if (!questionId) {
                const scriptContent = $questionElement.find('script').text();
                if (scriptContent) {
                    const match = scriptContent.match(/question[_\s]*(?:id|pro)[_\s]*[:\s]*(\d+)/i);
                    if (match) questionId = match[1];
                }
            }

            // Use index as fallback only if no real ID found
            if (!questionId) {
                questionId = 'q' + (index + 1);
            }

            // Get question text
            const questionText = $questionElement.find('.wpProQuiz_question_text, .question-text, h5, .wpProQuiz_question').first().text().trim();

            // Get answer options (find all 4 answers per question)
            const answers = [];
            
            // Try multiple selectors to find all answer inputs
            const answerSelectors = [
                '.wpProQuiz_questionInput',
                'input[type="radio"]',
                'input[type="checkbox"]',
                'input[name*="question"]',
                '.wpProQuiz_questionList input'
            ];
            
            let foundAnswers = [];
            answerSelectors.forEach(selector => {
                $questionElement.find(selector).each(function() {
                    const $input = $(this);
                    // Skip if already found
                    if (foundAnswers.some(a => a.element.is($input))) return;
                    
                    foundAnswers.push({element: $input});
                });
            });
            
            // Process found answers (limit to 4)
            foundAnswers.slice(0, 4).forEach(function(item, idx) {
                const $input = item.element;
                
                // Find associated label text
                let answerText = '';
                
                // Method 1: Label wrapping the input
                const $wrapperLabel = $input.closest('label');
                if ($wrapperLabel.length) {
                    answerText = $wrapperLabel.text().trim();
                }
                
                // Method 2: Label with for attribute
                if (!answerText) {
                    const inputId = $input.attr('id');
                    if (inputId) {
                        const $forLabel = $('label[for="' + inputId + '"]');
                        if ($forLabel.length) {
                            answerText = $forLabel.text().trim();
                        }
                    }
                }
                
                // Method 3: Next sibling label
                if (!answerText) {
                    const $nextLabel = $input.next('label');
                    if ($nextLabel.length) {
                        answerText = $nextLabel.text().trim();
                    }
                }
                
                // Method 4: Parent container text
                if (!answerText) {
                    const $parent = $input.closest('.wpProQuiz_questionListItem, .answer-option, .question-answer');
                    if ($parent.length) {
                        answerText = $parent.text().trim();
                    }
                }
                
                const answerValue = parseInt($input.val()) || (idx + 1);
                
                if (answerText) {
                    answers.push({
                        value: answerValue,
                        text: answerText,
                        element: $input
                    });
                }
            });

            return {
                id: questionId,
                text: questionText,
                answers: answers,
                element: $questionElement,
                correctAnswer: null // Will be filled when answers load
            };
        },

        createFooterAnalyzer: function() {
            // Remove any existing analyzers
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
                    z-index: 999999;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
                    border-top: 3px solid #2196F3;
                ">
                    <div style="max-width: 1200px; margin: 0 auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                <h3 style="margin: 0 15px 0 0; color: #2196F3; font-size: 18px;">🎯 Live Quiz Analyzer</h3>
                                <div id="analyzer-stats" style="display: flex; gap: 20px; font-size: 14px; color: #333;">
                                    <span>Quiz: <strong id="quiz-id-display">${this.currentQuiz || 'Loading...'}</strong></span>
                                    <span>Questions: <strong id="questions-count">${this.questions.length}</strong></span>
                                    <span>Answers: <strong id="answers-loaded">Loading...</strong></span>
                                    <span id="processing-status">Status: Ready</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <button id="toggle-analyzer-details" style="
                                    background: #2196F3;
                                    border: none;
                                    color: white;
                                    padding: 8px 15px;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    font-size: 12px;
                                ">Show Details</button>
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
                        
                        <div id="analyzer-details" style="
                            display: none;
                            margin-top: 15px;
                            padding-top: 15px;
                            border-top: 1px solid #ddd;
                            max-height: 300px;
                            overflow-y: auto;
                            background: #f9f9f9;
                            border-radius: 5px;
                            padding: 15px;
                        ">
                            <div id="questions-analysis"></div>
                        </div>
                    </div>
                </div>
            `;

            $('body').append(analyzerHtml);
            this.bindAnalyzerEvents();
            this.updateAnalyzer();
        },

        bindAnalyzerEvents: function() {
            const self = this;

            $('#toggle-analyzer-details').on('click', function() {
                const $details = $('#analyzer-details');
                const $btn = $(this);
                
                if ($details.is(':visible')) {
                    $details.slideUp();
                    $btn.text('Show Details');
                } else {
                    self.generateDetailedAnalysis();
                    $details.slideDown();
                    $btn.text('Hide Details');
                }
            });

            $('#refresh-analyzer').on('click', function() {
                self.refresh();
            });

            // Monitor answer selections for real-time feedback
            $(document).on('change click', '.wpProQuiz_questionInput', function() {
                if ($(this).is(':checked') || $(this).is(':selected')) {
                    setTimeout(() => {
                        self.handleAnswerSelection($(this));
                    }, 100);
                }
            });
        },

        updateAnalyzer: function() {
            $('#quiz-id-display').text(this.currentQuiz || 'Unknown');
            $('#questions-count').text(this.questions.length);
            $('#answers-loaded').text(Object.keys(this.correctAnswers).length);
            
            const status = Object.keys(this.correctAnswers).length > 0 ? 'Ready ✅' : 'Loading...';
            $('#processing-status').html('Status: ' + status);

            // Update question data with correct answers
            this.questions.forEach(question => {
                question.correctAnswer = this.correctAnswers[question.id] || null;
            });
        },

        generateDetailedAnalysis: function() {
            // Always load clean data from database instead of using DOM extraction
            this.loadQuestionsFromDatabase();
            
            let analysisHtml = '<h4 style="margin: 0 0 10px 0; color: #333;">🎯 Live Quiz Analysis</h4>';
            analysisHtml += '<p style="color: #666;">Loading clean data from database...</p>';
            
            if (this.questions.length > 0) {
                analysisHtml += '<div style="display: grid; gap: 15px; max-height: 400px; overflow-y: auto;">';
                
                this.questions.forEach((question, index) => {
                    const hasCorrectAnswer = question.correctAnswer !== null;
                    const statusColor = hasCorrectAnswer ? '#4CAF50' : '#f44336';
                    const statusIcon = hasCorrectAnswer ? '✅' : '❌';
                    const correctAnswerText = hasCorrectAnswer ? `1 Correct Answer` : 'No Answer';
                    
                    analysisHtml += `
                        <div style="
                            background: #ffffff;
                            padding: 15px;
                            border-radius: 8px;
                            border-left: 4px solid ${statusColor};
                            margin-bottom: 10px;
                            border: 1px solid #e0e0e0;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong style="color: #2196F3;">Question ${index + 1} of ${this.questions.length} (ID: ${question.id}) - </strong>
                                <span style="color: ${statusColor};">${statusIcon} ${correctAnswerText}</span>
                            </div>
                            <div style="font-size: 14px; margin: 10px 0; line-height: 1.4; color: #333;">
                                ${question.text || 'Question text not available'}
                            </div>
                            ${this.generateAnswerOptions(question)}
                        </div>
                    `;
                });
                
                analysisHtml += '</div>';
            }

            // Performance summary matching PHP demo
            const correctCount = this.questions.filter(q => q.correctAnswer !== null).length;
            const totalAnswers = this.questions.reduce((sum, q) => sum + q.answers.length, 0);
            const processingTime = performance.now();
            
            analysisHtml += `
                <div style="
                    margin-top: 15px;
                    padding: 15px;
                    background: #ffffff;
                    border-radius: 8px;
                    border: 1px solid #e0e0e0;
                ">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Performance Summary</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 13px; color: #333;">
                        <div><strong>Questions Processed:</strong> ${this.questions.length}</div>
                        <div><strong>Total Answers:</strong> ${totalAnswers}</div>
                        <div><strong>Correct Answers:</strong> ${correctCount}</div>
                        <div><strong>Processing Time:</strong> ${Math.round(processingTime)}ms ${processingTime < 100 ? 'Excellent' : processingTime < 500 ? 'Good' : 'Slow'}</div>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #666;">
                        <strong>Generated:</strong> ${new Date().toLocaleTimeString()} | <strong>System Ready:</strong> ${correctCount > 0 ? 'Yes' : 'No'}
                    </div>
                </div>
            `;

            $('#questions-analysis').html(analysisHtml);
        },

        generateAnswerOptions: function(question) {
            if (!question.answers || question.answers.length === 0) {
                return '<div style="color: #f44336; font-size: 12px;">No answer options found</div>';
            }

            let optionsHtml = '<div style="margin-top: 10px;"><strong style="color: #333;">Answer Options:</strong><br>';
            const optionLabels = ['A', 'B', 'C', 'D'];
            
            question.answers.forEach((answer, idx) => {
                const isCorrect = question.correctAnswer && (idx + 1) === question.correctAnswer;
                const bgColor = isCorrect ? '#d4edda' : '#f8f9fa';
                const borderColor = isCorrect ? '#4CAF50' : '#dee2e6';
                
                optionsHtml += `
                    <div style="
                        margin: 5px 0;
                        padding: 8px;
                        background: ${bgColor};
                        border: 1px solid ${borderColor};
                        border-radius: 4px;
                        font-size: 12px;
                        color: #333;
                    ">
                        ${optionLabels[idx] || (idx + 1)}. ${answer.text || 'Answer text not available'}
                        ${isCorrect ? ' <strong style="color: #4CAF50;">✓ CORRECT</strong>' : ''}
                    </div>
                `;
            });
            
            optionsHtml += '</div>';
            return optionsHtml;
        },

        loadQuestionsFromDatabase: function() {
            const self = this;
            const quizId = this.extractQuizId();
            
            $.ajax({
                url: '/live-quiz-analyzer-json.php?quiz_id=' + quizId + '&format=json',
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    if (data && data.questions) {
                        // Replace DOM-extracted questions with clean database data
                        self.questions = data.questions.map((q, index) => ({
                            id: q.question_id,
                            text: q.question_text,
                            answers: q.answers || [],
                            correctAnswer: q.correct_answer,
                            element: null
                        }));
                        
                        // Update correct answers object
                        self.correctAnswers = {};
                        data.questions.forEach(q => {
                            if (q.correct_answer) {
                                self.correctAnswers[q.question_id] = q.correct_answer;
                            }
                        });
                        
                        self.updateAnalyzer();
                        self.renderDatabaseAnalysis();
                    }
                },
                error: function() {
                    console.error('LILAC: Failed to load questions from database');
                }
            });
        },

        renderDatabaseAnalysis: function() {
            let analysisHtml = '<h4 style="margin: 0 0 10px 0; color: #333;">🎯 Live Quiz Analysis (Database)</h4>';
            
            if (this.questions.length > 0) {
                analysisHtml += '<div style="display: grid; gap: 15px; max-height: 400px; overflow-y: auto;">';
                
                this.questions.forEach((question, index) => {
                    const hasCorrectAnswer = question.correctAnswer !== null;
                    const statusColor = hasCorrectAnswer ? '#4CAF50' : '#f44336';
                    const statusIcon = hasCorrectAnswer ? '✅' : '❌';
                    const correctAnswerText = hasCorrectAnswer ? `1 Correct Answer` : 'No Answer';
                    
                    analysisHtml += `
                        <div style="
                            background: #ffffff;
                            padding: 15px;
                            border-radius: 8px;
                            border-left: 4px solid ${statusColor};
                            margin-bottom: 10px;
                            border: 1px solid #e0e0e0;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong style="color: #2196F3;">Question ${index + 1} of ${this.questions.length} (ID: ${question.id}) - </strong>
                                <span style="color: ${statusColor};">${statusIcon} ${correctAnswerText}</span>
                            </div>
                            <div style="font-size: 14px; margin: 10px 0; line-height: 1.4; color: #333;">
                                ${question.text || 'Question text not available'}
                            </div>
                            ${this.generateAnswerOptions(question)}
                        </div>
                    `;
                });
                
                analysisHtml += '</div>';
            } else {
                analysisHtml += '<p style="color: #666;">No questions found in database.</p>';
            }

            // Performance summary
            const correctCount = this.questions.filter(q => q.correctAnswer !== null).length;
            const totalAnswers = this.questions.reduce((sum, q) => sum + q.answers.length, 0);
            
            analysisHtml += `
                <div style="
                    margin-top: 15px;
                    padding: 15px;
                    background: #ffffff;
                    border-radius: 8px;
                    border: 1px solid #e0e0e0;
                ">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Performance Summary</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 13px; color: #333;">
                        <div><strong>Questions Processed:</strong> ${this.questions.length}</div>
                        <div><strong>Total Answers:</strong> ${totalAnswers}</div>
                        <div><strong>Correct Answers:</strong> ${correctCount}</div>
                        <div><strong>Data Source:</strong> Clean Database</div>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #666;">
                        <strong>Generated:</strong> ${new Date().toLocaleTimeString()} | <strong>System Ready:</strong> ${correctCount > 0 ? 'Yes' : 'No'}
                    </div>
                </div>
            `;

            $('#questions-analysis').html(analysisHtml);
        },

        handleAnswerSelection: function($input) {
            const questionContainer = $input.closest('.wpProQuiz_questionListItem');
            const questionIndex = $('.wpProQuiz_questionListItem').index(questionContainer);
            
            if (questionIndex >= 0 && questionIndex < this.questions.length) {
                const question = this.questions[questionIndex];
                const selectedAnswer = parseInt($input.val()) || 1;
                
                this.showAnswerFeedback(questionContainer, question, selectedAnswer);
            }
        },

        showAnswerFeedback: function($container, question, selectedAnswer) {
            if (!question.correctAnswer) return;

            const isCorrect = (selectedAnswer === question.correctAnswer);
            
            // Remove existing feedback
            $container.find('.lilac-answer-feedback').remove();

            const feedbackColor = isCorrect ? '#4CAF50' : '#f44336';
            const feedbackIcon = isCorrect ? '✅' : '❌';
            const feedbackText = isCorrect ? 'Correct Answer!' : `Wrong! Correct answer: ${question.correctAnswer}`;

            const feedback = $(`
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

            $container.append(feedback);

            // Update status
            $('#processing-status').html(`Last: Q${question.id} → ${isCorrect ? 'Correct' : 'Wrong'}`);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                feedback.fadeOut(500, function() {
                    $(this).remove();
                });
            }, 5000);
        },

        refresh: function() {
            this.questions = [];
            this.detectQuizData();
            this.loadCorrectAnswers();
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
        
        /* Adjust page bottom padding to accommodate footer */
        body {
            padding-bottom: 80px !important;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .lilac-footer-analyzer {
                padding: 10px 15px !important;
            }
            .lilac-footer-analyzer h3 {
                font-size: 16px !important;
            }
            .lilac-footer-analyzer #analyzer-stats {
                flex-direction: column !important;
                gap: 5px !important;
            }
        }
    `;
    document.head.appendChild(style);

            // Initialize when DOM is ready
    $(document).ready(function() {
        // Debug: Log what elements we can find
        
        // Always initialize - let the analyzer handle detection
        window.LilacQuizAnalyzer.init();
        
        // Also try after LearnDash loads
        setTimeout(function() {
            window.LilacQuizAnalyzer.detectQuizData();
            window.LilacQuizAnalyzer.updateAnalyzer();
        }, 2000);
    });

})(jQuery);
