/**
 * DOM-Based Answer Extractor for Quiz Validation Fix
 * Extracts correct answers from Quiz Browser Tool data and applies to live quiz
 */
(function($) {
    'use strict';
    
    const config = {
        debug: true,
        quizBrowserToolUrl: '/quiz-browser-tool.php',
        retryAttempts: 3,
        retryDelay: 1000
    };
    
    const state = {
        correctAnswers: {},
        currentQuizId: null,
        initialized: false
    };
    
    // Debug logger
    function log(message, data) {
        if (config.debug) {
            console.log('%c[DOM EXTRACTOR] ' + message, 'color: #2196F3;', data || '');
        }
    }
    
    function error(message, data) {
        console.error('%c[DOM EXTRACTOR ERROR] ' + message, 'color: #f44336;', data || '');
    }
    
    /**
     * Extract quiz ID from current page
     */
    function getCurrentQuizId() {
        // Try multiple methods to get quiz ID
        const methods = [
            () => window.lilacQuizData?.quiz_id,
            () => document.querySelector('[data-quiz-id]')?.getAttribute('data-quiz-id'),
            () => {
                const match = window.location.href.match(/quiz[_-]?id[=:](\d+)/i);
                return match ? match[1] : null;
            },
            () => {
                const scripts = document.querySelectorAll('script');
                for (let script of scripts) {
                    const match = script.textContent.match(/quiz[_\s]*id[:\s]*(\d+)/i);
                    if (match) return match[1];
                }
                return null;
            }
        ];
        
        for (let method of methods) {
            try {
                const id = method();
                if (id) {
                    log('Found quiz ID: ' + id);
                    return id;
                }
            } catch (e) {
                // Continue to next method
            }
        }
        
        return null;
    }
    
    /**
     * Extract correct answers from Quiz Browser Tool for specific question text
     */
    function extractCorrectAnswerFromBrowserTool(questionText, callback) {
        const searchQuery = encodeURIComponent('"' + questionText.substring(0, 50) + '"');
        const url = config.quizBrowserToolUrl + '?search=' + searchQuery + '&per_page=50';
        
        log('Fetching from Quiz Browser Tool: ' + url);
        
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Look for the correct answer marker
                const correctAnswers = doc.querySelectorAll('.answer-option:contains("✓ CORRECT"), [class*="correct"]');
                
                if (correctAnswers.length > 0) {
                    // Extract the answer index (A, B, C, D)
                    correctAnswers.forEach((element, index) => {
                        const answerText = element.textContent || element.innerText;
                        const match = answerText.match(/^([A-D])\./);
                        if (match) {
                            const answerIndex = match[1].charCodeAt(0) - 65; // Convert A=0, B=1, C=2, D=3
                            log('Found correct answer: ' + match[1] + ' (index: ' + answerIndex + ')');
                            callback(answerIndex);
                            return;
                        }
                    });
                } else {
                    // Fallback: look for "CORRECT" text in the HTML
                    const htmlContent = html.toLowerCase();
                    const correctMatches = htmlContent.match(/([a-d])\.[^✓]*✓\s*correct/g);
                    
                    if (correctMatches && correctMatches.length > 0) {
                        const answerLetter = correctMatches[0].charAt(0).toUpperCase();
                        const answerIndex = answerLetter.charCodeAt(0) - 65;
                        log('Found correct answer via text search: ' + answerLetter + ' (index: ' + answerIndex + ')');
                        callback(answerIndex);
                        return;
                    }
                }
                
                error('Could not extract correct answer from browser tool');
                callback(null);
            })
            .catch(err => {
                error('Failed to fetch from Quiz Browser Tool', err);
                callback(null);
            });
    }
    
    /**
     * Apply correct answer to current quiz question
     */
    function applyCorrectAnswer(correctIndex) {
        const currentQuestion = document.querySelector('.wpProQuiz_listItem');
        if (!currentQuestion) {
            error('No current question found');
            return;
        }
        
        const answers = currentQuestion.querySelectorAll('.wpProQuiz_questionListItem');
        if (answers.length === 0) {
            error('No answer options found');
            return;
        }
        
        if (correctIndex >= 0 && correctIndex < answers.length) {
            // Mark the correct answer
            answers.forEach((answer, index) => {
                if (index === correctIndex) {
                    answer.classList.add('lilac-correct-answer');
                    answer.style.border = '2px solid #4CAF50';
                    answer.style.backgroundColor = '#E8F5E8';
                    log('Marked answer ' + (index + 1) + ' as correct');
                } else {
                    answer.classList.remove('lilac-correct-answer');
                }
            });
            
            // Store for validation override
            state.correctAnswers[getCurrentQuestionId()] = correctIndex;
            
            // Override LearnDash validation
            overrideValidation(correctIndex);
        }
    }
    
    /**
     * Get current question ID
     */
    function getCurrentQuestionId() {
        const question = document.querySelector('.wpProQuiz_listItem');
        return question ? question.getAttribute('data-question-id') || 'current' : 'current';
    }
    
    /**
     * Override LearnDash's validation system
     */
    function overrideValidation(correctIndex) {
        // Monitor for validation responses
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    const responseDiv = document.querySelector('.wpProQuiz_response');
                    if (responseDiv) {
                        const selectedAnswer = document.querySelector('.wpProQuiz_questionListItem.is-selected');
                        if (selectedAnswer) {
                            const selectedIndex = Array.from(selectedAnswer.parentNode.children).indexOf(selectedAnswer);
                            
                            if (selectedIndex === correctIndex) {
                                // Show correct
                                showCorrectResponse(responseDiv);
                            } else {
                                // Show incorrect
                                showIncorrectResponse(responseDiv);
                            }
                        }
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
    
    function showCorrectResponse(responseDiv) {
        const correctDiv = responseDiv.querySelector('.wpProQuiz_correct');
        const incorrectDiv = responseDiv.querySelector('.wpProQuiz_incorrect');
        
        if (correctDiv) {
            correctDiv.style.display = 'block';
            log('Showing correct response');
        }
        if (incorrectDiv) {
            incorrectDiv.style.display = 'none';
        }
    }
    
    function showIncorrectResponse(responseDiv) {
        const correctDiv = responseDiv.querySelector('.wpProQuiz_correct');
        const incorrectDiv = responseDiv.querySelector('.wpProQuiz_incorrect');
        
        if (incorrectDiv) {
            incorrectDiv.style.display = 'block';
            log('Showing incorrect response');
        }
        if (correctDiv) {
            correctDiv.style.display = 'none';
        }
    }
    
    /**
     * Process current question
     */
    function processCurrentQuestion() {
        const questionElement = document.querySelector('.wpProQuiz_question');
        if (!questionElement) {
            log('No question found, retrying...');
            setTimeout(processCurrentQuestion, 1000);
            return;
        }
        
        const questionText = questionElement.textContent || questionElement.innerText;
        if (!questionText.trim()) {
            error('Empty question text');
            return;
        }
        
        log('Processing question: ' + questionText.substring(0, 50) + '...');
        
        extractCorrectAnswerFromBrowserTool(questionText, function(correctIndex) {
            if (correctIndex !== null) {
                applyCorrectAnswer(correctIndex);
            } else {
                error('Could not determine correct answer for question');
            }
        });
    }
    
    /**
     * Initialize the extractor
     */
    function init() {
        if (state.initialized) return;
        
        log('Initializing DOM Answer Extractor...');
        
        state.currentQuizId = getCurrentQuizId();
        if (!state.currentQuizId) {
            log('No quiz ID found, will try to process anyway');
        }
        
        // Process current question
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', processCurrentQuestion);
        } else {
            processCurrentQuestion();
        }
        
        // Monitor for question changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    const newQuestion = document.querySelector('.wpProQuiz_question');
                    if (newQuestion && !newQuestion.hasAttribute('data-processed')) {
                        newQuestion.setAttribute('data-processed', 'true');
                        setTimeout(processCurrentQuestion, 500);
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        state.initialized = true;
        log('DOM Answer Extractor initialized successfully');
    }
    
    // Auto-initialize when script loads
    $(document).ready(function() {
        init();
    });
    
    // Expose for manual testing
    window.LilacDOMExtractor = {
        init: init,
        processCurrentQuestion: processCurrentQuestion,
        extractCorrectAnswerFromBrowserTool: extractCorrectAnswerFromBrowserTool,
        state: state
    };
    
})(jQuery);
