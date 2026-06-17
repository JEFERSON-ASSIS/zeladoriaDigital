<?php
declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\Database;
use App\Repositories\AgendamentoRepository;
use App\Repositories\ServicoRepository;

final class CoreRulesService
{
    public function __construct(
        private ServicoRepository $servicoRepo = new ServicoRepository(),
        private AgendamentoRepository $agendaRepo = new AgendamentoRepository(),
    ) {
    }

    /** @return array<string, mixed>|null */
    public function getRules(int $idServico, int $idEmpresa): ?array
    {
        return $this->servicoRepo->findRules($idServico, $idEmpresa);
    }

    public function isDataBloqueada(int $idServico, int $idEmpresa, string $dataISO, array $rules): bool
    {
        $bloqueiosFixos = [
            '2025-12-22', '2025-12-23', '2025-12-24', '2025-12-25', '2025-12-26',
            '2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02',
            '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07',
            '2026-01-08', '2026-01-09',
        ];
        if (in_array($dataISO, $bloqueiosFixos, true)) {
            return true;
        }

        if (!empty($rules['datas_bloqueadas'])) {
            $datasBanco = preg_split('/[,\s;]+/', (string)$rules['datas_bloqueadas'], -1, PREG_SPLIT_NO_EMPTY);
            foreach ($datasBanco as $d) {
                $d = trim($d);
                $norm = $d;
                if (strpos($d, '/') !== false) {
                    $p = explode('/', $d);
                    if (count($p) === 3) {
                        $norm = sprintf('%04d-%02d-%02d', (int)$p[2], (int)$p[1], (int)$p[0]);
                    }
                }
                if ($norm === $dataISO) {
                    return true;
                }
            }
        }

        return $this->agendaRepo->temBloqueioGrade($idEmpresa, $idServico, $dataISO);
    }

    public function getLimiteDiaSemana(\DateTime $data, array $rules): int
    {
        $dow = (int)$data->format('w');
        $map = [
            1 => 'limite_seg', 2 => 'limite_ter', 3 => 'limite_qua',
            4 => 'limite_qui', 5 => 'limite_sex', 6 => 'limite_sab', 0 => 'limite_dom',
        ];
        if (isset($map[$dow])) {
            $field = $map[$dow];
            if (isset($rules[$field]) && $rules[$field] !== null) {
                return (int)$rules[$field];
            }
        }
        return 0;
    }

    public function isLimiteAtingido(int $idServico, int $idEmpresa, string $dataISO, int $limite): bool
    {
        if ($limite >= 999) {
            return false;
        }
        if ($limite <= 0) {
            return true;
        }
        return $this->agendaRepo->countAtivosDia($idEmpresa, $idServico, $dataISO) >= $limite;
    }

    public function syncCliente(array $dados): void
    {
        $cpfLimpo = preg_replace('/\D/', '', (string)($dados['cpf'] ?? ''));
        if (strlen($cpfLimpo) < 11) {
            return;
        }

        $nome = trim((string)($dados['nome'] ?? ''));
        $setor = trim((string)($dados['setor'] ?? ''));
        $telefone = trim((string)($dados['telefone'] ?? ''));
        $c = Database::connection();

        $sql = "SELECT id FROM clientes
                WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ? LIMIT 1";
        $stmt = $c->prepare($sql);
        $stmt->bind_param('s', $cpfLimpo);
        $stmt->execute();
        $existente = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($existente) {
            $sqlUp = 'UPDATE clientes SET nome = ?, setor = ?, telefone = ? WHERE id = ?';
            $stUp = $c->prepare($sqlUp);
            $stUp->bind_param('sssi', $nome, $setor, $telefone, $existente['id']);
            $stUp->execute();
            $stUp->close();
        } else {
            $sqlIns = 'INSERT INTO clientes (nome, setor, telefone, cpf) VALUES (?, ?, ?, ?)';
            $stIns = $c->prepare($sqlIns);
            $stIns->bind_param('ssss', $nome, $setor, $telefone, $cpfLimpo);
            $stIns->execute();
            $stIns->close();
        }
    }
}
