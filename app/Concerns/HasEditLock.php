<?php

namespace App\Concerns;

use App\Support\EditLock;
use Illuminate\Database\Eloquent\Model;

/**
 * Adds edit_lock (open, locked, pending, unlocked) to the record's array
 * form, so screens can show a lock instead of the edit and delete buttons.
 *
 * @phpstan-require-extends Model
 */
trait HasEditLock
{
    public function initializeHasEditLock(): void
    {
        $this->append('edit_lock');
    }

    public function getEditLockAttribute(): string
    {
        return EditLock::state($this);
    }
}
