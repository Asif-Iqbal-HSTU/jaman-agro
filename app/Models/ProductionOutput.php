<?php

namespace App\Models;

use App\Concerns\RecordsActivity;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The kg of one grade sorted out of a production batch.
 *
 * @property int $id
 * @property int $production_batch_id
 * @property int $tea_grade_id
 * @property string $kg
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['production_batch_id', 'tea_grade_id', 'kg'])]
class ProductionOutput extends Model
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
        ];
    }

    /**
     * @return BelongsTo<ProductionBatch, $this>
     */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class, 'production_batch_id');
    }

    /**
     * @return BelongsTo<TeaGrade, $this>
     */
    public function grade(): BelongsTo
    {
        return $this->belongsTo(TeaGrade::class, 'tea_grade_id');
    }
}
