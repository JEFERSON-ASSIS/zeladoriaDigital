<?php
declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\AppConfig;
use App\Repositories\AgendaRepository;
use App\Repositories\AgendamentoRepository;
use App\Support\DateHelper;
use App\Support\TurnoHelper;

final class DisponibilidadeService
{
    public function __construct(
        private CoreRulesService $rules = new CoreRulesService(),
        private SlotService $slots = new SlotService(),
        private AgendamentoRepository $agendaRepo = new AgendamentoRepository(),
        private AgendaRepository $agendaDiaRepo = new AgendaRepository(),
    ) {
    }

    /**
     * @return array{
     *   dataBase: string,
     *   dias: list<string>,
     *   vagas: list<int>,
     *   turno_tarde?: list<bool>,
     *   vagas_tarde?: list<int>,
     *   falar?: string
     * }
     */
    public function diasDisponiveis(int $idServico, int $idEmpresa): array
    {
        $regras = $this->rules->getRules($idServico, $idEmpresa);
        if (!$regras) {
            throw new \RuntimeException('SERVICO_NAO_ENCONTRADO');
        }

        $dentista = $idServico === (int)AppConfig::servicos()['dentista'];
        $medico = $idServico === (int)AppConfig::servicos()['medico'];

        $diasPt = DateHelper::diasPt();
        $mapDia = DateHelper::mapDiaIngles();
        $dias = [];
        $vagas = [];
        $turnoTarde = [];
        $vagasTarde = [];
        $exibirCamposTarde = false;
        $maxResultados = (int)($regras['dias_antecedencia'] ?? 5);

        $cursor = new \DateTime('tomorrow');
        $tentadas = 0;

        while (count($dias) < $maxResultados && $tentadas < 90) {
            $idx = (int)$cursor->format('w');
            $dataSql = $cursor->format('Y-m-d');

            if ($medico && ($idx === 0 || $idx === 6)) {
                $cursor->modify('+1 day');
                $tentadas++;
                continue;
            }

            if ($this->rules->isDataBloqueada($idServico, $idEmpresa, $dataSql, $regras)) {
                $cursor->modify('+1 day');
                $tentadas++;
                continue;
            }

            $limiteDia = $this->rules->getLimiteDiaSemana($cursor, $regras);
            if ($limiteDia <= 0) {
                $cursor->modify('+1 day');
                $tentadas++;
                continue;
            }

            $temVaga = $dentista
                ? $this->diaDentistaTemVaga($idEmpresa, $idServico, $dataSql, $regras, $mapDia[$idx])
                : !$this->rules->isLimiteAtingido($idServico, $idEmpresa, $dataSql, $limiteDia);

            if ($temVaga) {
                $total = $this->agendaRepo->countAtivosDia($idEmpresa, $idServico, $dataSql);
                $dias[] = $cursor->format('d/m/Y') . ' ' . $diasPt[$idx] . '-feira';
                $vagas[] = max(0, $limiteDia - $total);

                $tardeResumo = $this->resumoTardeDia($idServico, $idEmpresa, $dataSql, $regras, $mapDia[$idx], $idx);
                $turnoTarde[] = $tardeResumo['disponivel'];
                $vagasTarde[] = $tardeResumo['vagas'];
                if ($this->mostrarTardePermitida($regras, $idx)) {
                    $exibirCamposTarde = true;
                }
            }

            $cursor->modify('+1 day');
            $tentadas++;
            if ($dentista && $cursor > (new \DateTime('today'))->modify('+60 days')) {
                break;
            }
        }

        $out = [
            'dataBase' => (new \DateTime('today'))->format('d/m/Y'),
            'dias'     => $dias,
            'vagas'    => $vagas,
        ];

        if ($exibirCamposTarde) {
            $out['turno_tarde'] = $turnoTarde;
            $out['vagas_tarde'] = $vagasTarde;
        }

        if ($dentista) {
            $out['falar'] = 'Mostre os dias disponíveis. Quando o usuário escolher um dia, consulte os horários livres.';
        }

        return $out;
    }

    /**
     * @return array{empresa: int, servico: int, data: string, horarios: list<string>, tempo_agendamento: int}
     */
    public function horariosLivres(int $idServico, int $idEmpresa, string $dataISO): array
    {
        $regras = $this->rules->getRules($idServico, $idEmpresa);
        if (!$regras) {
            throw new \RuntimeException('SERVICO_NAO_ENCONTRADO');
        }

        if ($this->rules->isDataBloqueada($idServico, $idEmpresa, $dataISO, $regras)) {
            throw new \RuntimeException('DATA_BLOQUEADA');
        }

        $dt = new \DateTime($dataISO);
        $diaSemana = strtolower($dt->format('l'));
        $cfg = $this->agendaDiaRepo->configDia($idEmpresa, $idServico, $diaSemana) ?? [];

        $capacidadeBloco = (int)($regras['vagas_por_hora'] ?? 2);
        $isDentista = $idServico === (int)AppConfig::servicos()['dentista'];

        $step = 30;
        if (!empty($regras['horarios_liberados'])) {
            $step = (int)($regras['duracao_atendimento'] ?? 30);
            $candidatos = array_map('trim', explode(',', (string)$regras['horarios_liberados']));
        } else {
            $step = (int)($cfg['tempo_agendamento'] ?? 30);
            $possM = array_slice(
                $this->slots->gerarSlotsDia($dataISO, $cfg['abertura_manha'] ?? null, $cfg['fechamento_manha'] ?? null, $step),
                0,
                6
            );
            $possT = array_slice(
                $this->slots->gerarSlotsDia($dataISO, $cfg['abertura_tarde'] ?? null, $cfg['fechamento_tarde'] ?? null, $step),
                0,
                6
            );
            $candidatos = array_merge($possM, $possT);
        }

        $ocupados = $this->agendaRepo->horariosOcupados($idEmpresa, $idServico, $dataISO);
        $livres = [];

        foreach ($candidatos as $hora) {
            if (in_array($hora, $ocupados, true)) {
                continue;
            }
            if ($isDentista && !$this->blocoAceitaAgendamento($idEmpresa, $idServico, $dataISO, $hora, $capacidadeBloco)) {
                continue;
            }
            $livres[] = $hora;
        }

        if ($livres === []) {
            throw new \RuntimeException('SEM_HORARIOS');
        }

        return [
            'empresa'           => $idEmpresa,
            'servico'           => $idServico,
            'data'              => $dataISO,
            'horarios'          => array_values($livres),
            'tempo_agendamento' => $step,
        ];
    }

    private function diaDentistaTemVaga(int $emp, int $serv, string $data, array $regras, string $diaEn): bool
    {
        $limiteDia = $this->rules->getLimiteDiaSemana(new \DateTime($data), $regras);
        if ($limiteDia <= 0 || $this->rules->isLimiteAtingido($serv, $emp, $data, $limiteDia)) {
            return false;
        }

        $cfg = $this->agendaDiaRepo->configDia($emp, $serv, $diaEn);
        if (!$cfg) {
            return false;
        }

        try {
            $this->horariosLivres($serv, $emp, $data);
            return true;
        } catch (\RuntimeException) {
            return false;
        }
    }

    private function blocoAceitaAgendamento(int $empresa, int $servico, string $dataISO, string $hora, int $capacidade): bool
    {
        $bloco = SlotService::intervaloBloco($dataISO, $hora);
        $total = $this->agendaRepo->countNoBloco($empresa, $servico, $bloco['inicio'], $bloco['fim']);
        if ($total >= $capacidade) {
            return false;
        }
        return true;
    }

    /**
     * @return array{disponivel: bool, vagas: int}
     */
    private function resumoTardeDia(int $idServico, int $idEmpresa, string $dataISO, array $regras, string $diaEn, int $dow): array
    {
        $cfg = $this->agendaDiaRepo->configDia($idEmpresa, $idServico, $diaEn);
        if (!$cfg) {
            return ['disponivel' => false, 'vagas' => 0];
        }

        if (!$this->mostrarTardePermitida($regras, $dow)) {
            return ['disponivel' => false, 'vagas' => 0];
        }

        $dt = new \DateTime($dataISO);
        $limiteDia = $this->rules->getLimiteDiaSemana($dt, $regras);
        if ($limiteDia <= 0 || $this->rules->isLimiteAtingido($idServico, $idEmpresa, $dataISO, $limiteDia)) {
            return ['disponivel' => false, 'vagas' => 0];
        }

        $step = (int)($cfg['tempo_agendamento'] ?? 30);
        $slotsTarde = $this->slots->gerarSlotsDia(
            $dataISO,
            $cfg['abertura_tarde'] ?? null,
            $cfg['fechamento_tarde'] ?? null,
            $step
        );

        if ($slotsTarde === []) {
            return ['disponivel' => false, 'vagas' => 0];
        }

        $ocupados = $this->agendaRepo->horariosOcupados($idEmpresa, $idServico, $dataISO);
        $vagas = TurnoHelper::contarLivres($slotsTarde, $ocupados);

        return [
            'disponivel' => $vagas > 0,
            'vagas' => $vagas,
        ];
    }

    private function mostrarTardePermitida(array $regras, int $dow): bool
    {
        $map = [
            1 => 'mostrar_tarde_seg',
            2 => 'mostrar_tarde_ter',
            3 => 'mostrar_tarde_qua',
            4 => 'mostrar_tarde_qui',
            5 => 'mostrar_tarde_sex',
        ];

        if (!isset($map[$dow])) {
            return false;
        }

        $field = $map[$dow];
        if (!array_key_exists($field, $regras)) {
            return false;
        }

        return (int)$regras[$field] === 1;
    }
}
