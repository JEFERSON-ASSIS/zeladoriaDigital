<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Infrastructure\Database;

final class ProgramaRepository
{
    /**
     * @return array{doc: string, doc_sem_zero: string, doc_like: string}
     */
    public static function variantesDocumento(string $doc): array
    {
        $docSemZero = ltrim($doc, '0');
        $docSemZero = $docSemZero === '' ? $doc : $docSemZero;

        return [
            'doc'          => $doc,
            'doc_sem_zero' => $docSemZero,
            'doc_like'     => '%' . $docSemZero . '%',
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listarPorDocumento(string $doc, int $empresa): array
    {
        $v = self::variantesDocumento($doc);
        $c = Database::connection();

        $sql = "SELECT a.id,
                       a.cpf_cns,
                       a.nome,
                       a.telefone,
                       a.setor,
                       a.data_atendimento,
                       a.programa_id,
                       a.empresa_id,
                       a.status,
                       COALESCE(ps.nome_servico, 'Programa de Saude') AS nome_servico,
                       COALESCE(ps.profissional, '') AS profissional
                FROM agendamentos_programas a
                LEFT JOIN programas_servicos ps ON ps.id = a.programa_id
                WHERE a.empresa_id = ?
                  AND (
                      REPLACE(REPLACE(REPLACE(REPLACE(a.cpf_cns, '.', ''), '-', ''), ' ', ''), '/', '') = ?
                      OR REPLACE(REPLACE(REPLACE(REPLACE(a.cpf_cns, '.', ''), '-', ''), ' ', ''), '/', '') = ?
                      OR LPAD(REPLACE(REPLACE(REPLACE(REPLACE(a.cpf_cns, '.', ''), '-', ''), ' ', ''), '/', ''), 11, '0') = ?
                  )
                ORDER BY a.data_atendimento ASC, a.id ASC";

        $st = $c->prepare($sql);
        if (!$st) {
            return [];
        }

        $st->bind_param('isss', $empresa, $v['doc'], $v['doc_sem_zero'], $v['doc']);
        $st->execute();
        $res = $st->get_result();

        $rows = [];
        while ($row = $res->fetch_assoc()) {
            $rows[] = $row;
        }
        $st->close();

        return $rows;
    }

    /**
     * @return array<string, int|string>
     */
    public function diagnosticoDocumento(string $doc, int $empresa): array
    {
        $v = self::variantesDocumento($doc);
        $c = Database::connection();

        $diagnostico = [
            'documento'                              => $doc,
            'documento_sem_zero'                     => $v['doc_sem_zero'],
            'empresa'                                => $empresa,
            'match_documento_qualquer_empresa'       => 0,
            'match_documento_empresa'                => 0,
            'match_documento_empresa_cancelado'      => 0,
        ];

        $sqlDiag = "SELECT
                        COUNT(*) AS total_qualquer_empresa,
                        SUM(CASE WHEN empresa_id = ? THEN 1 ELSE 0 END) AS total_empresa,
                        SUM(CASE WHEN empresa_id = ? AND LOWER(TRIM(COALESCE(status, ''))) IN ('cancelado', 'cancelada', 'cancelled') THEN 1 ELSE 0 END) AS total_cancelado
                    FROM agendamentos_programas
                    WHERE REPLACE(REPLACE(REPLACE(REPLACE(cpf_cns, '.', ''), '-', ''), ' ', ''), '/', '') = ?
                       OR REPLACE(REPLACE(REPLACE(REPLACE(cpf_cns, '.', ''), '-', ''), ' ', ''), '/', '') = ?
                       OR LPAD(REPLACE(REPLACE(REPLACE(REPLACE(cpf_cns, '.', ''), '-', ''), ' ', ''), '/', ''), 11, '0') = ?
                       OR REPLACE(REPLACE(REPLACE(REPLACE(cpf_cns, '.', ''), '-', ''), ' ', ''), '/', '') LIKE ?";

        $st = $c->prepare($sqlDiag);
        if (!$st) {
            return $diagnostico;
        }

        $st->bind_param(
            'iissss',
            $empresa,
            $empresa,
            $v['doc'],
            $v['doc_sem_zero'],
            $v['doc'],
            $v['doc_like'],
        );
        $st->execute();
        $row = $st->get_result()->fetch_assoc() ?: [];
        $st->close();

        $diagnostico['match_documento_qualquer_empresa'] = (int)($row['total_qualquer_empresa'] ?? 0);
        $diagnostico['match_documento_empresa'] = (int)($row['total_empresa'] ?? 0);
        $diagnostico['match_documento_empresa_cancelado'] = (int)($row['total_cancelado'] ?? 0);

        return $diagnostico;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $id, int $empresa): ?array
    {
        $c = Database::connection();
        $sql = 'SELECT id, programa_id, cpf_cns, status
                FROM agendamentos_programas
                WHERE id = ? AND empresa_id = ?
                LIMIT 1';
        $st = $c->prepare($sql);
        if (!$st) {
            return null;
        }

        $st->bind_param('ii', $id, $empresa);
        $st->execute();
        $row = $st->get_result()->fetch_assoc();
        $st->close();

        return $row ?: null;
    }

    public function excluir(int $id, int $empresa): int
    {
        $c = Database::connection();
        $sql = 'DELETE FROM agendamentos_programas
                WHERE id = ? AND empresa_id = ?
                LIMIT 1';
        $st = $c->prepare($sql);
        if (!$st) {
            return -1;
        }

        $st->bind_param('ii', $id, $empresa);
        $st->execute();
        $affected = $st->affected_rows;
        $st->close();

        return $affected;
    }
}
