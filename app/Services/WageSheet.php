<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\PieceWork;
use App\Models\WageBonus;
use App\Models\WagePayment;
use App\Models\Worker;
use App\Support\Decimal;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;

/**
 * Wages for a pay period. Workers are paid twice a week: on Sunday for
 * Thursday–Saturday, and on Thursday for Sunday–Wednesday.
 */
final class WageSheet
{
    /**
     * The two most recent pay periods, ending on or before today.
     *
     * @return array{sunday: array{from: string, to: string}, thursday: array{from: string, to: string}}
     */
    public static function periods(?CarbonInterface $today = null): array
    {
        $today = CarbonImmutable::instance($today ?? Date::today())->startOfDay();

        // Thursday to Saturday, paid on Sunday.
        $saturday = $today->dayOfWeek === CarbonInterface::SATURDAY ? $today : $today->previous(CarbonInterface::SATURDAY);
        // Sunday to Wednesday, paid on Thursday.
        $wednesday = $today->dayOfWeek === CarbonInterface::WEDNESDAY ? $today : $today->previous(CarbonInterface::WEDNESDAY);

        return [
            'sunday' => ['from' => $saturday->subDays(2)->toDateString(), 'to' => $saturday->toDateString()],
            'thursday' => ['from' => $wednesday->subDays(3)->toDateString(), 'to' => $wednesday->toDateString()],
        ];
    }

    /**
     * Each worker's earnings in the period, and what they are owed in total.
     *
     * @return list<array<string, mixed>>
     */
    public static function for(CarbonInterface $from, CarbonInterface $to): array
    {
        $between = fn (Builder $q, string $column) => $q->whereDate($column, '>=', $from)->whereDate($column, '<=', $to);

        $hours = self::sumBy(Attendance::query()->tap(fn ($q) => $between($q, 'work_date')), 'amount', 'hours');
        $pieces = self::sumBy(PieceWork::query()->tap(fn ($q) => $between($q, 'work_date')), 'amount');
        $bonuses = self::sumBy(WageBonus::query()->tap(fn ($q) => $between($q, 'given_on')), 'amount');
        // A payment counts for the pay period it was made for, whenever it was handed over.
        $paid = self::sumBy(WagePayment::query()->whereDate('period_from', '<=', $to)->whereDate('period_to', '>=', $from), 'amount');

        $active = array_unique([...array_keys($hours), ...array_keys($pieces), ...array_keys($bonuses), ...array_keys($paid)]);

        return array_values(Worker::query()
            ->withWageTotals()
            ->where(fn ($q) => $q->where('is_active', true)->orWhereIn('id', $active))
            ->orderBy('name')
            ->get()
            ->map(function (Worker $w) use ($hours, $pieces, $bonuses, $paid) {
                $earned = Decimal::add($hours[$w->id]['amount'] ?? 0, $pieces[$w->id]['amount'] ?? 0, $bonuses[$w->id]['amount'] ?? 0);

                return [
                    ...$w->only('id', 'name', 'pay_type', 'hourly_rate'),
                    'hours' => Decimal::add($hours[$w->id]['hours'] ?? 0),
                    'hourly_amount' => Decimal::add($hours[$w->id]['amount'] ?? 0),
                    'piece_amount' => Decimal::add($pieces[$w->id]['amount'] ?? 0),
                    'bonus_amount' => Decimal::add($bonuses[$w->id]['amount'] ?? 0),
                    'earned' => $earned,
                    'paid_in_period' => Decimal::add($paid[$w->id]['amount'] ?? 0),
                    'owed' => $w->owed(),
                ];
            })
            ->all());
    }

    /**
     * Sum columns per worker.
     *
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @param  literal-string  ...$columns
     * @return array<int, array<string, string>>
     */
    private static function sumBy(Builder $query, string ...$columns): array
    {
        $sums = $query->toBase()->select('worker_id')->groupBy('worker_id');

        foreach ($columns as $column) {
            $sums->selectRaw("SUM({$column}) as {$column}");
        }

        $rows = [];

        foreach ($sums->get() as $row) {
            $rows[(int) $row->worker_id] = array_map(fn ($c) => (string) $row->{$c}, array_combine($columns, $columns));
        }

        return $rows;
    }
}
