<?php
/**
 * Configuração da API Chatbot / n8n – PSF1
 * Ajuste api_key em produção (deixe vazio em dev para desabilitar auth).
 */
return [
    'unidade'    => 'PSF1',
    'empresa_id' => 1,
    'timezone'   => 'America/Cuiaba',

    'servicos' => [
        'medico'     => 18,
        'enfermeiro' => 20,
        'dentista'   => 22,
    ],

    'medico_ignora_fim_semana' => true,

    /** Chave opcional: header X-Api-Key ou query api_key */
    'api_key' => getenv('PSF1_API_KEY') ?: '',

    /** true = UPDATE status; false = DELETE */
    'cancelamento_soft' => false,

    'cors' => [
        'allow_origin'  => '*',
        'allow_methods' => 'GET, POST, PATCH, DELETE, OPTIONS',
        'allow_headers' => 'Content-Type, X-Api-Key, Authorization, X-Requested-With',
    ],

    'telemetria' => true,

    /** Log em arquivo: api_chatbot_shared/logs/api_psf1_AAAA-MM-DD.log */
    'api_log'             => true,
    /** Caminho fixo opcional; vazio = pasta logs/ compartilhada */
    'api_log_path'        => '',
    /** true = grava só HTTP 4xx/5xx e exceções */
    'api_log_errors_only' => false,
];
