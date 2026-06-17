<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Infrastructure\Database;

final class ServicoRepository
{
    /** @return array<string, mixed>|null */
    public function findRules(int $idServico, int $idEmpresa): ?array
    {
        $c = Database::connection();
        $sql = 'SELECT * FROM servico WHERE id = ? AND idempresa = ? LIMIT 1';
        $stmt = $c->prepare($sql);
        $stmt->bind_param('ii', $idServico, $idEmpresa);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }
}
