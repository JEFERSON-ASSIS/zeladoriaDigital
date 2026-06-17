<?php
declare(strict_types=1);

namespace App\Support;

final class DateHelper
{
    public static function toIso(string $dataBrOuISO): string
    {
        $dataBrOuISO = trim($dataBrOuISO);
        if (strpos($dataBrOuISO, '/') !== false) {
            $p = explode('/', $dataBrOuISO);
            if (count($p) !== 3) {
                throw new \InvalidArgumentException('Data inválida. Use dd/mm/aaaa ou aaaa-mm-dd.');
            }
            $iso = sprintf('%04d-%02d-%02d', (int)$p[2], (int)$p[1], (int)$p[0]);
        } else {
            $iso = $dataBrOuISO;
        }

        $dt = \DateTime::createFromFormat('Y-m-d', $iso);
        if (!$dt || $dt->format('Y-m-d') !== $iso) {
            throw new \InvalidArgumentException('Data inválida.');
        }
        return $iso;
    }

    public static function toBr(string $iso): string
    {
        $dt = new \DateTime($iso);
        return $dt->format('d/m/Y');
    }

    /** @return list<string> */
    public static function diasPt(): array
    {
        return ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    }

    /** @return array<int, string> */
    public static function mapDiaIngles(): array
    {
        return [
            0 => 'sunday', 1 => 'monday', 2 => 'tuesday', 3 => 'wednesday',
            4 => 'thursday', 5 => 'friday', 6 => 'saturday',
        ];
    }
}
