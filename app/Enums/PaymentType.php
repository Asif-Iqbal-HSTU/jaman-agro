<?php

namespace App\Enums;

enum PaymentType: string
{
    case Advance = 'advance';
    case Payment = 'payment';

    /**
     * Get the translated, human readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Advance => __('Advance'),
            self::Payment => __('Payment'),
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
