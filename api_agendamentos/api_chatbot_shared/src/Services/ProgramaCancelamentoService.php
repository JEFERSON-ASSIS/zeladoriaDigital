<?php
declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\AppConfig;
use App\Infrastructure\Database;
use App\Repositories\ProgramaRepository;

final class ProgramaCancelamentoService
{
    public function __construct(
        private ProgramaRepository $repo = new ProgramaRepository(),
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function cancelar(int $id, ?int $empresa = null): array
    {
        $empresa = $empresa ?? AppConfig::empresaId();

        if ($id <= 0) {
            return ['status' => 'error', 'message' => 'ID inválido.'];
        }

        $dados = $this->repo->findById($id, $empresa);
        if (!$dados) {
            return ['status' => 'not_found', 'message' => 'Atendimento de programa não encontrado.'];
        }

        $affected = $this->repo->excluir($id, $empresa);

        if ($affected < 0) {
            return ['status' => 'error', 'message' => 'Erro ao preparar cancelamento.'];
        }

        if ($affected <= 0) {
            return [
                'status'        => 'not_updated',
                'success'       => false,
                'message'       => 'Não foi possível confirmar a exclusão no banco.',
                'table'         => 'agendamentos_programas',
                'id'            => $id,
                'affected_rows' => $affected,
            ];
        }

        $this->registrarLog(
            (int)($dados['programa_id'] ?? 0),
            $empresa,
            (string)($dados['cpf_cns'] ?? ''),
            $id,
        );

        return [
            'status'        => 'deleted',
            'success'       => true,
            'message'       => 'Cancelado com sucesso.',
            'table'         => 'agendamentos_programas',
            'id'            => $id,
            'affected_rows' => $affected,
        ];
    }

    private function registrarLog(int $programaId, int $empresa, string $cpf, int $id): void
    {
        $c = Database::connection();
        $unidade = AppConfig::unidade();
        $msg = "Atendimento de programa ID $id excluído via API Chatbot $unidade.";
        $sql = 'INSERT INTO logs_robo (servico_id, empresa_id, cpf, tipo, mensagem) VALUES (?, ?, ?, ?, ?)';
        $st = $c->prepare($sql);
        if (!$st) {
            return;
        }

        $tipo = 'cancelamento_programa';
        $st->bind_param('iisss', $programaId, $empresa, $cpf, $tipo, $msg);
        $st->execute();
        $st->close();
    }
}
