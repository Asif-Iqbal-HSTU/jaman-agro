<?php

namespace App\Http\Controllers;

use App\Actions\Sales\RecordRetailSale;
use App\Enums\PaymentMethod;
use App\Http\Requests\Sales\RetailSaleRequest;
use App\Models\Customer;
use App\Models\RetailSale;
use App\Models\StockMovement;
use App\Models\TeaGrade;
use App\Support\Decimal;
use App\Support\EditLock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

class RetailSaleController extends Controller
{
    /**
     * Retail sale memos for a period.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'customer' => ['nullable', 'integer'],
        ]);

        $from = isset($validated['from']) ? Date::parse($validated['from']) : Date::today()->startOfMonth();
        $to = isset($validated['to']) ? Date::parse($validated['to']) : Date::today();

        $query = RetailSale::query()
            ->whereDate('sold_on', '>=', $from)
            ->whereDate('sold_on', '<=', $to)
            ->when($validated['customer'] ?? null, fn ($query, $id) => $query->where('customer_id', $id));

        return Inertia::render('retail-sales/index', [
            'sales' => (clone $query)
                ->with('customer:id,name', 'items.grade:id,code', 'payment:id,retail_sale_id,amount')
                ->orderByDesc('sold_on')->orderByDesc('id')
                ->paginate(30)
                ->withQueryString(),
            'totals' => [
                'count' => (clone $query)->count(),
                'amount' => Decimal::add((clone $query)->sum('total_amount')),
                'kg' => Decimal::add((clone $query)->join('retail_sale_items', 'retail_sale_items.retail_sale_id', '=', 'retail_sales.id')->sum('retail_sale_items.kg')),
            ],
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'customer' => $validated['customer'] ?? null,
            ],
            'customers' => Customer::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for writing a sale memo.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('retail-sales/create', [
            'grades' => TeaGrade::ordered()->where('is_active', true)->get(['id', 'code', 'name']),
            'balances' => StockMovement::balances(),
            'customers' => Customer::where('is_active', true)->orderBy('name')->get(['id', 'name', 'phone']),
            'customerId' => $request->integer('customer') ?: null,
            'methods' => PaymentMethod::options(),
            'today' => Date::today()->toDateString(),
        ]);
    }

    /**
     * Record a sale.
     */
    public function store(RetailSaleRequest $request, RecordRetailSale $record): RedirectResponse
    {
        $sale = $record->handle(
            [
                'sold_on' => (string) $request->validated('sold_on'),
                'customer_id' => $request->validated('customer_id') === null ? null : (int) $request->validated('customer_id'),
                'notes' => $request->validated('notes'),
                'recorded_by' => $request->user()->id,
            ],
            $request->items(),
            $request->payment(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Sale :number saved.', ['number' => $sale->number])]);

        return to_route('retail-sales.show', $sale);
    }

    /**
     * Show a printable sale memo.
     */
    public function show(RetailSale $retailSale): Response
    {
        return Inertia::render('retail-sales/show', [
            'sale' => $retailSale->load('customer:id,name,phone,address', 'items.grade:id,code,name', 'payment', 'recorder:id,name'),
        ]);
    }

    /**
     * Cancel a sale entered by mistake.
     */
    public function destroy(RetailSale $retailSale, RecordRetailSale $record): RedirectResponse
    {
        EditLock::ensureEditable($retailSale);

        $record->delete($retailSale);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Sale cancelled and its tea returned to stock.')]);

        return to_route('retail-sales.index');
    }
}
