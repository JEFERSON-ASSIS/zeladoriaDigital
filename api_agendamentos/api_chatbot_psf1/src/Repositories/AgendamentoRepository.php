<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Infrastructure\Database;

final class AgendamentoRepository
{
    private const STATUS_CANCELADOS = "('cancelado', 'cancelado usuário', 'cancelado usuario')";

    public function countAtivosDia(int $empresa, int $servico, string $dataISO): int
    {
        $c = Database::connection();
        $sql = "SELECT COUNT(*) AS total FROM agendamentos
                WHERE empresa = ? AND servico = ? AND DATE(datetime) = ?
                AND LOWER(status_agendamento) NOT IN " . self::STATUS_CANCELADOS;
        $stmt = $c->prepare($sql);
        $stmt->bind_param('iis', $empresa, $servico, $dataISO);
        $stmt->execute();
        $total = (int)($stmt->get_result()->fetch_assoc()['total'] ?? 0);
        $stmt->close();
        return $total;
    }

    /** @return list<string> HH:MM */
    public function horariosOcupados(int $empresa, int $servico, string $dataISO): array
    {
        $c = Database::connection();
        $sql = "SELECT TIME_FORMAT(datetime, '%H:%i') AS h FROM agendamentos
                WHERE empresa = ? AND servico = ? AND DATE(datetime) = ?
                AND LOWER(status_agendamento) NOT IN " . self::STATUS_CANCELADOS;
        $stmt = $c->prepare($sql);
        $stmt->bind_param('iis', $empresa, $servico, $dataISO);
        $stmt->execute();
        $rows = array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'h');
        $stmt->close();
        return $rows;
    }

    public function countNoBloco(int $empresa, int $servico, string $inicioBloco, string $fimBloco): int
    {
        $c = Database::connection();
        $sql = "SELECT COUNT(*) AS total FROM agendamentos
                WHERE empresa = ? AND servico = ?
                AND datetime BETWEEN ? AND ?
                AND LOWER(status_agendamento) NOT IN " . self::STATUS_CANCELADOS;
        $stmt = $c->prepare($sql);
        $stmt->bind_param('iiss', $empresa, $servico, $inicioBloco, $fimBloco);
        $stmt->execute();
        $total = (int)($stmt->get_result()->fetch_assoc()['total'] ?? 0);
        $stmt->close();
        return $total;
    }

    public function existeDatetime(int $empresa, int $servico, string $datetime): bool
    {
        $c = Database::connection();
        $sql = "SELECT 1 FROM agendamentos
                WHERE empresa = ? AND servico = ? AND datetime = ?
                AND LOWER(status_agendamento) NOT IN " . self::STATUS_CANCELADOS . ' LIMIT 1';
        $stmt = $c->prepare($sql);
        $stmt->bind_param('iis', $empresa, $servico, $datetime);
        $stmt->execute();
        $ok = $stmt->get_result()->num_rows > 0;
        $stmt->close();
        return $ok;
    }

    public function insert(
        string $datetime,
        string $nome,
        string $setor,
        string $telefone,
        int $servico,
        int $empresa,
        string $cpf,
        ?string $horaComparecer = null
    ): int {
        $c = Database::connection();
        if ($horaComparecer !== null) {
            $sql = "INSERT INTO agendamentos
                    (datetime, nome, setor, telefone, servico, empresa, cpf, status_agendamento, id_profissional, horaComparecer)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Ausente', ?, ?)";
            $stmt = $c->prepare($sql);
            $stmt->bind_param('ssssiisis', $datetime, $nome, $setor, $telefone, $servico, $empresa, $cpf, $servico, $horaComparecer);
        } else {
            $sql = "INSERT INTO agendamentos
                    (datetime, nome, setor, telefone, servico, empresa, cpf, status_agendamento, id_profissional)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Ausente', ?)";
            $stmt = $c->prepare($sql);
            $stmt->bind_param('ssssiisi', $datetime, $nome, $setor, $telefone, $servico, $empresa, $cpf, $servico);
        }
        if (!$stmt->execute()) {
            $err = $stmt->error;
            $stmt->close();
            throw new \RuntimeException('Erro ao inserir agendamento: ' . $err);
        }
        $id = (int)$stmt->insert_id;
        $stmt->close();
        return $id;
    }

    public function updateHoraComparecer(int $id, string $horaComparecer): void
    {
        $c = Database::connection();
        $sql = 'UPDATE agendamentos SET horaComparecer = ? WHERE id = ?';
        $stmt = $c->prepare($sql);
        $stmt->bind_param('si', $horaComparecer, $id);
        $stmt->execute();
        $stmt->close();
    }

    public function temBloqueioGrade(int $empresa, int $servico, string $dataISO): bool
    {
        $c = Database::connection();
        $sql = "SELECT 1 FROM agendamentos
                WHERE empresa = ? AND servico = ? AND DATE(datetime) = ?
                AND status_agendamento = 'Bloqueado' LIMIT 1";
        $stmt = $c->prepare($sql);
        $stmt->bind_param('iis', $empresa, $servico, $dataISO);
        $stmt->execute();
        $ok = $stmt->get_result()->num_rows > 0;
        $stmt->close();
        return $ok;
    }

    /** @return array<string, mixed>|null */
    public function findById(int $id, int $empresa): ?array
    {
        $c = Database::connection();
        $sql = 'SELECT * FROM agendamentos WHERE id = ? AND empresa = ? LIMIT 1';
        $stmt = $c->prepare($sql);
        $stmt->bind_param('ii', $id, $empresa);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    public function cancelar(int $id, int $empresa, bool $soft): bool
    {
        $c = Database::connection();
        if ($soft) {
            $sql = "UPDATE agendamentos SET status_agendamento = 'Cancelado usuário' WHERE id = ? AND empresa = ?";
            $stmt = $c->prepare($sql);
            $stmt->bind_param('ii', $id, $empresa);
            $stmt->execute();
            $ok = $stmt->affected_rows > 0;
            $stmt->close();
            return $ok;
        }
        $sql = 'DELETE FROM agendamentos WHERE id = ? AND empresa = ?';
        $stmt = $c->prepare($sql);
        $stmt->bind_param('ii', $id, $empresa);
        $stmt->execute();
        $ok = $stmt->affected_rows > 0;
        $stmt->close();
        return $ok;
    }
}
