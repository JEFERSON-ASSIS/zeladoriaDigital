<?php
declare(strict_types=1);

namespace App\Support;

final class CpfHelper
{
    /** @var list<string> */
    private const INPUT_KEYS = ['cpf', 'cns_cpf', 'CPF', 'documento', 'document', 'cns', 'CNS'];

    public static function normalize(string $cpf): string
    {
        return self::normalizeDocument($cpf);
    }

    /**
     * CPF só da URL (?cpf=). Use no Typebot quando o documento vai na query string.
     */
    public static function extractFromQueryString(): string
    {
        return self::extractFirstValidFromArray($_GET);
    }

    /**
     * Lê CPF/CNS priorizando ?cpf= na URL e ignorando placeholders do Typebot/n8n
     * ("answer value", "content", etc.) que sobrescrevem o CPF real no corpo POST.
     *
     * @param array<string, mixed> $input Request mesclado (GET + POST + JSON)
     */
    public static function extractFromInput(array $input): string
    {
        $fromUrl = self::extractFromQueryString();
        if ($fromUrl !== '') {
            return $fromUrl;
        }

        foreach ([$_POST, $input] as $source) {
            if (!is_array($source) || $source === []) {
                continue;
            }
            $doc = self::extractFirstValidFromArray($source);
            if ($doc !== '') {
                return $doc;
            }
        }
        return '';
    }

    /**
     * @param array<string, mixed> $input
     */
    private static function extractFirstValidFromArray(array $input): string
    {
        foreach (self::INPUT_KEYS as $key) {
            if (!array_key_exists($key, $input)) {
                continue;
            }
            $v = $input[$key];
            if (!is_scalar($v) || self::isIgnorableValue($v)) {
                continue;
            }
            $doc = self::normalizeDocument($v);
            if (self::isDocumentoAceito($doc)) {
                return $doc;
            }
        }
        return '';
    }

    private static function isIgnorableValue(mixed $value): bool
    {
        if (!is_scalar($value)) {
            return true;
        }
        $s = strtolower(trim((string)$value));
        if ($s === '') {
            return true;
        }
        if (in_array($s, ['content', 'answer value', 'answer', 'null', 'undefined', 'n/a', 'none'], true)) {
            return true;
        }
        if (str_contains($s, 'sample result') || str_contains($s, 'generated ⬇')) {
            return true;
        }
        if (str_starts_with($s, '{{') || str_starts_with($s, '={')) {
            return true;
        }
        return preg_replace('/\D/', '', $s) === '';
    }

    /**
     * Remove máscara; corrige zero à esquerda (n8n/JSON manda número sem o 0).
     */
    public static function normalizeDocument(mixed $doc): string
    {
        if ($doc === null || $doc === false) {
            return '';
        }

        if (is_int($doc)) {
            $digits = (string) abs($doc);
        } elseif (is_float($doc)) {
            $digits = sprintf('%.0f', abs($doc));
        } else {
            $digits = preg_replace('/\D/', '', trim((string)$doc)) ?? '';
        }

        if ($digits === '') {
            return '';
        }

        $len = strlen($digits);

        if ($len === 10) {
            return '0' . $digits;
        }

        if ($len === 11 || $len === 15) {
            return $digits;
        }

        if ($len === 14) {
            return '0' . $digits;
        }

        return $digits;
    }

    public static function isDocumentoAceito(string $doc): bool
    {
        $digits = self::normalizeDocument($doc);
        $len = strlen($digits);
        return $len === 11 || $len === 15;
    }

    public static function isValid(string $cpf): bool
    {
        $cpf = self::normalize($cpf);
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }

        for ($t = 9; $t < 11; $t++) {
            $sum = 0;
            for ($i = 0; $i < $t; $i++) {
                $sum += (int)$cpf[$i] * (($t + 1) - $i);
            }
            $digit = ((10 * $sum) % 11) % 10;
            if ((int)$cpf[$t] !== $digit) {
                return false;
            }
        }
        return true;
    }
}
