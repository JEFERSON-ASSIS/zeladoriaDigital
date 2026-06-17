<?php
declare(strict_types=1);

namespace App\Http;

use App\Infrastructure\AppConfig;

final class Request
{
    /** @var array<string, mixed> */
    private array $data;

    public function __construct()
    {
        $this->data = self::parseInput();
        $this->data = self::normalizeAliases($this->data);
    }

    /** @return array<string, mixed> */
    public function all(): array
    {
        return $this->data;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->data[$key] ?? $default;
    }

    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function assertApiKey(): void
    {
        $expected = (string)AppConfig::get('api_key', '');
        if ($expected === '') {
            return;
        }

        $provided = $_SERVER['HTTP_X_API_KEY']
            ?? $_GET['api_key']
            ?? $this->get('api_key', '');

        if (!is_string($provided) || !hash_equals($expected, $provided)) {
            Response::error(401, 'UNAUTHORIZED', 'Chave de API inválida ou ausente.');
        }
    }

    /** @return array<string, mixed> */
    private static function parseInput(): array
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $json = json_decode(file_get_contents('php://input') ?: '', true);

        if (is_array($json) && $json !== []) {
            return array_merge($_GET, $_POST, $json);
        }

        if ($method === 'GET') {
            return $_GET;
        }

        return array_merge($_GET, $_POST);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private static function normalizeAliases(array $input): array
    {
        if (isset($input['cns_cpf']) && !isset($input['cpf'])) {
            $input['cpf'] = $input['cns_cpf'];
        }
        if (isset($input['CPF']) && !isset($input['cpf'])) {
            $input['cpf'] = $input['CPF'];
        }
        return $input;
    }
}
