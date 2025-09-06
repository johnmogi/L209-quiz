/**
 * Advanced Quiz Expansion Overlay
 * Enhanced version with better error handling and performance
 */

(function($) {
    'use strict';
    
    // Prevent multiple initializations
    if (window.LilacExpansionOverlay && window.LilacExpansionOverlay.initialized) {
        return;
    }
    
    window.LilacExpansionOverlay = {
        initialized: false,
        overlay: null,
        isExpanded: false
    };
    
    /**
     * Initialize the expansion overlay system
     */
    function initExpansionOverlay() {
        console.log('🔍 Initializing Advanced Expansion Overlay...');
        
        createOverlay();
        setupTriggers();
        
        window.LilacExpansionOverlay.initialized = true;
        console.log('✅ Advanced Expansion Overlay initialized');
    }
    
    /**
     * Create overlay element
     */
    function createOverlay() {
        if (window.LilacExpansionOverlay.overlay) return;
        
        const overlay = $(`
            <div id="lilac-expansion-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 999999;
                overflow-y: auto;
                padding: 20px;
                box-sizing: border-box;
                display: none;
                font-family: Arial, sans-serif;
                color: white;
            ">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="color: #00ff00; margin: 0;">🔍 Quiz Expansion View</h2>
                        <button id="close-expansion" style="
                            background: #dc3545;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                        ">Close</button>
                    </div>
                    <div id="expansion-content">
                        Loading...
                    </div>
                </div>
            </div>
        `);
        
        $('body').append(overlay);
        window.LilacExpansionOverlay.overlay = overlay;
        
        // Setup close functionality
        overlay.find('#close-expansion').on('click', closeOverlay);
        overlay.on('click', function(e) {
            if (e.target.id === 'lilac-expansion-overlay') {
                closeOverlay();
            }
        });
    }
    
    /**
     * Setup trigger mechanisms
     */
    function setupTriggers() {
        // Keyboard shortcut: Ctrl+Shift+E
        $(document).on('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                toggleOverlay();
            }
        });
        
        // Add trigger button to debug panel if it exists
        setTimeout(() => {
            if ($('#lilac-debug-panel').length) {
                const triggerButton = $(`
                    <button id="expansion-trigger" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 3px;
                        cursor: pointer;
                        margin: 5px 0;
                        width: 100%;
                    ">🔍 Expand Quiz</button>
                `);
                
                triggerButton.on('click', toggleOverlay);
                $('#lilac-debug-panel').find('#debug-content').prepend(triggerButton);
            }
        }, 2000);
    }
    
    /**
     * Toggle overlay visibility
     */
    function toggleOverlay() {
        if (window.LilacExpansionOverlay.isExpanded) {
            closeOverlay();
        } else {
            openOverlay();
        }
    }
    
    /**
     * Open overlay
     */
    function openOverlay() {
        console.log('🔍 Opening expansion overlay...');
        
        loadExpansionContent();
        window.LilacExpansionOverlay.overlay.show();
        window.LilacExpansionOverlay.isExpanded = true;
    }
    
    /**
     * Close overlay
     */
    function closeOverlay() {
        console.log('🔍 Closing expansion overlay...');
        
        window.LilacExpansionOverlay.overlay.hide();
        window.LilacExpansionOverlay.isExpanded = false;
    }
    
    /**
     * Load expansion content
     */
    function loadExpansionContent() {
        const contentDiv = $('#expansion-content');
        contentDiv.html('<div style="text-align: center; padding: 40px;">Loading quiz data...</div>');
        
        // Try to get data from various sources
        let questions = [];
        
        // Source 1: LilacAnswerCorrection
        if (window.LilacAnswerCorrection && window.LilacAnswerCorrection.correctAnswers) {
            const correctAnswers = window.LilacAnswerCorrection.correctAnswers;
            Object.keys(correctAnswers).forEach(qId => {
                const data = correctAnswers[qId];
                questions.push({
                    id: qId,
                    text: data.questionText,
                    correctIndex: data.correctIndex,
                    answers: data.answers
                });
            });
        }
        
        // Source 2: LilacQuizAnalyzer
        if (questions.length === 0 && window.LilacQuizAnalyzer && window.LilacQuizAnalyzer.correctAnswers) {
            Object.keys(window.LilacQuizAnalyzer.correctAnswers).forEach(qId => {
                questions.push({
                    id: qId,
                    text: `Question ${qId}`,
                    correctIndex: window.LilacQuizAnalyzer.correctAnswers[qId],
                    answers: []
                });
            });
        }
        
        // Generate content
        if (questions.length > 0) {
            generateQuestionContent(questions);
        } else {
            // Fallback: load via AJAX
            loadViaAjax();
        }
    }
    
    /**
     * Generate question content display
     */
    function generateQuestionContent(questions) {
        let html = `
            <div style="background: #2c2c2c; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #00ff00; margin: 0 0 10px 0;">📊 Quiz Overview</h3>
                <p>Total Questions: <strong>${questions.length}</strong></p>
                <p>Data Source: <strong>Live Integration System</strong></p>
                <p>Last Updated: <strong>${new Date().toLocaleTimeString()}</strong></p>
            </div>
        `;
        
        questions.forEach((q, index) => {
            const questionNum = index + 1;
            
            html += `
                <div style="background: #1a1a1a; border: 1px solid #444; border-radius: 8px; margin-bottom: 15px; padding: 15px;">
                    <div style="background: #e74c3c; color: white; padding: 8px 12px; margin: -15px -15px 15px -15px; border-radius: 8px 8px 0 0;">
                        <strong>Question ${questionNum} of ${questions.length} (ID: ${q.id})</strong>
                        ${q.correctIndex !== null ? ` - 1 Correct Answer` : ''}
                    </div>
                    
                    <div style="margin-bottom: 15px; font-size: 16px; line-height: 1.4;">
                        ${q.text || '[Question text not available]'}
                    </div>
                    
                    ${generateAnswerOptions(q.answers, q.correctIndex)}
                </div>
            `;
        });
        
        $('#expansion-content').html(html);
    }
    
    /**
     * Generate answer options HTML
     */
    function generateAnswerOptions(answers, correctIndex) {
        if (!answers || Object.keys(answers).length === 0) {
            return '<div style="color: #999; font-style: italic;">Answer options not available</div>';
        }
        
        let html = '<div style="margin-top: 10px;"><strong>Answer Options:</strong><br>';
        
        Object.keys(answers).forEach(index => {
            const answer = answers[index];
            const letter = String.fromCharCode(65 + parseInt(index));
            const isCorrect = parseInt(index) === correctIndex;
            const correctMarker = isCorrect ? ' <span style="background: #27ae60; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">✓ CORRECT</span>' : '';
            
            html += `
                <div style="padding: 5px 0; border-bottom: 1px solid #333;">
                    ${letter}. ${answer.text || answer}${correctMarker}
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    /**
     * Load data via AJAX as fallback
     */
    function loadViaAjax() {
        $.ajax({
            url: window.location.origin + '/quiz-data-loader.php',
            method: 'GET',
            dataType: 'json',
            data: {
                action: 'load_all_questions',
                quiz_id: 0
            },
            success: function(response) {
                if (response.success && response.data) {
                    const questions = Object.keys(response.data).map(qId => {
                        const q = response.data[qId];
                        return {
                            id: qId,
                            text: q.text,
                            correctIndex: q.correct_answer,
                            answers: q.answers
                        };
                    });
                    
                    generateQuestionContent(questions);
                } else {
                    $('#expansion-content').html(`
                        <div style="color: #ff6b6b; text-align: center; padding: 40px;">
                            <h3>❌ Failed to Load Quiz Data</h3>
                            <p>Could not retrieve quiz questions from the database.</p>
                            <p>Error: ${response.message || 'Unknown error'}</p>
                        </div>
                    `);
                }
            },
            error: function(xhr, status, error) {
                $('#expansion-content').html(`
                    <div style="color: #ff6b6b; text-align: center; padding: 40px;">
                        <h3>❌ Connection Error</h3>
                        <p>Could not connect to the quiz data loader.</p>
                        <p>Error: ${error}</p>
                    </div>
                `);
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExpansionOverlay);
    } else {
        initExpansionOverlay();
    }
    
    // Also initialize after a delay
    setTimeout(initExpansionOverlay, 1000);
    
})(jQuery);
