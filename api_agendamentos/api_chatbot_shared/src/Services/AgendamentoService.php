<?php
declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\AppConfig;
use App\Repositories\AgendamentoRepository;
use App\Strategies\DentistaStrategy;
use App\Strategies\EnfermeiraStrategy;
use App\Strategies\MedicaStrategy;
use App\Support\CpfHelper;

final class AgendamentoService
{
    /** @var list<object> */
    private array $strategies;
    private AgendamentoRepository $agendamentos;

    public function __construct()
    {
        $this->agendamentos = new AgendamentoRepository();
        $this->strategies = [
            new MedicaStrategy(),
            new DentistaStrategy(),
            new EnfermeiraStrategy(),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function criar(array $input): array
    {
        $req = ['nome', 'telefone', 'servico', 'empresa', 'cpf', 'data'];
        foreach ($req as $f) {
            if (empty($input[$f])) {
                throw new \InvalidArgumentException("Campo obrigatório ausente: $f");
            }
        }

        $idServico = (int)$input['servico'];
        $cpf = CpfHelper::normalize((string)$input['cpf']);
        if (!CpfHelper::isValid($cpf)) {
            throw new \InvalidArgumentException('CPF inválido.');
        }
        $input['cpf'] = $cpf;

        $servicosPermitidos = AppConfig::servicosAtivos();
        if (!in_array($idServico, $servicosPermitidos, true)) {
            throw new \InvalidArgumentException(
                'Serviço não permitido para ' . AppConfig::unidade() . '.'
            );
        }

        $idDentista = (int)(AppConfig::servicos()['dentista'] ?? 0);
        if ($idDentista > 0 && $idServico === $idDentista && empty($input['hora'])) {
            throw new \InvalidArgumentException('Campo hora é obrigatório para dentista.');
        }

        $idEmpresa = (int)$input['empresa'];
        $trava = $this->agendamentos->adquirirTravaCpfServico($idEmpresa, $idServico, $cpf);

        try {
            if ($this->agendamentos->existeAusentePorCpfServico($idEmpresa, $idServico, $cpf)) {
                throw new \InvalidArgumentException(
                    'Esta pessoa já possui um agendamento ativo para este serviço. '
                    . 'Cancele o agendamento atual antes de fazer outro.'
                );
            }

            foreach ($this->strategies as $strategy) {
                if ($strategy->supports($idServico)) {
                    return $strategy->agendar($input);
                }
            }

            throw new \RuntimeException('Nenhuma estratégia de agendamento para este serviço.');
        } finally {
            $this->agendamentos->liberarTrava($trava);
        }
    }
}
