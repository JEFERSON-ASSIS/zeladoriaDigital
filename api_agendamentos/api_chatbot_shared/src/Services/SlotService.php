<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\AgendaRepository;

final class SlotService
{
    public function __construct(
        private AgendaRepository $agendaRepo = new AgendaRepository(),
    ) {
    }

    /**
     * @return list<string> HH:MM
     */
    public function gerarSlotsAgenda(int $empresa, int $servico, string $diaSemanaEn, array $regras): array
    {
        if (!empty($regras['horarios_liberados'])) {
            return array_map('trim', explode(',', (string)$regras['horarios_liberados']));
        }

        $cfg = $this->agendaRepo->configDia($empresa, $servico, $diaSemanaEn);
        if (!$cfg) {
            return [];
        }

        $dur = (int)($cfg['tempo_agendamento'] ?? 15);
        $slots = [];

        if (!empty($cfg['abertura_manha']) && !empty($cfg['fechamento_manha'])) {
            $slots = array_merge($slots, $this->gerarIntervalo($cfg['abertura_manha'], $cfg['fechamento_manha'], $dur));
        }
        if (!empty($cfg['abertura_tarde']) && !empty($cfg['fechamento_tarde'])) {
            $slots = array_merge($slots, $this->gerarIntervalo($cfg['abertura_tarde'], $cfg['fechamento_tarde'], $dur));
        }

        return $slots;
    }

    /**
     * Slots do dia separados por turno (manhã / tarde), alinhado à agenda_dia_semana.
     *
     * @return array{manha: list<string>, tarde: list<string>}
     */
    public function gerarSlotsPorTurno(int $empresa, int $servico, string $diaSemanaEn, array $regras): array
    {
        $cfg = $this->agendaRepo->configDia($empresa, $servico, $diaSemanaEn);
        $dur = (int)($cfg['tempo_agendamento'] ?? 15);
        if ($dur <= 0) {
            $dur = 15;
        }

        if (!empty($regras['horarios_liberados'])) {
            $liberados = array_map('trim', explode(',', (string)$regras['horarios_liberados']));
            $corte = $this->limiteInicioTarde($cfg);
            $manha = [];
            $tarde = [];
            foreach ($liberados as $h) {
                if ($h === '') {
                    continue;
                }
                if ($this->horaEManha($h, $corte)) {
                    $manha[] = $h;
                } else {
                    $tarde[] = $h;
                }
            }
            return ['manha' => $manha, 'tarde' => $tarde];
        }

        $manha = [];
        $tarde = [];
        if ($cfg) {
            if (!empty($cfg['abertura_manha']) && !empty($cfg['fechamento_manha'])) {
                $manha = $this->gerarIntervalo($cfg['abertura_manha'], $cfg['fechamento_manha'], $dur);
            }
            if (!empty($cfg['abertura_tarde']) && !empty($cfg['fechamento_tarde'])) {
                $tarde = $this->gerarIntervalo($cfg['abertura_tarde'], $cfg['fechamento_tarde'], $dur);
            }
        }

        return ['manha' => $manha, 'tarde' => $tarde];
    }

    /**
     * @param array<string, mixed>|null $cfg
     */
    private function limiteInicioTarde(?array $cfg): string
    {
        if ($cfg && !empty($cfg['abertura_tarde'])) {
            return substr((string)$cfg['abertura_tarde'], 0, 5);
        }
        if ($cfg && !empty($cfg['fechamento_manha'])) {
            return substr((string)$cfg['fechamento_manha'], 0, 5);
        }
        return '12:00';
    }

    private function horaEManha(string $hhmm, string $corteTarde): bool
    {
        return strcmp(substr($hhmm, 0, 5), $corteTarde) < 0;
    }

    /**
     * @return list<string>
     */
    public function gerarSlotsDia(string $dataISO, ?string $ini, ?string $fim, int $dur): array
    {
        if (empty($ini) || empty($fim)) {
            return [];
        }
        $slots = [];
        $inicio = strtotime("$dataISO $ini");
        $fimT = strtotime("$dataISO $fim");
        for ($t = $inicio; $t < $fimT; $t += $dur * 60) {
            $slots[] = date('H:i', $t);
        }
        return $slots;
    }

    /** @return list<string> */
    private function gerarIntervalo(string $ini, string $fim, int $durMin): array
    {
        $slots = [];
        $inicio = strtotime('2000-01-01 ' . $ini);
        $fimT = strtotime('2000-01-01 ' . $fim);
        for ($t = $inicio; $t < $fimT; $t += $durMin * 60) {
            $slots[] = date('H:i', $t);
        }
        return $slots;
    }

    public static function blocoHorario(string $horaHHMM): array
    {
        $horaBloco = substr($horaHHMM, 0, 2) . ':00:00';
        return ['inicio_suffix' => $horaBloco, 'hora_bloco' => $horaBloco];
    }

    public static function intervaloBloco(string $dataISO, string $horaHHMM): array
    {
        $horaBloco = substr($horaHHMM, 0, 2) . ':00:00';
        $inicio = "{$dataISO} {$horaBloco}";
        $dt = \DateTime::createFromFormat('Y-m-d H:i:s', $inicio);
        if (!$dt) {
            throw new \InvalidArgumentException('Bloco de horário inválido.');
        }
        $dt->modify('+59 minutes +59 seconds');
        return ['inicio' => $inicio, 'fim' => $dt->format('Y-m-d H:i:s')];
    }
}
