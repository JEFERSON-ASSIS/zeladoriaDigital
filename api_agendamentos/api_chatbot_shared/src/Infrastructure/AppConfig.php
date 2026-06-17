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

    /** @return list<int> */
    public static function servicosAtivos(): array
    {
        $out = [];
        foreach (self::servicos() as $id) {
            $id = (int)$id;
            if ($id > 0) {
                $out[] = $id;
            }
        }
        return $out;
    }

    public static function empresaId(): int
    {
        return (int)(self::$config['empresa_id'] ?? 1);
    }

    public static function unidade(): string
    {
        return (string)(self::$config['unidade'] ?? 'PSF');
    }

    public static function temDentista(): bool
    {
        return (int)(self::servicos()['dentista'] ?? 0) > 0;
    }
}
