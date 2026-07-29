<?php
declare(strict_types=1);

use App\Http\Response;
use App\Infrastructure\AppConfig;
use App\Services\ListagemService;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    $empresa = (int)$request->get('empresa', AppConfig::empresaId());
    $telefone = (string)$request->get('telefone', '');

    if ($telefone === '') {
        Response::error(400, 'MISSING_PHONE', 'Telefone ausente.');
    }

    $result = (new ListagemService())->listarHistoricoPwaPorTelefone($telefone, $empresa);
    if (($result['status'] ?? '') === 'error') {
        Response::error(400, 'PHONE_INVALID', (string)$result['message']);
    }

    Response::json(200, $result, ['empresa' => $empresa]);
});
