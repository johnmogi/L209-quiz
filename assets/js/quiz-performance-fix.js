/**
 * Performance-optimized answer verification
 * Replaces heavy MutationObserver with direct event handling
 */

jQuery(document).ready(function($) {
    console.log('[LilacQuiz] Performance Fix: Loading optimized answer verification');
    
    // Direct event binding instead of MutationObserver
    $(document).on('click', '.wpProQuiz_button[name="check"]', function() {
        const $question = $(this).closest('.wpProQuiz_listItem');
        
        // Wait for LearnDash to process the answer
        setTimeout(function() {
            const hasCorrect = $question.find('.wpProQuiz_answerCorrect, .wpProQuiz_answerCorrectIncomplete').length > 0;
            const hasIncorrect = $question.find('.wpProQuiz_answerIncorrect').length > 0;
            
            if (hasCorrect || hasIncorrect) {
                console.log('[LilacQuiz] Fast answer result:', hasCorrect ? 'CORRECT' : 'INCORRECT');
                handleAnswerResultFast($question, hasCorrect);
            }
        }, 100); // Minimal delay
    });
    
    function handleAnswerResultFast($question, isCorrect) {
        if (!isCorrect && $question.hasClass('enforceHint')) {
            // Show orange hint box immediately
            const $hintBox = $('<div class="lilac-hint-box-fast" style="background: #fff3e0; border: 2px solid #ff9800; padding: 15px; margin: 15px 0; text-align: center; border-radius: 4px; cursor: pointer;">' +
                '<div style="color: #e65100; font-weight: bold; margin-bottom: 10px;">רוצה רמז? לחץ כאן לקבלת עזרה</div>' +
                '<button type="button" class="lilac-show-hint-fast" style="background: #ff9800; color: white; border: none; padding: 8px 24px; border-radius: 4px; font-weight: bold; cursor: pointer;">רמז</button>' +
                '</div>');
            
            $question.find('.wpProQuiz_button[name="check"]').after($hintBox);
            
            // Handle hint click
            $hintBox.on('click', function() {
                $question.find('.wpProQuiz_button[name="tip"]').trigger('click');
            });
        }
    }
});
