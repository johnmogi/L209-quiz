// Simple Quiz Footer - Direct answers display
(function($) {
    'use strict';

    // Initialize immediately when DOM is ready
    $(document).ready(function() {
        console.log('🎯 Simple Quiz Footer: Starting...');
        
        // Add footer immediately
        addQuizFooter();
        
        // Load quiz data
        setTimeout(function() {
            loadQuizData();
        }, 1000);
    });

    function addQuizFooter() {
        // Remove any existing footer
        $('.simple-quiz-footer').remove();
        
        const footerHtml = `
            <div class="simple-quiz-footer" style="
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #ffffff;
                color: #333333;
                padding: 15px 20px;
                z-index: 999999;
                font-family: Arial, sans-serif;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
                border-top: 3px solid #2196F3;
                max-height: 200px;
                overflow-y: auto;
            ">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <h3 style="margin: 0 0 10px 0; color: #2196F3; font-size: 16px;">🎯 Quiz Answers</h3>
                    <div id="quiz-answers-content" style="font-size: 13px;">
                        Loading quiz data...
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(footerHtml);
        $('body').css('padding-bottom', '120px');
        
        console.log('🎯 Simple Quiz Footer: Footer added');
    }

    function loadQuizData() {
        const quizId = extractQuizId();
        console.log('🎯 Simple Quiz Footer: Loading data for quiz ID:', quizId);
        
        $.ajax({
            url: '/simple-quiz-data.php?quiz_id=' + quizId,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log('🎯 Simple Quiz Footer: Data loaded:', data);
                displayQuizData(data);
            },
            error: function(xhr, status, error) {
                console.error('🎯 Simple Quiz Footer: Error loading data:', error);
                $('#quiz-answers-content').html('<span style="color: #f44336;">Error loading quiz data</span>');
            }
        });
    }

    function extractQuizId() {
        // Try multiple methods to get quiz ID
        
        // Method 1: From body classes
        const bodyClasses = $('body').attr('class') || '';
        const postIdMatch = bodyClasses.match(/postid-(\d+)/);
        if (postIdMatch) {
            return postIdMatch[1];
        }

        // Method 2: From URL
        const url = window.location.href;
        const urlPatterns = [
            /\/quiz\/.*?(\d+)/i,
            /quiz[_-](\d+)/i,
            /p=(\d+)/i
        ];
        
        for (let pattern of urlPatterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }

        // Method 3: From page elements
        const articleId = $('article[id*="post-"]').attr('id');
        if (articleId) {
            const match = articleId.match(/post-(\d+)/);
            if (match) {
                return match[1];
            }
        }

        // Default fallback
        return '11702';
    }

    function displayQuizData(data) {
        let content = '';
        
        if (!data.success || !data.questions || data.questions.length === 0) {
            content = `<span style="color: #f44336;">No quiz data found for Quiz ID: ${data.quiz_id || 'unknown'}</span>`;
        } else {
            content = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 8px;">`;
            
            data.questions.forEach((question, index) => {
                const correctLetter = question.correct_answer ? ['A', 'B', 'C', 'D'][question.correct_answer - 1] : '?';
                const correctText = question.correct_answer && question.answers[question.correct_answer - 1] 
                    ? question.answers[question.correct_answer - 1].text.substring(0, 40) + '...'
                    : 'No answer';
                
                content += `
                    <div style="background: #f0f8ff; padding: 6px; border-radius: 3px; border-left: 3px solid #2196F3;">
                        <strong style="color: #333;">Q${index + 1}:</strong> 
                        <span style="color: #4CAF50; font-weight: bold; font-size: 14px;">${correctLetter}</span>
                        <div style="font-size: 11px; color: #666; margin-top: 2px;">${correctText}</div>
                    </div>
                `;
            });
            
            content += `</div>`;
            content += `<div style="margin-top: 8px; font-size: 11px; color: #666;">Quiz ID: ${data.quiz_id} | ${data.questions.length} questions loaded</div>`;
        }
        
        $('#quiz-answers-content').html(content);
    }

})(jQuery);
