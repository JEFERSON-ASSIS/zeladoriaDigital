<?php
/**
 * GET – Próximos dias disponíveis para consulta médica (fluxo com escolha de hora)
 * Só lista dias que ainda têm horário livre, como no fluxo do dentista.
 * Parâmetros: empresa (opcional)
 *
 * Exemplo:
 * GET .../endpoints/disponibilidade/dias_medico.php
 */
declare(strict_types=1);

use App\Http\Response;
use App\Infrastructure\AppConfig;
use App\Services\DisponibilidadeService;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    $idEmpresa = (int)$request->get('empresa', AppConfig::empresaId());
    $idServico = (int)(AppConfig::servicos()['medico'] ?? 0);
    $data = [];

    if ($idServico <= 0) {
        Response::error(400, 'MEDICO_NAO_CONFIGURADO', 'Serviço médico não configurado nesta unidade.');
    }

    try {
        $data = (new DisponibilidadeService())->diasDisponiveisMedico($idEmpresa);
    } catch (\RuntimeException $e) {
        $code = $e->getMessage();
        $map = [
            'MEDICO_NAO_CONFIGURADO' => [400, 'Serviço médico não configurado.'],
            'SERVICO_NAO_ENCONTRADO' => [404, 'Serviço médico não encontrado.'],
        ];
        [$http, $msg] = $map[$code] ?? [422, $e->getMessage()];
        Response::error($http, $code, $msg);
    }

    Response::json(200, $data, [
        'servico' => $idServico,
        'empresa' => $idEmpresa,
    ]);
});
