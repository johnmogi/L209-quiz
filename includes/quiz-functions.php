<?php
/**
 * Quiz utility functions for Lilac Quiz Sidebar
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get quiz ID from various sources
 */
function lilac_get_current_quiz_id() {
    global $post;
    
    if (is_singular('sfwd-quiz')) {
        return $post->ID;
    }
    
    return null;
}

/**
 * Check if current page is a quiz
 */
function lilac_is_quiz_page() {
    return is_singular('sfwd-quiz') || 
           (isset($_GET['quiz']) && !empty($_GET['quiz'])) ||
           strpos($_SERVER['REQUEST_URI'], '/quiz') !== false;
}
