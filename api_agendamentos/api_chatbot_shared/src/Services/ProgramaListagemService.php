<?php
declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\AppConfig;
use App\Repositories\ProgramaRepository;

final class ProgramaListagemService
{
    public function __construct(
        private ProgramaRepository $repo = new ProgramaRepository(),
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function listarPorCpf(string $cpf, ?int $empresa = null): array
    {
        $doc = preg_replace('/\D/', '', $cpf);
        $idEmpresa = $empresa ?? AppConfig::empresaId();

        if ($doc === '' || strlen($doc) < 11) {
            return ['status' => 'error', 'message' => 'Documento inválido.'];
        }

        $rows = $this->repo->listarPorDocumento($doc, $idEmpresa);
        $agendamentos = array_map(
            static fn (array $row): array => self::formatarItem($row),
            $rows,
        );

        if ($agendamentos === []) {
            return [
                'status'       => 'not_found',
                'documento'    => $doc,
                'empresa'      => $idEmpresa,
                'tipo'         => 'programas',
                'agendamentos' => [],
                'message'      => 'Nenhum atendimento de programa encontrado para cancelamento.',
                'diagnostico'  => $this->repo->diagnosticoDocumento($doc, $idEmpresa),
            ];
        }

        return [
            'status'       => 'success',
            'documento'    => $doc,
            'empresa'      => $idEmpresa,
            'tipo'         => 'programas',
            'total'        => count($agendamentos),
            'agendamentos' => $agendamentos,
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private static function formatarItem(array $row): array
    {
        $ts = strtotime((string)($row['data_atendimento'] ?? ''));
        $servico = trim((string)($row['nome_servico'] ?? 'Programa de Saude'));
        $profissional = trim((string)($row['profissional'] ?? ''));
        $servicoCompleto = $profissional !== '' ? $servico . ' - ' . $profissional : $servico;

        return [
            'id'               => (int)$row['id'],
            'nome'             => $row['nome'] ?? '',
            'servico'          => $servicoCompleto,
            'servico_canonico' => self::servicoCanonico($servicoCompleto),
            'data'             => $ts !== false ? date('d/m/Y', $ts) : (string)($row['data_atendimento'] ?? '-'),
            'hora'             => '-',
            'status'           => $row['status'] ?? '',
        ];
    }

    private static function servicoCanonico(string $nome): string
    {
        $texto = mb_strtolower(trim($nome), 'UTF-8');
        $texto = strtr($texto, [
            'á' => 'a', 'à' => 'a', 'ã' => 'a', 'â' => 'a',
            'é' => 'e', 'ê' => 'e', 'í' => 'i',
            'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ú' => 'u', 'ç' => 'c',
        ]);

        if (str_contains($texto, 'medic') || str_contains($texto, 'clinico')) {
            return 'medico';
        }
        if (str_contains($texto, 'enferm')) {
            return 'enfermeiro';
        }
        if (str_contains($texto, 'dent') || str_contains($texto, 'odonto')) {
            return 'dentista';
        }

        return 'programa';
    }
}
