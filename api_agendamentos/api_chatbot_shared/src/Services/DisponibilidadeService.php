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

        $idDentista = (int)(AppConfig::servicos()['dentista'] ?? 0);
        $idMedico = (int)(AppConfig::servicos()['medico'] ?? 0);
        $dentista = $idDentista > 0 && $idServico === $idDentista;
        $medico = $idServico === $idMedico;
        $ignoraFimSemanaMedico = (bool)AppConfig::get('medico_ignora_fim_semana', true);

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

            if ($medico && $ignoraFimSemanaMedico && ($idx === 0 || $idx === 6)) {
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
                ? $this->diaTemVagaPorHorarios($idEmpresa, $idServico, $dataSql, $regras, $mapDia[$idx])
                : !$this->rules->isLimiteAtingido($idServico, $idEmpresa, $dataSql, $limiteDia);

            if ($temVaga) {
                $total = $this->agendaRepo->countAtivosDia($idEmpresa, $idServico, $dataSql);
                $dias[] = $cursor->format('d/m/Y') . ' ' . $diasPt[$idx] . '-feira';
                $vagas[] = max(0, $limiteDia - $total);

                if ($medico) {
                    $tardePermitida = $this->mostrarTardePermitida($regras, $idx);
                    if ($tardePermitida) {
                        $exibirCamposTarde = true;
                    }
                    if ($tardePermitida) {
                        try {
                            $turnos = $this->turnosNoDia($idServico, $idEmpresa, $dataSql);
                            $turnoTarde[] = (bool)($turnos['turnos_tarde'] ?? false);
                            $vagasTarde[] = (int)($turnos['turnos']['tarde']['vagas'] ?? 0);
                        } catch (\Throwable) {
                            $turnoTarde[] = false;
                            $vagasTarde[] = 0;
                        }
                    } else {
                        $turnoTarde[] = false;
                        $vagasTarde[] = 0;
                    }
                }
            }

            $cursor->modify('+1 day');
            $tentadas++;
            if ($dentista && $cursor > (new \DateTime('today'))->modify('+90 days')) {
                break;
            }
        }

        $out = [
            'dataBase' => (new \DateTime('today'))->format('d/m/Y'),
            'dias'     => $dias,
            'vagas'    => $vagas,
        ];

        if ($medico && $exibirCamposTarde) {
            $out['turno_tarde'] = $turnoTarde;
            $out['vagas_tarde'] = $vagasTarde;
        }

        if ($dentista) {
            $out['falar'] = 'Mostre os dias disponíveis. Quando o usuário escolher um dia, consulte os horários livres.';
        }

        return $out;
    }

    /**
     * Dias com vaga real de horário — fluxo médico escolhendo hora (como dentista).
     *
     * @return array{
     *   dataBase: string,
     *   dias: list<string>,
     *   vagas: list<int>,
     *   turno_tarde?: list<bool>,
     *   vagas_tarde?: list<int>,
     *   falar: string
     * }
     */
    public function diasDisponiveisMedico(int $idEmpresa): array
    {
        $idServico = (int)(AppConfig::servicos()['medico'] ?? 0);
        if ($idServico <= 0) {
            throw new \RuntimeException('MEDICO_NAO_CONFIGURADO');
        }

        $regras = $this->rules->getRules($idServico, $idEmpresa);
        if (!$regras) {
            throw new \RuntimeException('SERVICO_NAO_ENCONTRADO');
        }

        $ignoraFimSemanaMedico = (bool)AppConfig::get('medico_ignora_fim_semana', true);
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
        $limiteBusca = (new \DateTime('today'))->modify('+90 days');

        while (count($dias) < $maxResultados && $tentadas < 90) {
            $idx = (int)$cursor->format('w');
            $dataSql = $cursor->format('Y-m-d');

            if ($ignoraFimSemanaMedico && ($idx === 0 || $idx === 6)) {
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

            if ($this->diaTemVagaPorHorarios($idEmpresa, $idServico, $dataSql, $regras, $mapDia[$idx])) {
                $total = $this->agendaRepo->countAtivosDia($idEmpresa, $idServico, $dataSql);
                $dias[] = $cursor->format('d/m/Y') . ' ' . $diasPt[$idx] . '-feira';
                $vagas[] = max(0, $limiteDia - $total);

                $turnoTardeDisponivel = false;
                $vagasTardeDia = 0;
                $tardePermitida = $this->mostrarTardePermitida($regras, $idx);
                if ($tardePermitida) {
                    $exibirCamposTarde = true;
                }
                try {
                    $resumoTurnos = $this->resumoTurnosMedicoDia($idServico, $idEmpresa, $dataSql, $regras);
                    $turnoTardeDisponivel = (bool)($resumoTurnos['turnos']['tarde']['disponivel'] ?? false);
                    $vagasTardeDia = (int)($resumoTurnos['turnos']['tarde']['vagas'] ?? 0);
                } catch (\RuntimeException) {
                    $turnoTardeDisponivel = false;
                    $vagasTardeDia = 0;
                }

                $turnoTardeEfetivo = $tardePermitida && $turnoTardeDisponivel;
                $vagasTardeEfetiva = $tardePermitida ? $vagasTardeDia : 0;

                $turnoTarde[] = $turnoTardeEfetivo;
                $vagasTarde[] = $vagasTardeEfetiva;
            }

            $cursor->modify('+1 day');
            $tentadas++;
            if ($cursor > $limiteBusca) {
                break;
            }
        }

        $out = [
            'dataBase'    => (new \DateTime('today'))->format('d/m/Y'),
            'dias'        => $dias,
            'vagas'       => $vagas,
            'falar'       => 'Mostre os dias disponíveis. Quando o usuário escolher um dia, consulte horarios_medico.php.',
        ];

        if ($exibirCamposTarde) {
            $out['turno_tarde'] = $turnoTarde;
            $out['vagas_tarde'] = $vagasTarde;
        }

        return $out;
    }

    /**
     * Horários livres do serviço médico da unidade.
     *
     * @return array{empresa: int, servico: int, data: string, horarios: list<string>, tempo_agendamento: int}
     */
    public function horariosLivresMedico(int $idEmpresa, string $dataISO): array
    {
        $idServico = (int)(AppConfig::servicos()['medico'] ?? 0);
        if ($idServico <= 0) {
            throw new \RuntimeException('MEDICO_NAO_CONFIGURADO');
        }

        $result = $this->horariosLivres($idServico, $idEmpresa, $dataISO);
        $regras = $this->rules->getRules($idServico, $idEmpresa);
        if (!$regras) {
            throw new \RuntimeException('SERVICO_NAO_ENCONTRADO');
        }

        $dt = new \DateTime($dataISO);
        $dow = (int)$dt->format('w');
        if (!$this->mostrarTardePermitida($regras, $dow)) {
            $diaSemanaEn = strtolower($dt->format('l'));
            $cfg = $this->agendaDiaRepo->configDia($idEmpresa, $idServico, $diaSemanaEn) ?? [];

            $corteTarde = '12:00';
            if (!empty($cfg['abertura_tarde'])) {
                $corteTarde = substr((string)$cfg['abertura_tarde'], 0, 5);
            } elseif (!empty($cfg['fechamento_manha'])) {
                $corteTarde = substr((string)$cfg['fechamento_manha'], 0, 5);
            }

            $result['horarios'] = array_values(array_filter(
                $result['horarios'] ?? [],
                static fn(string $h): bool => strcmp(substr($h, 0, 5), $corteTarde) < 0
            ));

            if (($result['horarios'] ?? []) === []) {
                throw new \RuntimeException('SEM_HORARIOS');
            }
        }

        return $result;
    }

    /**
     * Turnos (manhã / tarde) com vaga no dia — uso principal: consulta médica.
     *
     * @return array{
     *   data: string,
     *   dataISO: string,
     *   turnos_manha: bool,
     *   turnos_tarde: bool,
     *   ambos_turnos: bool,
     *   cenario_turno: 'ambos'|'manha'|'tarde',
     *   turnos: array{
     *     manha: array{disponivel: bool, vagas: int, label: string},
     *     tarde: array{disponivel: bool, vagas: int, label: string}
     *   },
     *   perguntar_turno: bool,
     *   turno_sugerido: string|null,
     *   falar: string
     * }
     */
    public function turnosNoDia(int $idServico, int $idEmpresa, string $dataISO): array
    {
        $idMedico = (int)(AppConfig::servicos()['medico'] ?? 0);
        if ($idMedico <= 0 || $idServico !== $idMedico) {
            throw new \InvalidArgumentException(
                'Este endpoint é apenas para o serviço de consulta médica desta unidade.'
            );
        }

        $regras = $this->rules->getRules($idServico, $idEmpresa);
        if (!$regras) {
            throw new \RuntimeException('SERVICO_NAO_ENCONTRADO');
        }

        $resumo = $this->resumoTurnosMedicoDia($idServico, $idEmpresa, $dataISO, $regras);

        $dataBr = DateHelper::toBr($dataISO);
        if ($resumo['perguntar_turno']) {
            $falar = "No dia {$dataBr} há consulta de manhã e à tarde. Digite *1* para consulta cedo (manhã) ou *2* para à tarde.";
        } elseif ($resumo['turno_sugerido'] === 'manha') {
            $falar = "No dia {$dataBr} há vaga apenas no período da manhã. O agendamento será feito no turno da manhã.";
        } else {
            $falar = "No dia {$dataBr} há vaga apenas no período da tarde. O agendamento será feito no turno da tarde.";
        }

        return $resumo + [
            'data'  => $dataBr,
            'falar' => $falar,
        ];
    }

    /**
     * @return array{
     *   turnos_manha: bool,
     *   turnos_tarde: bool,
     *   ambos_turnos: bool,
     *   cenario_turno: 'ambos'|'manha'|'tarde',
     *   turnos: array{
     *     manha: array{disponivel: bool, vagas: int, label: string},
     *     tarde: array{disponivel: bool, vagas: int, label: string}
     *   },
     *   perguntar_turno: bool,
     *   turno_sugerido: string|null
     * }
     */
    private function resumoTurnosMedicoDia(int $idServico, int $idEmpresa, string $dataISO, array $regras): array
    {
        if ($this->rules->isDataBloqueada($idServico, $idEmpresa, $dataISO, $regras)) {
            throw new \RuntimeException('DATA_BLOQUEADA');
        }

        $dt = new \DateTime($dataISO);
        $limiteDia = $this->rules->getLimiteDiaSemana($dt, $regras);
        if ($limiteDia <= 0) {
            throw new \RuntimeException('DIA_FECHADO');
        }

        if ($this->rules->isLimiteAtingido($idServico, $idEmpresa, $dataISO, $limiteDia)) {
            throw new \RuntimeException('LIMITE_DIA_ATINGIDO');
        }

        $diaSemanaEn = strtolower($dt->format('l'));
        $porTurno = $this->slots->gerarSlotsPorTurno($idEmpresa, $idServico, $diaSemanaEn, $regras);
        if ($porTurno['manha'] === [] && $porTurno['tarde'] === []) {
            throw new \RuntimeException('SEM_AGENDA_TURNO');
        }

        $ocupados = $this->agendaRepo->horariosOcupados($idEmpresa, $idServico, $dataISO);
        $vagasManha = TurnoHelper::contarLivres($porTurno['manha'], $ocupados);
        $vagasTarde = TurnoHelper::contarLivres($porTurno['tarde'], $ocupados);

        $dow = (int)$dt->format('w');
        if (!$this->mostrarTardePermitida($regras, $dow)) {
            $vagasTarde = 0;
        }

        $manhaOk = $vagasManha > 0;
        $tardeOk = $vagasTarde > 0;

        if (!$manhaOk && !$tardeOk) {
            throw new \RuntimeException('SEM_TURNO');
        }

        $perguntar = $manhaOk && $tardeOk;
        $turnoSugerido = null;
        if ($manhaOk && !$tardeOk) {
            $turnoSugerido = 'manha';
        } elseif ($tardeOk && !$manhaOk) {
            $turnoSugerido = 'tarde';
        }

        $cenarioTurno = $perguntar ? 'ambos' : ($turnoSugerido ?? 'manha');

        return [
            'dataISO'         => $dataISO,
            'turnos_manha'    => $manhaOk,
            'turnos_tarde'    => $tardeOk,
            'ambos_turnos'    => $perguntar,
            'cenario_turno'   => $cenarioTurno,
            'turnos'          => [
                'manha' => [
                    'disponivel' => $manhaOk,
                    'vagas'      => $vagasManha,
                    'label'      => 'Consulta cedo (manhã)',
                ],
                'tarde' => [
                    'disponivel' => $tardeOk,
                    'vagas'      => $vagasTarde,
                    'label'      => 'Consulta à tarde',
                ],
            ],
            'perguntar_turno' => $perguntar,
            'turno_sugerido'  => $turnoSugerido,
        ];
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
        $limiteDia = $this->rules->getLimiteDiaSemana($dt, $regras);
        if ($limiteDia <= 0) {
            throw new \RuntimeException('DIA_FECHADO');
        }

        if ($this->rules->isLimiteAtingido($idServico, $idEmpresa, $dataISO, $limiteDia)) {
            throw new \RuntimeException('LIMITE_DIA_ATINGIDO');
        }

        $diaSemana = strtolower($dt->format('l'));
        $cfg = $this->agendaDiaRepo->configDia($idEmpresa, $idServico, $diaSemana) ?? [];

        $capacidadeBloco = (int)($regras['vagas_por_hora'] ?? 2);
        $idDentista = (int)(AppConfig::servicos()['dentista'] ?? 0);
        $isDentista = $idDentista > 0 && $idServico === $idDentista;

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

    private function diaTemVagaPorHorarios(int $emp, int $serv, string $data, array $regras, string $diaEn): bool
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
