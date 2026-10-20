<?php

namespace App\Http\Controllers;

use App\Actions\Sales\SaveAuctionInvoice;
use App\Enums\PackageType;
use App\Http\Requests\Sales\AuctionInvoiceRequest;
use App\Models\AuctionInvoice;
use App\Models\Broker;
use App\Models\StockMovement;
use App\Models\TeaGrade;
use App\Models\Warehouse;
use App\Support\Decimal;
use App\Support\EditLock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AuctionInvoiceController extends Controller
{
    /**
     * Invoices sent to auction, from packing to payment.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['packed', 'dispatched', 'sold', 'paid'])],
            'search' => ['nullable', 'string', 'max:50'],
        ]);
        $search = trim($validated['search'] ?? '');

        $invoices = AuctionInvoice::query()
            ->with('grade:id,code', 'broker:id,name', 'warehouse:id,name')
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->status($status))
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('invoice_no', 'like', "%{$search}%")
                ->orWhere('sale_no', 'like', "%{$search}%")
                ->orWhere('lot_no', 'like', "%{$search}%")
                ->orWhere('buyer', 'like', "%{$search}%")))
            ->orderByDesc('packed_on')->orderByDesc('id')
            ->paginate(30)
            ->withQueryString();

        $unsold = AuctionInvoice::query()->whereNull('price_per_kg');
        $unpaid = AuctionInvoice::query()->status('sold');
        $soldThisMonth = AuctionInvoice::query()->whereNotNull('price_per_kg')->whereDate('sold_on', '>=', Date::today()->startOfMonth());

        return Inertia::render('auction-invoices/index', [
            'invoices' => $invoices,
            'filters' => ['status' => $validated['status'] ?? null, 'search' => $search],
            'summary' => [
                'awaiting_sale_kg' => Decimal::add($unsold->sum('net_kg')),
                'awaiting_sale_count' => $unsold->count(),
                'awaiting_payment' => Decimal::add($unpaid->sum('net_amount')),
                'sold_this_month_kg' => Decimal::add((clone $soldThisMonth)->sum('net_kg')),
                'sold_this_month_amount' => Decimal::add((clone $soldThisMonth)->sum('net_amount')),
            ],
        ]);
    }

    /**
     * Show the form for packing an invoice.
     */
    public function create(): Response
    {
        return Inertia::render('auction-invoices/create', [
            ...$this->formOptions(),
            'nextNumber' => AuctionInvoice::nextNumber(),
            'today' => Date::today()->toDateString(),
        ]);
    }

    /**
     * Pack an invoice and take its tea out of stock.
     */
    public function store(AuctionInvoiceRequest $request, SaveAuctionInvoice $save): RedirectResponse
    {
        $invoice = $save->handle(new AuctionInvoice(['recorded_by' => $request->user()->id]), $request->invoiceData());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice :number packed.', ['number' => $invoice->invoice_no])]);

        return to_route('auction-invoices.index');
    }

    /**
     * Show the invoice, where dispatch, the auction result and payment are filled in.
     */
    public function edit(AuctionInvoice $auctionInvoice): Response
    {
        return Inertia::render('auction-invoices/edit', [
            ...$this->formOptions($auctionInvoice),
            'invoice' => $auctionInvoice,
            'today' => Date::today()->toDateString(),
        ]);
    }

    /**
     * Update packing, dispatch, auction result or payment.
     */
    public function update(AuctionInvoiceRequest $request, AuctionInvoice $auctionInvoice, SaveAuctionInvoice $save): RedirectResponse
    {
        $data = $request->invoiceData();

        // Changing the packing is a correction and falls under the edit time limit;
        // filling in dispatch, the result and the payment later is not.
        $packingChanged = (clone $auctionInvoice)->fill($data)->isDirty($auctionInvoice->editTrackedFields);

        if ($packingChanged) {
            EditLock::ensureEditable($auctionInvoice);
        }

        $save->handle($auctionInvoice, $data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice :number updated.', ['number' => $auctionInvoice->invoice_no])]);

        return to_route('auction-invoices.index');
    }

    /**
     * Unpack an invoice entered by mistake. Sold invoices are kept.
     */
    public function destroy(AuctionInvoice $auctionInvoice, SaveAuctionInvoice $save): RedirectResponse
    {
        EditLock::ensureEditable($auctionInvoice);

        if ($auctionInvoice->price_per_kg !== null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('A sold invoice cannot be deleted.')]);

            return back();
        }

        $save->delete($auctionInvoice);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice deleted and its tea returned to stock.')]);

        return to_route('auction-invoices.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(?AuctionInvoice $invoice = null): array
    {
        return [
            'grades' => TeaGrade::ordered()
                ->where(fn ($query) => $query->where('is_active', true)->orWhere('id', $invoice?->tea_grade_id))
                ->get(['id', 'code', 'name']),
            'brokers' => Broker::query()
                ->where(fn ($query) => $query->where('is_active', true)->orWhere('id', $invoice?->broker_id))
                ->orderBy('name')
                ->get(['id', 'name']),
            'warehouses' => Warehouse::query()
                ->where(fn ($query) => $query->where('is_active', true)->orWhere('id', $invoice?->warehouse_id))
                ->orderBy('name')
                ->get(['id', 'name', 'location']),
            'balances' => StockMovement::balances(),
            'packageTypes' => PackageType::options(),
        ];
    }
}
