<?php
/**
 * GET – Próximos dias disponíveis
 * Parâmetros: servico (18|20|22), empresa (opcional, padrão 1)
 *
 * Exemplo n8n/chatbot:
 * GET .../endpoints/disponibilidade/dias.php?servico=18
 */
declare(strict_types=1);

use App\Http\EndpointRunner;
use App\Http\Response;
use App\Infrastructure\AppConfig;
use App\Services\DisponibilidadeService;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    $idServico = (int)$request->get('servico', 0);
    $idEmpresa = (int)$request->get('empresa', AppConfig::empresaId());

    if ($idServico <= 0) {
        Response::error(400, 'MISSING_SERVICO', 'Parâmetro servico é obrigatório. Consulte index.php desta unidade.');
    }

    $data = (new DisponibilidadeService())->diasDisponiveis($idServico, $idEmpresa);

    Response::json(200, $data, [
        'servico' => $idServico,
        'empresa' => $idEmpresa,
    ]);
});
