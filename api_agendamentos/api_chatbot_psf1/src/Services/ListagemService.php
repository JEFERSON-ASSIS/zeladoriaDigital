<?php
declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\AppConfig;
use App\Infrastructure\Database;

final class ListagemService
{
    /**
     * @return array<string, mixed>
     */
    public function listarPorCpf(string $cpf, ?int $empresa = null): array
    {
        $doc = preg_replace('/\D/', '', $cpf);
        $idEmpresa = $empresa ?? AppConfig::empresaId();
        $servicos = AppConfig::servicos();

        if (strlen($doc) < 11) {
            return ['status' => 'error', 'message' => 'Documento inválido.'];
        }

        $c = Database::connection();
        $sql = "SELECT a.*, s.nome AS nome_servico
                FROM agendamentos a
                LEFT JOIN servico s ON s.id = a.servico
                WHERE REPLACE(REPLACE(REPLACE(a.cpf, '.', ''), '-', ''), ' ', '') = ?
                AND a.empresa = ?
                AND LOWER(a.status_agendamento) = 'ausente'
                ORDER BY a.datetime ASC";

        $st = $c->prepare($sql);
        $st->bind_param('si', $doc, $idEmpresa);
        $st->execute();
        $res = $st->get_result();

        $agendamentos = [];
        while ($row = $res->fetch_assoc()) {
            $dt = strtotime($row['datetime']);
            $canonico = $this->servicoCanonico($row['nome_servico'] ?? '');
            $agendamentos[] = [
                'id'               => (int)$row['id'],
                'nome'             => $row['nome'],
                'servico'          => $row['nome_servico'],
                'servico_canonico' => $canonico,
                'data'             => date('d/m/Y', $dt),
                'hora'             => date('H:i', $dt),
                'status'           => $row['status_agendamento'],
            ];
        }
        $st->close();

        if ($agendamentos !== []) {
            return $this->montarRespostaAusentes($doc, $idEmpresa, $agendamentos, $servicos);
        }

        if ($this->existeCliente($doc)) {
            return [
                'status'    => 'no_ausente_cliente',
                'documento' => $doc,
                'falar'     => $this->textoLiberado($servicos),
            ];
        }

        if ($this->existeAgendamento($doc, $idEmpresa)) {
            return [
                'status'    => 'no_ausente_agendamento',
                'documento' => $doc,
                'falar'     => 'Usuário sem agendamentos ausentes. ' . $this->textoLiberado($servicos),
            ];
        }

        return [
            'status'    => 'not_found',
            'documento' => $doc,
            'message'   => 'Nenhum registro encontrado.',
        ];
    }

    /** @param list<array<string, mixed>> $agendamentos */
    private function montarRespostaAusentes(string $doc, int $idEmpresa, array $agendamentos, array $servicos): array
    {
        $porServico = ['medico' => [], 'dentista' => [], 'enfermeiro' => [], 'desconhecido' => []];
        foreach ($agendamentos as $a) {
            $porServico[$a['servico_canonico']][] = $a;
        }

        $medStatus = !empty($porServico['medico'])
            ? 'Médica: BLOQUEADA (já possui agendamento Ausente).'
            : 'Médica: LIBERADA (ID ' . $servicos['medico'] . ').';
        $denStatus = !empty($porServico['dentista'])
            ? 'Dentista: BLOQUEADO (já possui agendamento Ausente).'
            : 'Dentista: LIBERADO (ID ' . $servicos['dentista'] . ').';
        $enfStatus = !empty($porServico['enfermeiro'])
            ? 'Enfermeira: BLOQUEADA (já possui agendamento Ausente).'
            : 'Enfermeira: LIBERADA (ID ' . $servicos['enfermeiro'] . ').';

        return [
            'status'               => 'success',
            'documento'            => $doc,
            'empresa'              => $idEmpresa,
            'total'                => count($agendamentos),
            'agendamentos'         => $agendamentos,
            'bloquear_por_servico' => [
                'medico'     => !empty($porServico['medico']),
                'dentista'   => !empty($porServico['dentista']),
                'enfermeiro' => !empty($porServico['enfermeiro']),
            ],
            'ausentes_por_servico' => $porServico,
            'falar'                => "Status: $medStatus $denStatus $enfStatus",
        ];
    }

    private function existeCliente(string $doc): bool
    {
        $c = Database::connection();
        $sql = "SELECT 1 FROM clientes
                WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ? LIMIT 1";
        $st = $c->prepare($sql);
        $st->bind_param('s', $doc);
        $st->execute();
        $ok = $st->get_result()->num_rows > 0;
        $st->close();

        return $ok;
    }

    private function existeAgendamento(string $doc, int $empresa): bool
    {
        $c = Database::connection();
        $sql = "SELECT 1 FROM agendamentos
                WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ? AND empresa = ?
                LIMIT 1";
        $st = $c->prepare($sql);
        $st->bind_param('si', $doc, $empresa);
        $st->execute();
        $ok = $st->get_result()->num_rows > 0;
        $st->close();

        return $ok;
    }

    private function servicoCanonico(string $nome): string
    {
        $s = mb_strtolower(trim($nome), 'UTF-8');
        $s = strtr($s, ['á' => 'a', 'ã' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ç' => 'c']);
        if (str_contains($s, 'medic') || str_contains($s, 'clinico')) {
            return 'medico';
        }
        if (str_contains($s, 'dent') || str_contains($s, 'odonto')) {
            return 'dentista';
        }
        if (str_contains($s, 'enferm')) {
            return 'enfermeiro';
        }
        return 'desconhecido';
    }

    /** @param array<string, int> $servicos */
    private function textoLiberado(array $servicos): string
    {
        return 'Serviços liberados: Médica (ID ' . $servicos['medico']
            . '), Dentista (ID ' . $servicos['dentista']
            . '), Enfermeira (ID ' . $servicos['enfermeiro'] . ').';
    }
}
