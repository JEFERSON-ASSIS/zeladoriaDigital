<?php
/**
 * POST JSON – Cria agendamento (médico 18, enfermeiro 20, dentista 22)
 *
 * Body exemplo médica/enfermeira:
 * { "nome","telefone","cpf","servico":18,"empresa":1,"data":"20/05/2026","setor":"" }
 *
 * Dentista (+ hora):
 * { ..., "servico":22, "hora":"13:30" }
 */
declare(strict_types=1);

use App\Http\EndpointRunner;
use App\Http\Response;
use App\Services\AgendamentoService;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    if ($request->method() !== 'POST') {
        Response::error(405, 'METHOD_NOT_ALLOWED', 'Use POST com JSON.');
    }

    $result = (new AgendamentoService())->criar($request->all());

    // Formato legado para compatibilidade com fluxos que esperam { sucesso, id, ... }
    Response::legacy(200, $result);
});
