// Quick Answer Fix - Override incorrect answer detection
(function() {
    'use strict';
    
    console.log('🔧 QUICK ANSWER FIX: Loading override...');
    
    // Override the answer detection for the specific police testing question
    function fixPoliceTestingQuestion() {
        // Look for the specific question about police testing
        const questions = document.querySelectorAll('.wpProQuiz_question');
        
        questions.forEach((questionDiv, index) => {
            const questionText = questionDiv.querySelector('.wpProQuiz_question_text');
            if (!questionText) return;
            
            const text = questionText.textContent;
            
            // Check if this is the police testing question
            if (text.includes('שוטר') || text.includes('בדיקת נשיפה') || text.includes('אסור לסרב')) {
                console.log(`🎯 Found police testing question ${index + 1}:`, text.substring(0, 100));
                
                // Find the answer options
                const answers = questionDiv.querySelectorAll('.wpProQuiz_questionListItem');
                
                answers.forEach((answerDiv, ansIndex) => {
                    const label = answerDiv.querySelector('label');
                    if (!label) return;
                    
                    const answerText = label.textContent;
                    
                    // Mark the correct answer (option C - about not being allowed to refuse)
                    if (answerText.includes('אסור לסרב') || 
                        answerText.includes('לא רשאי לסרב') ||
                        answerText.includes('חובה להיענות')) {
                        
                        console.log(`✅ CORRECT ANSWER FOUND (Option ${ansIndex}):`, answerText.substring(0, 50));
                        
                        // Override the answer detection
                        window.lilacQuizCorrectAnswers = window.lilacQuizCorrectAnswers || {};
                        window.lilacQuizCorrectAnswers[index + 1] = [ansIndex];
                        
                        // Add visual indicator
                        answerDiv.style.border = '2px solid green';
                        answerDiv.style.backgroundColor = '#e8f5e8';
                        
                        // Add a small indicator
                        if (!answerDiv.querySelector('.correct-indicator')) {
                            const indicator = document.createElement('span');
                            indicator.className = 'correct-indicator';
                            indicator.textContent = ' ✅';
                            indicator.style.color = 'green';
                            indicator.style.fontWeight = 'bold';
                            label.appendChild(indicator);
                        }
                    } else {
                        // Mark incorrect answers
                        answerDiv.style.border = '1px solid #ddd';
                        answerDiv.style.backgroundColor = '#f9f9f9';
                    }
                });
            }
        });
    }
    
    // Run the fix when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixPoliceTestingQuestion);
    } else {
        fixPoliceTestingQuestion();
    }
    
    // Also run after a short delay to catch dynamically loaded content
    setTimeout(fixPoliceTestingQuestion, 1000);
    setTimeout(fixPoliceTestingQuestion, 3000);
    
    console.log('🔧 QUICK ANSWER FIX: Override loaded');
    
})();
