<?php

namespace App\Models;

use App\Concerns\HasEditLock;
use App\Concerns\MarksEdited;
use App\Concerns\RecordsActivity;
use App\Support\Decimal;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * One manufacture: green leaf in, sorted made tea out.
 *
 * @property int $id
 * @property CarbonImmutable $produced_on
 * @property string $green_leaf_kg
 * @property string|null $withering_hours
 * @property int|null $fermentation_minutes
 * @property int|null $dryer_temp_c
 * @property string|null $notes
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $edited_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['produced_on', 'green_leaf_kg', 'withering_hours', 'fermentation_minutes', 'dryer_temp_c', 'notes', 'recorded_by'])]
class ProductionBatch extends Model
{
    use HasEditLock, MarksEdited, RecordsActivity;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'produced_on' => 'date:Y-m-d',
            'green_leaf_kg' => 'decimal:2',
            'withering_hours' => 'decimal:1',
            'fermentation_minutes' => 'integer',
            'dryer_temp_c' => 'integer',
            'edited_at' => 'datetime',
        ];
    }

    /**
     * Made tea as a percentage of the green leaf that went in.
     *
     * @return numeric-string|null
     */
    public static function recovery(string|int|float|null $madeTeaKg, string|int|float|null $greenLeafKg): ?string
    {
        if (Decimal::compare($greenLeafKg, 0) <= 0) {
            return null;
        }

        return Decimal::div(Decimal::mul($madeTeaKg, 100, 4), $greenLeafKg);
    }

    /**
     * @return HasMany<ProductionOutput, $this>
     */
    public function outputs(): HasMany
    {
        return $this->hasMany(ProductionOutput::class);
    }

    /**
     * @return MorphMany<StockMovement, $this>
     */
    public function stockMovements(): MorphMany
    {
        return $this->morphMany(StockMovement::class, 'source');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
