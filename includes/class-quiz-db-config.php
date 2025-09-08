<?php
// c:\Users\USUARIO\Documents\SITES\LILAC\L209\app\public\wp-content\plugins\lilac-quiz-sidebar\includes\class-quiz-db-config.php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Lilac_Quiz_DB_Config {
    private static $instance = null;
    private $config = array();

    private function __construct() {
        $this->load_environment_config();
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function load_environment_config() {
        // Check if we're on the production server
        if (strpos($_SERVER['HTTP_HOST'], 'test-li.ussl.co.il') !== false || 
            (function_exists('home_url') && strpos(home_url(), 'test-li.ussl.co.il') !== false)) {
            // Production environment
            $this->config = array(
                'db_host' => 'localhost',
                'db_name' => 'testihrt_up1',
                'db_user' => 'testihrt_up1',
                'db_password' => 'p_2132hTescM@Tcr'
            );
        } else {
            // Local development environment (L209.local)
            $this->config = array(
                'db_host' => '127.0.0.1',
                'db_port' => '10074',
                'db_name' => 'local',
                'db_user' => 'root',
                'db_password' => 'root'
            );
        }
    }

    public function get($key) {
        return isset($this->config[$key]) ? $this->config[$key] : null;
    }

    public function get_connection() {
        try {
            $dsn = "mysql:host={$this->config['db_host']}";
            
            // Add port if specified (for local environment)
            if (isset($this->config['db_port'])) {
                $dsn .= ";port={$this->config['db_port']}";
            }
            
            $dsn .= ";dbname={$this->config['db_name']};charset=utf8mb4";
            
            $options = array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            );
            return new PDO($dsn, $this->config['db_user'], $this->config['db_password'], $options);
        } catch (PDOException $e) {
            error_log('Database Connection Error: ' . $e->getMessage());
            return null;
        }
    }
}