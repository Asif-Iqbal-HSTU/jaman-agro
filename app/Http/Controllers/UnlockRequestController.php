<?php

namespace App\Http\Controllers;

use App\Models\UnlockRequest;
use App\Support\EditLock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UnlockRequestController extends Controller
{
    /**
     * Ask the administrator to unlock an entry that is past the edit time limit.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', Rule::in(array_keys(UnlockRequest::SUBJECTS))],
            'id' => ['required', 'integer'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $subject = UnlockRequest::SUBJECTS[$validated['subject']]::query()->whereKey($validated['id'])->firstOrFail();

        if (EditLock::state($subject) !== EditLock::LOCKED) {
            Inertia::flash('toast', ['type' => 'info', 'message' => __('This entry does not need an unlock right now.')]);

            return back();
        }

        UnlockRequest::create([
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'requested_by' => $request->user()->id,
            'reason' => $validated['reason'],
            'status' => UnlockRequest::PENDING,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Unlock requested. The administrator will be asked to approve it.')]);

        return back();
    }

    /**
     * The administrator's list of requests, waiting ones first.
     */
    public function index(): Response
    {
        $requests = UnlockRequest::query()
            ->with('requester:id,name', 'decider:id,name')
            ->orderByRaw("case when status = 'pending' then 0 else 1 end")
            ->latest('id')
            ->paginate(30)
            ->through(fn (UnlockRequest $r) => [
                ...$r->only('id', 'reason', 'status', 'subject_id'),
                'subject' => Str::headline(class_basename($r->subject_type)).' #'.$r->subject_id,
                'requester' => $r->requester?->name,
                'decider' => $r->decider?->name,
                'created_at' => $r->created_at?->toIso8601String(),
                'decided_at' => $r->decided_at?->toIso8601String(),
                'expires_at' => $r->expires_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/unlock-requests/index', [
            'requests' => $requests,
            'validHours' => (int) config('factory.unlock_valid_hours', 24),
        ]);
    }

    /**
     * Approve or reject a request.
     */
    public function update(Request $request, UnlockRequest $unlockRequest): RedirectResponse
    {
        $validated = $request->validate(['decision' => ['required', Rule::in([UnlockRequest::APPROVED, UnlockRequest::REJECTED])]]);

        $approved = $validated['decision'] === UnlockRequest::APPROVED;

        $unlockRequest->update([
            'status' => $validated['decision'],
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
            'expires_at' => $approved ? now()->addHours((int) config('factory.unlock_valid_hours', 24)) : null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => $approved ? __('Unlock approved.') : __('Unlock rejected.')]);

        return to_route('admin.unlock-requests.index');
    }
}
