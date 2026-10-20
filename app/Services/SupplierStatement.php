<?php

namespace App\Services;

use App\Models\LeafReceipt;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Support\Decimal;
use Carbon\CarbonInterface;

/**
 * A supplier's account for a period: what they were owed at the start,
 * every delivery and payment in between, and what they are owed at the end.
 */
final class SupplierStatement
{
    /**
     * @return array{
     *     opening_balance: string,
     *     closing_balance: string,
     *     totals: array{net_kg: string, leaf_amount: string, paid: string, unpriced: int},
     *     entries: list<array<string, mixed>>
     * }
     */
    public static function for(Supplier $supplier, CarbonInterface $from, CarbonInterface $to): array
    {
        $leafBefore = $supplier->leafReceipts()->whereDate('received_on', '<', $from)->sum('amount');
        $paidBefore = $supplier->payments()->whereDate('paid_on', '<', $from)->sum('amount');

        $opening = Decimal::sub(Decimal::add($supplier->opening_balance, $leafBefore), $paidBefore);

        $receipts = $supplier->leafReceipts()
            ->whereDate('received_on', '>=', $from)->whereDate('received_on', '<=', $to)
            ->orderBy('received_on')->orderBy('id')
            ->get()
            ->map(fn (LeafReceipt $r) => [
                'kind' => 'leaf',
                'id' => $r->id,
                'date' => $r->received_on->toDateString(),
                'reference' => $r->number,
                'net_kg' => $r->net_kg,
                'rate' => $r->rate,
                'credit' => $r->amount,
                'debit' => null,
            ]);

        $payments = $supplier->payments()
            ->whereDate('paid_on', '>=', $from)->whereDate('paid_on', '<=', $to)
            ->orderBy('paid_on')->orderBy('id')
            ->get()
            ->map(fn (SupplierPayment $p) => [
                'kind' => $p->type->value,
                'id' => $p->id,
                'date' => $p->paid_on->toDateString(),
                'reference' => $p->reference,
                'method' => $p->method->label(),
                'net_kg' => null,
                'rate' => null,
                'credit' => null,
                'debit' => $p->amount,
            ]);

        $balance = $opening;

        // Leaf before payments on the same day, so a same-day payment never shows a false advance.
        $entries = array_values($receipts->concat($payments)
            ->sortBy(fn (array $e) => $e['date'].($e['kind'] === 'leaf' ? '0' : '1').str_pad((string) $e['id'], 10, '0', STR_PAD_LEFT))
            ->map(function (array $entry) use (&$balance) {
                $balance = Decimal::sub(Decimal::add($balance, $entry['credit']), $entry['debit']);

                return [...$entry, 'balance' => $balance];
            })
            ->all());

        return [
            'opening_balance' => $opening,
            'closing_balance' => $balance,
            'totals' => [
                'net_kg' => Decimal::add(...$receipts->pluck('net_kg')->all()),
                'leaf_amount' => Decimal::add(...$receipts->pluck('credit')->all()),
                'paid' => Decimal::add(...$payments->pluck('debit')->all()),
                'unpriced' => $receipts->whereNull('credit')->count(),
            ],
            'entries' => $entries,
        ];
    }
}
