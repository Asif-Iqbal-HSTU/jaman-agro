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

/**
 * Contract work done on a day: so many kg, bags or tons of a job at its rate.
 *
 * @property int $id
 * @property CarbonImmutable $work_date
 * @property int $worker_id
 * @property int $piece_rate_id
 * @property string $quantity
 * @property string $rate
 * @property string $amount
 * @property string|null $notes
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $edited_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['work_date', 'worker_id', 'piece_rate_id', 'quantity', 'rate', 'notes', 'recorded_by'])]
class PieceWork extends Model
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
            'work_date' => 'date:Y-m-d',
            'quantity' => 'decimal:2',
            'rate' => 'decimal:2',
            'amount' => 'decimal:2',
            'edited_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(fn (PieceWork $work) => $work->amount = Decimal::mul($work->quantity, $work->rate));
    }

    /**
     * @return BelongsTo<Worker, $this>
     */
    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }

    /**
     * @return BelongsTo<PieceRate, $this>
     */
    public function job(): BelongsTo
    {
        return $this->belongsTo(PieceRate::class, 'piece_rate_id');
    }
}
