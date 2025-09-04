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
            
            // Wait for DOM to be ready
            $(document).ready(() => {
                this.createAlwaysVisibleHintButton();
                this.setupAnswerFeedback();
                this.setupQuizObserver();
            });
        }

        createAlwaysVisibleHintButton() {
            // Remove any existing hint button
            $('#lilac-always-hint-btn').remove();
            
            const quizContainer = $('.wpProQuiz_content');
            if (!quizContainer.length) {
                console.log('Quiz container not found, retrying...');
                setTimeout(() => this.createAlwaysVisibleHintButton(), 1000);
                return;
            }

            // Create always-visible hint button matching screenshot design
            const hintButton = $(`
                <div id="lilac-always-hint-btn" class="lilac-always-hint-button">
                    <button type="button" class="hint-btn">
                        רמז
                    </button>
                    <span class="hint-text">צפייה ברמז 💡</span>
                </div>
            `);

            // Add click handler
            hintButton.find('.hint-btn').on('click', (e) => {
                e.preventDefault();
                this.showHintModal();
            });

            // Insert after quiz container
            quizContainer.after(hintButton);
            console.log('✅ Always-visible hint button created');
        }

        showHintModal() {
            // Remove existing modal
            $('.lilac-hint-modal').remove();
            
            // Get hint content from existing quiz hint or create default
            let hintContent = this.getHintContent();
            
            // Create hint modal matching screenshot design
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
            
            // Close on background click
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
            return 'החלק אופר במופרע נהגה תחת השפעת אלכוהול או מיממ מעכרים וחרדי נמצא רב לא לאפשר לאדם התנהגות חייב לצייתו';
        }

        triggerHint() {
            // Show modal instead of clicking existing button
            this.showHintModal();
        }

        setupAnswerFeedback() {
            console.log('Setting up answer feedback system...');
            
            // Monitor for quiz submission results
            this.observeQuizResults();
        }

        observeQuizResults() {
            // Watch for result messages
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

            // Also check existing elements
            this.checkForResultMessages($('body'));
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
            const wrongIndicators = $container.find('.wpProQuiz_incorrect, .incorrect-answer, [class*="incorrect"], [class*="wrong"]');
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
            const feedback = $(`
                <div class="lilac-feedback-message ${feedbackClass}">
                    <span class="feedback-text">${message}</span>
                    ${type === 'wrong' ? '<button class="feedback-hint-btn">רמז</button>' : ''}
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
                if (!$('#lilac-always-hint-btn').length) {
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
    window.lilacQuizFeedback = new QuizFeedbackSystem();

    console.log('Quiz Feedback System: Script loaded');

})(jQuery);
