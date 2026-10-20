<?php

namespace App\Models;

use App\Concerns\RecordsActivity;
use App\Support\Decimal;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A retail buyer of made tea, who may buy on credit.
 *
 * @property int $id
 * @property string $name
 * @property string|null $phone
 * @property string|null $address
 * @property string $opening_balance
 * @property bool $is_active
 * @property string|null $notes
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property string|null $sales_amount
 * @property string|null $paid_amount
 */
#[Fillable(['name', 'phone', 'address', 'opening_balance', 'is_active', 'notes'])]
class Customer extends Model
{
    use RecordsActivity;

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
     * @return HasMany<RetailSale, $this>
     */
    public function sales(): HasMany
    {
        return $this->hasMany(RetailSale::class);
    }

    /**
     * @return HasMany<CustomerPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(CustomerPayment::class);
    }

    /**
     * Load the totals needed to work out each customer's balance.
     *
     * @param  Builder<Customer>  $query
     */
    public function scopeWithBalance(Builder $query): void
    {
        $query->withSum('sales as sales_amount', 'total_amount')
            ->withSum('payments as paid_amount', 'amount');
    }

    /**
     * What the customer owes the factory. Negative means they paid in advance.
     * Requires the withBalance() scope.
     *
     * @return numeric-string
     */
    public function balance(): string
    {
        return Decimal::sub(Decimal::add($this->opening_balance, $this->sales_amount), $this->paid_amount);
    }

    /**
     * Total still owed to the factory by all customers.
     *
     * @return numeric-string
     */
    public static function totalReceivable(): string
    {
        $balances = self::query()->withBalance()->get()->map->balance();

        return Decimal::add(...$balances->filter(fn (string $b) => Decimal::compare($b, 0) > 0)->all());
    }
}
