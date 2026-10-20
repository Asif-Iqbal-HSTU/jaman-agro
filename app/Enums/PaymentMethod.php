<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Bank = 'bank';
    case MobileBanking = 'mobile_banking';

    /**
     * Get the translated, human readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Cash => __('Cash'),
            self::Bank => __('Bank'),
            self::MobileBanking => __('Mobile banking'),
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
