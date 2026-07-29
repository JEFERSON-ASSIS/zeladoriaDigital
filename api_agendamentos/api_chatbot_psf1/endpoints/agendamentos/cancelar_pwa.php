<?php
declare(strict_types=1);

use App\Http\Response;
use App\Infrastructure\AppConfig;
use App\Services\CancelamentoService;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    $id = (int)$request->get('id', 0);
    $empresa = (int)$request->get('empresa', AppConfig::empresaId());
    $telefone = (string)$request->get('telefone', '');

    if ($id <= 0 || $telefone === '') {
        Response::error(400, 'INVALID_REQUEST', 'ID e telefone são obrigatórios.');
    }

    $result = (new CancelamentoService())->cancelarPorTelefone($id, $telefone, $empresa);
    if (($result['status'] ?? '') === 'not_found') {
        Response::error(404, 'NOT_FOUND', (string)$result['message']);
    }
    if (($result['status'] ?? '') === 'forbidden') {
        Response::error(403, 'FORBIDDEN', (string)$result['message']);
    }
    if (($result['status'] ?? '') === 'error') {
        Response::error(500, 'CANCEL_ERROR', (string)$result['message']);
    }

    Response::json(200, $result, ['empresa' => $empresa]);
});
