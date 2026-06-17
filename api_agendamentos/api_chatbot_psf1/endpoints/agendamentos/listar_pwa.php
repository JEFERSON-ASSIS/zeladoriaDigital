<?php
/**
 * GET ou POST – Lista todos os agendamentos do CPF com status atual (PWA)
 * Parâmetros: cpf (ou cns_cpf, documento), empresa (opcional), limite (opcional, máx. 100)
 */
declare(strict_types=1);

use App\Http\Response;
use App\Infrastructure\AppConfig;
use App\Services\ListagemService;
use App\Support\CpfHelper;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    $empresa = (int)$request->get('empresa', AppConfig::empresaId());
    $limite = (int)$request->get('limite', 50);

    $cpf = CpfHelper::extractFromQueryString();
    if ($cpf === '') {
        $cpf = CpfHelper::extractFromInput($request->all());
    }

    if ($cpf === '') {
        Response::error(400, 'MISSING_CPF', 'CPF inválido ou ausente. '
            . 'Use: .../listar_pwa.php?cpf=01545934193');
    }

    $result = (new ListagemService())->listarHistoricoPwaPorCpf($cpf, $empresa, $limite);

    if (($result['status'] ?? '') === 'error') {
        Response::error(400, 'DOCUMENTO_INVALIDO', (string)($result['message'] ?? 'Documento inválido.'));
    }

    Response::json(200, $result, ['empresa' => $empresa]);
});
