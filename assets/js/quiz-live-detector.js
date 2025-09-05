// LILAC Live Quiz Question Detector & Answer Validator
// Detects current quiz questions and provides real-time answer validation

(function($) {
    'use strict';

    window.LilacQuizDetector = {
        currentQuestions: {},
        isActive: false,

        init: function() {
            this.detectQuizQuestions();
            this.createValidationTool();
            this.setupRealTimeValidation();
            console.log('LILAC Quiz Detector: Live detection active');
        },

        // Detect current quiz questions on the page
        detectQuizQuestions: function() {
            const self = this;
            self.currentQuestions = {};

            // Find all question containers
            $('.wpProQuiz_questionListItem').each(function(index) {
                const $question = $(this);
                const questionData = self.extractQuestionData($question, index);
                
                if (questionData) {
                    self.currentQuestions[questionData.id] = questionData;
                }
            });

            console.log('LILAC: Detected', Object.keys(self.currentQuestions).length, 'live questions');
            return self.currentQuestions;
        },

        // Extract question data from DOM
        extractQuestionData: function($questionElement, index) {
            // Try multiple methods to get question ID
            let questionId = null;
            
            // Method 1: data attributes
            questionId = $questionElement.attr('data-question-id') || 
                        $questionElement.attr('data-id') ||
                        $questionElement.find('[data-question-id]').attr('data-question-id');

            // Method 2: class names
            if (!questionId) {
                const classMatch = $questionElement.attr('class').match(/question[_-](\d+)/i);
                if (classMatch) questionId = classMatch[1];
            }

            // Method 3: ID attributes
            if (!questionId) {
                const idMatch = $questionElement.attr('id').match(/question[_-](\d+)/i);
                if (idMatch) questionId = idMatch[1];
            }

            // Method 4: hidden inputs
            if (!questionId) {
                const hiddenInput = $questionElement.find('input[name*="question"]').first();
                if (hiddenInput.length) {
                    const nameMatch = hiddenInput.attr('name').match(/\[(\d+)\]/);
                    if (nameMatch) questionId = nameMatch[1];
                }
            }

            // Method 5: use index as fallback
            if (!questionId) {
                questionId = 'q' + (index + 1);
            }

            // Get question text
            const questionText = $questionElement.find('.wpProQuiz_question_text, .question-text, h5, .wpProQuiz_question').first().text().trim();

            // Get answer options
            const answers = [];
            $questionElement.find('.wpProQuiz_questionInput').each(function() {
                const $input = $(this);
                const $label = $input.closest('label').length ? $input.closest('label') : $input.next('label');
                const answerText = $label.text().trim();
                const answerValue = $input.val() || ($input.attr('name').match(/\[(\d+)\]/) ? $input.attr('name').match(/\[(\d+)\]/)[1] : answers.length + 1);
                
                answers.push({
                    value: answerValue,
                    text: answerText,
                    element: $input
                });
            });

            return {
                id: questionId,
                text: questionText,
                answers: answers,
                element: $questionElement,
                correctAnswer: window.lilacGetCorrectAnswer ? window.lilacGetCorrectAnswer(questionId) : null
            };
        },

        // Create validation tool overlay
        createValidationTool: function() {
            const detectedCount = Object.keys(this.currentQuestions).length;
            
            const validatorHtml = `
                <div id="lilac-validator" style="
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 300px;
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    z-index: 999999;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0;">🎯 Answer Validator</h4>
                        <button id="toggle-validator" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 3px 8px; border-radius: 3px; cursor: pointer;">−</button>
                    </div>
                    
                    <div id="validator-content">
                        <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                            <div>Live Questions: <strong>${detectedCount}</strong></div>
                            <div>Database Answers: <strong>${Object.keys(window.lilacQuizCorrectAnswers || {}).length}</strong></div>
                            <div id="validation-status">Status: Ready</div>
                        </div>
                        
                        <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px;">
                            <div style="font-size: 12px; margin-bottom: 5px;">Quick Test:</div>
                            <select id="question-selector" style="width: 100%; padding: 5px; border: none; border-radius: 3px; margin-bottom: 5px;">
                                <option value="">Select Question...</option>
                            </select>
                            <div id="answer-options" style="display: none;"></div>
                            <div id="validation-result" style="margin-top: 5px; font-weight: bold;"></div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing validator
            $('#lilac-validator').remove();
            $('body').append(validatorHtml);

            // Populate question selector
            this.populateQuestionSelector();
            this.bindValidatorEvents();
        },

        populateQuestionSelector: function() {
            const $selector = $('#question-selector');
            $selector.empty().append('<option value="">Select Question...</option>');

            Object.entries(this.currentQuestions).forEach(([id, question]) => {
                const questionPreview = question.text.substring(0, 50) + (question.text.length > 50 ? '...' : '');
                $selector.append(`<option value="${id}">Q${id}: ${questionPreview}</option>`);
            });
        },

        bindValidatorEvents: function() {
            const self = this;

            // Toggle validator
            $('#toggle-validator').on('click', function() {
                const content = $('#validator-content');
                const btn = $(this);
                if (content.is(':visible')) {
                    content.hide();
                    btn.text('+');
                } else {
                    content.show();
                    btn.text('−');
                }
            });

            // Question selection
            $('#question-selector').on('change', function() {
                const questionId = $(this).val();
                if (questionId) {
                    self.showAnswerOptions(questionId);
                } else {
                    $('#answer-options').hide();
                    $('#validation-result').empty();
                }
            });
        },

        showAnswerOptions: function(questionId) {
            const question = this.currentQuestions[questionId];
            if (!question) return;

            const $answerOptions = $('#answer-options');
            let optionsHtml = '<div style="font-size: 12px; margin-bottom: 5px;">Test Answer:</div>';

            question.answers.forEach((answer, index) => {
                const answerPreview = answer.text.substring(0, 30) + (answer.text.length > 30 ? '...' : '');
                optionsHtml += `
                    <button class="test-answer-btn" data-question="${questionId}" data-answer="${answer.value}" style="
                        display: block;
                        width: 100%;
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: none;
                        padding: 5px;
                        margin: 2px 0;
                        border-radius: 3px;
                        cursor: pointer;
                        text-align: left;
                        font-size: 11px;
                    ">${index + 1}. ${answerPreview}</button>
                `;
            });

            $answerOptions.html(optionsHtml).show();

            // Bind answer test buttons
            $('.test-answer-btn').on('click', function() {
                const qId = $(this).data('question');
                const answer = $(this).data('answer');
                self.validateAnswer(qId, answer);
            });
        },

        validateAnswer: function(questionId, selectedAnswer) {
            const isCorrect = window.lilacIsAnswerCorrect ? window.lilacIsAnswerCorrect(questionId, selectedAnswer) : null;
            const correctAnswer = window.lilacGetCorrectAnswer ? window.lilacGetCorrectAnswer(questionId) : null;

            let resultHtml = '';
            if (isCorrect === null) {
                resultHtml = `<div style="color: #ffeb3b;">❓ No data for Q${questionId}</div>`;
            } else if (isCorrect) {
                resultHtml = `<div style="color: #4CAF50;">✅ CORRECT</div>`;
            } else {
                resultHtml = `<div style="color: #f44336;">❌ WRONG (Correct: ${correctAnswer})</div>`;
            }

            $('#validation-result').html(resultHtml);
            $('#validation-status').text(`Last: Q${questionId} → ${isCorrect ? 'Correct' : 'Wrong'}`);

            console.log(`LILAC Validation: Q${questionId} - Selected ${selectedAnswer}, Correct ${correctAnswer}, Result: ${isCorrect}`);
        },

        // Setup real-time validation on answer selection
        setupRealTimeValidation: function() {
            const self = this;

            // Monitor all quiz inputs
            $(document).on('change click', '.wpProQuiz_questionInput', function() {
                if ($(this).is(':checked') || $(this).is(':selected')) {
                    setTimeout(() => {
                        self.handleLiveAnswerSelection($(this));
                    }, 100);
                }
            });

            console.log('LILAC: Real-time validation active');
        },

        handleLiveAnswerSelection: function($input) {
            const questionContainer = $input.closest('.wpProQuiz_questionListItem');
            const questionIndex = $('.wpProQuiz_questionListItem').index(questionContainer);
            
            // Find question data
            let questionData = null;
            Object.values(this.currentQuestions).forEach(q => {
                if (q.element.is(questionContainer)) {
                    questionData = q;
                }
            });

            if (!questionData) {
                // Re-detect if question not found
                this.detectQuizQuestions();
                return;
            }

            const selectedAnswer = $input.val() || ($input.attr('name').match(/\[(\d+)\]/) ? $input.attr('name').match(/\[(\d+)\]/)[1] : null);
            
            if (selectedAnswer) {
                this.showLiveValidation(questionContainer, questionData.id, selectedAnswer);
            }
        },

        showLiveValidation: function($container, questionId, selectedAnswer) {
            const isCorrect = window.lilacIsAnswerCorrect ? window.lilacIsAnswerCorrect(questionId, selectedAnswer) : null;
            const correctAnswer = window.lilacGetCorrectAnswer ? window.lilacGetCorrectAnswer(questionId) : null;

            // Remove existing validation
            $container.find('.lilac-live-validation').remove();

            if (isCorrect === null) return; // No data available

            const validationColor = isCorrect ? '#4CAF50' : '#f44336';
            const validationIcon = isCorrect ? '✅' : '❌';
            const validationText = isCorrect ? 'Correct Answer!' : `Wrong! Correct answer: ${correctAnswer}`;

            const validationElement = $(`
                <div class="lilac-live-validation" style="
                    background: ${validationColor};
                    color: white;
                    padding: 8px 12px;
                    border-radius: 5px;
                    margin: 10px 0;
                    font-weight: bold;
                    font-size: 14px;
                    animation: slideIn 0.3s ease-out;
                ">
                    ${validationIcon} ${validationText}
                </div>
            `);

            $container.append(validationElement);

            // Update validator status
            $('#validation-status').text(`Live: Q${questionId} → ${isCorrect ? 'Correct' : 'Wrong'}`);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                validationElement.fadeOut(500, function() {
                    $(this).remove();
                });
            }, 5000);
        },

        // Public method to check if answer is correct
        isAnswerCorrect: function(questionId, answer) {
            return window.lilacIsAnswerCorrect ? window.lilacIsAnswerCorrect(questionId, answer) : null;
        },

        // Public method to get correct answer
        getCorrectAnswer: function(questionId) {
            return window.lilacGetCorrectAnswer ? window.lilacGetCorrectAnswer(questionId) : null;
        },

        // Refresh detection
        refresh: function() {
            this.detectQuizQuestions();
            this.populateQuestionSelector();
            console.log('LILAC: Quiz detection refreshed');
        }
    };

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .lilac-live-validation {
            animation: slideIn 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);

    // Initialize when DOM is ready and answers are loaded
    $(document).ready(function() {
        function initDetector() {
            if (typeof window.lilacQuizCorrectAnswers !== 'undefined' && 
                Object.keys(window.lilacQuizCorrectAnswers).length > 0 &&
                $('.wpProQuiz_questionListItem').length > 0) {
                
                window.LilacQuizDetector.init();
            } else {
                setTimeout(initDetector, 1000);
            }
        }
        
        setTimeout(initDetector, 500);
    });

})(jQuery);
