(function() {
    'use strict';
    
    console.log('🔧 Quiz Comprehensive System: Starting...');
    
    let hintButtonCreated = false;
    let debuggerInitialized = false;
    
    // Hint Button System
    function createHintButton() {
        if (hintButtonCreated) return;
        
        console.log('=== CREATING HINT BUTTON ===');
        
        // Check if body has enforce-hint class
        if (!document.body.classList.contains('enforce-hint')) {
            console.log('Body does not have enforce-hint class, skipping');
            return;
        }
        
        // Find quiz container
        const quizContainer = jQuery('#wpProQuiz_102, .wpProQuiz_content').first();
        if (quizContainer.length === 0) {
            console.log('Quiz container not found');
            return;
        }
        
        console.log('Quiz container found:', quizContainer[0]);
        
        // Create hint button
        const hintButton = jQuery(`
            <div class="lilac-comprehensive-hint" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                transition: all 0.3s ease;
                z-index: 99999;
                position: relative;
                border: 2px solid #4a5568;
                font-size: 16px;
                clear: both;
                width: 100%;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
                line-height: 1.4;
            ">
                🔍 לחץ כאן לקבלת רמז
            </div>
        `);
        
        // Add hover effects
        hintButton.hover(
            function() {
                jQuery(this).css({
                    'transform': 'translateY(-2px)',
                    'box-shadow': '0 6px 20px rgba(102, 126, 234, 0.4)'
                });
            },
            function() {
                jQuery(this).css({
                    'transform': 'translateY(0)',
                    'box-shadow': '0 4px 15px rgba(102, 126, 234, 0.3)'
                });
            }
        );
        
        // Add click handler
        hintButton.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== HINT BUTTON CLICKED ===');
            
            // Try to find native hint button
            const nativeHintBtn = jQuery('.wpProQuiz_TipButton, .wpProQuiz_tipButton, input[value*="רמז"], button[class*="hint"]');
            console.log('Native hint buttons found:', nativeHintBtn.length);
            
            if (nativeHintBtn.length > 0) {
                console.log('Clicking native hint button...');
                nativeHintBtn.first().trigger('click');
            } else {
                // Show Hebrew message if no hint available
                alert('שימו לב רמז לא זמין עבור שאלה זו');
                console.log('No native hint button found - showing Hebrew message');
            }
        });
        
        // Position the button
        quizContainer.append(hintButton);
        hintButtonCreated = true;
        
        console.log('✅ HINT BUTTON CREATED AND POSITIONED!');
    }
    
    // Answer Feedback System
    function initAnswerFeedback() {
        console.log('=== INITIALIZING ANSWER FEEDBACK ===');
        
        // Monitor answer selections
        jQuery(document).on('change', '.wpProQuiz_questionList input[type="radio"], .wpProQuiz_questionList input[type="checkbox"]', function() {
            const selectedAnswer = jQuery(this);
            const questionContainer = selectedAnswer.closest('.wpProQuiz_questionList');
            
            console.log('Answer selected:', selectedAnswer.val());
            
            // Clear previous feedback
            questionContainer.find('.lilac-answer-feedback').remove();
            
            // Add feedback based on answer correctness
            setTimeout(function() {
                const isCorrect = selectedAnswer.closest('li').hasClass('wpProQuiz_correct') || 
                                selectedAnswer.data('correct') === true;
                
                const feedbackHtml = isCorrect ? 
                    '<div class="lilac-answer-feedback correct">✅ תשובה נכונה!</div>' :
                    '<div class="lilac-answer-feedback incorrect">❌ תשובה לא נכונה</div>';
                
                questionContainer.append(feedbackHtml);
                
                console.log('Feedback added:', isCorrect ? 'Correct' : 'Incorrect');
            }, 100);
        });
    }
    
    // Debugger System (Admin only)
    function initDebugger() {
        if (debuggerInitialized) return;
        
        // Check if user is admin
        if (!document.body.classList.contains('logged-in') || !document.body.classList.contains('admin-bar')) {
            console.log('Debugger: Not admin user, skipping');
            return;
        }
        
        console.log('=== INITIALIZING DEBUGGER ===');
        
        // Create debugger panel
        const debuggerPanel = jQuery(`
            <div id="lilac-debugger" style="
                position: fixed;
                top: 50px;
                right: 20px;
                width: 300px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 999999;
                font-family: monospace;
                font-size: 12px;
                max-height: 400px;
                overflow-y: auto;
                border: 2px solid #4a5568;
            ">
                <h3 style="margin: 0 0 10px 0; color: #667eea;">Quiz Debugger</h3>
                <div id="debugger-content">
                    <div>Quiz ID: ${jQuery('body').data('quiz-id') || 'Unknown'}</div>
                    <div>Container: ${jQuery('.wpProQuiz_content').length ? 'Found' : 'Not Found'}</div>
                    <div>Questions: ${jQuery('.wpProQuiz_questionList').length}</div>
                    <div>Hint Buttons: ${jQuery('.wpProQuiz_TipButton').length}</div>
                </div>
                <button id="refresh-debugger" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                ">Refresh</button>
            </div>
        `);
        
        jQuery('body').append(debuggerPanel);
        
        // Refresh button functionality
        jQuery('#refresh-debugger').on('click', function() {
            jQuery('#debugger-content').html(`
                <div>Quiz ID: ${jQuery('body').data('quiz-id') || 'Unknown'}</div>
                <div>Container: ${jQuery('.wpProQuiz_content').length ? 'Found' : 'Not Found'}</div>
                <div>Questions: ${jQuery('.wpProQuiz_questionList').length}</div>
                <div>Hint Buttons: ${jQuery('.wpProQuiz_TipButton').length}</div>
                <div>Custom Hint: ${jQuery('.lilac-comprehensive-hint').length ? 'Created' : 'Not Created'}</div>
                <div>Time: ${new Date().toLocaleTimeString()}</div>
            `);
        });
        
        debuggerInitialized = true;
        console.log('✅ DEBUGGER INITIALIZED!');
    }
    
    // Initialize all systems
    function init() {
        console.log('🔧 Initializing comprehensive system...');
        
        // Initialize immediately
        createHintButton();
        initAnswerFeedback();
        initDebugger();
        
        // Initialize when DOM is ready
        jQuery(document).ready(function() {
            console.log('🔧 DOM ready, initializing systems...');
            createHintButton();
            initAnswerFeedback();
            initDebugger();
        });
        
        // Initialize after delay for dynamic content
        setTimeout(function() {
            console.log('🔧 Delayed initialization...');
            createHintButton();
            initDebugger();
        }, 1000);
    }
    
    // Start the system
    init();
    
    console.log('🔧 Quiz Comprehensive System: Loaded');
    
})();
