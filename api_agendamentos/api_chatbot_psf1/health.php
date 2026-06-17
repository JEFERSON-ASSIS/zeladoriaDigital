<?php
/**
 * Diagnóstico de deploy — abra no navegador para ver o que falta no servidor.
 * Ex.: https://saude.agendaclique.com.br/api_chatbot_psf1/health.php
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

$unitDir = defined('API_CHATBOT_UNIT_DIR') ? API_CHATBOT_UNIT_DIR : __DIR__;
$root = dirname($unitDir);
$sharedBootstrap = $root . '/api_chatbot_shared/bootstrap.php';
$configFile = $unitDir . '/config/config.php';

$dbBootstrapFile = $root . '/api_chatbot_shared/src/Infrastructure/DatabaseBootstrap.php';

$report = [
    'ok'              => true,
    'php_version'     => PHP_VERSION,
    'document_root'   => $_SERVER['DOCUMENT_ROOT'] ?? null,
    'unit_dir'        => $unitDir,
    'parent_dir'      => $root,
    'checks'          => [],
];

$report['checks']['api_chatbot_shared'] = is_file($sharedBootstrap)
    ? ['ok' => true, 'path' => $sharedBootstrap]
    : ['ok' => false, 'path' => $sharedBootstrap, 'hint' => 'Envie a pasta api_chatbot_shared ao lado de api_chatbot_psf1'];

$report['checks']['config'] = is_file($configFile)
    ? ['ok' => true, 'path' => $configFile]
    : ['ok' => false, 'path' => $configFile];

if (is_file($dbBootstrapFile)) {
    require_once $dbBootstrapFile;
    $report['checks']['conexao'] = \App\Infrastructure\DatabaseBootstrap::diagnose($root);
} else {
    $report['checks']['conexao'] = [
        'ok'   => false,
        'hint' => 'DatabaseBootstrap.php não encontrado em api_chatbot_shared.',
    ];
}

if (!$report['checks']['api_chatbot_shared']['ok']
    || !$report['checks']['config']['ok']
    || !$report['checks']['conexao']['ok']) {
    $report['ok'] = false;
}

if ($report['ok'] && is_file($sharedBootstrap)) {
    try {
        define('API_CHATBOT_CONFIG_PATH', $configFile);
        require $sharedBootstrap;
        $report['checks']['database'] = ['ok' => true, 'message' => 'Conexão mysqli carregada'];
    } catch (Throwable $e) {
        $report['ok'] = false;
        $report['checks']['database'] = ['ok' => false, 'error' => $e->getMessage()];
    }
}

http_response_code($report['ok'] ? 200 : 503);
echo json_encode($report, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
