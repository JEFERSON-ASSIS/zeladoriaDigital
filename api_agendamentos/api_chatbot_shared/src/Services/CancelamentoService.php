<?php
declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\AppConfig;
use App\Infrastructure\Database;
use App\Repositories\AgendamentoRepository;

final class CancelamentoService
{
    public function __construct(
        private AgendamentoRepository $repo = new AgendamentoRepository(),
    ) {
    }

    /**
     * @return array{status: string, message: string}
     */
    public function cancelar(int $id, ?int $empresa = null): array
    {
        $empresa = $empresa ?? AppConfig::empresaId();
        $soft = (bool)AppConfig::get('cancelamento_soft', true);

        $dados = $this->repo->findById($id, $empresa);
        if (!$dados) {
            return ['status' => 'not_found', 'message' => 'Agendamento não encontrado.'];
        }

        if (!$this->repo->cancelar($id, $empresa, $soft)) {
            return ['status' => 'error', 'message' => 'Não foi possível cancelar o agendamento.'];
        }

        $this->registrarLog((int)$dados['servico'], $empresa, (string)$dados['cpf'], $id, $soft);

        return [
            'status'  => $soft ? 'cancelled' : 'deleted',
            'message' => 'Cancelado com sucesso.',
            'id'      => $id,
        ];
    }

    private function registrarLog(int $servico, int $empresa, string $cpf, int $id, bool $soft): void
    {
        $c = Database::connection();
        $tipo = $soft ? 'cancelamento_soft' : 'cancelamento_delete';
        $msg = "Agendamento ID $id cancelado via API Chatbot PSF1.";
        $sql = 'INSERT INTO logs_robo (servico_id, empresa_id, cpf, tipo, mensagem) VALUES (?, ?, ?, ?, ?)';
        $st = $c->prepare($sql);
        if ($st) {
            $st->bind_param('iisss', $servico, $empresa, $cpf, $tipo, $msg);
            $st->execute();
            $st->close();
        }
    }
}
