/**
 * Quiz Feedback System
 * Provides always-visible hint button and answer feedback messages
 */

(function($) {
    'use strict';

    class QuizFeedbackSystem {
        constructor() {
            this.init();
        }

        init() {
            console.log('Quiz Feedback System: Initializing...');
            console.log('Document ready state:', document.readyState);
            
            let initialized = false;
            
            // Initialize immediately if DOM is ready, otherwise wait
            if (document.readyState === 'loading') {
                console.log('Quiz Feedback System: DOM is loading, waiting for ready...');
                
                // Primary method: jQuery document ready
                $(document).ready(() => {
                    if (!initialized) {
                        console.log('Quiz Feedback System: DOM ready callback fired, starting initialization...');
                        initialized = true;
                        this.startInitialization();
                    }
                });
                
                // Fallback method: timeout
                setTimeout(() => {
                    if (!initialized) {
                        console.log('Quiz Feedback System: DOM ready timeout fallback, starting initialization...');
                        initialized = true;
                        this.startInitialization();
                    }
                }, 2000);
                
            } else {
                console.log('Quiz Feedback System: DOM already ready, starting initialization immediately...');
                this.startInitialization();
            }
        }

        startInitialization() {
            this.createAlwaysVisibleHintButton();
            this.setupAnswerFeedback();
            this.setupQuizObserver();
        }

        createAlwaysVisibleHintButton() {
            // Remove any existing hint button
            $('.lilac-hint-message').remove();
            
            const quizContainer = $('.wpProQuiz_content');
            if (!quizContainer.length) {
                console.log('Quiz container not found, retrying...');
                setTimeout(() => this.createAlwaysVisibleHintButton(), 1000);
                return;
            }

            // Create always-visible hint button matching production design
            const hintButton = $(`
                <div class="lilac-hint-message" style="background: rgb(204, 229, 255); border: 2px solid rgb(0, 123, 255); border-radius: 8px; padding: 15px 20px; display: flex; align-items: center; gap: 15px; direction: rtl; text-align: right; font-family: Arial, sans-serif; margin: 15px 0px; width: 100%; max-width: 800px; box-sizing: border-box;">
                    <div style="display: flex; align-items: center; gap: 10px; color: #004085; font-weight: bold; font-size: 16px;">
                        <span style="color: #007bff; font-size: 18px;">
                            <img draggable="false" role="img" class="emoji" alt="💡" src="https://s.w.org/images/core/emoji/16.0.1/svg/1f4a1.svg">
                        </span>
                        <span>צפייה ברמז</span>
                    </div>
                    <button class="lilac-force-hint" style="background: #007bff; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; min-width: 80px;">רמז</button>
                </div>
            `);

            // Add click handler
            hintButton.find('.lilac-force-hint').on('click', (e) => {
                e.preventDefault();
                this.showHintModal();
            });

            // Insert hint button after quiz container
            quizContainer.after(hintButton);
            console.log('✅ Always-visible hint button created');
        }

        showHintModal() {
            // Remove existing modal
            $('.lilac-hint-modal').remove();
            
            // Get hint content
            const hintContent = this.getHintContent();
            
            // Create hint modal matching production design
            const modal = $(`
                <div class="lilac-hint-modal">
                    <div class="lilac-hint-modal-content">
                        <button class="lilac-hint-modal-close">×</button>
                        <h3>שאלות בנושא: מבחן תרגול - רמז</h3>
                        <p>${hintContent}</p>
                        <button class="hint-btn" style="background: #007cba; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            אישור
                        </button>
                    </div>
                </div>
            `);
            
            // Add event handlers
            modal.find('.lilac-hint-modal-close, .hint-btn').on('click', () => {
                modal.fadeOut(300, () => modal.remove());
            });
            
            // Close modal when clicking outside
            modal.on('click', (e) => {
                if (e.target === modal[0]) {
                    modal.fadeOut(300, () => modal.remove());
                }
            });
            
            // Add to page
            $('body').append(modal);
            console.log('🎯 Hint modal displayed');
        }
        
        getHintContent() {
            // Try to get hint from existing quiz elements
            const existingHint = $('.wpProQuiz_tipp').text().trim();
            if (existingHint) {
                return existingHint;
            }
            
            // Default hint content
            return 'החוק אוסר במפורש נהיגה תחת השפעת אלכוהול או סמים משכרים ודורש מבעל רכב לא לאפשר לאדם הנמצא תחת השפעות אלכוהול לנהוג ברכבו.';
        }

        setupAnswerFeedback() {
            // Watch for quiz result changes
            this.observeQuizResults();
        }

        observeQuizResults() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.checkForResultMessages($(node));
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        checkForResultMessages($container) {
            // Check for correct answer indicators
            const correctIndicators = $container.find('.wpProQuiz_correct, .correct-answer, [class*="correct"]');
            correctIndicators.each((i, el) => {
                if ($(el).is(':visible') && !$(el).hasClass('lilac-processed')) {
                    $(el).addClass('lilac-processed');
                    this.showCorrectAnswerFeedback();
                }
            });

            // Check for wrong answer indicators
            const wrongIndicators = $container.find('.wpProQuiz_incorrect, .incorrect-answer, [class*="wrong"]');
            wrongIndicators.each((i, el) => {
                if ($(el).is(':visible') && !$(el).hasClass('lilac-processed')) {
                    $(el).addClass('lilac-processed');
                    this.showWrongAnswerFeedback();
                }
            });
        }

        showCorrectAnswerFeedback() {
            const message = 'כל הכבוד! תשובה נכונה';
            this.showFeedbackMessage(message, 'correct');
        }

        showWrongAnswerFeedback() {
            const message = 'תשובה שגויה! לחץ על הרמז לקבלת עזרה';
            this.showFeedbackMessage(message, 'wrong');
        }

        showFeedbackMessage(message, type) {
            // Remove existing feedback
            $('.lilac-feedback-message').remove();

            const feedbackClass = `lilac-feedback-${type}`;
            const backgroundColor = type === 'correct' ? 'rgb(212, 237, 218)' : 'rgb(248, 215, 218)';
            const borderColor = type === 'correct' ? 'rgb(40, 167, 69)' : 'rgb(220, 53, 69)';
            const textColor = type === 'correct' ? 'rgb(21, 87, 36)' : 'rgb(114, 28, 36)';
            
            const feedback = $(`
                <div class="lilac-feedback-message ${feedbackClass}" style="background: ${backgroundColor}; border: 2px solid ${borderColor}; border-radius: 8px; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; gap: 15px; direction: rtl; text-align: right; font-family: Arial, sans-serif; margin: 15px 0px; width: 100%; max-width: 800px; box-sizing: border-box;">
                    <span class="feedback-text" style="color: ${textColor}; font-weight: bold; font-size: 16px;">${message}</span>
                    ${type === 'wrong' ? '<button class="feedback-hint-btn" style="background: #dc3545; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; min-width: 80px;">רמז</button>' : ''}
                </div>
            `);

            // Add click handler for hint button in wrong answer feedback
            if (type === 'wrong') {
                feedback.find('.feedback-hint-btn').on('click', () => {
                    this.showHintModal();
                });
            }

            // Insert feedback message after quiz container
            const quizContainer = $('.wpProQuiz_content');
            if (quizContainer.length) {
                quizContainer.after(feedback);
            } else {
                $('body').append(feedback);
            }

            // Auto-hide after 5 seconds (except for wrong answers)
            if (type !== 'wrong') {
                setTimeout(() => {
                    feedback.fadeOut(500, () => feedback.remove());
                }, 5000);
            }

            console.log(`📢 Feedback shown: ${type} - ${message}`);
        }

        setupQuizObserver() {
            // Watch for quiz state changes
            const quizObserver = new MutationObserver(() => {
                // Ensure hint button is always present
                if (!$('.lilac-hint-message').length) {
                    setTimeout(() => this.createAlwaysVisibleHintButton(), 500);
                }
            });

            quizObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // Initialize the feedback system
    window.LilacQuizFeedback = new QuizFeedbackSystem();

    console.log('Quiz Feedback System: Script loaded');

})(jQuery);
