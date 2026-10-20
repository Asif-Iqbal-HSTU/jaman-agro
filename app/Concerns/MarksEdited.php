<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Model;

/**
 * Stamps edited_at when someone changes a saved record, so the record can
 * show an "edited" mark (like an edited WhatsApp message). Changes the
 * system makes on its own use saveQuietly() and leave no mark.
 *
 * A model may list $editTrackedFields to only count changes to those
 * fields (for example the packing details of an auction invoice, whose
 * later stages are normal progress, not corrections).
 *
 * @phpstan-require-extends Model
 */
trait MarksEdited
{
    public static function bootMarksEdited(): void
    {
        static::updating(function (self $model) {
            $fields = property_exists($model, 'editTrackedFields') ? $model->editTrackedFields : null;
            $changed = array_diff(array_keys($model->getDirty()), ['updated_at', 'edited_at']);

            if ($fields !== null) {
                $changed = array_intersect($changed, $fields);
            }

            if ($changed !== []) {
                $model->setAttribute('edited_at', $model->freshTimestamp());
            }
        });
    }
}
