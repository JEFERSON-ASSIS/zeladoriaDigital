<?php
declare(strict_types=1);

namespace App\Infrastructure;

final class DatabaseBootstrap
{
    /**
     * @return list<string>
     */
    public static function conexaoFileCandidates(string $deployRoot): array
    {
        return [
            $deployRoot . '/painel/conexao/conexao.php',
            $deployRoot . '/conexao/conexao.php',
            dirname($deployRoot) . '/painel/conexao/conexao.php',
            $deployRoot . '/../painel/conexao/conexao.php',
        ];
    }

    public static function hasEnvConfig(): bool
    {
        return self::env('DB_HOST') !== ''
            && self::envDbName() !== ''
            && self::env('DB_USER') !== '';
    }

    /**
     * @return array<string, mixed>
     */
    public static function diagnose(string $deployRoot): array
    {
        if (self::hasEnvConfig()) {
            return [
                'ok'     => true,
                'source' => 'env',
                'host'   => self::env('DB_HOST'),
                'base'   => self::envDbName(),
                'user'   => self::env('DB_USER'),
                'porta'  => self::envPort(),
            ];
        }

        $tried = self::conexaoFileCandidates($deployRoot);
        foreach ($tried as $path) {
            if (is_file($path)) {
                return [
                    'ok'     => true,
                    'source' => 'file',
                    'path'   => $path,
                ];
            }
        }

        return [
            'ok'    => false,
            'tried' => $tried,
            'hint'  => 'Defina DB_HOST, DB_NAME e DB_USER (Docker/Swarm) '
                . 'ou disponibilize painel/conexao/conexao.php no servidor.',
        ];
    }

    public static function connect(string $deployRoot): \mysqli
    {
        if (self::hasEnvConfig()) {
            return self::connectFromEnv();
        }

        foreach (self::conexaoFileCandidates($deployRoot) as $path) {
            if (!is_file($path)) {
                continue;
            }

            require_once $path;

            if (isset($conexao) && $conexao instanceof \mysqli) {
                return $conexao;
            }
        }

        throw new \RuntimeException('Não foi possível conectar ao banco de dados.');
    }

    private static function connectFromEnv(): \mysqli
    {
        $host = self::env('DB_HOST');
        $base = self::envDbName();
        $user = self::env('DB_USER');
        $senha = self::envDbPassword();
        $porta = self::envPort();

        $conexao = @mysqli_connect($host, $user, $senha, $base, $porta);
        if (!$conexao) {
            throw new \RuntimeException('Erro na conexão: ' . mysqli_connect_error());
        }

        return $conexao;
    }

    private static function envDbName(): string
    {
        $name = self::env('DB_NAME');
        if ($name !== '') {
            return $name;
        }

        return self::env('DB_DATABASE');
    }

    private static function envDbPassword(): string
    {
        $pass = self::env('DB_PASS');
        if ($pass !== '') {
            return $pass;
        }

        return self::env('DB_PASSWORD');
    }

    private static function envPort(): int
    {
        $port = self::env('DB_PORT');
        if ($port === '') {
            return 3306;
        }

        return (int)$port;
    }

    private static function env(string $key): string
    {
        if (array_key_exists($key, $_ENV)) {
            $value = $_ENV[$key];
            return is_string($value) ? trim($value) : '';
        }

        if (array_key_exists($key, $_SERVER)) {
            $value = $_SERVER[$key];
            return is_string($value) ? trim($value) : '';
        }

        $value = getenv($key);
        return is_string($value) ? trim($value) : '';
    }
}
