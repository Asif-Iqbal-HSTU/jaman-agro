<?php

namespace App\Models;

use App\Concerns\RecordsActivity;
use App\Support\Decimal;
use Carbon\CarbonImmutable;
use Database\Factories\SupplierFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A garden owner the factory buys green leaf from.
 *
 * @property int $id
 * @property string|null $code
 * @property string $name
 * @property string|null $phone
 * @property string|null $garden_name
 * @property string|null $address
 * @property string $opening_balance
 * @property bool $is_active
 * @property string|null $notes
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property string|null $leaf_amount
 * @property string|null $paid_amount
 */
#[Fillable(['code', 'name', 'phone', 'garden_name', 'address', 'opening_balance', 'is_active', 'notes'])]
class Supplier extends Model
{
    /** @use HasFactory<SupplierFactory> */
    use HasFactory, RecordsActivity;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<LeafReceipt, $this>
     */
    public function leafReceipts(): HasMany
    {
        return $this->hasMany(LeafReceipt::class);
    }

    /**
     * @return HasMany<SupplierPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    /**
     * Load the totals needed to work out each supplier's balance.
     *
     * @param  Builder<Supplier>  $query
     */
    public function scopeWithBalance(Builder $query): void
    {
        $query->withSum('leafReceipts as leaf_amount', 'amount')
            ->withSum('payments as paid_amount', 'amount');
    }

    /**
     * Totals across all suppliers: what the factory owes, and the advances
     * still to be recovered from suppliers whose balance has gone negative.
     *
     * @return array{payable: string, advances: string}
     */
    public static function balanceSummary(): array
    {
        $balances = self::query()->withBalance()->get()->map->balance();

        return [
            'payable' => Decimal::add(...$balances->filter(fn (string $b) => Decimal::compare($b, 0) > 0)->all()),
            'advances' => Decimal::sub(0, Decimal::add(...$balances->filter(fn (string $b) => Decimal::compare($b, 0) < 0)->all())),
        ];
    }

    /**
     * What the factory owes the supplier right now. Negative means the
     * supplier has taken more in advances than their leaf is worth so far.
     * Requires the withBalance() scope.
     */
    public function balance(): string
    {
        return Decimal::sub(
            Decimal::add($this->opening_balance, $this->leaf_amount),
            $this->paid_amount,
        );
    }
}
