<?php
/**
 * GET ou POST – Lista atendimentos de programas para cancelamento
 * Parâmetros: cpf (ou cns_cpf, documento), empresa (opcional)
 */
declare(strict_types=1);

use App\Http\EndpointRunner;
use App\Http\Response;
use App\Infrastructure\AppConfig;
use App\Services\ProgramaListagemService;
use App\Support\CpfHelper;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    $empresa = (int)$request->get('empresa', AppConfig::empresaId());
    $cpf = CpfHelper::extractFromQueryString();
    if ($cpf === '') {
        $cpf = CpfHelper::extractFromInput($request->all());
    }

    if ($cpf === '') {
        Response::error(400, 'MISSING_CPF', 'CPF inválido ou ausente na URL. '
            . 'Use: .../listar_programas.php?cpf=01545934193 (11 dígitos no parâmetro cpf da URL).');
    }

    $result = (new ProgramaListagemService())->listarPorCpf($cpf, $empresa);

    if (($result['status'] ?? '') === 'error') {
        Response::error(400, 'DOCUMENTO_INVALIDO', (string)($result['message'] ?? 'Documento inválido.'));
    }

    $http = ($result['status'] ?? '') === 'not_found' ? 404 : 200;
    Response::json($http, $result, ['empresa' => $empresa]);
});
