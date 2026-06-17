<?php
/**
 * GET – Horários livres para consulta médica em um dia (fluxo como dentista)
 * Parâmetros: data (dd/mm/aaaa ou aaaa-mm-dd), empresa (opcional)
 *
 * Exemplo:
 * GET .../endpoints/disponibilidade/horarios_medico.php?data=20/05/2026
 */
declare(strict_types=1);

use App\Http\EndpointRunner;
use App\Http\Response;
use App\Infrastructure\AppConfig;
use App\Services\DisponibilidadeService;
use App\Support\DateHelper;

require_once dirname(__DIR__, 2) . '/bootstrap.php';

\App\Http\EndpointRunner::run(static function ($request) {
    $idServico = (int)(AppConfig::servicos()['medico'] ?? 0);
    $idEmpresa = (int)$request->get('empresa', AppConfig::empresaId());
    $dataRaw = trim((string)$request->get('data', ''));

    if ($idServico <= 0) {
        Response::error(400, 'MEDICO_NAO_CONFIGURADO', 'Serviço médico não configurado nesta unidade.');
    }
    if ($dataRaw === '') {
        Response::error(400, 'MISSING_DATA', 'Parâmetro data é obrigatório.');
    }

    try {
        $dataISO = DateHelper::toIso($dataRaw);
        $result = (new DisponibilidadeService())->horariosLivresMedico($idEmpresa, $dataISO);
    } catch (\InvalidArgumentException $e) {
        Response::error(400, 'INVALID_DATA', $e->getMessage());
    } catch (\RuntimeException $e) {
        $code = $e->getMessage();
        $map = [
            'MEDICO_NAO_CONFIGURADO' => [400, 'Serviço médico não configurado.'],
            'SERVICO_NAO_ENCONTRADO' => [404, 'Serviço médico não encontrado.'],
            'DATA_BLOQUEADA'         => [422, 'Data bloqueada para agendamento.'],
            'DIA_FECHADO'            => [422, 'Não há atendimento neste dia da semana.'],
            'LIMITE_DIA_ATINGIDO'    => [422, 'Limite diário de agendamentos atingido.'],
            'SEM_HORARIOS'           => [422, 'Não há horários livres para esta data.'],
        ];
        [$http, $msg] = $map[$code] ?? [422, $e->getMessage()];
        Response::error($http, $code, $msg);
    }

    $horarios = array_values($result['horarios'] ?? []);

    Response::json(200, [
        'data'              => DateHelper::toBr($dataISO),
        'dataISO'           => $dataISO,
        'horarios'          => $horarios,
        'tempo_agendamento' => $result['tempo_agendamento'] ?? null,
        'perguntar_hora'    => true,
        'falar'             => $horarios === []
            ? 'Não há horários disponíveis para consulta médica nesta data.'
            : 'Escolha um dos horários disponíveis para consulta médica.',
    ], [
        'servico' => $idServico,
        'empresa' => $idEmpresa,
    ]);
});
