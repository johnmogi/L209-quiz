/**
 * Enhanced Quiz Debugger System
 * Provides comprehensive debugging information for quiz functionality
 */

(function($) {
    'use strict';
    
    // Prevent multiple initializations
    if (window.quizDebuggerEnhanced && window.quizDebuggerEnhanced.initialized) {
        return;
    }
    
    window.quizDebuggerEnhanced = {
        initialized: false,
        debugPanel: null,
        debugData: {}
    };
    
    /**
     * Initialize the enhanced debugger
     */
    function initDebugger() {
        console.log('🐛 Initializing Enhanced Quiz Debugger...');
        
        createDebugPanel();
        startDebugging();
        
        window.quizDebuggerEnhanced.initialized = true;
        console.log('✅ Enhanced Quiz Debugger initialized');
    }
    
    /**
     * Create debug panel UI
     */
    function createDebugPanel() {
        const debugPanel = $(`
            <div id="lilac-debug-panel" style="position: fixed; top: 10px; right: 10px; width: 350px; background: rgba(0,0,0,0.9); color: #fff; padding: 15px; border-radius: 8px; z-index: 999999; font-family: monospace; font-size: 12px; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #00ff00;">🐛 QUIZ DEBUGGER</h3>
                    <div>
                        <button id="debug-toggle" style="background: #007cba; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Toggle</button>
                        <button id="debug-close" style="background: #dc3545; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer;">×</button>
                    </div>
                </div>
                <div id="debug-content">
                    <div id="debug-status" style="margin-bottom: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                        <strong>Status:</strong> <span id="debug-status-text">Initializing...</span>
                    </div>
                    <div id="debug-sections"></div>
                </div>
            </div>
        `);
        
        $('body').append(debugPanel);
        window.quizDebuggerEnhanced.debugPanel = debugPanel;
        
        // Setup controls
        $('#debug-toggle').on('click', function() {
            $('#debug-content').toggle();
        });
        
        $('#debug-close').on('click', function() {
            debugPanel.hide();
        });
        
        // Make draggable
        debugPanel.draggable({
            handle: 'h3'
        });
    }
    
    /**
     * Start debugging process
     */
    function startDebugging() {
        updateStatus('Running diagnostics...');
        
        // Run all debug checks
        setTimeout(() => {
            checkQuizElements();
            checkScripts();
            checkHints();
            checkAnswerSystem();
            checkFeedbackSystem();
            updateDebugDisplay();
            updateStatus('Debug complete');
        }, 1000);
        
        // Update every 5 seconds
        setInterval(() => {
            checkQuizElements();
            checkHints();
            updateDebugDisplay();
        }, 5000);
    }
    
    /**
     * Check quiz elements
     */
    function checkQuizElements() {
        const data = {
            questions: $('.wpProQuiz_listItem, .wpProQuiz_question').length,
            answers: $('.wpProQuiz_questionInput').length,
            checkButtons: $('.wpProQuiz_button[name="check"]').length,
            nextButtons: $('.wpProQuiz_button[name="next"]').length,
            feedbackAreas: $('.quiz-feedback-area').length
        };
        
        window.quizDebuggerEnhanced.debugData.elements = data;
    }
    
    /**
     * Check loaded scripts
     */
    function checkScripts() {
        const scripts = {
            jquery: typeof jQuery !== 'undefined',
            hintTriggers: typeof window.quizHintTriggers !== 'undefined',
            answerDetection: typeof window.quizAnswerDetection !== 'undefined',
            databaseLoader: typeof window.quizDatabaseLoader !== 'undefined',
            feedbackSystem: $('script[src*="quiz-ui-feedback-system"]').length > 0
        };
        
        window.quizDebuggerEnhanced.debugData.scripts = scripts;
    }
    
    /**
     * Check hint system
     */
    function checkHints() {
        const hints = {
            nativeHints: $('.wpProQuiz_tipp').length,
            enhancedHints: $('.wpProQuiz_tipp.lilac-enhanced').length,
            hintTriggers: $('.lilac-hint-trigger').length,
            hintButtons: $('.hint-button').length,
            feedbackHintButtons: $('.feedback-hint-btn').length,
            modal: $('#lilac-hint-modal').length > 0
        };
        
        window.quizDebuggerEnhanced.debugData.hints = hints;
    }
    
    /**
     * Check answer detection system
     */
    function checkAnswerSystem() {
        const answers = {
            initialized: window.quizAnswerDetection && window.quizAnswerDetection.initialized,
            questionData: window.quizAnswerDetection ? Object.keys(window.quizAnswerDetection.questionData || {}).length : 0,
            correctAnswers: window.quizAnswerDetection ? Object.keys(window.quizAnswerDetection.correctAnswers || {}).length : 0
        };
        
        window.quizDebuggerEnhanced.debugData.answers = answers;
    }
    
    /**
     * Check feedback system
     */
    function checkFeedbackSystem() {
        const feedback = {
            correctFeedback: $('.correct-feedback').length,
            incorrectFeedback: $('.incorrect-feedback').length,
            correctAnswers: $('.correct-answer').length,
            incorrectAnswers: $('.incorrect-answer').length
        };
        
        window.quizDebuggerEnhanced.debugData.feedback = feedback;
    }
    
    /**
     * Update debug display
     */
    function updateDebugDisplay() {
        const data = window.quizDebuggerEnhanced.debugData;
        
        let html = '';
        
        // Elements section
        if (data.elements) {
            html += `<div style="margin-bottom: 10px; padding: 8px; background: rgba(0,100,0,0.2); border-radius: 4px;">
                <strong>📋 Quiz Elements:</strong><br>
                Questions: ${data.elements.questions}<br>
                Answers: ${data.elements.answers}<br>
                Check Buttons: ${data.elements.checkButtons}<br>
                Next Buttons: ${data.elements.nextButtons}<br>
                Feedback Areas: ${data.elements.feedbackAreas}
            </div>`;
        }
        
        // Scripts section
        if (data.scripts) {
            html += `<div style="margin-bottom: 10px; padding: 8px; background: rgba(0,0,100,0.2); border-radius: 4px;">
                <strong>📜 Scripts Status:</strong><br>
                jQuery: ${data.scripts.jquery ? '✅' : '❌'}<br>
                Hint Triggers: ${data.scripts.hintTriggers ? '✅' : '❌'}<br>
                Answer Detection: ${data.scripts.answerDetection ? '✅' : '❌'}<br>
                Database Loader: ${data.scripts.databaseLoader ? '✅' : '❌'}<br>
                Feedback System: ${data.scripts.feedbackSystem ? '✅' : '❌'}
            </div>`;
        }
        
        // Hints section
        if (data.hints) {
            html += `<div style="margin-bottom: 10px; padding: 8px; background: rgba(100,100,0,0.2); border-radius: 4px;">
                <strong>💡 Hint System:</strong><br>
                Native Hints: ${data.hints.nativeHints}<br>
                Enhanced Hints: ${data.hints.enhancedHints}<br>
                Hint Triggers: ${data.hints.hintTriggers}<br>
                Hint Buttons: ${data.hints.hintButtons}<br>
                Feedback Hint Buttons: ${data.hints.feedbackHintButtons}<br>
                Modal: ${data.hints.modal ? '✅' : '❌'}
            </div>`;
        }
        
        // Answers section
        if (data.answers) {
            html += `<div style="margin-bottom: 10px; padding: 8px; background: rgba(100,0,100,0.2); border-radius: 4px;">
                <strong>🎯 Answer System:</strong><br>
                Initialized: ${data.answers.initialized ? '✅' : '❌'}<br>
                Question Data: ${data.answers.questionData}<br>
                Correct Answers: ${data.answers.correctAnswers}
            </div>`;
        }
        
        // Feedback section
        if (data.feedback) {
            html += `<div style="margin-bottom: 10px; padding: 8px; background: rgba(100,50,0,0.2); border-radius: 4px;">
                <strong>📢 Feedback System:</strong><br>
                Correct Feedback: ${data.feedback.correctFeedback}<br>
                Incorrect Feedback: ${data.feedback.incorrectFeedback}<br>
                Correct Answers: ${data.feedback.correctAnswers}<br>
                Incorrect Answers: ${data.feedback.incorrectAnswers}
            </div>`;
        }
        
        // AJAX section
        html += `<div style="margin-bottom: 10px; padding: 8px; background: rgba(0,100,100,0.2); border-radius: 4px;">
            <strong>🌐 AJAX Status:</strong><br>
            URL: ${typeof lilacHintEnforcement !== 'undefined' && lilacHintEnforcement.ajaxUrl ? '✅ ' + lilacHintEnforcement.ajaxUrl : '❌ Not configured'}<br>
            Nonce: ${typeof lilacHintEnforcement !== 'undefined' && lilacHintEnforcement.nonce ? '✅ Available' : '❌ Missing'}
        </div>`;
        
        $('#debug-sections').html(html);
    }
    
    /**
     * Update status
     */
    function updateStatus(status) {
        $('#debug-status-text').text(status);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebugger);
    } else {
        initDebugger();
    }
    
    // Also initialize after a delay
    setTimeout(initDebugger, 1000);
    
})(jQuery);
