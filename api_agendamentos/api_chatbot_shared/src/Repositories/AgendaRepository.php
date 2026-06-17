<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Infrastructure\Database;

final class AgendaRepository
{
    /** @return array<string, mixed>|null */
    public function configDia(int $empresa, int $servico, string $diaSemanaEn): ?array
    {
        $c = Database::connection();
        $sql = 'SELECT abertura_manha, fechamento_manha, abertura_tarde, fechamento_tarde, tempo_agendamento
                FROM agenda_dia_semana
                WHERE id_empresa = ? AND id_servico = ? AND dia_semana = ? LIMIT 1';
        $stmt = $c->prepare($sql);
        $stmt->bind_param('iis', $empresa, $servico, $diaSemanaEn);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }
}
