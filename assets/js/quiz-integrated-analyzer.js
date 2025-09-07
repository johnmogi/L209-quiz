/**
 * Live Quiz Analyzer Integration - Restored
 * Provides real-time quiz analysis and debugging information
 * Works alongside the answer indicators system
 */

(function($) {
    'use strict';

    const QuizAnalyzer = {
        
        /**
         * Initialize the Live Quiz Analyzer
         */
        init: function() {
            console.log('[Quiz Analyzer] Initializing Live Quiz Analyzer');
            
            // Add analyzer styles
            this.addStyles();
            
            // Create analyzer widget
            this.createAnalyzerWidget();
            
            // Start monitoring quiz data
            this.startMonitoring();
        },

        /**
         * Add CSS styles for the analyzer widget
         */
        addStyles: function() {
            if ($('#quiz-analyzer-styles').length) return;
            
            $('<style id="quiz-analyzer-styles">')
                .text(`
                    .quiz-analyzer-widget {
                        position: fixed;
                        top: 10px;
                        left: 10px;
                        background: #2196F3;
                        color: white;
                        padding: 10px 15px;
                        border-radius: 8px;
                        font-family: Arial, sans-serif;
                        font-size: 12px;
                        z-index: 9999;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        min-width: 200px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }
                    
                    .quiz-analyzer-widget:hover {
                        background: #1976D2;
                        transform: translateY(-2px);
                    }
                    
                    .quiz-analyzer-widget.expanded {
                        min-width: 300px;
                        max-width: 400px;
                    }
                    
                    .analyzer-header {
                        font-weight: bold;
                        font-size: 14px;
                        margin-bottom: 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .analyzer-status {
                        font-size: 10px;
                        background: rgba(255,255,255,0.2);
                        padding: 2px 6px;
                        border-radius: 10px;
                    }
                    
                    .analyzer-details {
                        display: none;
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid rgba(255,255,255,0.3);
                    }
                    
                    .analyzer-details.visible {
                        display: block;
                    }
                    
                    .analyzer-stat {
                        margin: 3px 0;
                        font-size: 11px;
                    }
                    
                    .analyzer-actions {
                        margin-top: 8px;
                        display: flex;
                        gap: 5px;
                    }
                    
                    .analyzer-btn {
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 10px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    
                    .analyzer-btn:hover {
                        background: rgba(255,255,255,0.3);
                    }
                `)
                .appendTo('head');
        },

        /**
         * Create the analyzer widget
         */
        createAnalyzerWidget: function() {
            const widget = $(`
                <div class="quiz-analyzer-widget" id="quiz-analyzer-widget">
                    <div class="analyzer-header">
                        <span>🎯 Live Quiz Analyzer</span>
                        <span class="analyzer-status">Ready</span>
                    </div>
                    <div class="analyzer-summary">
                        Quiz: <span id="analyzer-quiz-id">--</span> | 
                        Questions: <span id="analyzer-questions">--</span> | 
                        Answers: <span id="analyzer-answers">--</span>
                    </div>
                    <div class="analyzer-details" id="analyzer-details">
                        <div class="analyzer-stat">Status: <span id="analyzer-detailed-status">Initializing...</span></div>
                        <div class="analyzer-stat">Current Question: <span id="analyzer-current-q">--</span></div>
                        <div class="analyzer-stat">Correct Answers: <span id="analyzer-correct">--</span></div>
                        <div class="analyzer-stat">Processing Time: <span id="analyzer-time">--</span></div>
                        <div class="analyzer-actions">
                            <button class="analyzer-btn" onclick="QuizAnalyzer.showDetails()">Show Details</button>
                            <button class="analyzer-btn" onclick="QuizAnalyzer.refresh()">Refresh</button>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append(widget);
            
            // Toggle details on click
            widget.on('click', function(e) {
                if (!$(e.target).hasClass('analyzer-btn')) {
                    $(this).toggleClass('expanded');
                    $('#analyzer-details').toggleClass('visible');
                }
            });
        },

        /**
         * Start monitoring quiz data
         */
        startMonitoring: function() {
            const self = this;
            
            // Initial data collection
            this.collectQuizData();
            
            // Monitor for changes every 5 seconds
            setInterval(function() {
                self.collectQuizData();
            }, 5000);
            
            // Monitor for quiz interactions
            this.setupQuizMonitoring();
        },

        /**
         * Collect current quiz data
         */
        collectQuizData: function() {
            const startTime = performance.now();
            
            // Get quiz ID from various sources
            let quizId = '--';
            if (typeof wpData !== 'undefined' && wpData.quiz_pro_id) {
                quizId = wpData.quiz_pro_id;
            } else if (typeof learndash_quiz_data !== 'undefined') {
                quizId = learndash_quiz_data.quiz_id || '--';
            }
            
            // Count questions and answers
            const questions = $('.wpProQuiz_listItem').length;
            const totalAnswers = $('.wpProQuiz_questionListItem').length;
            const correctAnswers = $('.wpProQuiz_answerCorrect, .wpProQuiz_answerCorrectIncomplete').length;
            const incorrectAnswers = $('.wpProQuiz_answerIncorrect').length;
            
            // Get current question
            const currentQuestion = $('.wpProQuiz_listItem:visible').index() + 1;
            
            const processingTime = Math.round(performance.now() - startTime);
            
            // Update widget
            $('#analyzer-quiz-id').text(quizId);
            $('#analyzer-questions').text(questions);
            $('#analyzer-answers').text(totalAnswers);
            $('#analyzer-current-q').text(currentQuestion > 0 ? currentQuestion : '--');
            $('#analyzer-correct').text(correctAnswers);
            $('#analyzer-time').text(processingTime + 'ms');
            
            // Update status
            let status = 'Ready';
            if (correctAnswers > 0) {
                status = 'Active';
            }
            if (questions === 0) {
                status = 'No Quiz';
            }
            
            $('.analyzer-status').text(status);
            $('#analyzer-detailed-status').text(status);
            
            // Log to console (matching the format you showed)
            console.log(`Live Quiz Analyzer Quiz: ${quizId} Questions: ${questions} Answers: ${totalAnswers} Status: ${status}`);
        },

        /**
         * Setup quiz interaction monitoring
         */
        setupQuizMonitoring: function() {
            const self = this;
            
            // Monitor answer selections
            $(document).on('change', '.wpProQuiz_questionInput', function() {
                console.log('[Quiz Analyzer] Answer selected');
                setTimeout(() => self.collectQuizData(), 100);
            });
            
            // Monitor check button clicks
            $(document).on('click', '.wpProQuiz_button[name="check"]', function() {
                console.log('[Quiz Analyzer] Check button clicked');
                setTimeout(() => self.collectQuizData(), 500);
            });
            
            // Monitor navigation
            $(document).on('click', '.wpProQuiz_button[name="next"], .wpProQuiz_button[name="back"]', function() {
                console.log('[Quiz Analyzer] Navigation button clicked');
                setTimeout(() => self.collectQuizData(), 300);
            });
        },

        /**
         * Show detailed analyzer view
         */
        showDetails: function() {
            const analyzerUrl = window.location.origin + '/live-quiz-analyzer.php';
            const quizId = $('#analyzer-quiz-id').text();
            const fullUrl = analyzerUrl + (quizId !== '--' ? '?quiz_id=' + quizId : '');
            
            window.open(fullUrl, '_blank', 'width=800,height=600,scrollbars=yes');
        },

        /**
         * Force refresh analyzer data
         */
        refresh: function() {
            console.log('[Quiz Analyzer] Manual refresh triggered');
            this.collectQuizData();
            
            // Visual feedback
            const widget = $('#quiz-analyzer-widget');
            widget.css('background', '#4CAF50');
            setTimeout(() => {
                widget.css('background', '#2196F3');
            }, 300);
        }
    };

    // Initialize when document is ready
    $(document).ready(function() {
        // Wait for other scripts to load
        setTimeout(function() {
            QuizAnalyzer.init();
        }, 1000);
    });

    // Make available globally
    window.QuizAnalyzer = QuizAnalyzer;

})(jQuery);
