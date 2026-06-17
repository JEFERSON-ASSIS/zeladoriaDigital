<?php
/**
 * API Chatbot / n8n – PSF2 (Centro)
 */
return [
    'unidade'    => 'PSF2',
    'empresa_id' => 2,
    'timezone'   => 'America/Cuiaba',

    'servicos' => [
        'medico'     => 21,
        'enfermeiro' => 23,
        'dentista'   => 19,
    ],

    'medico_ignora_fim_semana' => true,

    'api_key' => getenv('PSF2_API_KEY') ?: '',

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
