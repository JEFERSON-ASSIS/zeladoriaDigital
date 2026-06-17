<?php
/**
 * GET – Turnos (manhã / tarde) com vaga no dia — consulta médica
 * Parâmetros: servico (ID médico da unidade), data (dd/mm/aaaa ou aaaa-mm-dd), empresa (opcional)
 *
 * Exemplo:
 * GET .../endpoints/disponibilidade/turnos.php?servico=18&data=20/05/2026
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
        Response::error(400, 'MISSING_SERVICO', 'Parâmetro servico é obrigatório (ID do médico desta unidade).');
    }
    if ($dataRaw === '') {
        Response::error(400, 'MISSING_DATA', 'Parâmetro data é obrigatório.');
    }

    try {
        $dataISO = DateHelper::toIso($dataRaw);
        $data = (new DisponibilidadeService())->turnosNoDia($idServico, $idEmpresa, $dataISO);
    } catch (\InvalidArgumentException $e) {
        Response::error(400, 'INVALID_REQUEST', $e->getMessage());
    } catch (\RuntimeException $e) {
        $code = $e->getMessage();
        $map = [
            'SERVICO_NAO_ENCONTRADO' => [404, 'Serviço não encontrado.'],
            'DATA_BLOQUEADA'         => [422, 'Data bloqueada para agendamento.'],
            'DIA_FECHADO'            => [422, 'Não há atendimento neste dia da semana.'],
            'LIMITE_DIA_ATINGIDO'    => [422, 'Limite diário de agendamentos atingido.'],
            'SEM_AGENDA_TURNO'       => [422, 'Agenda não configurada para este dia.'],
            'SEM_TURNO'              => [422, 'Não há vagas em nenhum turno neste dia.'],
        ];
        [$http, $msg] = $map[$code] ?? [422, $e->getMessage()];
        Response::error($http, $code, $msg);
    }

    Response::json(200, $data, [
        'servico' => $idServico,
        'empresa' => $idEmpresa,
    ]);
});
