<?php
declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\Database;

final class TelemetryService
{
    public static function register(int $statusCode, string $responseBody, float $startTime): void
    {
        try {
            self::registerOrFail($statusCode, $responseBody, $startTime);
        } catch (\Throwable) {
            // Telemetria não deve derrubar a API
        }
    }

    private static function registerOrFail(int $statusCode, string $responseBody, float $startTime): void
    {
        $c = Database::connection();
        $input = $GLOBALS['api_chatbot_input'] ?? [];

        $tempoExec = round(microtime(true) - $startTime, 4);
        $endpoint = $_SERVER['SCRIPT_NAME'] ?? 'unknown';
        $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        $cpf = $input['cpf'] ?? ($input['cns_cpf'] ?? null);
        $nome = $input['nome'] ?? null;
        $telefone = $input['telefone'] ?? null;
        $servicoNome = $input['servico_nome'] ?? ($input['servico'] ?? null);
        $dataAg = $input['data'] ?? null;

        if ($dataAg && is_string($dataAg) && strpos($dataAg, '/') !== false) {
            $p = explode('/', $dataAg);
            if (count($p) === 3) {
                $dataAg = "{$p[2]}-{$p[1]}-{$p[0]}";
            }
        }

        $resData = json_decode($responseBody, true);
        $idCriado = $resData['data']['id'] ?? ($resData['id'] ?? ($resData['data']['ids'][0] ?? null));

        $sql = 'INSERT INTO api_telemetria (
            id_empresa, id_servico, endpoint, metodo, payload_input, payload_output,
            paciente_cpf, paciente_nome, paciente_telefone, servico_nome,
            data_agendada, id_objeto_criado, status_code, ip_origem, tempo_execucao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        $stmt = $c->prepare($sql);
        if (!$stmt) {
            return;
        }

        $idEmp = (int)($input['empresa'] ?? 0);
        $idServ = (int)($input['servico'] ?? 0);
        $payloadIn = json_encode($input, JSON_UNESCAPED_UNICODE);

        $stmt->bind_param(
            'iisssssssssiisd',
            $idEmp,
            $idServ,
            $endpoint,
            $metodo,
            $payloadIn,
            $responseBody,
            $cpf,
            $nome,
            $telefone,
            $servicoNome,
            $dataAg,
            $idCriado,
            $statusCode,
            $ip,
            $tempoExec
        );
        $stmt->execute();
        $stmt->close();
    }
}
