<?php

namespace App\Concerns;

use App\Models\ActivityLog;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

/**
 * Writes an activity log entry whenever the model is created, updated or deleted.
 *
 * @phpstan-require-extends Model
 */
trait RecordsActivity
{
    public static function bootRecordsActivity(): void
    {
        static::created(function (self $model) {
            ActivityLog::record('created', $model, [
                'attributes' => $model->activityAttributes($model->getAttributes()),
            ]);
        });

        static::updated(function (self $model) {
            $changes = $model->activityAttributes($model->getChanges());

            if ($changes === []) {
                return;
            }

            ActivityLog::record('updated', $model, [
                'old' => Arr::only($model->getPrevious(), array_keys($changes)),
                'attributes' => $changes,
            ]);
        });

        static::deleted(function (self $model) {
            ActivityLog::record('deleted', $model, [
                'attributes' => $model->activityAttributes($model->getAttributes()),
            ]);
        });
    }

    /**
     * Strip hidden and bookkeeping columns from attributes before they are logged.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    protected function activityAttributes(array $attributes): array
    {
        $attributes = Arr::except($attributes, [
            ...$this->getHidden(),
            $this->getKeyName(),
            'created_at',
            'updated_at',
        ]);

        // Dates read as 2026-10-16 in the log, not as a full ISO timestamp.
        return array_map(
            fn ($value) => $value instanceof DateTimeInterface
                ? $value->format($value->format('H:i:s') === '00:00:00' ? 'Y-m-d' : 'Y-m-d H:i')
                : $value,
            $attributes,
        );
    }
}
