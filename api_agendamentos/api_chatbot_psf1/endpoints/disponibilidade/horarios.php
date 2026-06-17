<?php
/**
 * GET – Horários livres em um dia (principalmente dentista e enfermeira)
 * Parâmetros: servico, data (dd/mm/aaaa ou aaaa-mm-dd), empresa (opcional)
 *
 * Exemplo:
 * GET .../endpoints/disponibilidade/horarios.php?servico=22&data=20/05/2026
 */
declare(strict_types=1);

use App\Http\EndpointRunner;
use App\Http\Response;
use App\Infrastructure\AppConfig;
use App\Services\DisponibilidadeService;
use App\Support\DateHelper;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    $idServico = (int)$request->get('servico', 0);
    $idEmpresa = (int)$request->get('empresa', AppConfig::empresaId());
    $dataRaw = trim((string)$request->get('data', ''));

    if ($idServico <= 0) {
        Response::error(400, 'MISSING_SERVICO', 'Parâmetro servico é obrigatório.');
    }
    if ($dataRaw === '') {
        Response::error(400, 'MISSING_DATA', 'Parâmetro data é obrigatório.');
    }

    $dataISO = DateHelper::toIso($dataRaw);
    $data = (new DisponibilidadeService())->horariosLivres($idServico, $idEmpresa, $dataISO);

    Response::json(200, $data, [
        'servico' => $idServico,
        'empresa' => $idEmpresa,
    ]);
});
