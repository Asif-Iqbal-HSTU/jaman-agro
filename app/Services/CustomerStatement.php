<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\RetailSale;
use App\Support\Decimal;
use Carbon\CarbonInterface;

/**
 * A retail customer's account for a period: what they owed at the start,
 * every sale and payment in between, and what they owe at the end.
 */
final class CustomerStatement
{
    /**
     * @return array{
     *     opening_balance: string,
     *     closing_balance: string,
     *     totals: array{sales: string, paid: string},
     *     entries: list<array<string, mixed>>
     * }
     */
    public static function for(Customer $customer, CarbonInterface $from, CarbonInterface $to): array
    {
        $salesBefore = $customer->sales()->whereDate('sold_on', '<', $from)->sum('total_amount');
        $paidBefore = $customer->payments()->whereDate('paid_on', '<', $from)->sum('amount');

        $opening = Decimal::sub(Decimal::add($customer->opening_balance, $salesBefore), $paidBefore);

        $sales = $customer->sales()
            ->with('items.grade:id,code')
            ->whereDate('sold_on', '>=', $from)->whereDate('sold_on', '<=', $to)
            ->orderBy('sold_on')->orderBy('id')
            ->get()
            ->map(fn (RetailSale $s) => [
                'kind' => 'sale',
                'id' => $s->id,
                'date' => $s->sold_on->toDateString(),
                'reference' => $s->number,
                'details' => $s->items->map(fn ($i) => "{$i->grade?->code} {$i->kg} kg")->join(', '),
                'debit' => $s->total_amount,
                'credit' => null,
            ]);

        $payments = $customer->payments()
            ->whereDate('paid_on', '>=', $from)->whereDate('paid_on', '<=', $to)
            ->orderBy('paid_on')->orderBy('id')
            ->get()
            ->map(fn (CustomerPayment $p) => [
                'kind' => 'payment',
                'id' => $p->id,
                'date' => $p->paid_on->toDateString(),
                'reference' => $p->reference,
                'details' => $p->method->label(),
                'debit' => null,
                'credit' => $p->amount,
                'edit_lock' => $p->edit_lock,
            ]);

        $balance = $opening;

        // Sales before payments on the same day, so money taken with a sale follows it.
        $entries = array_values($sales->concat($payments)
            ->sortBy(fn (array $e) => $e['date'].($e['kind'] === 'sale' ? '0' : '1').str_pad((string) $e['id'], 10, '0', STR_PAD_LEFT))
            ->map(function (array $entry) use (&$balance) {
                $balance = Decimal::sub(Decimal::add($balance, $entry['debit']), $entry['credit']);

                return [...$entry, 'balance' => $balance];
            })
            ->all());

        return [
            'opening_balance' => $opening,
            'closing_balance' => $balance,
            'totals' => [
                'sales' => Decimal::add(...$sales->pluck('debit')->all()),
                'paid' => Decimal::add(...$payments->pluck('credit')->all()),
            ],
            'entries' => $entries,
        ];
    }
}
