<?php

namespace App\Support;

use App\Models\UnlockRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Exceptions\HttpResponseException;
use Inertia\Inertia;

/**
 * The edit time limit: entries can be changed for a few days after they
 * were recorded; after that only with an unlock approved by the admin.
 */
final class EditLock
{
    public const OPEN = 'open';

    public const LOCKED = 'locked';

    public const PENDING = 'pending';

    public const UNLOCKED = 'unlocked';

    /**
     * The state of a record for the signed-in user: open, locked, pending (unlock asked) or unlocked.
     */
    public static function state(Model $model, ?User $user = null): string
    {
        $user ??= auth()->user();

        if ($user instanceof User && $user->isAdmin()) {
            return self::OPEN;
        }

        $created = $model->getAttribute('created_at');
        $days = (int) config('factory.edit_lock_days', 3);

        if ($created === null || $created->greaterThan(now()->subDays($days))) {
            return self::OPEN;
        }

        $requests = UnlockRequest::query()
            ->where('subject_type', $model->getMorphClass())
            ->where('subject_id', $model->getKey())
            ->whereIn('status', [UnlockRequest::PENDING, UnlockRequest::APPROVED])
            ->get(['status', 'expires_at']);

        if ($requests->contains(fn ($r) => $r->status === UnlockRequest::APPROVED && $r->expires_at?->isFuture())) {
            return self::UNLOCKED;
        }

        return $requests->contains('status', UnlockRequest::PENDING) ? self::PENDING : self::LOCKED;
    }

    public static function isLocked(Model $model): bool
    {
        return in_array(self::state($model), [self::LOCKED, self::PENDING], true);
    }

    /**
     * Stop a change to a locked record, sending the user back with an explanation.
     *
     * @throws HttpResponseException
     */
    public static function ensureEditable(Model $model): void
    {
        if (! self::isLocked($model)) {
            return;
        }

        Inertia::flash('toast', [
            'type' => 'error',
            'message' => __('This entry is older than :days days and is locked. Ask the administrator to unlock it.', [
                'days' => config('factory.edit_lock_days', 3),
            ]),
        ]);

        throw new HttpResponseException(back());
    }
}
