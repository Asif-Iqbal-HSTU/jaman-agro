<?php

namespace App\Enums;

enum DeliveryMode: string
{
    case Supplier = 'supplier';
    case FactoryVehicle = 'factory_vehicle';

    /**
     * Get the translated, human readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Supplier => __('Brought by the supplier'),
            self::FactoryVehicle => __('Collected by a factory vehicle'),
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
