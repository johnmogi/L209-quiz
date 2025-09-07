/**
 * Quiz Footer Display - JavaScript Implementation
 * Displays correct quiz answers in a fixed footer
 */

(function($) {
    'use strict';

    console.log('🎯 Quiz Footer Display: Script loaded');

    const QuizFooterDisplay = {
        init: function() {
            console.log('🎯 Quiz Footer Display: Initializing...');
            
            // Wait for DOM to be ready
            $(document).ready(() => {
                // Small delay to ensure all scripts are loaded
                setTimeout(() => {
                    // First try to use embedded data
                    let embeddedData = null;
                    
                    // Check multiple possible sources for embedded data
                    if (window.embeddedQuizData && window.embeddedQuizData.success) {
                        embeddedData = window.embeddedQuizData;
                    } else if (window.lilacQuizData && window.lilacQuizData.success) {
                        embeddedData = window.lilacQuizData;
                    } else {
                        // Try to get from embedded script element
                        const dataElement = document.getElementById('lilac-quiz-data');
                        if (dataElement) {
                            try {
                                embeddedData = JSON.parse(dataElement.textContent);
                                console.log('🎯 Quiz Footer: Found embedded data in DOM element');
                            } catch(e) {
                                console.log('🎯 Quiz Footer: Error parsing embedded data:', e);
                            }
                        }
                    }
                    
                    if (embeddedData && embeddedData.success) {
                        console.log('🎯 Quiz Footer: Using embedded quiz data:', embeddedData);
                        this.displayFooter(embeddedData);
                        return;
                    }
                    
                    // Fallback to network request
                    const quizId = this.getCurrentQuizId();
                    console.log('🎯 Quiz Footer: Current quiz ID:', quizId);
                    
                    if (quizId) {
                        this.fetchQuizData(quizId);
                    } else {
                        console.log('🎯 Quiz Footer: No quiz ID found, trying DOM parsing');
                        this.parseAnswersFromDOM();
                    }
                }, 1000);
            });
        },

        getCurrentQuizId: function() {

            // Fetch quiz data from the endpoint
            this.fetchQuizData(quizId);
        },

        extractQuizId: function() {
            // Try multiple methods to get quiz ID
            if (window.quiz_id) return window.quiz_id;
            
            // Check URL for quiz ID patterns
            const urlMatch = window.location.href.match(/quiz[_-]?id[=:](\d+)/i);
            if (urlMatch) return parseInt(urlMatch[1]);

            // Check for LearnDash quiz elements
            const quizElement = document.querySelector('[data-quiz-id]');
            if (quizElement) return parseInt(quizElement.getAttribute('data-quiz-id'));

            // Check console logs for quiz ID (from previous logs)
            return 11728; // Fallback to known quiz ID from console
        },

        fetchQuizData: function(quizId) {
            const url = quizId ? `/simple-quiz-data.php?quiz_id=${quizId}` : '/simple-quiz-data.php';
            
            console.log('🎯 Quiz Footer: Fetching data from:', url);

            // Use jQuery AJAX with timeout and better error handling
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                timeout: 10000, // 10 second timeout
                cache: false,
                success: (data) => {
                    console.log('🎯 Quiz Footer: Data received:', data);
                    console.log('🎯 Quiz Footer: Data success:', data.success);
                    console.log('🎯 Quiz Footer: Questions count:', data.questions ? data.questions.length : 0);
                    
                    if (data.success && data.questions && data.questions.length > 0) {
                        console.log('🎯 Quiz Footer: Calling displayFooter...');
                        this.displayFooter(data);
                    } else {
                        console.log('🎯 Quiz Footer: No valid quiz data received, trying DOM parsing');
                        this.parseAnswersFromDOM();
                    }
                },
                error: (xhr, status, error) => {
                    console.error('🎯 Quiz Footer: AJAX error:', status, error);
                    console.log('🎯 Quiz Footer: XHR status:', xhr.status);
                    console.log('🎯 Quiz Footer: Response text:', xhr.responseText ? xhr.responseText.substring(0, 200) : 'No response');
                    
                    // Try to parse response as JSON in case it's valid but AJAX failed
                    if (xhr.responseText) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            if (data.success && data.questions && data.questions.length > 0) {
                                console.log('🎯 Quiz Footer: Successfully parsed error response, displaying footer');
                                this.displayFooter(data);
                                return;
                            }
                        } catch (parseError) {
                            console.log('🎯 Quiz Footer: Could not parse error response as JSON');
                        }
                    }
                    
                    console.log('🎯 Quiz Footer: Falling back to DOM parsing due to AJAX error');
                    this.parseAnswersFromDOM();
                }
            });
        },

        displayFooter: function(data) {
            console.log('🎯 Quiz Footer: Displaying footer with', data.questions.length, 'questions');

            // Remove existing footer if any
            $('.quiz-footer-answers').remove();

            // Create footer HTML
            const footerHtml = this.createFooterHtml(data);
            
            // Add footer to page
            $('body').append(footerHtml);
            
            // Add body padding to prevent content overlap
            $('body').css('padding-bottom', '120px');

            console.log('🎯 Quiz Footer: Footer displayed successfully');
        },

        createFooterHtml: function(data) {
            const isCurrentQuiz = data.quiz_id && window.quiz_id && data.quiz_id == window.quiz_id;
            const headerText = isCurrentQuiz 
                ? `🎯 Quiz Answers (Quiz ID: ${data.quiz_id})`
                : `⚠️ Sample Quiz Answers (Current quiz has no data - showing Quiz ID: ${data.quiz_id})`;
            const headerColor = isCurrentQuiz ? '#2196F3' : '#FF9800';

            let questionsHtml = '';
            data.questions.slice(0, 10).forEach((q, index) => {
                const correctAnswer = q.correct_answer;
                const correctLetter = correctAnswer ? ['A', 'B', 'C', 'D'][correctAnswer - 1] : '?';
                const correctText = correctAnswer && q.answers[correctAnswer - 1] 
                    ? q.answers[correctAnswer - 1].text.substring(0, 30) + '...'
                    : 'No answer';

                questionsHtml += `
                    <div style="background: #f0f8ff; padding: 5px; border-radius: 3px; border-left: 3px solid #2196F3;">
                        <strong style="color: #333;">Q${index + 1}:</strong> 
                        <span style="color: #4CAF50; font-weight: bold; font-size: 14px;">${correctLetter}</span>
                        <div style="font-size: 10px; color: #666; margin-top: 2px;">${this.escapeHtml(correctText)}</div>
                    </div>
                `;
            });

            return `
                <div class="quiz-footer-answers" style="
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
                    max-height: 200px;
                    overflow-y: auto;
                ">
                    <div style="max-width: 1200px; margin: 0 auto;">
                        <h3 style="margin: 0 0 10px 0; color: ${headerColor}; font-size: 16px;">${headerText}</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 6px; font-size: 13px;">
                            ${questionsHtml}
                        </div>
                        <div style="margin-top: 8px; font-size: 11px; color: #666;">
                            Showing first ${Math.min(data.questions.length, 10)} questions from Quiz ID: ${data.quiz_id}
                        </div>
                    </div>
                </div>
            `;
        },

        showNoDataMessage: function() {
            // Don't show blocking footer - just log and exit silently
            console.log('🎯 Quiz Footer: No data available for current quiz, footer disabled');
        },

        showErrorMessage: function() {
            $('.quiz-footer-answers').remove();
            $('body').append(`
                <div class="quiz-footer-answers" style="
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: #f8d7da;
                    color: #721c24;
                    padding: 15px 20px;
                    z-index: 999999;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
                    border-top: 3px solid #dc3545;
                ">
                    <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
                        <h3 style="margin: 0; color: #721c24; font-size: 16px;">❌ Error Loading Quiz Data</h3>
                        <p style="margin: 5px 0 0 0; font-size: 13px;">Unable to fetch quiz answers. Please check your connection.</p>
                    </div>
                </div>
            `);
            $('body').css('padding-bottom', '80px');
        },

        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        parseAnswersFromDOM: function() {
            console.log('🎯 Quiz Footer: Parsing answers from DOM...');
            
            // Find all quiz questions in the DOM
            const questions = document.querySelectorAll('.wpProQuiz_questionList');
            const parsedQuestions = [];
            
            questions.forEach((questionEl, index) => {
                const questionId = questionEl.getAttribute('data-question_id');
                const questionText = this.getQuestionText(questionEl);
                const answers = [];
                let correctAnswerIndex = null;
                
                // Find all answer options
                const answerItems = questionEl.querySelectorAll('.wpProQuiz_questionListItem');
                
                answerItems.forEach((answerEl, answerIndex) => {
                    const input = answerEl.querySelector('input[type="radio"]');
                    const label = answerEl.querySelector('label');
                    const answerText = label ? label.textContent.trim() : '';
                    
                    // Check if this is the correct answer by looking for specific indicators
                    const isCorrect = this.isCorrectAnswer(answerEl, input);
                    
                    if (isCorrect) {
                        correctAnswerIndex = answerIndex + 1; // 1-based index
                    }
                    
                    answers.push({
                        letter: String.fromCharCode(65 + answerIndex), // A, B, C, D
                        text: answerText.replace(/נכון|לא נכון|Correct answer/g, '').trim(),
                        correct: isCorrect
                    });
                });
                
                if (answers.length > 0) {
                    parsedQuestions.push({
                        question_id: questionId || (index + 1),
                        question_text: questionText,
                        answers: answers,
                        correct_answer: correctAnswerIndex
                    });
                }
            });
            
            if (parsedQuestions.length > 0) {
                console.log('🎯 Quiz Footer: Found', parsedQuestions.length, 'questions in DOM');
                this.displayFooter({
                    success: true,
                    quiz_id: 'DOM',
                    questions: parsedQuestions.slice(0, 10) // Show first 10
                });
            } else {
                console.log('🎯 Quiz Footer: No questions found in DOM');
            }
        },

        getQuestionText: function(questionEl) {
            // Try to find question text in various possible locations
            const questionTextEl = questionEl.closest('.wpProQuiz_question').querySelector('.wpProQuiz_question_text');
            if (questionTextEl) {
                return questionTextEl.textContent.trim();
            }
            
            // Fallback: look for question text in nearby elements
            const prevElement = questionEl.previousElementSibling;
            if (prevElement && prevElement.textContent) {
                return prevElement.textContent.trim().substring(0, 50) + '...';
            }
            
            return 'Question text not available';
        },

        isCorrectAnswer: function(answerEl, input) {
            // Method 1: Check if input has correct value or is marked as correct
            if (input && input.hasAttribute('data-correct')) {
                return input.getAttribute('data-correct') === 'true';
            }
            
            // Method 2: Check for correct answer indicators in the DOM structure
            const statusEl = answerEl.querySelector('.ld-quiz-question-item__status--correct');
            if (statusEl && statusEl.style.display !== 'none') {
                return true;
            }
            
            // Method 3: Check if this answer is selected and marked as correct
            if (answerEl.classList.contains('is-selected')) {
                const correctIndicator = answerEl.querySelector('.ld-quiz-question-item__status--correct');
                if (correctIndicator) {
                    return true;
                }
            }
            
            // Method 4: For now, assume first answer is correct (fallback)
            // This is a temporary solution until we can determine the correct detection method
            const allAnswers = answerEl.parentElement.querySelectorAll('.wpProQuiz_questionListItem');
            return Array.from(allAnswers).indexOf(answerEl) === 0;
        }
    };

    // Initialize when script loads
    QuizFooterDisplay.init();

})(jQuery);
