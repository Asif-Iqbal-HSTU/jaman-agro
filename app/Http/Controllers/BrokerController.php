<?php

namespace App\Http\Controllers;

use App\Models\Broker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BrokerController extends Controller
{
    /**
     * List the brokers the factory sells through.
     */
    public function index(): Response
    {
        return Inertia::render('brokers/index', [
            'brokers' => Broker::orderBy('name')->get(),
        ]);
    }

    /**
     * Add a broker.
     */
    public function store(Request $request): RedirectResponse
    {
        Broker::create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Broker saved.')]);

        return to_route('brokers.index');
    }

    /**
     * Update or switch off a broker.
     */
    public function update(Request $request, Broker $broker): RedirectResponse
    {
        $broker->update($this->validated($request, $broker));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Broker saved.')]);

        return to_route('brokers.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Broker $broker = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique(Broker::class)->ignore($broker?->id)],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
        ]);
    }
}
