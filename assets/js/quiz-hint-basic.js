/**
 * Basic Quiz Hint System - WORKING VERSION
 * Simple, reliable hint functionality
 */

// Global debug flag
window.LILAC_HINT_DEBUG = true;

(function() {
    'use strict';
    
    console.log('🎯 BASIC HINT SYSTEM: Starting v3.0 - ' + new Date().toLocaleTimeString());
    console.log('🎯 BASIC HINT: jQuery available:', typeof jQuery !== 'undefined');
    console.log('🎯 BASIC HINT: Document ready state:', document.readyState);
    
    function init() {
        console.log('🎯 BASIC HINT: DOM ready, initializing...');
        
        // Multiple attempts to ensure we catch the quiz
        setTimeout(addHintButtons, 500);
        setTimeout(addHintButtons, 1500);
        setTimeout(addHintButtons, 3000);
        
        // Also try on any DOM changes
        if (window.MutationObserver) {
            const observer = new MutationObserver(function() {
                addHintButtons();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
    
    function addHintButtons() {
        console.log('🎯 BASIC HINT: Looking for quiz questions...');
        
        // Try multiple selectors to find quiz questions
        const selectors = [
            '.wpProQuiz_listItem',
            '.wpProQuiz_questionListItem', 
            '[class*="wpProQuiz"]',
            '.learndash-quiz-question'
        ];
        
        let questions = [];
        for (let selector of selectors) {
            questions = document.querySelectorAll(selector);
            if (questions.length > 0) {
                console.log('🎯 BASIC HINT: Found', questions.length, 'questions with selector:', selector);
                break;
            }
        }
        
        if (questions.length === 0) {
            console.log('🎯 BASIC HINT: No quiz questions found yet');
            return;
        }
        
        questions.forEach(function(question, index) {
            // Check if hint button already exists
            if (question.querySelector('.basic-hint-btn')) {
                return;
            }
            
            console.log('🎯 BASIC HINT: Processing question', index + 1);
            
            // Try to find button container in multiple ways
            let buttonContainer = question.querySelector('.wpProQuiz_questionListItem') ||
                                question.querySelector('[class*="button"]') ||
                                question.querySelector('input[type="button"]')?.parentElement ||
                                question;
            
            // Create simple hint button
            const hintBtn = document.createElement('input');
            hintBtn.type = 'button';
            hintBtn.value = 'רמז';
            hintBtn.className = 'wpProQuiz_button basic-hint-btn';
            hintBtn.style.cssText = `
                margin-right: 10px !important; 
                background: #007cba !important; 
                color: white !important;
                padding: 8px 15px !important;
                border: none !important;
                border-radius: 3px !important;
                cursor: pointer !important;
                font-size: 14px !important;
            `;
            
            // Add click handler
            hintBtn.onclick = function() {
                console.log('🎯 BASIC HINT: Button clicked for question', index + 1);
                showHint(question, index + 1);
            };
            
            // Insert hint button
            if (buttonContainer.firstChild) {
                buttonContainer.insertBefore(hintBtn, buttonContainer.firstChild);
            } else {
                buttonContainer.appendChild(hintBtn);
            }
            
            console.log('🎯 BASIC HINT: Added hint button to question', index + 1);
        });
        
        console.log('🎯 BASIC HINT: Finished processing', questions.length, 'questions');
    }
    
    function showHint(question, questionNum) {
        console.log('🎯 BASIC HINT: Showing hint for question', questionNum);
        
        // Look for existing hint content
        let hintDiv = question.querySelector('.wpProQuiz_tipp, .basic-hint-content');
        
        if (hintDiv) {
            // Toggle existing hint
            if (hintDiv.style.display === 'none') {
                hintDiv.style.display = 'block';
                console.log('🎯 BASIC HINT: Showing existing hint');
            } else {
                hintDiv.style.display = 'none';
                console.log('🎯 BASIC HINT: Hiding hint');
                return;
            }
        } else {
            // Create basic hint
            hintDiv = document.createElement('div');
            hintDiv.className = 'wpProQuiz_tipp basic-hint-content';
            hintDiv.style.cssText = `
                background: #f0f8ff !important; 
                border: 2px solid #007cba !important; 
                padding: 15px !important; 
                margin: 10px 0 !important; 
                border-radius: 5px !important;
                font-family: Arial, sans-serif !important;
                direction: rtl !important;
            `;
            hintDiv.innerHTML = `
                <h5 style="margin: 0 0 10px !important; color: #007cba !important; font-size: 16px !important;">רמז</h5>
                <p style="margin: 0 !important; color: #333 !important; line-height: 1.5 !important;">
                    נסה לחשוב על התשובה הנכונה. אם אתה מתקשה, פנה למורה לעזרה.
                </p>
            `;
            
            // Insert after question in multiple possible locations
            const insertTargets = [
                question.querySelector('.wpProQuiz_question_text'),
                question.querySelector('.wpProQuiz_question'),
                question.querySelector('[class*="question"]'),
                question.firstElementChild
            ];
            
            let inserted = false;
            for (let target of insertTargets) {
                if (target && target.parentNode) {
                    target.parentNode.insertBefore(hintDiv, target.nextSibling);
                    inserted = true;
                    console.log('🎯 BASIC HINT: Hint inserted after', target.className);
                    break;
                }
            }
            
            if (!inserted) {
                question.appendChild(hintDiv);
                console.log('🎯 BASIC HINT: Hint appended to question container');
            }
        }
        
        console.log('🎯 BASIC HINT: Hint display completed for question', questionNum);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
