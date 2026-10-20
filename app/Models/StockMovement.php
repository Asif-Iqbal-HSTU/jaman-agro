<?php

namespace App\Models;

use App\Enums\StockMovementType;
use App\Support\Decimal;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Validation\ValidationException;

/**
 * One line in the made tea ledger; a grade's stock is the sum of its lines.
 * Production lines mirror a batch's outputs (the batch and its outputs are
 * what get logged); adjustments are logged by the controller that makes them.
 *
 * @property int $id
 * @property CarbonImmutable $moved_on
 * @property int $tea_grade_id
 * @property string $quantity_kg
 * @property StockMovementType $type
 * @property string|null $source_type
 * @property int|null $source_id
 * @property string|null $reason
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['moved_on', 'tea_grade_id', 'quantity_kg', 'type', 'source_type', 'source_id', 'reason', 'recorded_by'])]
class StockMovement extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'moved_on' => 'date:Y-m-d',
            'quantity_kg' => 'decimal:2',
            'type' => StockMovementType::class,
        ];
    }

    /**
     * Current stock of each grade, keyed by grade id.
     *
     * @param  list<int>|null  $gradeIds
     * @return array<int, numeric-string>
     */
    public static function balances(?array $gradeIds = null): array
    {
        return self::query()
            ->when($gradeIds !== null, fn ($query) => $query->whereIn('tea_grade_id', $gradeIds))
            ->selectRaw('tea_grade_id, SUM(quantity_kg) as balance')
            ->groupBy('tea_grade_id')
            ->pluck('balance', 'tea_grade_id')
            ->map(fn ($balance) => Decimal::add($balance))
            ->all();
    }

    /**
     * Refuse any change that would leave a grade with less than zero kg in stock.
     * Call it inside the transaction that made the change, so it rolls back.
     *
     * @param  array<int, int>  $gradeIds
     *
     * @throws ValidationException
     */
    public static function ensureNotNegative(array $gradeIds, string $errorKey = 'outputs'): void
    {
        $short = collect(self::balances(array_values(array_unique($gradeIds))))
            ->filter(fn (string $balance) => Decimal::compare($balance, 0) < 0);

        if ($short->isNotEmpty()) {
            throw ValidationException::withMessages([
                $errorKey => __('This would leave less than zero kg in stock for :grades.', [
                    'grades' => TeaGrade::whereIn('id', $short->keys())->pluck('code')->join(', '),
                ]),
            ]);
        }
    }

    /**
     * @return BelongsTo<TeaGrade, $this>
     */
    public function grade(): BelongsTo
    {
        return $this->belongsTo(TeaGrade::class, 'tea_grade_id');
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
