<?php

namespace App\Http\Controllers;

use App\Http\Requests\Leaf\LeafRateRequest;
use App\Models\LeafRate;
use App\Models\LeafReceipt;
use App\Support\EditLock;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class LeafRateController extends Controller
{
    /**
     * Set (or change) the day's leaf rates and price that day's deliveries.
     */
    public function store(LeafRateRequest $request): RedirectResponse
    {
        $date = $request->date('rate_date');

        $rate = LeafRate::forDate($date) ?? new LeafRate(['rate_date' => $date]);

        if ($rate->exists) {
            EditLock::ensureEditable($rate);
        }

        $rate->fill([
            'rate' => $request->validated('rate'),
            'site_rate' => $request->validated('site_rate'),
            'set_by' => $request->user()->id,
        ])->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Rate saved. :count deliveries priced.', [
                'count' => LeafReceipt::whereDate('received_on', $date)->whereNotNull('amount')->count(),
            ]),
        ]);

        return to_route('leaf-receipts.index', ['date' => $date?->toDateString()]);
    }
}
