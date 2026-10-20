<?php

namespace App\Models;

use App\Concerns\RecordsActivity;
use App\Enums\PieceUnit;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A contract job and its current rate, e.g. Bagging at ৳8 per bag.
 *
 * @property int $id
 * @property string $name
 * @property PieceUnit $unit
 * @property string $rate
 * @property int $sort_order
 * @property bool $is_active
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['name', 'unit', 'rate', 'sort_order', 'is_active'])]
class PieceRate extends Model
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
            'unit' => PieceUnit::class,
            'rate' => 'decimal:2',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @param  Builder<PieceRate>  $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('name');
    }
}
