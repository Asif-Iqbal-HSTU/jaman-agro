<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Models\AuctionInvoice;
use App\Models\CustomerPayment;
use App\Models\Expense;
use App\Models\SupplierPayment;
use App\Models\WagePayment;
use App\Support\Decimal;
use Carbon\CarbonInterface;

/**
 * Every taka that came in or went out in a period, by payment method:
 * money in from customers and the broker, money out to suppliers and on expenses.
 */
final class CashBook
{
    /**
     * @return array{
     *     entries: list<array{date: string, kind: string, details: string, method: string, in: string|null, out: string|null}>,
     *     totals: array{in: string, out: string, net: string},
     *     by_method: list<array{method: string, label: string, in: string, out: string, net: string}>
     * }
     */
    public static function for(CarbonInterface $from, CarbonInterface $to, ?PaymentMethod $method = null): array
    {
        $entries = [];

        $customerPayments = CustomerPayment::query()->with('customer:id,name')
            ->whereDate('paid_on', '>=', $from)->whereDate('paid_on', '<=', $to)
            ->when($method, fn ($q) => $q->where('method', $method))
            ->get();

        foreach ($customerPayments as $p) {
            $entries[] = [
                'date' => $p->paid_on->toDateString(),
                'kind' => 'customer',
                'details' => $p->customer->name ?? __('Walk-in customer'),
                'method' => $p->method->value,
                'in' => $p->amount,
                'out' => null,
            ];
        }

        // The broker pays auction proceeds into the bank.
        if ($method === null || $method === PaymentMethod::Bank) {
            $invoices = AuctionInvoice::query()->with('broker:id,name')
                ->whereNotNull('paid_on')
                ->whereDate('paid_on', '>=', $from)->whereDate('paid_on', '<=', $to)
                ->get();

            foreach ($invoices as $i) {
                $entries[] = [
                    'date' => $i->paid_on?->toDateString() ?? '',
                    'kind' => 'auction',
                    'details' => trim($i->invoice_no.' '.($i->broker->name ?? '')),
                    'method' => PaymentMethod::Bank->value,
                    'in' => $i->net_amount,
                    'out' => null,
                ];
            }
        }

        $supplierPayments = SupplierPayment::query()->with('supplier:id,name')
            ->whereDate('paid_on', '>=', $from)->whereDate('paid_on', '<=', $to)
            ->when($method, fn ($q) => $q->where('method', $method))
            ->get();

        foreach ($supplierPayments as $p) {
            $entries[] = [
                'date' => $p->paid_on->toDateString(),
                'kind' => 'supplier',
                'details' => $p->supplier->name ?? '',
                'method' => $p->method->value,
                'in' => null,
                'out' => $p->amount,
            ];
        }

        $expenses = Expense::query()->with('category:id,name')
            ->whereDate('spent_on', '>=', $from)->whereDate('spent_on', '<=', $to)
            ->when($method, fn ($q) => $q->where('method', $method))
            ->get();

        foreach ($expenses as $e) {
            $entries[] = [
                'date' => $e->spent_on->toDateString(),
                'kind' => 'expense',
                'details' => trim(($e->category->name ?? '').($e->paid_to ? ' · '.$e->paid_to : '')),
                'method' => $e->method->value,
                'in' => null,
                'out' => $e->amount,
            ];
        }

        $wagePayments = WagePayment::query()->with('worker:id,name')
            ->whereDate('paid_on', '>=', $from)->whereDate('paid_on', '<=', $to)
            ->when($method, fn ($q) => $q->where('method', $method))
            ->get();

        foreach ($wagePayments as $w) {
            $entries[] = [
                'date' => $w->paid_on->toDateString(),
                'kind' => 'wages',
                'details' => $w->worker->name ?? '',
                'method' => $w->method->value,
                'in' => null,
                'out' => $w->amount,
            ];
        }

        // By date; on the same day, money in before money out.
        usort($entries, fn (array $a, array $b) => [$a['date'], $a['in'] === null] <=> [$b['date'], $b['in'] === null]);

        $byMethod = [];

        foreach (PaymentMethod::cases() as $m) {
            $rows = array_filter($entries, fn (array $e) => $e['method'] === $m->value);
            $in = Decimal::add(...array_column($rows, 'in'));
            $out = Decimal::add(...array_column($rows, 'out'));

            $byMethod[] = ['method' => $m->value, 'label' => $m->label(), 'in' => $in, 'out' => $out, 'net' => Decimal::sub($in, $out)];
        }

        $in = Decimal::add(...array_column($entries, 'in'));
        $out = Decimal::add(...array_column($entries, 'out'));

        return [
            'entries' => $entries,
            'totals' => ['in' => $in, 'out' => $out, 'net' => Decimal::sub($in, $out)],
            'by_method' => $byMethod,
        ];
    }
}
