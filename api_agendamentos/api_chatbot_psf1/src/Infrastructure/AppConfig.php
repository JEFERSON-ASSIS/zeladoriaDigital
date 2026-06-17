<?php
declare(strict_types=1);

namespace App\Infrastructure;

final class AppConfig
{
    /** @var array<string, mixed> */
    private static array $config = [];

    /** @param array<string, mixed> $config */
    public static function set(array $config): void
    {
        self::$config = $config;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return self::$config[$key] ?? $default;
    }

    /** @return array<string, int> */
    public static function servicos(): array
    {
        return self::$config['servicos'] ?? [];
    }

    public static function empresaId(): int
    {
        return (int)(self::$config['empresa_id'] ?? 1);
    }
}
