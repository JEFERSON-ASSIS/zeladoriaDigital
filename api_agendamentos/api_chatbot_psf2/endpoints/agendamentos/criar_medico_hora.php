<?php
/**
 * POST JSON - Cria consulta medica com hora escolhida pelo usuario.
 *
 * Body:
 * {
 *   "nome": "Paciente",
 *   "telefone": "66999999999",
 *   "cpf": "00000000000",
 *   "empresa": 1,
 *   "data": "20/05/2026",
 *   "hora": "13:30",
 *   "setor": ""
 * }
 */
declare(strict_types=1);

use App\Http\Response;
use App\Infrastructure\AppConfig;
use App\Services\AgendamentoService;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    if ($request->method() !== 'POST') {
        Response::error(405, 'METHOD_NOT_ALLOWED', 'Use POST com JSON.');
    }

    $input = $request->all();
    $idServico = (int)(AppConfig::servicos()['medico'] ?? 0);
    if ($idServico <= 0) {
        Response::error(400, 'MEDICO_NAO_CONFIGURADO', 'Servico medico nao configurado nesta unidade.');
    }

    if (empty($input['hora'])) {
        Response::error(400, 'MISSING_HORA', 'Campo hora e obrigatorio para esta rota.');
    }

    $input['servico'] = $idServico;
    $input['empresa'] = (int)($input['empresa'] ?? AppConfig::empresaId());

    $result = (new AgendamentoService())->criar($input);

    Response::legacy(200, $result);
});