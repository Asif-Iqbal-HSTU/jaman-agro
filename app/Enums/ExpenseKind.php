<?php

namespace App\Enums;

enum ExpenseKind: string
{
    case Factory = 'factory';
    case Vehicle = 'vehicle';

    /**
     * Get the translated, human readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Factory => __('Factory'),
            self::Vehicle => __('Vehicle'),
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
