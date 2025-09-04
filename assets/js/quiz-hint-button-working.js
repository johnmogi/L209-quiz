(function() {
    'use strict';
    
    console.log('🔧 Quiz Hint Button Working: Starting...');
    
    function createHintButton() {
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
        
        // Check if hint button already exists
        if (jQuery('.lilac-working-hint').length > 0) {
            console.log('Hint button already exists');
            return;
        }
        
        // Create hint button
        const hintButton = jQuery(`
            <div class="lilac-working-hint" style="
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
        
        // Add click handler with multiple binding methods
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
        
        // Also bind with addEventListener for better compatibility
        hintButton[0].addEventListener('click', function(e) {
            console.log('=== NATIVE CLICK EVENT FIRED ===');
        });
        
        // Test click binding immediately
        console.log('Testing click handler attachment...');
        hintButton.trigger('click');
        
        // Position the button
        quizContainer.append(hintButton);
        
        console.log('✅ HINT BUTTON CREATED AND POSITIONED!');
        console.log('✅ Click handler attached successfully!');
    }
    
    // Initialize
    function init() {
        console.log('🔧 Initializing hint button...');
        
        // Try immediately
        createHintButton();
        
        // Try when DOM is ready
        jQuery(document).ready(function() {
            console.log('🔧 DOM ready, creating hint button...');
            createHintButton();
        });
        
        // Try after a delay
        setTimeout(function() {
            console.log('🔧 Delayed creation...');
            createHintButton();
        }, 1000);
    }
    
    // Start
    init();
    
    console.log('🔧 Quiz Hint Button Working: Script loaded');
    
})();
