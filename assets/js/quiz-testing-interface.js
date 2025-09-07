// LILAC Quiz Testing & Feedback Interface
// Complete solution for manual testing, real-time feedback, and answer browsing

(function($) {
    'use strict';

    // Main interface object
    window.LilacQuizTester = {
        init: function() {
            this.createTestingInterface();
            this.setupRealTimeFeedback();
            this.setupAnswerBrowser();
            console.log('LILAC Quiz Tester: All systems initialized');
        },

        // 1. MANUAL TESTING INTERFACE
        createTestingInterface: function() {
            const testInterface = $(`
                <div id="lilac-test-interface" style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 350px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    z-index: 999999;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    max-height: 80vh;
                    overflow-y: auto;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0; color: #fff;">🧪 Quiz Tester</h3>
                        <button id="toggle-tester" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">−</button>
                    </div>
                    
                    <div id="tester-content">
                        <!-- Manual Testing Section -->
                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h4 style="margin: 0 0 10px 0;">Manual Answer Testing</h4>
                            <div style="margin-bottom: 10px;">
                                <input type="number" id="test-question-id" placeholder="Question ID" style="width: 100px; padding: 5px; border: none; border-radius: 3px;">
                                <input type="number" id="test-answer" placeholder="Answer (1-4)" min="1" max="4" style="width: 80px; padding: 5px; border: none; border-radius: 3px; margin-left: 5px;">
                                <button id="test-answer-btn" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-left: 5px;">Test</button>
                            </div>
                            <div id="test-result" style="min-height: 20px; font-weight: bold;"></div>
                        </div>

                        <!-- Real-time Status -->
                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h4 style="margin: 0 0 10px 0;">System Status</h4>
                            <div>Total Answers: <span id="total-answers">${Object.keys(window.lilacQuizCorrectAnswers || {}).length}</span></div>
                            <div>Real-time Feedback: <span id="feedback-status">🟢 Active</span></div>
                            <div>Last Test: <span id="last-test">None</span></div>
                        </div>

                        <!-- Quick Actions -->
                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                            <h4 style="margin: 0 0 10px 0;">Quick Actions</h4>
                            <button id="browse-answers" style="background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 5px; margin-bottom: 5px;">Browse All Answers</button>
                            <button id="test-random" style="background: #FF9800; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 5px; margin-bottom: 5px;">Random Test</button>
                            <button id="export-answers" style="background: #9C27B0; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-bottom: 5px;">Export Data</button>
                        </div>
                    </div>
                </div>
            `);

            $('body').append(testInterface);
            this.bindTestingEvents();
        },

        bindTestingEvents: function() {
            const self = this;

            // Toggle interface
            $('#toggle-tester').on('click', function() {
                const content = $('#tester-content');
                const btn = $(this);
                if (content.is(':visible')) {
                    content.hide();
                    btn.text('+');
                } else {
                    content.show();
                    btn.text('−');
                }
            });

            // Manual testing
            $('#test-answer-btn').on('click', function() {
                self.testAnswer();
            });

            // Enter key for testing
            $('#test-question-id, #test-answer').on('keypress', function(e) {
                if (e.which === 13) {
                    self.testAnswer();
                }
            });

            // Random test
            $('#test-random').on('click', function() {
                self.randomTest();
            });

            // Browse answers
            $('#browse-answers').on('click', function() {
                self.openAnswerBrowser();
            });

            // Export answers
            $('#export-answers').on('click', function() {
                self.exportAnswers();
            });
        },

        testAnswer: function() {
            const questionId = $('#test-question-id').val();
            const userAnswer = parseInt($('#test-answer').val());
            const resultDiv = $('#test-result');

            if (!questionId || !userAnswer) {
                resultDiv.html('❌ Enter Question ID and Answer');
                return;
            }

            const correctAnswer = window.lilacGetCorrectAnswer(questionId);
            const isCorrect = window.lilacIsAnswerCorrect(questionId, userAnswer);

            if (correctAnswer === null) {
                resultDiv.html(`❓ Question ${questionId} not found`);
            } else {
                const status = isCorrect ? '✅ CORRECT' : '❌ WRONG';
                const color = isCorrect ? '#4CAF50' : '#f44336';
                resultDiv.html(`
                    <div style="color: ${color};">
                        ${status}<br>
                        Q${questionId}: Your ${userAnswer} vs Correct ${correctAnswer}
                    </div>
                `);
            }

            $('#last-test').text(`Q${questionId}: ${userAnswer} → ${isCorrect ? 'Correct' : 'Wrong'}`);
        },

        randomTest: function() {
            const questionIds = Object.keys(window.lilacQuizCorrectAnswers);
            const randomId = questionIds[Math.floor(Math.random() * questionIds.length)];
            const correctAnswer = window.lilacQuizCorrectAnswers[randomId];
            
            $('#test-question-id').val(randomId);
            $('#test-answer').val('');
            
            $('#test-result').html(`
                <div style="color: #FF9800;">
                    🎲 Random Question ${randomId}<br>
                    Correct answer is: ${correctAnswer}<br>
                    Try testing with different answers!
                </div>
            `);
        },

        // 2. REAL-TIME FEEDBACK BRIDGE
        setupRealTimeFeedback: function() {
            const self = this;
            
            // Monitor quiz answer selections
            $(document).on('click', '.wpProQuiz_questionInput', function() {
                setTimeout(() => {
                    self.handleAnswerSelection($(this));
                }, 100);
            });

            // Monitor answer changes
            $(document).on('change', '.wpProQuiz_questionInput', function() {
                self.handleAnswerSelection($(this));
            });

            console.log('LILAC: Real-time feedback bridge activated');
        },

        handleAnswerSelection: function($input) {
            if (!$input.is(':checked')) return;

            const questionContainer = $input.closest('.wpProQuiz_questionListItem');
            const questionId = this.extractQuestionId(questionContainer);
            const selectedAnswer = this.extractAnswerIndex($input);

            if (questionId && selectedAnswer) {
                this.provideFeedback(questionContainer, questionId, selectedAnswer);
            }
        },

        extractQuestionId: function($container) {
            // Try multiple methods to get question ID
            const dataId = $container.attr('data-question-id');
            if (dataId) return dataId;

            const classMatch = $container.attr('class').match(/question-(\d+)/);
            if (classMatch) return classMatch[1];

            const idMatch = $container.attr('id').match(/question_(\d+)/);
            if (idMatch) return idMatch[1];

            return null;
        },

        extractAnswerIndex: function($input) {
            const value = $input.val();
            const name = $input.attr('name');
            
            // Try to get answer index from value or name
            if (value && !isNaN(value)) return parseInt(value);
            
            const match = name.match(/answer_(\d+)/);
            if (match) return parseInt(match[1]);

            return null;
        },

        provideFeedback: function($container, questionId, selectedAnswer) {
            // Fix: Ensure proper integer conversion for comparison
            const selectedAnswerInt = parseInt(selectedAnswer);
            const questionIdInt = parseInt(questionId);
            
            // Debug logging to identify calculation issues
            console.log('🔧 Testing Interface Debug:', {
                questionId: questionId,
                questionIdInt: questionIdInt,
                selectedAnswer: selectedAnswer,
                selectedAnswerInt: selectedAnswerInt
            });
            
            const isCorrect = window.lilacIsAnswerCorrect(questionIdInt, selectedAnswerInt);
            const correctAnswer = window.lilacGetCorrectAnswer(questionIdInt);

            // Remove existing feedback
            $container.find('.lilac-feedback').remove();

            // Add new feedback
            const feedbackColor = isCorrect ? '#4CAF50' : '#f44336';
            const feedbackIcon = isCorrect ? '✅' : '❌';
            const feedbackText = isCorrect ? 'Correct!' : `Wrong! Correct: ${correctAnswer}`;

            const feedback = $(`
                <div class="lilac-feedback" style="
                    background: ${feedbackColor};
                    color: white;
                    padding: 8px 12px;
                    border-radius: 5px;
                    margin-top: 10px;
                    font-weight: bold;
                    animation: fadeIn 0.3s ease-in;
                ">
                    ${feedbackIcon} ${feedbackText}
                </div>
            `);

            $container.append(feedback);

            // Update status
            $('#last-test').text(`Q${questionId}: ${selectedAnswer} → ${isCorrect ? 'Correct' : 'Wrong'}`);

            console.log(`LILAC Feedback: Q${questionId} - Selected ${selectedAnswer}, Correct ${correctAnswer}, Result: ${isCorrect}`);
        },

        // 3. ANSWER BROWSER
        setupAnswerBrowser: function() {
            // Browser will be created on demand
            console.log('LILAC: Answer browser ready');
        },

        openAnswerBrowser: function() {
            const browserHtml = this.generateAnswerBrowserHtml();
            
            // Remove existing browser
            $('#lilac-answer-browser').remove();
            
            $('body').append(browserHtml);
            this.bindBrowserEvents();
        },

        generateAnswerBrowserHtml: function() {
            const answers = window.lilacQuizCorrectAnswers;
            const totalQuestions = Object.keys(answers).length;
            
            let tableRows = '';
            let currentPage = 0;
            const itemsPerPage = 50;
            
            // Generate first page
            const questionIds = Object.keys(answers).sort((a, b) => parseInt(a) - parseInt(b));
            for (let i = 0; i < Math.min(itemsPerPage, questionIds.length); i++) {
                const qId = questionIds[i];
                tableRows += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${qId}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${answers[qId]}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                            <button onclick="LilacQuizTester.testSpecificQuestion('${qId}')" style="background: #2196F3; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Test</button>
                        </td>
                    </tr>
                `;
            }

            return `
                <div id="lilac-answer-browser" style="
                    position: fixed;
                    top: 50px;
                    left: 50px;
                    width: 80%;
                    height: 80%;
                    background: white;
                    border: 2px solid #2196F3;
                    border-radius: 10px;
                    z-index: 1000000;
                    padding: 20px;
                    box-shadow: 0 4px 30px rgba(0,0,0,0.3);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 15px;">
                        <h2 style="margin: 0; color: #2196F3;">📚 Answer Browser (${totalQuestions} Questions)</h2>
                        <button onclick="document.getElementById('lilac-answer-browser').remove()" style="background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">✕ Close</button>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="search-questions" placeholder="Search by Question ID..." style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; width: 200px; margin-right: 10px;">
                        <button id="search-btn" style="background: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Search</button>
                        <button id="show-all" style="background: #FF9800; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-left: 5px;">Show All</button>
                    </div>
                    
                    <div style="flex: 1; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f5f5f5;">
                                    <th style="border: 1px solid #ddd; padding: 12px;">Question ID</th>
                                    <th style="border: 1px solid #ddd; padding: 12px;">Correct Answer</th>
                                    <th style="border: 1px solid #ddd; padding: 12px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="answer-table-body">
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: 15px; text-align: center;">
                        <button id="prev-page" style="background: #607D8B; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px;">← Previous</button>
                        <span id="page-info">Page 1 of ${Math.ceil(totalQuestions / itemsPerPage)}</span>
                        <button id="next-page" style="background: #607D8B; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Next →</button>
                    </div>
                </div>
            `;
        },

        bindBrowserEvents: function() {
            const self = this;
            
            // Search functionality
            $('#search-btn').on('click', function() {
                self.searchQuestions();
            });
            
            $('#search-questions').on('keypress', function(e) {
                if (e.which === 13) {
                    self.searchQuestions();
                }
            });
            
            $('#show-all').on('click', function() {
                self.showAllQuestions();
            });
            
            // Pagination
            $('#prev-page').on('click', function() {
                self.changePage(-1);
            });
            
            $('#next-page').on('click', function() {
                self.changePage(1);
            });
        },

        searchQuestions: function() {
            const searchTerm = $('#search-questions').val().trim();
            if (!searchTerm) return;
            
            const answers = window.lilacQuizCorrectAnswers;
            let tableRows = '';
            
            if (answers[searchTerm]) {
                tableRows = `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${searchTerm}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${answers[searchTerm]}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                            <button onclick="LilacQuizTester.testSpecificQuestion('${searchTerm}')" style="background: #2196F3; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Test</button>
                        </td>
                    </tr>
                `;
            } else {
                tableRows = '<tr><td colspan="3" style="border: 1px solid #ddd; padding: 20px; text-align: center; color: #666;">Question not found</td></tr>';
            }
            
            $('#answer-table-body').html(tableRows);
        },

        showAllQuestions: function() {
            $('#search-questions').val('');
            this.renderPage(0);
        },

        testSpecificQuestion: function(questionId) {
            $('#test-question-id').val(questionId);
            $('#test-answer').val('').focus();
            
            const correctAnswer = window.lilacQuizCorrectAnswers[questionId];
            $('#test-result').html(`
                <div style="color: #2196F3;">
                    Ready to test Q${questionId}<br>
                    Correct answer: ${correctAnswer}
                </div>
            `);
        },

        exportAnswers: function() {
            const answers = window.lilacQuizCorrectAnswers;
            const csvContent = "Question ID,Correct Answer\n" + 
                Object.entries(answers).map(([id, answer]) => `${id},${answer}`).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lilac-quiz-answers.csv';
            a.click();
            window.URL.revokeObjectURL(url);
            
            console.log('LILAC: Answers exported to CSV');
        }
    };

    // Initialize when DOM is ready
    $(document).ready(function() {
        // Wait for answers to load
        setTimeout(function() {
            if (typeof window.lilacQuizCorrectAnswers !== 'undefined' && Object.keys(window.lilacQuizCorrectAnswers).length > 0) {
                window.LilacQuizTester.init();
            } else {
                console.log('LILAC: Waiting for answers to load...');
                setTimeout(arguments.callee, 1000);
            }
        }, 500);
    });

})(jQuery);
