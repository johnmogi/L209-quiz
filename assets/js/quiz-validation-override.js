/**
 * Quiz Validation Override System
 * Fixes LearnDash database corruption by overriding incorrect validation
 */

(function() {
    'use strict';
    
    console.log('🔧 VALIDATION OVERRIDE: Starting system...');
    
    // Correct answer data (from Quiz Browser Tool analysis)
    const CORRECT_ANSWERS = {
        '1629': 2, // Question 1629: Option C (index 2) is correct, not option A (index 0)
        // Add more corrections as needed
    };
    
    /**
     * Override LearnDash validation with correct data
     */
    function overrideValidation() {
        console.log('🎯 VALIDATION OVERRIDE: Setting up validation override...');
        
        // Monitor answer selections
        document.addEventListener('change', function(e) {
            if (e.target.type === 'radio' && e.target.name.includes('question')) {
                const questionElement = e.target.closest('.wpProQuiz_listItem');
                if (questionElement) {
                    setTimeout(() => {
                        fixValidationFeedback(questionElement);
                    }, 100);
                }
            }
        });
        
        // Also monitor for existing feedback on page load
        setTimeout(() => {
            const questionElements = document.querySelectorAll('.wpProQuiz_listItem');
            questionElements.forEach(fixValidationFeedback);
        }, 1000);
    }
    
    /**
     * Fix validation feedback for a question
     */
    function fixValidationFeedback(questionElement) {
        const questionId = getQuestionId(questionElement);
        if (!questionId || !CORRECT_ANSWERS[questionId]) {
            return; // No override data for this question
        }
        
        const correctIndex = CORRECT_ANSWERS[questionId];
        const selectedInput = questionElement.querySelector('input[type="radio"]:checked');
        
        if (!selectedInput) return;
        
        // Get selected answer index
        const allInputs = questionElement.querySelectorAll('input[type="radio"]');
        const selectedIndex = Array.from(allInputs).indexOf(selectedInput);
        
        console.log('🔍 VALIDATION OVERRIDE: Checking question', questionId, {
            selectedIndex: selectedIndex,
            correctIndex: correctIndex,
            shouldBeCorrect: selectedIndex === correctIndex
        });
        
        // Find existing feedback elements
        const incorrectFeedback = questionElement.querySelector('.wpProQuiz_incorrect');
        const correctFeedback = questionElement.querySelector('.wpProQuiz_correct');
        
        if (selectedIndex === correctIndex) {
            // This should be marked as correct
            if (incorrectFeedback) {
                console.log('✅ VALIDATION OVERRIDE: Fixing incorrect feedback to correct');
                
                // Replace incorrect feedback with correct feedback
                incorrectFeedback.className = incorrectFeedback.className.replace('wpProQuiz_incorrect', 'wpProQuiz_correct');
                incorrectFeedback.innerHTML = '✅ כל הכבוד! תשובה נכונה';
                incorrectFeedback.style.backgroundColor = '#d4edda';
                incorrectFeedback.style.color = '#155724';
                incorrectFeedback.style.border = '1px solid #c3e6cb';
                incorrectFeedback.style.padding = '10px';
                incorrectFeedback.style.borderRadius = '5px';
                incorrectFeedback.style.marginTop = '10px';
                
                // Add success styling to the selected answer
                const selectedAnswerElement = selectedInput.closest('.wpProQuiz_questionListItem');
                if (selectedAnswerElement) {
                    selectedAnswerElement.style.backgroundColor = '#d4edda';
                    selectedAnswerElement.style.border = '2px solid #28a745';
                    selectedAnswerElement.style.borderRadius = '5px';
                }
            }
        } else {
            // This should be marked as incorrect
            if (correctFeedback) {
                console.log('❌ VALIDATION OVERRIDE: Fixing correct feedback to incorrect');
                
                // Replace correct feedback with incorrect feedback
                correctFeedback.className = correctFeedback.className.replace('wpProQuiz_correct', 'wpProQuiz_incorrect');
                correctFeedback.innerHTML = `❌ תשובה שגויה! התשובה הנכונה היא: ${correctIndex + 1}`;
                correctFeedback.style.backgroundColor = '#f8d7da';
                correctFeedback.style.color = '#721c24';
                correctFeedback.style.border = '1px solid #f5c6cb';
                correctFeedback.style.padding = '10px';
                correctFeedback.style.borderRadius = '5px';
                correctFeedback.style.marginTop = '10px';
                
                // Add error styling to the selected answer
                const selectedAnswerElement = selectedInput.closest('.wpProQuiz_questionListItem');
                if (selectedAnswerElement) {
                    selectedAnswerElement.style.backgroundColor = '#f8d7da';
                    selectedAnswerElement.style.border = '2px solid #dc3545';
                    selectedAnswerElement.style.borderRadius = '5px';
                }
                
                // Highlight the correct answer
                const correctAnswerElement = allInputs[correctIndex]?.closest('.wpProQuiz_questionListItem');
                if (correctAnswerElement) {
                    correctAnswerElement.style.backgroundColor = '#d4edda';
                    correctAnswerElement.style.border = '2px solid #28a745';
                    correctAnswerElement.style.borderRadius = '5px';
                    
                    // Add correct indicator
                    if (!correctAnswerElement.querySelector('.correct-indicator')) {
                        const indicator = document.createElement('span');
                        indicator.className = 'correct-indicator';
                        indicator.innerHTML = ' ← התשובה הנכונה';
                        indicator.style.color = '#28a745';
                        indicator.style.fontWeight = 'bold';
                        indicator.style.marginRight = '10px';
                        correctAnswerElement.appendChild(indicator);
                    }
                }
            }
        }
    }
    
    /**
     * Get question ID from element
     */
    function getQuestionId(questionElement) {
        // Try to extract question ID from various sources
        const inputs = questionElement.querySelectorAll('input[type="radio"]');
        if (inputs.length > 0) {
            const inputName = inputs[0].name;
            const match = inputName.match(/question_(\d+)/);
            if (match) {
                return match[1];
            }
        }
        
        // Fallback methods
        return questionElement.getAttribute('data-question-id') ||
               questionElement.querySelector('[data-question-id]')?.getAttribute('data-question-id');
    }
    
    /**
     * Add visual indicator for override system
     */
    function addOverrideIndicator() {
        const indicator = document.createElement('div');
        indicator.innerHTML = '🔧 Validation Override Active';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #17a2b8;
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            font-size: 12px;
            font-weight: bold;
            z-index: 99998;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(indicator);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            indicator.style.opacity = '0.3';
        }, 5000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            overrideValidation();
            addOverrideIndicator();
        });
    } else {
        overrideValidation();
        addOverrideIndicator();
    }
    
    console.log('✅ VALIDATION OVERRIDE: System initialized');
    
})();
