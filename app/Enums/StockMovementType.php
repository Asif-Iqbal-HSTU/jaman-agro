<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Production = 'production';
    case Adjustment = 'adjustment';
    case Auction = 'auction';
    case Retail = 'retail';

    /**
     * Get the translated, human readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Production => __('Production'),
            self::Adjustment => __('Adjustment'),
            self::Auction => __('Auction'),
            self::Retail => __('Retail sale'),
        };
    }
}
