<?php
/**
 * API Chatbot / n8n – PSF3 / UBS Rural
 * Odontologia: configure dentista em servicos se houver serviço ativo (0 = desativado).
 */
return [
    'unidade'    => 'PSF3',
    'empresa_id' => 3,
    'timezone'   => 'America/Cuiaba',

    'servicos' => [
        'medico'     => 24,
        'enfermeiro' => 25,
        'dentista'   => 0,
    ],

    'medico_ignora_fim_semana' => true,

    'api_key' => getenv('PSF3_API_KEY') ?: '',

    'cancelamento_soft' => false,

    'cors' => [
        'allow_origin'  => '*',
        'allow_methods' => 'GET, POST, PATCH, DELETE, OPTIONS',
        'allow_headers' => 'Content-Type, X-Api-Key, Authorization, X-Requested-With',
    ],

    'telemetria' => true,

    'api_log'             => true,
    'api_log_path'        => '',
    'api_log_errors_only' => false,
];
