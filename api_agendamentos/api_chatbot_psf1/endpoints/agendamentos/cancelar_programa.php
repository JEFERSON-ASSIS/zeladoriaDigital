<?php
/**
 * POST, GET ou DELETE – Cancela atendimento de programa por ID (exclusão em agendamentos_programas)
 * Parâmetros: id, empresa (opcional)
 */
declare(strict_types=1);

use App\Http\EndpointRunner;
use App\Http\Response;
use App\Infrastructure\AppConfig;
use App\Services\ProgramaCancelamentoService;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    $method = $request->method();
    if (!in_array($method, ['POST', 'DELETE', 'GET'], true)) {
        Response::error(405, 'METHOD_NOT_ALLOWED', 'Use POST, GET ou DELETE.');
    }

    $id = (int)$request->get('id', 0);
    $empresa = (int)$request->get('empresa', AppConfig::empresaId());

    if ($id <= 0) {
        Response::error(400, 'MISSING_ID', 'Parâmetro id é obrigatório.');
    }

    $result = (new ProgramaCancelamentoService())->cancelar($id, $empresa);
    $status = (string)($result['status'] ?? '');

    if ($status === 'not_found') {
        Response::error(404, 'NOT_FOUND', (string)($result['message'] ?? 'Não encontrado.'));
    }
    if ($status === 'error') {
        Response::error(500, 'CANCEL_ERROR', (string)($result['message'] ?? 'Erro ao cancelar.'));
    }
    if ($status === 'not_updated') {
        Response::error(409, 'NOT_UPDATED', (string)($result['message'] ?? 'Não foi possível cancelar.'));
    }

    Response::json(200, $result, ['empresa' => $empresa]);
});
