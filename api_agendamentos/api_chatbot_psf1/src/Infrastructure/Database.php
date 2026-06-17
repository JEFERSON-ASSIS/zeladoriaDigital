<?php
declare(strict_types=1);

namespace App\Infrastructure;

final class Database
{
    private static ?\mysqli $conn = null;

    public static function set(\mysqli $conn): void
    {
        self::$conn = $conn;
    }

    public static function connection(): \mysqli
    {
        if (self::$conn === null) {
            throw new \RuntimeException('Conexão não inicializada.');
        }
        return self::$conn;
    }
}
