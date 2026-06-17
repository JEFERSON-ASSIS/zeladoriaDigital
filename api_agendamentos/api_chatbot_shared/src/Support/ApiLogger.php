<?php
declare(strict_types=1);

namespace App\Support;

use App\Infrastructure\AppConfig;

final class ApiLogger
{
    private const MAX_RESPONSE_CHARS = 4000;

    /** @var list<string> */
    private const SENSITIVE_KEYS = ['api_key', 'senha', 'password', 'token', 'authorization'];

    public static function log(
        int $statusCode,
        string $responseBody,
        float $startTime,
        ?\Throwable $exception = null
    ): void {
        if (!AppConfig::get('api_log', true)) {
            return;
        }

        if (self::shouldSkip()) {
            return;
        }

        if (AppConfig::get('api_log_errors_only', false) && $statusCode < 400 && $exception === null) {
            return;
        }

        $input = $GLOBALS['api_chatbot_input'] ?? [];
        if (!is_array($input)) {
            $input = [];
        }

        $decoded = json_decode($responseBody, true);
        $errorCode = null;
        if (is_array($decoded)) {
            $errorCode = $decoded['data']['code'] ?? ($decoded['code'] ?? null);
        }

        $entry = [
            'ts'       => date('Y-m-d H:i:s'),
            'unidade'  => AppConfig::get('unidade', ''),
            'empresa'  => AppConfig::empresaId(),
            'endpoint' => $_SERVER['SCRIPT_NAME'] ?? 'unknown',
            'uri'      => $_SERVER['REQUEST_URI'] ?? '',
            'metodo'   => $_SERVER['REQUEST_METHOD'] ?? 'GET',
            'ip'       => $_SERVER['REMOTE_ADDR'] ?? '',
            'status'   => $statusCode,
            'ms'       => round((microtime(true) - $startTime) * 1000, 2),
            'input'    => self::sanitizeInput($input),
            'code'     => $errorCode,
        ];

        if ($exception !== null) {
            $entry['exception'] = $exception->getMessage();
            $entry['exception_file'] = $exception->getFile() . ':' . $exception->getLine();
        }

        if ($responseBody !== '') {
            $snippet = $responseBody;
            if (strlen($snippet) > self::MAX_RESPONSE_CHARS) {
                $snippet = substr($snippet, 0, self::MAX_RESPONSE_CHARS) . '…';
            }
            $entry['response'] = $snippet;
        }

        $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($line === false) {
            return;
        }

        self::writeLine($line . PHP_EOL);
    }

    private static function shouldSkip(): bool
    {
        $script = basename($_SERVER['SCRIPT_NAME'] ?? '');
        return in_array($script, ['health.php', 'swagger.php'], true);
    }

    /** @param array<string, mixed> $input */
    private static function sanitizeInput(array $input): array
    {
        $out = [];
        foreach ($input as $key => $value) {
            $k = strtolower((string)$key);
            if (in_array($k, self::SENSITIVE_KEYS, true)) {
                $out[$key] = '***';
                continue;
            }
            if (is_array($value)) {
                $out[$key] = self::sanitizeInput($value);
                continue;
            }
            $out[$key] = $value;
        }
        return $out;
    }

    private static function writeLine(string $line): void
    {
        $path = self::resolveLogPath();
        $dir = dirname($path);
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
            error_log('[api_chatbot] Não foi possível criar pasta de log: ' . $dir);
            return;
        }

        if (@file_put_contents($path, $line, FILE_APPEND | LOCK_EX) === false) {
            error_log('[api_chatbot] Falha ao gravar log em: ' . $path);
        }
    }

    private static function resolveLogPath(): string
    {
        $custom = (string)AppConfig::get('api_log_path', '');
        if ($custom !== '') {
            return $custom;
        }

        $unidade = preg_replace('/[^a-z0-9_-]+/i', '_', (string)AppConfig::get('unidade', 'api')) ?? 'api';
        $unidade = strtolower($unidade);

        if (defined('API_CHATBOT_SHARED_ROOT')) {
            return API_CHATBOT_SHARED_ROOT . '/logs/api_' . $unidade . '_' . date('Y-m-d') . '.log';
        }

        return sys_get_temp_dir() . '/api_chatbot_' . $unidade . '_' . date('Y-m-d') . '.log';
    }
}
