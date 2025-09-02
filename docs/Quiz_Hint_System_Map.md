# Quiz Hint System Architecture Map

## 1. Core Components

### 1.1 Backend (PHP)
- **Main Class**: `Lilac_Quiz_Sidebar` in `class-quiz-sidebar.php`
  - Handles quiz settings and hint enforcement logic
  - Manages AJAX endpoints for hint tracking
  - Controls sidebar behavior

### 1.2 Frontend (JavaScript)
- **quiz-answer-handler.js**: Manages answer submission and validation
- **quiz-answer-reselection.js**: Handles answer reselection and hint enforcement
- **quiz-navigation-control.js**: Controls navigation during hint enforcement
- **quiz-sidebar-media.js**: Manages media display in the sidebar
- **enhanced-sidebar-layout.js**: Handles responsive layout and media loading

## 2. Hint System Flow

### 2.1 Initialization
1. Quiz loads with `enforce_hint` setting checked
2. Body gets `quiz-enforce-hint` class
3. Next button is hidden immediately

### 2.2 Answer Submission
1. User selects an answer and clicks "Check"
2. If answer is incorrect:
   - Answer is marked as incorrect
   - User must view the hint before continuing
   - Next button remains hidden

### 2.3 Hint Viewing
1. User clicks the hint button
2. System tracks hint viewing
3. Once viewed, enables the Next button

### 2.4 Navigation Control
1. Direct question navigation is disabled
2. Users must proceed sequentially
3. Prevents skipping questions without viewing hints

## 3. Key Files and Functions

### 3.1 Backend (PHP)
- **class-quiz-sidebar.php**
  - `is_enforce_hint_enabled()`: Checks if hint enforcement is enabled
  - `check_quiz_enforce_hint()`: AJAX handler for hint status
  - `enqueue_scripts()`: Loads necessary JavaScript files

### 3.2 Frontend (JavaScript)
- **quiz-navigation-control.js**
  ```javascript
  function hideNextButton() {
      $('input[name="next"]').hide();
      $('.wpProQuiz_button[name="next"]').hide();
      $('.wpProQuiz_QuestionButton[value*="Next"]').hide();
      $('.wpProQuiz_QuestionButton[value*="הבא"]').hide();
  }
  ```

- **quiz-answer-reselection.js**
  ```javascript
  function handleAnswerResult($question, isCorrect, questionId) {
      if (!isCorrect && config.enforceHint) {
          showHintModal($question);
          hideNextButton();
      }
  }
  ```

## 4. Configuration

### 4.1 WordPress Admin Settings
- `_ld_quiz_toggle_sidebar`: Controls sidebar visibility
- `_ld_quiz_enforce_hint`: Enforces hint viewing

### 4.2 JavaScript Configuration
```javascript
const config = {
    enforceHint: true,
    debug: false,
    hintDelay: 300,
    highlightNext: true
};
```

## 5. CSS Classes and Styling

### 5.1 Core Classes
- `.quiz-enforce-hint`: Added to body when hint enforcement is active
- `.wpProQuiz_hint`: Hint container
- `.wpProQuiz_button`: Next/Previous buttons
- `.wpProQuiz_QuestionButton`: Question navigation buttons

### 5.2 Custom Styling
```css
.quiz-enforce-hint .wpProQuiz_button[name="next"] {
    display: none !important;
}

.wpProQuiz_hint {
    background-color: #f8f9fa;
    border-left: 4px solid #0073aa;
    padding: 1em;
    margin: 1em 0;
}
```

## 6. Debugging

### 6.1 Enabling Debug Mode
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### 6.2 Common Issues
1. **Hint not showing**: Check if `enforce_hint` meta is set
2. **Next button visible**: Verify CSS classes and JavaScript execution
3. **Navigation not restricted**: Check event listeners in quiz-navigation-control.js

## 7. Dependencies
- WordPress 5.0+
- LearnDash LMS
- jQuery 1.12.4+

## 8. Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS 10+)
- Chrome for Android
