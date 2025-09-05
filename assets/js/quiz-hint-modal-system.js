/**
 * Quiz Hint Modal System
 * Fixes doubled hint buttons and creates proper modal display for hints
 */

(function($) {
    'use strict';
    
    // Prevent multiple initializations
    if (window.quizHintModal && window.quizHintModal.initialized) {
        return;
    }
    
    // Initialize hint modal system
    window.quizHintModal = {
        initialized: false,
        currentModal: null
    };
    
    /**
     * Initialize the hint modal system
     */
    function initHintModalSystem() {
        console.log('🔧 Initializing Quiz Hint Modal System...');
        
        // Remove doubled hint buttons immediately
        removeDuplicateHintButtons();
        
        // Setup proper hint button functionality
        setupHintButtonHandlers();
        
        // Create modal container
        createModalContainer();
        
        // Monitor for new hint buttons
        setInterval(function() {
            removeDuplicateHintButtons();
            ensureProperHintButtons();
        }, 500);
        
        window.quizHintModal.initialized = true;
        console.log('✅ Quiz Hint Modal System initialized');
    }
    
    /**
     * Remove ALL hint buttons as requested by user
     */
    function removeDuplicateHintButtons() {
        $('.wpProQuiz_listItem').each(function() {
            const $question = $(this);
            const $hintButtons = $question.find('.wpProQuiz_TipButton');
            
            if ($hintButtons.length > 0) {
                console.log('🗑️ Removing ALL hint buttons as requested');
                
                // Remove ALL hint buttons
                $hintButtons.remove();
            }
        });
    }
    
    /**
     * No longer needed - hint buttons are being removed
     */
    function ensureProperHintButtons() {
        // Function disabled - hint buttons are being removed as requested
        return;
    }
    
    /**
     * Setup hint button handlers
     */
    function setupHintButtonHandlers() {
        // Use event delegation to handle all hint buttons
        $(document).off('click.hintModal', '.wpProQuiz_TipButton')
                   .on('click.hintModal', '.wpProQuiz_TipButton', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const $question = $(this).closest('.wpProQuiz_listItem');
            showHintModal($question);
        });
    }
    
    /**
     * Create modal container
     */
    function createModalContainer() {
        if ($('#quiz-hint-modal').length === 0) {
            const modalHTML = `
                <div id="quiz-hint-modal" class="quiz-hint-modal-overlay" style="display: none;">
                    <div class="quiz-hint-modal-content">
                        <div class="quiz-hint-modal-header">
                            <h3 class="quiz-hint-modal-title">רמז</h3>
                            <button class="quiz-hint-modal-close">&times;</button>
                        </div>
                        <div class="quiz-hint-modal-body">
                            <!-- Hint content will be inserted here -->
                        </div>
                        <div class="quiz-hint-modal-footer">
                            <button class="quiz-hint-modal-ok">הבנתי</button>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modalHTML);
            
            // Setup modal close handlers
            $('#quiz-hint-modal .quiz-hint-modal-close, #quiz-hint-modal .quiz-hint-modal-ok').on('click', closeHintModal);
            $('#quiz-hint-modal').on('click', function(e) {
                if (e.target === this) {
                    closeHintModal();
                }
            });
            
            // Add modal styles
            addModalStyles();
        }
    }
    
    /**
     * Show hint modal with content
     */
    function showHintModal($question) {
        const $modal = $('#quiz-hint-modal');
        const $modalBody = $modal.find('.quiz-hint-modal-body');
        
        // Find hint content
        let hintContent = '';
        const $hintDiv = $question.find('.wpProQuiz_tipp');
        
        if ($hintDiv.length > 0) {
            // Extract hint content from existing hint div
            const $hintText = $hintDiv.find('p').first();
            if ($hintText.length > 0) {
                hintContent = $hintText.html();
            } else {
                hintContent = $hintDiv.html();
            }
        }
        
        // Fallback content if no hint found
        if (!hintContent || hintContent.trim() === '') {
            hintContent = 'נסה לחשוב על התשובה הנכונה. אם אתה מתקשה, פנה למורה לעזרה.';
        }
        
        // Clean up the content (remove HTML tags we don't want)
        hintContent = hintContent.replace(/<h5[^>]*>.*?<\/h5>/gi, '');
        hintContent = hintContent.replace(/<div[^>]*>/gi, '').replace(/<\/div>/gi, '');
        
        // Set modal content
        $modalBody.html('<p>' + hintContent + '</p>');
        
        // Show modal with animation
        $modal.fadeIn(300);
        window.quizHintModal.currentModal = $modal;
        
        console.log('💡 Hint modal displayed');
    }
    
    /**
     * Close hint modal
     */
    function closeHintModal() {
        const $modal = $('#quiz-hint-modal');
        $modal.fadeOut(300);
        window.quizHintModal.currentModal = null;
        
        console.log('❌ Hint modal closed');
    }
    
    /**
     * Add modal styles
     */
    function addModalStyles() {
        if ($('#quiz-hint-modal-styles').length === 0) {
            const modalCSS = `
                <style id="quiz-hint-modal-styles">
                    .quiz-hint-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .quiz-hint-modal-content {
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                        max-width: 600px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                        direction: rtl;
                        text-align: right;
                        animation: modalSlideIn 0.3s ease-out;
                    }
                    
                    @keyframes modalSlideIn {
                        from {
                            transform: scale(0.7);
                            opacity: 0;
                        }
                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    
                    .quiz-hint-modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 25px 15px;
                        border-bottom: 1px solid #eee;
                        background: linear-gradient(135deg, #ffeb3b, #ffc107);
                    }
                    
                    .quiz-hint-modal-title {
                        margin: 0;
                        font-size: 24px;
                        font-weight: bold;
                        color: #333;
                    }
                    
                    .quiz-hint-modal-close {
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: #666;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        transition: all 0.2s ease;
                    }
                    
                    .quiz-hint-modal-close:hover {
                        background-color: rgba(0, 0, 0, 0.1);
                        color: #333;
                    }
                    
                    .quiz-hint-modal-body {
                        padding: 25px;
                        font-size: 16px;
                        line-height: 1.6;
                        color: #333;
                    }
                    
                    .quiz-hint-modal-body p {
                        margin: 0;
                        text-align: right;
                        direction: rtl;
                    }
                    
                    .quiz-hint-modal-footer {
                        padding: 15px 25px 25px;
                        text-align: center;
                        border-top: 1px solid #eee;
                    }
                    
                    .quiz-hint-modal-ok {
                        background: linear-gradient(135deg, #4caf50, #45a049);
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                    }
                    
                    .quiz-hint-modal-ok:hover {
                        background: linear-gradient(135deg, #45a049, #4caf50);
                        transform: translateY(-1px);
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                    }
                    
                    /* Hide original hint displays */
                    .wpProQuiz_tipp {
                        display: none !important;
                    }
                    
                    /* Ensure hint buttons are properly styled */
                    .wpProQuiz_TipButton {
                        background: linear-gradient(135deg, #ffeb3b, #ffc107) !important;
                        color: #333 !important;
                        border: 2px solid #ff9800 !important;
                        border-radius: 6px !important;
                        padding: 8px 16px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                    }
                    
                    .wpProQuiz_TipButton:hover {
                        background: linear-gradient(135deg, #ffc107, #ffeb3b) !important;
                        transform: translateY(-1px) !important;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
                    }
                </style>
            `;
            
            $('head').append(modalCSS);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHintModalSystem);
    } else {
        initHintModalSystem();
    }
    
    // Also initialize after a delay for dynamic content
    setTimeout(initHintModalSystem, 1000);
    
})(jQuery);
