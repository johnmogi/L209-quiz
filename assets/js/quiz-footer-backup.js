/**
 * Footer-based Quiz Answer Backup System
 * Pre-loads all correct answers in footer for instant verification
 */

jQuery(document).ready(function($) {
    console.log('[LilacQuiz] Footer Backup System: Initializing');
    
    // Get quiz data from footer (injected by PHP)
    const quizAnswers = window.lilacQuizAnswers || {};
    
    if (Object.keys(quizAnswers).length === 0) {
        console.log('[LilacQuiz] No quiz answers found in footer data');
        return;
    }
    
    console.log('[LilacQuiz] Loaded answers for', Object.keys(quizAnswers).length, 'questions');
    
    // Fast answer verification using pre-loaded data
    $(document).on('click', '.wpProQuiz_button[name="check"]', function() {
        const $question = $(this).closest('.wpProQuiz_listItem');
        const questionIndex = $question.index();
        const selectedAnswer = $question.find('.wpProQuiz_questionInput:checked').val();
        
        // Instant verification using footer data
        const correctAnswer = quizAnswers[questionIndex];
        const isCorrect = (selectedAnswer == correctAnswer);
        
        console.log('[LilacQuiz] Instant verification - Question:', questionIndex, 'Selected:', selectedAnswer, 'Correct:', correctAnswer, 'Result:', isCorrect);
        
        // Show immediate feedback
        setTimeout(function() {
            if (!isCorrect) {
                showHintBoxInstant($question);
            }
        }, 50);
    });
    
    function showHintBoxInstant($question) {
        // Remove existing hint boxes
        $question.find('.lilac-hint-box-instant').remove();
        
        const $hintBox = $('<div class="lilac-hint-box-instant" style="background: #fff3e0; border: 2px solid #ff9800; padding: 15px; margin: 15px 0; text-align: center; border-radius: 4px; cursor: pointer; animation: slideIn 0.3s ease-out;">' +
            '<div style="color: #e65100; font-weight: bold; margin-bottom: 10px;">רוצה רמז? לחץ כאן לקבלת עזרה</div>' +
            '<button type="button" class="lilac-show-hint-instant" style="background: #ff9800; color: white; border: none; padding: 8px 24px; border-radius: 4px; font-weight: bold; cursor: pointer;">רמז</button>' +
            '</div>');
        
        // Insert after check button
        $question.find('.wpProQuiz_button[name="check"]').after($hintBox);
        
        // Handle hint click
        $hintBox.on('click', function() {
            $question.find('.wpProQuiz_button[name="tip"]').trigger('click');
        });
    }
    
    // Add slide-in animation
    $('<style>').text(`
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `).appendTo('head');
});
