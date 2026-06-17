<?php
declare(strict_types=1);

define('API_CHATBOT_SHARED_ROOT', __DIR__);

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    $file = API_CHATBOT_SHARED_ROOT . '/src/' . $relative;
    if (is_file($file)) {
        require $file;
    }
});

$configPath = defined('API_CHATBOT_CONFIG_PATH')
    ? API_CHATBOT_CONFIG_PATH
    : (dirname(__DIR__) . '/api_chatbot_psf1/config/config.php');

if (!is_file($configPath)) {
    if (class_exists(\App\Http\Response::class, false)) {
        \App\Http\Response::error(500, 'CONFIG_NOT_FOUND', 'Arquivo de configuração não encontrado: ' . $configPath);
    }
    throw new RuntimeException('Arquivo de configuração não encontrado: ' . $configPath);
}

$config = require $configPath;

$host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
$isLocal = stripos($host, 'localhost') !== false
    || stripos($host, '127.0.0.1') !== false
    || $host === '';

ini_set('display_errors', $isLocal ? '1' : '0');
error_reporting(E_ALL);
date_default_timezone_set($config['timezone'] ?? 'America/Cuiaba');

App\Http\Response::applyCors($config['cors'] ?? []);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$deployRoot = dirname(__DIR__);

try {
    $conexao = App\Infrastructure\DatabaseBootstrap::connect($deployRoot);
} catch (\Throwable) {
    App\Http\Response::error(500, 'DB_CONNECTION', 'Não foi possível conectar ao banco de dados.');
}

mysqli_set_charset($conexao, 'utf8mb4');

App\Infrastructure\Database::set($conexao);
App\Infrastructure\AppConfig::set($config);
