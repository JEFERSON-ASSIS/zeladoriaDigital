<?php
declare(strict_types=1);

namespace App\Strategies;

use App\Contracts\AgendamentoStrategyInterface;
use App\Infrastructure\AppConfig;
use App\Infrastructure\Database;
use App\Repositories\AgendamentoRepository;
use App\Services\CoreRulesService;
use App\Services\SlotService;
use App\Support\DateHelper;

final class DentistaStrategy implements AgendamentoStrategyInterface
{
    public function __construct(
        private CoreRulesService $rules = new CoreRulesService(),
        private AgendamentoRepository $repo = new AgendamentoRepository(),
    ) {
    }

    public function supports(int $servicoId): bool
    {
        return $servicoId === (int)AppConfig::servicos()['dentista'];
    }

    public function agendar(array $input): array
    {
        $idServico = (int)AppConfig::servicos()['dentista'];
        $idEmpresa = (int)($input['empresa'] ?? AppConfig::empresaId());
        $nome = trim((string)$input['nome']);
        $telefone = trim((string)$input['telefone']);
        $cpf = preg_replace('/\D/', '', (string)$input['cpf']);
        $setor = trim((string)($input['setor'] ?? ''));
        $hora = trim((string)($input['hora'] ?? ''));

        if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $hora)) {
            throw new \InvalidArgumentException('Hora inválida. Use HH:MM.');
        }

        $dataISO = DateHelper::toIso((string)$input['data']);
        $dataBr = DateHelper::toBr($dataISO);
        $datetime = "{$dataISO} {$hora}:00";

        $regras = $this->rules->getRules($idServico, $idEmpresa);
        if (!$regras) {
            throw new \RuntimeException('Configurações do serviço não encontradas.');
        }

        if ($this->rules->isDataBloqueada($idServico, $idEmpresa, $dataISO, $regras)) {
            throw new \RuntimeException('Esta data está bloqueada para agendamentos.');
        }

        $horariosLiberados = !empty($regras['horarios_liberados'])
            ? array_map('trim', explode(',', (string)$regras['horarios_liberados']))
            : [];
        $horaTrim = substr($hora, 0, 5);
        if ($horariosLiberados !== [] && !in_array($horaTrim, $horariosLiberados, true)) {
            throw new \RuntimeException("O horário {$horaTrim} não está disponível para este serviço.");
        }

        $capacidadeBloco = (int)($regras['vagas_por_hora'] ?? 2);
        $bloco = SlotService::intervaloBloco($dataISO, $hora);

        $c = Database::connection();
        $c->begin_transaction();

        try {
            $totalNoBloco = $this->repo->countNoBloco($idEmpresa, $idServico, $bloco['inicio'], $bloco['fim']);
            if ($totalNoBloco >= $capacidadeBloco) {
                throw new \RuntimeException("Bloco de horário lotado ({$capacidadeBloco} vagas). Escolha outro horário.");
            }

            if ($this->repo->existeDatetime($idEmpresa, $idServico, $datetime)) {
                throw new \RuntimeException('Horário exatamente escolhido já reservado.');
            }

            $id = $this->repo->insert($datetime, $nome, $setor, $telefone, $idServico, $idEmpresa, $cpf);
            $c->commit();
            $this->rules->syncCliente($input);

            return [
                'sucesso'               => true,
                'mensagem'              => "Agendamento realizado com sucesso para às {$hora} no dia {$dataBr}.",
                'id'                    => $id,
                'servico'               => $idServico,
                'empresa'               => $idEmpresa,
                'data'                  => $dataBr,
                'hora'                  => $hora,
                'vagasRestantesNoBloco' => max(0, $capacidadeBloco - ($totalNoBloco + 1)),
            ];
        } catch (\Throwable $e) {
            $c->rollback();
            throw $e;
        }
    }
}
