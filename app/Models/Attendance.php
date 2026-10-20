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
 * One day of an hourly worker: time in, time out, and the pay it earns.
 *
 * @property int $id
 * @property CarbonImmutable $work_date
 * @property int $worker_id
 * @property string $time_in
 * @property string $time_out
 * @property string $hours
 * @property string $rate
 * @property string $amount
 * @property string|null $notes
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $edited_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['work_date', 'worker_id', 'time_in', 'time_out', 'rate', 'notes', 'recorded_by'])]
class Attendance extends Model
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
            'hours' => 'decimal:2',
            'rate' => 'decimal:2',
            'amount' => 'decimal:2',
            'edited_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Attendance $attendance) {
            $attendance->hours = self::hoursBetween($attendance->time_in, $attendance->time_out);
            $attendance->amount = Decimal::mul($attendance->hours, $attendance->rate);
        });
    }

    /**
     * Hours between two clock times. A time out earlier than the time in means the shift ran past midnight.
     *
     * @return numeric-string
     */
    public static function hoursBetween(string $in, string $out): string
    {
        $toMinutes = fn (string $t) => ((int) substr($t, 0, 2)) * 60 + (int) substr($t, 3, 2);
        $minutes = $toMinutes($out) - $toMinutes($in);

        if ($minutes < 0) {
            $minutes += 24 * 60;
        }

        return Decimal::div($minutes, 60);
    }

    /**
     * @return BelongsTo<Worker, $this>
     */
    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }
}
