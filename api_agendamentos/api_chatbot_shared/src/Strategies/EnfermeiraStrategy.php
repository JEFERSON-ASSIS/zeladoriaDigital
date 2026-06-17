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

final class EnfermeiraStrategy implements AgendamentoStrategyInterface
{
    public function __construct(
        private CoreRulesService $rules = new CoreRulesService(),
        private SlotService $slots = new SlotService(),
        private AgendamentoRepository $repo = new AgendamentoRepository(),
    ) {
    }

    public function supports(int $servicoId): bool
    {
        return $servicoId === (int)AppConfig::servicos()['enfermeiro'];
    }

    public function agendar(array $input): array
    {
        $nome = trim((string)$input['nome']);
        $telefone = trim((string)$input['telefone']);
        $idServico = (int)$input['servico'];
        $idEmpresa = (int)$input['empresa'];
        $cpf = preg_replace('/\D/', '', (string)$input['cpf']);
        $dataISO = DateHelper::toIso((string)$input['data']);
        $setor = trim((string)($input['setor'] ?? ''));

        $regras = $this->rules->getRules($idServico, $idEmpresa);
        if (!$regras) {
            throw new \RuntimeException('Serviço não encontrado.');
        }

        if ($this->rules->isDataBloqueada($idServico, $idEmpresa, $dataISO, $regras)) {
            throw new \RuntimeException('Data bloqueada (feriado ou recesso).');
        }

        $horariosInput = isset($input['hora'])
            ? (is_array($input['hora']) ? $input['hora'] : [$input['hora']])
            : [];

        $nomeServico = (string)($regras['nome'] ?? '');
        $isEnfermeiro = (bool)preg_match('/^enfermeir[oa]s?$/iu', $nomeServico);

        $horariosAgendar = [];

        if ($isEnfermeiro && $horariosInput === []) {
            $limiteDia = $this->rules->getLimiteDiaSemana(new \DateTime($dataISO), $regras);
            if ($limiteDia > 0 && $this->rules->isLimiteAtingido($idServico, $idEmpresa, $dataISO, $limiteDia)) {
                throw new \RuntimeException('Limite diário atingido para este serviço.');
            }

            $diaSemanaEn = strtolower((new \DateTime($dataISO))->format('l'));
            $slots = $this->slots->gerarSlotsAgenda($idEmpresa, $idServico, $diaSemanaEn, $regras);
            if ($slots === []) {
                throw new \RuntimeException('Sem horários configurados para este dia.');
            }

            $ocupados = $this->repo->horariosOcupados($idEmpresa, $idServico, $dataISO);
            foreach ($slots as $s) {
                if (!in_array($s, $ocupados, true)) {
                    $horariosAgendar[] = $s;
                    break;
                }
            }
            if ($horariosAgendar === []) {
                throw new \RuntimeException('Nenhum horário disponível.');
            }
        } else {
            if ($horariosInput === []) {
                throw new \InvalidArgumentException('Horário não informado.');
            }
            foreach ($horariosInput as $h) {
                if (!preg_match('/^\d{2}:\d{2}$/', (string)$h)) {
                    throw new \InvalidArgumentException("Horário inválido: $h");
                }
                $horariosAgendar[] = (string)$h;
            }
        }

        $c = Database::connection();
        mysqli_begin_transaction($c);
        $idsCriados = [];
        $horaFinal = null;

        try {
            foreach ($horariosAgendar as $h) {
                $datetime = "{$dataISO} {$h}:00";
                if ($this->repo->existeDatetime($idEmpresa, $idServico, $datetime)) {
                    throw new \RuntimeException("Horário $h já reservado.");
                }
                $idsCriados[] = $this->repo->insert(
                    $datetime,
                    $nome,
                    $setor,
                    $telefone,
                    $idServico,
                    $idEmpresa,
                    $cpf
                );
                $horaFinal = $h;
            }

            mysqli_commit($c);
            $this->rules->syncCliente($input);

            $blocoHora = $horaFinal ? substr($horaFinal, 0, 2) . ':00' : null;

            return [
                'sucesso'  => true,
                'mensagem' => 'Agendamento realizado com sucesso para '
                    . date('d/m/Y', strtotime($dataISO)) . " às $horaFinal.",
                'ids'      => $idsCriados,
                'id'       => $idsCriados[0] ?? null,
                'hora'     => $horaFinal,
                'data'     => $dataISO,
                'blocoHora'=> $blocoHora,
                'servico'  => $nomeServico,
                'empresa'  => $idEmpresa,
                'nome'     => $nome,
            ];
        } catch (\Throwable $e) {
            mysqli_rollback($c);
            throw $e;
        }
    }
}
