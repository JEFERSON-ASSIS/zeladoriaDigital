<?php
declare(strict_types=1);

namespace App\Http;

use App\Support\ApiLogger;

final class EndpointRunner
{
    public static function run(callable $handler): void
    {
        Response::boot();

        $request = new Request();
        $GLOBALS['api_chatbot_input'] = $request->all();
        $request->assertApiKey();

        try {
            $handler($request);
        } catch (\InvalidArgumentException $e) {
            Response::error(400, 'VALIDATION_ERROR', $e->getMessage());
        } catch (\RuntimeException $e) {
            $code = match ($e->getMessage()) {
                'SERVICO_NAO_ENCONTRADO' => ['404', 'SERVICO_NAO_ENCONTRADO'],
                'DATA_BLOQUEADA'         => ['422', 'DATA_BLOQUEADA'],
                'SEM_HORARIOS'           => ['422', 'SEM_HORARIOS'],
                default                  => ['422', 'BUSINESS_RULE'],
            };
            Response::error((int)$code[0], $code[1], $e->getMessage());
        } catch (\Throwable $e) {
            $start = Response::startTime();
            ApiLogger::log(500, '', $start, $e);
            Response::error(500, 'INTERNAL_ERROR', 'Erro interno ao processar a requisição.');
        }
    }
}
