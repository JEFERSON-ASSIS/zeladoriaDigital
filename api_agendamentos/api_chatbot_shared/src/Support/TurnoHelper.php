<?php
declare(strict_types=1);

namespace App\Support;

final class TurnoHelper
{
    /**
     * Normaliza entrada do bot (1/2, manha, tarde).
     *
     * @return 'manha'|'tarde'|null
     */
    public static function normalize(mixed $turno): ?string
    {
        if ($turno === null || $turno === '') {
            return null;
        }

        $t = strtolower(trim((string)$turno));
        $t = str_replace('ã', 'a', $t);

        if (in_array($t, ['1', 'manha', 'cedo', 'm'], true)) {
            return 'manha';
        }
        if (in_array($t, ['2', 'tarde', 't'], true)) {
            return 'tarde';
        }

        throw new \InvalidArgumentException('Turno inválido. Use 1/manha ou 2/tarde.');
    }

    /** @param list<string> $slots HH:MM */
    public static function contarLivres(array $slots, array $ocupados): int
    {
        $n = 0;
        foreach ($slots as $slot) {
            if (!in_array($slot, $ocupados, true)) {
                $n++;
            }
        }
        return $n;
    }

    /** @param list<string> $slots @param list<string> $ocupados @return list<string> */
    public static function filtrarLivres(array $slots, array $ocupados): array
    {
        $livres = [];
        foreach ($slots as $slot) {
            if (!in_array($slot, $ocupados, true)) {
                $livres[] = $slot;
            }
        }
        return $livres;
    }
}
