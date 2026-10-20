<?php

namespace App\Enums;

enum WorkerPayType: string
{
    case Hourly = 'hourly';
    case Contract = 'contract';

    /**
     * Get the translated, human readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Hourly => __('Hourly'),
            self::Contract => __('Contract (piece rate)'),
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
