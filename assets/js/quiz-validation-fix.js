/**
 * Smart Quiz Validation Fix
 * Automatically detects and corrects LearnDash's wrong answer validations
 */

(function() {
    'use strict';
    
    console.log('🔧 SMART QUIZ VALIDATION FIX: Starting...');
    
    // Backup system: Hardcoded correct answers from Quiz Browser Tool
    const correctAnswers = {
        // Based on Quiz Browser Tool reliable data
        // Format: question_id: correct_answer_index (0-based)
        '11703': 2, // Rest/break question - correct answer is index 2 (מנוחה)
        '11704': 1, // Speed question - correct answer is NOT "increase speed" 
        '11705': 0, // Safety question
        '11706': 3, // Traffic rules question
        // Add more as needed from Quiz Browser Tool
    };
    
    // Dynamic detection as fallback
    const dynamicAnswers = {};
    
    /**
     * Detect correct answers by analyzing the Quiz Browser Tool data
     */
    function detectCorrectAnswers() {
        console.log('🔍 Detecting correct answers from Quiz Browser Tool...');
        
        // Fetch correct answers from the API
        fetch('/quiz-browser-tool-api.php?quiz_id=11702')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.questions && data.questions.length > 0) {
                    data.questions.forEach(q => {
                        const answers = parseAnswerData(q.answer_data);
                        const correctIndex = answers.findIndex(a => a.correct);
                        if (correctIndex !== -1) {
                            dynamicAnswers[q.question_id] = correctIndex;
                            console.log(`✅ Question ${q.question_id}: Correct answer is index ${correctIndex}`);
                        }
                    });
                    console.log('📊 Loaded dynamic answers:', dynamicAnswers);
                } else {
                    console.log('⚠️ API returned empty - Using backup system');
                    console.log('🔄 Backup correct answers loaded:', Object.keys(correctAnswers).length);
                }
            })
            .catch(error => {
                console.log('⚠️ API failed, using DOM detection:', error);
                detectFromDOM();
            });
        
        // Always run DOM detection as additional backup
        detectFromDOM();
    }
    
    /**
     * Parse answer data from database
     */
    function parseAnswerData(rawData) {
        const answers = [];
        if (!rawData) return answers;
        
        const answerMatches = rawData.match(/s:\d+:"\x00\*\x00_answer";s:(\d+):"([^"]*)"/g);
        const correctMatches = rawData.match(/s:\d+:"\x00\*\x00_correct";b:([01])/g);
        
        if (answerMatches) {
            answerMatches.forEach((match, i) => {
                const answerMatch = match.match(/s:\d+:"([^"]*)"/);
                if (answerMatch) {
                    const answerText = answerMatch[1].trim();
                    const isCorrect = correctMatches && correctMatches[i] && correctMatches[i].includes('b:1');
                    
                    if (answerText) {
                        answers.push({
                            text: answerText,
                            correct: isCorrect,
                            index: i
                        });
                    }
                }
            });
        }
        
        return answers;
    }
    
    /**
     * Fallback: Detect from DOM patterns and keywords
     */
    function detectFromDOM() {
        console.log('🔍 DOM Detection: Analyzing answer patterns...');
        
        const questions = document.querySelectorAll('.wpProQuiz_listItem');
        questions.forEach((question, qIndex) => {
            const questionId = getQuestionId(question) || `question_${qIndex + 1}`;
            const answers = question.querySelectorAll('.wpProQuiz_questionListItem');
            
            answers.forEach((answer, aIndex) => {
                const text = answer.textContent.toLowerCase();
                
                // Look for keywords that indicate correct answers
                if (text.includes('מנוחה') || text.includes('נח') || text.includes('הפסקה') || 
                    text.includes('לא נכון') || text.includes('שקר') || text.includes('אסור')) {
                    correctAnswers[questionId] = aIndex;
                    console.log(`🎯 DOM: Found correct answer for question ${questionId}: index ${aIndex}`);
                }
                
                // For alcohol questions - "לא נכון" or "שקר" are usually correct
                if (text.includes('בירה') && (text.includes('לא נכון') || text.includes('שקר'))) {
                    correctAnswers[questionId] = aIndex;
                    console.log(`🎯 DOM: Found correct answer for alcohol question ${questionId}: index ${aIndex}`);
                }
            });
        });
        
        console.log('📊 DOM Detection complete:', correctAnswers);
    }
    
    /**
     * Get question ID from element
     */
    function getQuestionId(element) {
        const inputs = element.querySelectorAll('input[type="radio"]');
        if (inputs.length > 0) {
            const inputName = inputs[0].name;
            const match = inputName.match(/question_(\d+)/);
            return match ? match[1] : null;
        }
        return null;
    }
    
    /**
     * Get the correct answer for a question (checks both dynamic and backup)
     */
    function getCorrectAnswer(questionId) {
        // First check dynamic answers from API
        if (dynamicAnswers[questionId] !== undefined) {
            return dynamicAnswers[questionId];
        }
        // Then check backup hardcoded answers
        if (correctAnswers[questionId] !== undefined) {
            return correctAnswers[questionId];
        }
        return null;
    }
    
    /**
     * Fix validation for a question
     */
    function fixValidation(questionElement) {
        const questionId = getQuestionId(questionElement);
        if (!questionId || getCorrectAnswer(questionId) === null) {
            return; // No fix needed or no data
        }
        
        const selectedInput = questionElement.querySelector('input[type="radio"]:checked');
        if (!selectedInput) return;
        
        const allInputs = questionElement.querySelectorAll('input[type="radio"]');
        const selectedIndex = Array.from(allInputs).indexOf(selectedInput);
        const correctIndex = getCorrectAnswer(questionId);
        
        const isActuallyCorrect = selectedIndex === correctIndex;
        
        // Find feedback elements
        const incorrectFeedback = questionElement.querySelector('.wpProQuiz_incorrect');
        const correctFeedback = questionElement.querySelector('.wpProQuiz_correct');
        
        if (isActuallyCorrect && incorrectFeedback) {
            // Fix: Should be correct but showing as wrong
            console.log('✅ FIXING: Question', questionId, 'from wrong to correct');
            
            incorrectFeedback.className = incorrectFeedback.className.replace('wpProQuiz_incorrect', 'wpProQuiz_correct');
            incorrectFeedback.innerHTML = '✅ כל הכבוד! תשובה נכונה';
            incorrectFeedback.style.cssText = `
                background-color: #d4edda !important;
                color: #155724 !important;
                border: 1px solid #c3e6cb !important;
                padding: 10px !important;
                border-radius: 5px !important;
                margin-top: 10px !important;
            `;
            
        } else if (!isActuallyCorrect && correctFeedback) {
            // Fix: Should be wrong but showing as correct
            console.log('❌ FIXING: Question', questionId, 'from correct to wrong');
            
            const correctLetter = String.fromCharCode(65 + correctIndex); // A, B, C, D
            correctFeedback.className = correctFeedback.className.replace('wpProQuiz_correct', 'wpProQuiz_incorrect');
            correctFeedback.innerHTML = `❌ תשובה שגויה! התשובה הנכונה היא: ${correctLetter}`;
            correctFeedback.style.cssText = `
                background-color: #f8d7da !important;
                color: #721c24 !important;
                border: 1px solid #f5c6cb !important;
                padding: 10px !important;
                border-radius: 5px !important;
                margin-top: 10px !important;
            `;
        }
    }
    
    /**
     * Monitor for answer selections and fix validation
     */
    function startMonitoring() {
        document.addEventListener('change', function(event) {
            if (event.target.type === 'radio') {
                const questionElement = event.target.closest('.wpProQuiz_listItem');
                if (questionElement) {
                    // Wait a moment for LearnDash to show its feedback, then fix it
                    setTimeout(() => {
                        fixValidation(questionElement);
                    }, 100);
                }
            }
        });
        
        console.log('👁️ QUIZ VALIDATION FIX: Monitoring active');
    }
    
    /**
     * Initialize when page is ready
     */
    function init() {
        // First detect correct answers
        detectCorrectAnswers();
        
        // Then start monitoring
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startMonitoring);
        } else {
            startMonitoring();
        }
    }
    
    // Start immediately
    init();
    
})();
