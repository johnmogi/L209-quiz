/**
 * Quiz Hint Triggers System
 * Adds hint buttons/triggers to quiz questions that have hints available
 */

(function($) {
    'use strict';
    
    // Prevent multiple initializations
    if (window.quizHintTriggers && window.quizHintTriggers.initialized) {
        return;
    }
    
    window.quizHintTriggers = {
        initialized: false,
        hintsData: {}
    };
    
    /**
     * Initialize hint triggers system
     */
    function initHintTriggers() {
        console.log('🔧 Initializing Quiz Hint Triggers...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupHintTriggers);
        } else {
            setupHintTriggers();
        }
        
        window.quizHintTriggers.initialized = true;
    }
    
    /**
     * Setup hint triggers on quiz questions
     */
    function setupHintTriggers() {
        console.log('🎯 Setting up hint triggers...');
        
        // First, check for existing wpProQuiz_tipp elements (LearnDash native hints)
        const $existingHints = $('.wpProQuiz_tipp');
        console.log(`🔍 Found ${$existingHints.length} existing LearnDash hints`);
        
        if ($existingHints.length > 0) {
            // Work with existing hints
            setupExistingHints($existingHints);
        }
        
        // Find all quiz questions
        const $questions = $('.wpProQuiz_listItem, .wpProQuiz_question');
        
        if ($questions.length === 0) {
            console.log('⚠️ No quiz questions found, retrying in 2 seconds...');
            setTimeout(setupHintTriggers, 2000);
            return;
        }
        
        console.log(`📝 Found ${$questions.length} quiz questions`);
        
        $questions.each(function(index) {
            const $question = $(this);
            const questionId = getQuestionId($question, index);
            
            // Check if this question already has a native hint
            const $existingHint = $question.find('.wpProQuiz_tipp');
            if ($existingHint.length > 0) {
                console.log(`✅ Question ${questionId} already has native hint, enhancing it`);
                enhanceExistingHint($question, $existingHint, questionId);
                return;
            }
            
            // Check if hint trigger already exists
            if ($question.find('.lilac-hint-trigger').length > 0) {
                return; // Skip if already has trigger
            }
            
            // Add hint trigger button for questions without native hints
            addHintTrigger($question, questionId, index);
        });
        
        // Setup click handlers
        setupClickHandlers();
    }
    
    /**
     * Get question ID from various sources
     */
    function getQuestionId($question, fallbackIndex) {
        // Try various methods to get question ID
        let questionId = $question.data('question-id') || 
                        $question.find('[data-question-id]').data('question-id') ||
                        $question.attr('id') ||
                        fallbackIndex + 1;
        
        return questionId;
    }
    
    /**
     * Add hint trigger to a question
     */
    function addHintTrigger($question, questionId, index) {
        // Create hint trigger button
        const hintTrigger = $(`
            <div class="lilac-hint-trigger lilac-template-hint" data-question-id="${questionId}" data-question-index="${index}">
                <button type="button" class="hint-button">
                    <span class="hint-icon">💡</span>
                    <span class="hint-text">רמז</span>
                </button>
            </div>
        `);
        
        // Find the best place to insert the hint trigger
        const $insertLocation = findInsertLocation($question);
        
        if ($insertLocation) {
            $insertLocation.after(hintTrigger);
            console.log(`✅ Added hint trigger for question ${questionId}`);
        } else {
            // Fallback: append to question
            $question.append(hintTrigger);
            console.log(`⚠️ Added hint trigger to end of question ${questionId} (fallback)`);
        }
    }
    
    /**
     * Find the best location to insert hint trigger
     */
    function findInsertLocation($question) {
        // Try different locations in order of preference
        const selectors = [
            '.wpProQuiz_question_text',
            '.wpProQuiz_questionList',
            '.wpProQuiz_question',
            'h5, h4, h3',
            '.question-content'
        ];
        
        for (let selector of selectors) {
            const $element = $question.find(selector).first();
            if ($element.length > 0) {
                return $element;
            }
        }
        
        return null;
    }
    
    /**
     * Setup click handlers for hint triggers
     */
    function setupClickHandlers() {
        $(document).off('click.hintTriggers').on('click.hintTriggers', '.lilac-hint-trigger, .hint-button', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const $trigger = $(this).closest('.lilac-hint-trigger');
            const questionId = $trigger.data('question-id');
            const questionIndex = $trigger.data('question-index');
            
            console.log(`🔍 Hint clicked for question ${questionId} (index: ${questionIndex})`);
            
            // Show hint modal
            showHintModal(questionId, questionIndex);
        });
    }
    
    /**
     * Show hint modal for a question
     */
    function showHintModal(questionId, questionIndex) {
        console.log(`🎭 Showing hint modal for question ${questionId}`);
        
        // Check if modal exists, create if not
        if ($('#lilac-hint-modal').length === 0) {
            createHintModal();
        }
        
        // Load hint content via AJAX
        loadHintContent(questionId, questionIndex);
        
        // Show modal
        $('#lilac-hint-modal').fadeIn(300);
    }
    
    /**
     * Create hint modal HTML
     */
    function createHintModal() {
        const modalHTML = `
            <div id="lilac-hint-modal" style="display: none; position: fixed; z-index: 999999; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
                <div class="modal-content" style="position: relative; margin: 10% auto; padding: 20px; width: 80%; max-width: 600px; background-color: #fff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.3); direction: rtl;">
                    <span id="lilac-hint-close" style="position: absolute; top: 10px; left: 15px; font-size: 28px; font-weight: bold; cursor: pointer; color: #aaa;">&times;</span>
                    <div id="lilac-hint-content" style="margin-top: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
                        <h3 style="color: #007cba; margin-bottom: 15px;">💡 רמז</h3>
                        <div id="hint-loading" style="text-align: center; padding: 20px;">
                            <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007cba; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                            <p style="margin-top: 10px;">טוען רמז...</p>
                        </div>
                        <div id="hint-text" style="display: none; padding: 15px; background: #f8f9fa; border-radius: 5px; border-right: 4px solid #007cba;"></div>
                        <div id="hint-error" style="display: none; padding: 15px; background: #ffebee; border-radius: 5px; border-right: 4px solid #f44336; color: #c62828;"></div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .lilac-hint-trigger {
                    margin: 10px 0;
                    text-align: center;
                }
                .hint-button {
                    background: linear-gradient(135deg, #007cba, #005a87);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .hint-button:hover {
                    background: linear-gradient(135deg, #005a87, #007cba);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                }
                .hint-icon {
                    font-size: 16px;
                }
            </style>
        `;
        
        $('body').append(modalHTML);
        
        // Setup close handlers
        $('#lilac-hint-close').on('click', closeHintModal);
        $('#lilac-hint-modal').on('click', function(e) {
            if (e.target.id === 'lilac-hint-modal') {
                closeHintModal();
            }
        });
        
        console.log('🎭 Hint modal created');
    }
    
    /**
     * Load hint content via AJAX
     */
    function loadHintContent(questionId, questionIndex) {
        // Show loading state
        $('#hint-loading').show();
        $('#hint-text, #hint-error').hide();
        
        // Check if AJAX URL is available
        const ajaxUrl = (typeof lilacHintEnforcement !== 'undefined' && lilacHintEnforcement.ajaxUrl) ? 
                       lilacHintEnforcement.ajaxUrl : 
                       (typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php');
        
        const nonce = (typeof lilacHintEnforcement !== 'undefined' && lilacHintEnforcement.nonce) ? 
                     lilacHintEnforcement.nonce : '';
        
        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: {
                action: 'get_question_hint',
                question_id: questionId,
                nonce: nonce
            },
            success: function(response) {
                $('#hint-loading').hide();
                
                if (response.success && response.hint) {
                    $('#hint-text').html(response.hint).show();
                } else {
                    const message = response.message || 'לא נמצא רמז לשאלה זו';
                    $('#hint-error').html(`❌ ${message}`).show();
                }
            },
            error: function(xhr, status, error) {
                $('#hint-loading').hide();
                $('#hint-error').html(`❌ שגיאה בטעינת הרמז: ${error}`).show();
                console.error('Hint AJAX error:', xhr.responseText);
            }
        });
    }
    
    /**
     * Setup existing LearnDash hints
     */
    function setupExistingHints($existingHints) {
        $existingHints.each(function() {
            const $hint = $(this);
            const $question = $hint.closest('.wpProQuiz_listItem, .wpProQuiz_question');
            
            if ($question.length > 0) {
                const questionId = getQuestionId($question, 0);
                enhanceExistingHint($question, $hint, questionId);
            }
        });
    }
    
    /**
     * Enhance existing LearnDash hint
     */
    function enhanceExistingHint($question, $existingHint, questionId) {
        // Mark as enhanced to avoid duplicate processing
        if ($existingHint.hasClass('lilac-enhanced')) {
            return;
        }
        
        $existingHint.addClass('lilac-enhanced');
        
        // Store the original hint content for this specific question
        const hintContent = $existingHint.find('p').text() || $existingHint.text();
        $existingHint.data('original-hint', hintContent);
        
        // Hide the hint initially if it's visible
        $existingHint.hide();
        
        // Add our custom trigger button with question-specific data
        const hintTrigger = $(`
            <div class="lilac-hint-trigger lilac-template-hint" data-question-id="${questionId}" data-has-native="true" data-hint-content="${hintContent.replace(/"/g, '&quot;')}">
                <button type="button" class="hint-button">
                    <span class="hint-icon">💡</span>
                    <span class="hint-text">רמז</span>
                </button>
            </div>
        `);
        
        // Insert trigger before the hidden hint
        $existingHint.before(hintTrigger);
        
        console.log(`🔧 Enhanced existing hint for question ${questionId} with content: ${hintContent.substring(0, 50)}...`);
    }
    
    /**
     * Setup click handlers for hint triggers
     */
    function setupClickHandlers() {
        $(document).off('click.hintTriggers').on('click.hintTriggers', '.lilac-hint-trigger, .hint-button', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const $trigger = $(this).closest('.lilac-hint-trigger');
            const questionId = $trigger.data('question-id');
            const hasNative = $trigger.data('has-native');
            
            console.log(`🔍 Hint clicked for question ${questionId} (native: ${hasNative})`);
            
            if (hasNative) {
                // Show the existing LearnDash hint
                showNativeHint($trigger);
            } else {
                // Show our custom modal
                showHintModal(questionId, 0);
            }
        });
    }
    
    /**
     * Show native LearnDash hint
     */
    function showNativeHint($trigger) {
        const $question = $trigger.closest('.wpProQuiz_listItem, .wpProQuiz_question');
        const $nativeHint = $question.find('.wpProQuiz_tipp.lilac-enhanced');
        
        if ($nativeHint.length > 0) {
            // Toggle visibility of the specific hint for this question
            if ($nativeHint.is(':visible')) {
                $nativeHint.slideUp(300);
                $trigger.find('.hint-text').text('רמז');
            } else {
                // Hide all other hints first to prevent cross-contamination
                $('.wpProQuiz_tipp.lilac-enhanced').not($nativeHint).slideUp(300);
                $('.lilac-hint-trigger .hint-text').text('רמז');
                
                // Show only this question's hint
                $nativeHint.slideDown(300);
                $trigger.find('.hint-text').text('הסתר רמז');
            }
        } else {
            // Fallback: create hint from stored data
            const hintContent = $trigger.data('hint-content');
            if (hintContent) {
                createAndShowHint($question, hintContent);
            }
        }
    }
    
    /**
     * Create and show hint from stored content
     */
    function createAndShowHint($question, hintContent) {
        // Remove any existing dynamic hints for this question
        $question.find('.dynamic-hint').remove();
        
        const $dynamicHint = $(`
            <div class="wpProQuiz_tipp dynamic-hint" style="position: relative; display: none;">
                <div>
                    <h5 style="margin: 0px 0px 10px;" class="wpProQuiz_header">רמז</h5>
                    <p>${hintContent}</p>
                    <button class="hint-close-btn" style="margin-top: 10px; padding: 5px 10px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer;">סגור</button>
                </div>
            </div>
        `);
        
        $question.append($dynamicHint);
        $dynamicHint.slideDown(300);
        
        // Setup close functionality
        $dynamicHint.find('.hint-close-btn').on('click', function() {
            $dynamicHint.slideUp(300);
        });
    }
    
    /**
     * Close hint modal
     */
    function closeHintModal() {
        $('#lilac-hint-modal').fadeOut(300);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHintTriggers);
    } else {
        initHintTriggers();
    }
    
    // Also initialize after a delay for dynamic content
    setTimeout(initHintTriggers, 2000);
    
})(jQuery);
