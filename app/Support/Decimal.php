<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Exact decimal arithmetic for weights and money, so totals never drift
 * the way floating point numbers do. Results are numeric strings.
 */
final class Decimal
{
    /**
     * Add numbers together.
     *
     * @return numeric-string
     */
    public static function add(string|int|float|null ...$values): string
    {
        $sum = '0';

        foreach ($values as $value) {
            $sum = bcadd($sum, self::normalize($value), 4);
        }

        return self::round($sum);
    }

    /**
     * Subtract $b from $a.
     *
     * @return numeric-string
     */
    public static function sub(string|int|float|null $a, string|int|float|null $b): string
    {
        return self::round(bcsub(self::normalize($a), self::normalize($b), 4));
    }

    /**
     * Multiply two numbers, rounding the result half away from zero.
     *
     * @return numeric-string
     */
    public static function mul(string|int|float|null $a, string|int|float|null $b, int $scale = 2): string
    {
        return self::round(bcmul(self::normalize($a), self::normalize($b), $scale + 4), $scale);
    }

    /**
     * Divide $a by $b, rounding half away from zero.
     *
     * @return numeric-string
     */
    public static function div(string|int|float|null $a, string|int|float|null $b, int $scale = 2): string
    {
        return self::round(bcdiv(self::normalize($a), self::normalize($b), $scale + 4), $scale);
    }

    /**
     * Take a percentage of a number.
     *
     * @return numeric-string
     */
    public static function percent(string|int|float|null $value, string|int|float|null $percent): string
    {
        return self::round(bcdiv(bcmul(self::normalize($value), self::normalize($percent), 6), '100', 6));
    }

    /**
     * Compare two numbers: -1, 0 or 1.
     */
    public static function compare(string|int|float|null $a, string|int|float|null $b): int
    {
        return bccomp(self::normalize($a), self::normalize($b), 2);
    }

    /**
     * Round half away from zero to the given scale.
     *
     * @param  numeric-string  $value
     * @return numeric-string
     */
    public static function round(string $value, int $scale = 2): string
    {
        // Half of the last kept digit, e.g. 0.005 for two decimals.
        $half = bcdiv('5', bcpow('10', (string) ($scale + 1)), $scale + 1);

        return str_starts_with($value, '-')
            ? bcsub($value, $half, $scale)
            : bcadd($value, $half, $scale);
    }

    /**
     * Turn any accepted input into a numeric string bcmath understands.
     *
     * @return numeric-string
     */
    private static function normalize(string|int|float|null $value): string
    {
        if ($value === null || $value === '') {
            return '0';
        }

        $value = is_float($value) ? number_format($value, 6, '.', '') : (string) $value;

        if (! is_numeric($value)) {
            throw new InvalidArgumentException("[{$value}] is not a number.");
        }

        return $value;
    }
}
