<?php

namespace App\Models;

use App\Concerns\RecordsActivity;
use App\Enums\PaymentMethod;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Wages paid to a worker for a pay period.
 *
 * @property int $id
 * @property CarbonImmutable $paid_on
 * @property int $worker_id
 * @property CarbonImmutable $period_from
 * @property CarbonImmutable $period_to
 * @property string $amount
 * @property PaymentMethod $method
 * @property string|null $reference
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['paid_on', 'worker_id', 'period_from', 'period_to', 'amount', 'method', 'reference', 'recorded_by'])]
class WagePayment extends Model
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
            'paid_on' => 'date:Y-m-d',
            'period_from' => 'date:Y-m-d',
            'period_to' => 'date:Y-m-d',
            'amount' => 'decimal:2',
            'method' => PaymentMethod::class,
        ];
    }

    /**
     * @return BelongsTo<Worker, $this>
     */
    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }
}
