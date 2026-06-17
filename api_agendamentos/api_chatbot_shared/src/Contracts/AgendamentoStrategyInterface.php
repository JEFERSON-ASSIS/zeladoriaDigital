<?php
declare(strict_types=1);

namespace App\Contracts;

interface AgendamentoStrategyInterface
{
  /**
   * @param array<string, mixed> $input
   * @return array<string, mixed>
   */
    public function agendar(array $input): array;

    public function supports(int $servicoId): bool;
}
