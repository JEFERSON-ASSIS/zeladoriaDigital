<?php
declare(strict_types=1);

define('API_CHATBOT_CONFIG_PATH', __DIR__ . '/config/config.php');
require dirname(__DIR__) . '/api_chatbot_shared/bootstrap.php';

use App\Http\Response;
use App\Infrastructure\AppConfig;

Response::boot();

$base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
$host = ($_SERVER['REQUEST_SCHEME'] ?? 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
$s = AppConfig::servicos();

Response::json(200, [
    'api'        => 'Chatbot PSF1 v1',
    'unidade'    => AppConfig::unidade(),
    'empresa_id' => AppConfig::empresaId(),
    'servicos'   => $s,
    'fluxos'     => [
        'medico'      => 'listar -> dias?servico=' . $s['medico'] . ' -> turnos -> criar (turno manha|tarde)',
        'medico_hora' => 'listar -> dias_medico -> horarios_medico -> criar_medico_hora (com hora)',
        'dentista'    => 'listar -> dias?servico=' . $s['dentista'] . ' -> horarios -> criar (com hora)',
        'enfermeiro'  => 'listar -> dias?servico=' . $s['enfermeiro'] . ' -> criar (sem hora)',
    ],
    'endpoints'  => [
        'dias'              => $host . $base . '/endpoints/disponibilidade/dias.php?servico=' . $s['medico'],
        'dias_medico'       => $host . $base . '/endpoints/disponibilidade/dias_medico.php',
        'turnos'            => $host . $base . '/endpoints/disponibilidade/turnos.php?servico=' . $s['medico'] . '&data=20/05/2026',
        'horarios_medico'   => $host . $base . '/endpoints/disponibilidade/horarios_medico.php?data=20/05/2026',
        'horarios'          => $host . $base . '/endpoints/disponibilidade/horarios.php?servico=' . $s['dentista'] . '&data=20/05/2026',
        'listar'            => $host . $base . '/endpoints/agendamentos/listar.php?cpf=00000000000',
        'listar_programas'  => $host . $base . '/endpoints/agendamentos/listar_programas.php?cpf=00000000000',
        'criar'             => $host . $base . '/endpoints/agendamentos/criar.php (POST JSON)',
        'criar_medico_hora' => $host . $base . '/endpoints/agendamentos/criar_medico_hora.php (POST JSON com hora)',
        'cancelar'          => $host . $base . '/endpoints/agendamentos/cancelar.php?id=1',
        'cancelar_programa' => $host . $base . '/endpoints/agendamentos/cancelar_programa.php?id=1',
    ],
]);
