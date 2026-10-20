<?php

namespace App\Enums;

enum DeductionType: string
{
    case Kg = 'kg';
    case Percent = 'percent';

    /**
     * Get the translated, human readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Kg => __('kg'),
            self::Percent => __('%'),
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $case) => ['value' => $case->value, 'label' => $case->label()], self::cases());
    }
}
