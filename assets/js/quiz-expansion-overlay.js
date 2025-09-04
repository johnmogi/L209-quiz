/**
 * Quiz Expansion Overlay
 * Shows all quiz questions with correct answers highlighted
 * Provides detailed timing analysis for answer detection readiness
 */

(function() {
    'use strict';
    
    let expansionOverlay = null;
    let isExpanded = false;
    
    // Create expansion overlay
    function createExpansionOverlay() {
        if (expansionOverlay) return;
        
        expansionOverlay = document.createElement('div');
        expansionOverlay.id = 'quiz-expansion-overlay';
        expansionOverlay.style.cssText = `
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
        `;
        
        document.body.appendChild(expansionOverlay);
    }
    
    // Format timing display
    function formatTiming(ms) {
        if (ms < 100) return `${ms}ms ✅ Excellent`;
        if (ms < 500) return `${ms}ms ⚠️ Good`;
        return `${ms}ms ❌ Slow`;
    }
    
    // Generate expansion content
    function generateExpansionContent() {
        const startTime = performance.now();
        
        if (!window.quizDetector || !window.quizDetector.allQuestions) {
            return `
                <div style="color: #ff6b6b; background: #2c2c2c; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h2>❌ Quiz Data Not Ready</h2>
                    <p>Quiz detector hasn't loaded all questions yet. Please wait for initialization to complete.</p>
                    <p>Current status: ${window.quizDetector ? 'Detector loaded' : 'Detector not loaded'}</p>
                </div>
            `;
        }
        
        const questions = window.quizDetector.allQuestions;
        const totalQuestions = questions.length;
        const loadTime = performance.now() - startTime;
        
        let html = `
            <div style="background: #2c2c2c; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h1 style="margin: 0; color: #4CAF50;">🎯 Complete Quiz Expansion</h1>
                    <button onclick="window.closeQuizExpansion()" style="background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px;">✕ Close</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div><strong>📊 Total Questions:</strong> ${totalQuestions}</div>
                    <div><strong>⏱️ Data Load Time:</strong> ${formatTiming(window.quizDetector.loadTime || 0)}</div>
                    <div><strong>🚀 Expansion Time:</strong> ${formatTiming(loadTime)}</div>
                    <div><strong>📡 AJAX Status:</strong> ${window.quizDetector.correctAnswers ? '✅ Ready' : '❌ Not Ready'}</div>
                </div>
                
                <div style="background: #1e3d6f; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #4CAF50;">⏰ Timing Analysis</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; font-size: 14px;">
                        <div><strong>First Question Ready:</strong> ${window.quizDetector.allQuestions[0] ? '✅ Yes' : '❌ No'}</div>
                        <div><strong>All Answers Loaded:</strong> ${window.quizDetector.correctAnswers ? '✅ Yes' : '❌ No'}</div>
                        <div><strong>Detection Speed:</strong> ${window.quizDetector.loadTime < 1000 ? '✅ Fast' : '⚠️ Slow'}</div>
                        <div><strong>Memory Usage:</strong> ~${Math.round(JSON.stringify(questions).length / 1024)}KB</div>
                    </div>
                </div>
            </div>
        `;
        
        // Generate questions
        questions.forEach((question, index) => {
            const correctAnswers = question.answers.filter(a => a.correct);
            const correctCount = correctAnswers.length;
            
            html += `
                <div style="background: #f9f9f9; border: 2px solid #ddd; margin: 15px 0; padding: 20px; border-radius: 10px; color: #333;">
                    <div style="background: #2c5aa0; color: white; padding: 15px; margin: -20px -20px 15px -20px; border-radius: 10px 10px 0 0;">
                        <h3 style="margin: 0; font-size: 18px;">
                            📝 Question ${index + 1} of ${totalQuestions} 
                            (ID: ${question.question_id}) 
                            - ✅ ${correctCount} Correct Answer${correctCount !== 1 ? 's' : ''}
                        </h3>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #2c5aa0; font-size: 16px; line-height: 1.5;">
                        ${question.question_text}
                    </div>
                    
                    <div style="margin-left: 20px;">
                        <h4 style="color: #2c5aa0; margin-bottom: 10px;">Answer Options:</h4>
            `;
            
            question.answers.forEach((answer, ansIndex) => {
                const isCorrect = answer.correct;
                const bgColor = isCorrect ? '#d4edda' : '#f8f9fa';
                const borderColor = isCorrect ? '#28a745' : '#dee2e6';
                const textColor = isCorrect ? '#155724' : '#495057';
                const icon = isCorrect ? '✅' : '❌';
                const weight = isCorrect ? 'bold' : 'normal';
                
                html += `
                    <div style="
                        background: ${bgColor}; 
                        border: 2px solid ${borderColor}; 
                        padding: 12px; 
                        margin: 8px 0; 
                        border-radius: 5px; 
                        color: ${textColor};
                        font-weight: ${weight};
                        font-size: 15px;
                        ${isCorrect ? 'box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);' : ''}
                    ">
                        ${icon} <strong>${String.fromCharCode(65 + ansIndex)}.</strong> ${answer.text}
                        ${isCorrect ? '<strong style="color: #28a745; margin-left: 10px;">[CORRECT ANSWER]</strong>' : ''}
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        // Add performance summary
        html += `
            <div style="background: #2c2c2c; color: white; padding: 20px; border-radius: 10px; margin-top: 30px; text-align: center;">
                <h3 style="color: #4CAF50; margin-bottom: 15px;">🚀 Performance Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div><strong>Questions Processed:</strong> ${totalQuestions}</div>
                    <div><strong>Total Answers:</strong> ${questions.reduce((sum, q) => sum + q.answers.length, 0)}</div>
                    <div><strong>Correct Answers:</strong> ${questions.reduce((sum, q) => sum + q.answers.filter(a => a.correct).length, 0)}</div>
                    <div><strong>Processing Time:</strong> ${formatTiming(loadTime)}</div>
                </div>
                <p style="margin-top: 15px; color: #ccc;">
                    Generated: ${new Date().toLocaleTimeString()} | 
                    System Ready: ${window.quizDetector.initialized ? '✅ Yes' : '❌ No'}
                </p>
            </div>
        `;
        
        return html;
    }
    
    // Show expansion overlay
    function showExpansion() {
        createExpansionOverlay();
        
        const content = generateExpansionContent();
        expansionOverlay.innerHTML = content;
        expansionOverlay.style.display = 'block';
        isExpanded = true;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Log timing info
        console.log('Quiz Expansion opened at:', new Date().toLocaleTimeString());
        if (window.quizDetector && window.quizDetector.allQuestions) {
            console.log('First question correct answer:', 
                window.quizDetector.allQuestions[0]?.answers?.find(a => a.correct)?.text);
        }
    }
    
    // Hide expansion overlay
    function hideExpansion() {
        if (expansionOverlay) {
            expansionOverlay.style.display = 'none';
            isExpanded = false;
            document.body.style.overflow = '';
        }
    }
    
    // Add control button to footer logger
    function addExpansionButton() {
        const logger = document.getElementById('quiz-detector-log');
        if (!logger) return;
        
        let button = document.getElementById('quiz-expansion-btn');
        if (button) return; // Already exists
        
        button = document.createElement('button');
        button.id = 'quiz-expansion-btn';
        button.textContent = '🔍 Expand All Questions';
        button.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
            font-size: 12px;
            font-weight: bold;
        `;
        
        button.onclick = showExpansion;
        logger.appendChild(button);
    }
    
    // Global functions
    window.showQuizExpansion = showExpansion;
    window.closeQuizExpansion = hideExpansion;
    
    // Initialize when quiz detector is ready
    function initExpansion() {
        if (window.quizDetector && window.quizDetector.initialized) {
            addExpansionButton();
            
            // Add keyboard shortcut (Ctrl+E)
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'e') {
                    e.preventDefault();
                    if (isExpanded) {
                        hideExpansion();
                    } else {
                        showExpansion();
                    }
                }
            });
            
            console.log('Quiz Expansion ready! Press Ctrl+E or click the button to expand all questions.');
        } else {
            setTimeout(initExpansion, 500);
        }
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExpansion);
    } else {
        initExpansion();
    }
    
})();
