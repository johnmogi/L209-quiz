jQuery(document).ready(function($) {
    'use strict';
    
    console.log('Quiz Working System: Starting...');
    
    let systemInitialized = false;
    
    function initializeSystem() {
        if (systemInitialized) return;
        systemInitialized = true;
        
        console.log('=== INITIALIZING QUIZ SYSTEM ===');
        
        // 1. Create hint button if enforce-hint class exists
        if ($('body').hasClass('enforce-hint')) {
            createHintButton();
        }
        
        // 2. Initialize answer feedback
        initAnswerFeedback();
        
        // 3. Initialize debugger for admins
        if ($('body').hasClass('admin-bar')) {
            // Delay debugger initialization to ensure answers are loaded
            setTimeout(function() {
                initDebugger();
            }, 500);
        }
        
        console.log('✅ Quiz system initialized successfully');
    }
    
    function createHintButton() {
        console.log('Creating hint button...');
        
        const $quizContent = $('.wpProQuiz_content');
        if ($quizContent.length === 0) {
            console.log('Quiz content not found');
            return;
        }
        
        // Remove any existing hint buttons to prevent duplicates
        $('.lilac-hint-button').remove();
        
        const $hintButton = $(`
            <div class="lilac-hint-button" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 20px;
                margin: 15px 0;
                border-radius: 6px;
                text-align: center;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
                transition: all 0.2s ease;
                font-size: 14px;
                user-select: none;
            ">
                🔍 לחץ כאן לקבלת רמז
            </div>
        `);
        
        $hintButton.hover(
            function() { $(this).css('transform', 'translateY(-1px)'); },
            function() { $(this).css('transform', 'translateY(0)'); }
        );
        
        $hintButton.on('click', function() {
            console.log('Hint button clicked');
            
            const $nativeHint = $('.wpProQuiz_TipButton');
            if ($nativeHint.length > 0) {
                console.log('Triggering native hint button');
                $nativeHint.first().trigger('click');
            } else {
                alert('רמז לא זמין עבור שאלה זו');
                console.log('No native hint button found');
            }
        });
        
        $quizContent.append($hintButton);
        console.log('✅ Hint button created');
    }
    
    function initAnswerFeedback() {
        console.log('Initializing answer feedback...');
        
        $(document).on('change', '.wpProQuiz_questionList input[type="radio"], .wpProQuiz_questionList input[type="checkbox"]', function() {
            const $input = $(this);
            const $question = $input.closest('.wpProQuiz_questionList');
            
            // Remove previous feedback
            $question.find('.lilac-feedback').remove();
            
            setTimeout(function() {
                // Simple feedback based on data attributes or classes
                const isCorrect = $input.closest('li').hasClass('wpProQuiz_correct') || 
                                $input.data('correct') === true;
                
                const feedbackClass = isCorrect ? 'correct' : 'incorrect';
                const feedbackText = isCorrect ? '✅ נכון!' : '❌ לא נכון';
                
                const $feedback = $(`
                    <div class="lilac-feedback ${feedbackClass}" style="
                        padding: 8px 12px;
                        margin: 8px 0;
                        border-radius: 4px;
                        font-weight: bold;
                        ${isCorrect ? 
                            'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
                            'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
                        }
                    ">
                        ${feedbackText}
                    </div>
                `);
                
                $question.append($feedback);
                console.log('Feedback added:', feedbackClass);
            }, 100);
        });
        
        console.log('✅ Answer feedback initialized');
    }
    
    function initDebugger() {
        console.log('Initializing debugger...');
        
        // Remove existing debugger
        $('#lilac-debugger').remove();
        
        const $debugger = $(`
            <div id="lilac-debugger" style="
                position: fixed;
                top: 40px;
                right: 20px;
                width: 280px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 12px;
                border-radius: 6px;
                z-index: 999999;
                font-family: monospace;
                font-size: 11px;
                max-height: 300px;
                overflow-y: auto;
            ">
                <div style="font-weight: bold; margin-bottom: 8px; color: #667eea;">
                    🔧 Quiz Debugger
                </div>
                <div id="debug-info">
                    <div>Quiz Container: ${$('.wpProQuiz_content').length ? '✅' : '❌'}</div>
                    <div>Questions: ${$('.wpProQuiz_questionList').length}</div>
                    <div>Hint Buttons: ${$('.wpProQuiz_TipButton').length}</div>
                    <div>Custom Hint: ${$('.lilac-hint-button').length ? '✅' : '❌'}</div>
                    <div>Correct Answers: ${getCorrectAnswersCount()}</div>
                    <div>Database Status: ${getDatabaseStatus()}</div>
                </div>
                <button id="refresh-debug" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 10px;
                    margin-top: 8px;
                ">Refresh</button>
            </div>
        `);
        
        $('body').append($debugger);
        
        // Add helper functions for debugger
        window.getCorrectAnswersCount = function() {
            if (typeof window.lilacQuizCorrectAnswers !== 'undefined') {
                const count = Object.keys(window.lilacQuizCorrectAnswers).length;
                console.log('LILAC Debugger: Found', count, 'correct answers');
                return count;
            }
            console.log('LILAC Debugger: No correct answers found');
            return 0;
        };
        
        window.getDatabaseStatus = function() {
            if (typeof window.lilacQuizCorrectAnswers !== 'undefined' && Object.keys(window.lilacQuizCorrectAnswers).length > 0) {
                return '✅ Connected';
            }
            return '❌ No Data';
        };
        
        $('#refresh-debug').on('click', function() {
            $('#debug-info').html(`
                <div>Quiz Container: ${$('.wpProQuiz_content').length ? '✅' : '❌'}</div>
                <div>Questions: ${$('.wpProQuiz_questionList').length}</div>
                <div>Hint Buttons: ${$('.wpProQuiz_TipButton').length}</div>
                <div>Custom Hint: ${$('.lilac-hint-button').length ? '✅' : '❌'}</div>
                <div>Correct Answers: ${getCorrectAnswersCount()}</div>
                <div>Database Status: ${getDatabaseStatus()}</div>
                <div>Time: ${new Date().toLocaleTimeString()}</div>
            `);
        });
        
        console.log('✅ Debugger initialized');
    }
    
    // Initialize immediately and on DOM ready
    initializeSystem();
    
    // Also try after a short delay for dynamic content
    setTimeout(initializeSystem, 500);
    
    console.log('Quiz Working System: Loaded');
});
