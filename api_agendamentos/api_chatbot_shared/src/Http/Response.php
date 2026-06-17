<?php
declare(strict_types=1);

namespace App\Http;

use App\Infrastructure\AppConfig;
use App\Services\TelemetryService;
use App\Support\ApiLogger;

final class Response
{
    private static float $startTime;

    public static function boot(): void
    {
        self::$startTime = microtime(true);
    }

    public static function startTime(): float
    {
        return self::$startTime ?? microtime(true);
    }

    /** @param array<string, string> $cors */
    public static function applyCors(array $cors): void
    {
        header('Content-Type: application/json; charset=UTF-8');
        header('Access-Control-Allow-Origin: ' . ($cors['allow_origin'] ?? '*'));
        header('Access-Control-Allow-Methods: ' . ($cors['allow_methods'] ?? 'GET, POST, OPTIONS'));
        header('Access-Control-Allow-Headers: ' . ($cors['allow_headers'] ?? 'Content-Type, X-Api-Key'));
    }

    /**
     * Formato padrão n8n / chatbot: { statusCode, data, meta? }
     *
     * @param array<string, mixed> $data
     * @param array<string, mixed> $meta
     */
    public static function json(int $statusCode, array $data, array $meta = []): void
    {
        http_response_code($statusCode);
        $body = [
            'statusCode' => $statusCode,
            'data'       => $data,
        ];
        if ($meta !== []) {
            $body['meta'] = $meta;
        }

        $encoded = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $start = self::$startTime ?? microtime(true);
        if (AppConfig::get('telemetria', true)) {
            TelemetryService::register($statusCode, $encoded, $start);
        }
        ApiLogger::log($statusCode, $encoded ?: '', $start);
        echo $encoded;
        exit;
    }

    /**
     * Resposta legada (POST agendar) – mantém { sucesso, id, ... } para compatibilidade.
     *
     * @param array<string, mixed> $payload
     */
    public static function legacy(int $httpCode, array $payload): void
    {
        http_response_code($httpCode);
        $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $start = self::$startTime ?? microtime(true);
        if (AppConfig::get('telemetria', true)) {
            TelemetryService::register($httpCode, $encoded ?: '', $start);
        }
        ApiLogger::log($httpCode, $encoded ?: '', $start);
        echo $encoded;
        exit;
    }

    public static function error(int $statusCode, string $code, string $message, array $extra = []): void
    {
        self::json($statusCode, array_merge([
            'code'    => $code,
            'message' => $message,
        ], $extra));
    }
}
