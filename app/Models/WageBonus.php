<?php

namespace App\Models;

use App\Concerns\RecordsActivity;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Extra money for a worker, such as a heat, cold or Eid bonus.
 *
 * @property int $id
 * @property CarbonImmutable $given_on
 * @property int $worker_id
 * @property string $amount
 * @property string $reason
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['given_on', 'worker_id', 'amount', 'reason', 'recorded_by'])]
class WageBonus extends Model
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
            'given_on' => 'date:Y-m-d',
            'amount' => 'decimal:2',
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
