<?php

namespace App\Enums;

enum PieceUnit: string
{
    case Kg = 'kg';
    case Bag = 'bag';
    case Ton = 'ton';
    case Job = 'job';

    /**
     * Get the translated, human readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Kg => __('per kg'),
            self::Bag => __('per bag'),
            self::Ton => __('per ton'),
            self::Job => __('per job'),
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
