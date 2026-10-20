<?php

namespace App\Models;

use App\Concerns\RecordsActivity;
use App\Support\Decimal;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/**
 * One grade on a retail sale memo.
 *
 * @property int $id
 * @property int $retail_sale_id
 * @property int $tea_grade_id
 * @property string $kg
 * @property string $rate
 * @property string $amount
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['retail_sale_id', 'tea_grade_id', 'kg', 'rate'])]
class RetailSaleItem extends Model
{
    use RecordsActivity;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'kg' => 'decimal:2',
            'rate' => 'decimal:2',
            'amount' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saving(fn (RetailSaleItem $item) => $item->amount = Decimal::mul($item->kg, $item->rate));
    }

    /**
     * @return BelongsTo<RetailSale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(RetailSale::class, 'retail_sale_id');
    }

    /**
     * @return BelongsTo<TeaGrade, $this>
     */
    public function grade(): BelongsTo
    {
        return $this->belongsTo(TeaGrade::class, 'tea_grade_id');
    }

    /**
     * The line in the stock ledger that took this tea out of stock.
     *
     * @return MorphOne<StockMovement, $this>
     */
    public function stockMovement(): MorphOne
    {
        return $this->morphOne(StockMovement::class, 'source');
    }
}
