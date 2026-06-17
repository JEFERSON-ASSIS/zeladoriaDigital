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
use App\Support\TurnoHelper;

final class MedicaStrategy implements AgendamentoStrategyInterface
{
    public function __construct(
        private CoreRulesService $rules = new CoreRulesService(),
        private SlotService $slots = new SlotService(),
        private AgendamentoRepository $repo = new AgendamentoRepository(),
    ) {
    }

    public function supports(int $servicoId): bool
    {
        return $servicoId === (int)AppConfig::servicos()['medico'];
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
            throw new \RuntimeException('Servico nao encontrado.');
        }

        if ($this->rules->isDataBloqueada($idServico, $idEmpresa, $dataISO, $regras)) {
            throw new \RuntimeException('Data bloqueada (feriado ou recesso).');
        }

        $dataObj = new \DateTime($dataISO);
        $limiteDia = $this->rules->getLimiteDiaSemana($dataObj, $regras);
        if ($limiteDia <= 0) {
            throw new \RuntimeException('Agendamento fechado para este dia da semana.');
        }

        $diaSemanaEn = strtolower($dataObj->format('l'));
        $porTurno = $this->slots->gerarSlotsPorTurno($idEmpresa, $idServico, $diaSemanaEn, $regras);
        if ($porTurno['manha'] === [] && $porTurno['tarde'] === []) {
            throw new \RuntimeException('Nenhum horario configurado na agenda para este dia.');
        }

        $c = Database::connection();
        $slug = preg_replace('/[^a-z0-9]+/', '_', strtolower(AppConfig::unidade())) ?: 'psf';
        $lockName = "{$slug}_consulta_{$idEmpresa}_{$idServico}_{$dataISO}";
        $stLock = $c->prepare('SELECT GET_LOCK(?, 10) AS l');
        $stLock->bind_param('s', $lockName);
        $stLock->execute();
        if ((int)($stLock->get_result()->fetch_assoc()['l'] ?? 0) !== 1) {
            $stLock->close();
            throw new \RuntimeException('Sistema ocupado. Tente novamente.');
        }
        $stLock->close();

        try {
            mysqli_begin_transaction($c);

            if ($this->repo->countAtivosDia($idEmpresa, $idServico, $dataISO) >= $limiteDia) {
                throw new \RuntimeException("Limite diario de {$limiteDia} agendamentos atingido.");
            }

            $ocupados = $this->repo->horariosOcupados($idEmpresa, $idServico, $dataISO);
            $livresManha = TurnoHelper::filtrarLivres($porTurno['manha'], $ocupados);
            $livresTarde = TurnoHelper::filtrarLivres($porTurno['tarde'], $ocupados);
            $todosLivres = array_values(array_merge($livresManha, $livresTarde));

            $horaInput = trim((string)($input['hora'] ?? ''));
            if ($horaInput !== '') {
                if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $horaInput)) {
                    throw new \RuntimeException('Horario invalido. Use HH:MM.');
                }
                if (!in_array($horaInput, $todosLivres, true)) {
                    throw new \RuntimeException("O horario {$horaInput} nao esta disponivel para consulta medica neste dia.");
                }

                $horaAgendada = $horaInput;
                $turnoInferido = in_array($horaInput, $porTurno['manha'], true) ? 'manha' : 'tarde';
                $turnoNorm = TurnoHelper::normalize($input['turno'] ?? null) ?? $turnoInferido;
                if ($turnoNorm !== $turnoInferido) {
                    throw new \RuntimeException("O horario {$horaInput} nao pertence ao turno informado.");
                }
            } else {
                $turnoNorm = TurnoHelper::normalize($input['turno'] ?? null);
                if ($turnoNorm === null) {
                    throw new \RuntimeException(
                        'Antes de agendar consulta medica, consulte turnos.php e envie o campo turno como "manha" ou "tarde" (ou 1/2).'
                    );
                }

                $slotsLivres = $turnoNorm === 'manha' ? $livresManha : $livresTarde;
                $horaAgendada = $slotsLivres[0] ?? null;
                if (!$horaAgendada) {
                    throw new \RuntimeException('Nao ha horarios disponiveis para o turno escolhido neste dia.');
                }
            }

            $datetime = "{$dataISO} {$horaAgendada}:00";
            $id = $this->repo->insert($datetime, $nome, $setor, $telefone, $idServico, $idEmpresa, $cpf);

            $horaComparecer = $horaInput !== '' ? $horaAgendada : substr($horaAgendada, 0, 2) . ':00';
            $this->repo->updateHoraComparecer($id, $horaComparecer . ':00');

            mysqli_commit($c);
            $this->rules->syncCliente($input);

            $labelTurno = $turnoNorm === 'manha' ? 'manha' : 'tarde';

            return [
                'sucesso'        => true,
                'mensagem'       => 'Agendamento realizado para ' . $dataObj->format('d/m/Y')
                    . " as {$horaAgendada} ({$labelTurno}).",
                'id'             => $id,
                'hora'           => $horaAgendada,
                'horaAgendada'   => $horaAgendada,
                'horaComparecer' => $horaComparecer,
                'turno'          => $turnoNorm,
                'ordemDia'       => $this->repo->countAtivosDia($idEmpresa, $idServico, $dataISO),
            ];
        } catch (\Throwable $e) {
            mysqli_rollback($c);
            throw $e;
        } finally {
            $stRel = $c->prepare('SELECT RELEASE_LOCK(?)');
            $stRel->bind_param('s', $lockName);
            $stRel->execute();
            $stRel->close();
        }
    }
}
