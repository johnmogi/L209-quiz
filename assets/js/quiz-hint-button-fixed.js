/**
 * Quiz Hint Button - Fixed Version
 * Bypasses caching issues and provides proper positioning and functionality
 */

(function() {
    'use strict';
    
    console.log('🔧 Quiz Hint Button Fixed: Starting...');
    
    let hintButtonCreated = false;
    
    function createWorkingHintButton() {
        if (hintButtonCreated) {
            console.log('Hint button already created, skipping...');
            return;
        }
        
        console.log('=== CREATING WORKING HINT BUTTON ===');
        
        // Remove any existing hint buttons
        jQuery('.lilac-working-hint, .lilac-template-hint, .lilac-force-hint, .lilac-hint-message').remove();
        
        // Check if body has enforce-hint class
        const hasEnforceHint = jQuery('body').hasClass('enforce-hint');
        console.log('Body has enforce-hint class:', hasEnforceHint);
        
        if (!hasEnforceHint) {
            console.log('❌ Body does not have enforce-hint class - hint button not created');
            return;
        }
        
        // Find quiz container with comprehensive selectors
        const quizContainer = jQuery('.wpProQuiz_content, .wpProQuiz_quiz, #wpProQuiz_1, [id^="wpProQuiz_"], .ld-quiz, .learndash-quiz').first();
        console.log('Quiz container found:', quizContainer.length);
        
        if (quizContainer.length === 0) {
            console.log('❌ No quiz container found');
            return;
        }
        
        console.log('Quiz container ID:', quizContainer.attr('id'));
        console.log('Quiz container class:', quizContainer.attr('class'));
        
        // Create properly styled hint button
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
        
        // Add comprehensive click handler with enhanced debugging - IMMEDIATE ATTACHMENT
        console.log('🔧 Attaching click handler to hint button...');
        
        // Simple, direct click handler that works immediately
        hintButton.on('click', function(e) {
            console.log('=== HINT BUTTON CLICKED ===');
            
            // Try to find native hint button and click it
            var nativeHintBtn = jQuery('.wpProQuiz_TipButton, .wpProQuiz_tipButton, input[value*="רמז"], button[class*="hint"]');
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
        
        console.log('✅ Click handler attached successfully!');
                
                console.log(`Checking selector "${selector}": found ${hintBtns.length} elements`);
                
                hintBtns.each(function(index) {
                    const btn = jQuery(this);
                    const btnText = btn.text() || btn.val() || btn.attr('title') || '';
                    const btnClass = btn.attr('class') || '';
                    const btnId = btn.attr('id') || '';
                    
                    console.log(`  Element ${index}:`, {
                        tag: this.tagName,
                        text: btnText.substring(0, 50),
                        class: btnClass,
                        id: btnId,
                        visible: btn.is(':visible'),
                        display: btn.css('display'),
                        opacity: btn.css('opacity'),
                        onclick: this.onclick ? 'has onclick' : 'no onclick'
                    });
                    
                    // Try clicking any button that might be a hint button
                    if (btnText.toLowerCase().includes('hint') || 
                        btnText.includes('רמז') ||
                        btnClass.toLowerCase().includes('hint') ||
                        btnClass.toLowerCase().includes('tip')) {
                        
                        console.log('  🎯 Found potential hint button, attempting click:', this);
                        
                        try {
                            // Try multiple click approaches
                            btn.trigger('click');
                            btn.click();
                            if (this.onclick) this.onclick();
                            this.click();
                            
                            // Check if hint appeared after click
                            setTimeout(() => {
                                const visibleHints = jQuery('.wpProQuiz_tipp:visible, .wpProQuiz_hint_content:visible');
                                if (visibleHints.length > 0) {
                                    console.log('✅ Hint appeared after clicking button!');
                                    hintFound = true;
                                }
                            }, 100);
                            
                            hintFound = true;
                            console.log('  ✅ Hint button clicked successfully!');
                            return false; // break out of each loop
                        } catch (e) {
                            console.log('  ❌ Error clicking button:', e);
                        }
                    }
                });
            }
            
            console.log('Total buttons found across all selectors:', totalButtons);
            
            if (!hintFound) {
                console.log('❌ No working hint button found, trying alternative approach...');
                
                // Try to trigger hint display through JavaScript events
                const allButtons = jQuery('.wpProQuiz_content input[type="button"], .wpProQuiz_content button');
                console.log('Trying to click all quiz buttons as last resort:', allButtons.length);
                
                allButtons.each(function(i) {
                    console.log(`Clicking button ${i}:`, this);
                    try {
                        jQuery(this).trigger('click');
                    } catch (e) {
                        console.log('Error clicking button:', e);
                    }
                });
                
                // Show informative message in Hebrew
                setTimeout(() => {
                    const visibleHints = jQuery('.wpProQuiz_tipp:visible, .wpProQuiz_hint_content:visible');
                    if (visibleHints.length === 0) {
                        let message = 'רמז לא זמין כרגע.\n';
                        if (totalButtons > 0) {
                            message += `נמצאו ${totalButtons} כפתורים אך אף אחד לא הציג רמז.\n`;
                        }
                        message += 'נסה לענות על השאלה תחילה או לרענן את הדף.';
                        alert(message);
                    } else {
                        console.log('✅ Hint found after clicking all buttons!');
                    }
                }, 500);
            } else {
                console.log('✅ Hint successfully activated!');
            }
        });
        
        // Smart positioning strategy
        const positionStrategies = [
            // Strategy 1: After the last question
            function() {
                const questions = quizContainer.find('.wpProQuiz_question, .wpProQuiz_listItem, [class*="question"]');
                if (questions.length > 0) {
                    questions.last().after(hintButton);
                    return 'after-questions';
                }
                return false;
            },
            
            // Strategy 2: Before quiz action buttons
            function() {
                const buttons = quizContainer.find('.wpProQuiz_button, input[type="button"], button').not('.lilac-working-hint');
                if (buttons.length > 0) {
                    buttons.first().before(hintButton);
                    return 'before-buttons';
                }
                return false;
            },
            
            // Strategy 3: After quiz form
            function() {
                const form = quizContainer.find('form').first();
                if (form.length > 0) {
                    form.after(hintButton);
                    return 'after-form';
                }
                return false;
            },
            
            // Strategy 4: At end of quiz container
            function() {
                quizContainer.append(hintButton);
                return 'end-of-container';
            }
        ];
        
        let positionUsed = false;
        for (let i = 0; i < positionStrategies.length && !positionUsed; i++) {
            const strategy = positionStrategies[i];
            const result = strategy();
            if (result) {
                console.log(`✅ Hint button positioned using strategy: ${result}`);
                positionUsed = true;
            } else {
                console.log(`❌ Failed to position hint button using strategy: ${strategy.name}`);
            }
        }
        
        console.log('✅ WORKING HINT BUTTON CREATED AND POSITIONED!');
        console.log('🔧 Click handler attached with namespace: click.hintButtonHandler');
        
        // Verify button visibility after a short delay
        setTimeout(function() {
            const verification = jQuery('.lilac-working-hint');
            if (verification.length > 0 && verification.is(':visible')) {
                console.log('✅ SUCCESS: Hint button is visible and ready!');
                console.log('Button position:', verification.offset());
                console.log('Button dimensions:', {
                    width: verification.width(), 
                    height: verification.height()
                });
            } else {
                console.log('❌ WARNING: Hint button may not be visible');
            }
        }, 100);
    }
    
    // Initialize when DOM is ready
    function initHintButton() {
        console.log('🔧 initHintButton called, document.readyState:', document.readyState);
        
        // Try immediately regardless of document state
        console.log('🔧 Attempting immediate creation...');
        createWorkingHintButton();
        
        if (document.readyState === 'loading') {
            console.log('🔧 Document still loading, adding DOMContentLoaded listener');
            document.addEventListener('DOMContentLoaded', function() {
                console.log('🔧 DOMContentLoaded fired, creating hint button');
                createWorkingHintButton();
            });
        } else {
            console.log('🔧 Document ready, calling createWorkingHintButton again');
            createWorkingHintButton();
        }
        
        // Also try after delays with explicit logging
        console.log('🔧 Setting up delayed calls...');
        window.setTimeout(function() {
            console.log('🔧 1-second delay call executing');
            createWorkingHintButton();
        }, 1000);
        
        window.setTimeout(function() {
            console.log('🔧 3-second delay call executing');
            createWorkingHintButton();
        }, 3000);
        
        // Also try when jQuery is ready
        if (typeof jQuery !== 'undefined') {
            console.log('🔧 jQuery available, adding ready handler');
            jQuery(document).ready(function() {
                console.log('🔧 jQuery ready fired, creating hint button');
                createWorkingHintButton();
            });
        }
    }
    
    // Start initialization
    initHintButton();
    
    console.log('🔧 Quiz Hint Button Fixed: Script loaded and initialized');
    
})();
