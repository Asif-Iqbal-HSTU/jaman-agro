<?php

namespace App\Models;

use App\Concerns\HasEditLock;
use App\Concerns\RecordsActivity;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * A retail sale memo with one or more grades.
 *
 * @property int $id
 * @property CarbonImmutable $sold_on
 * @property int|null $customer_id
 * @property string $total_amount
 * @property string|null $notes
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read string $number
 */
#[Fillable(['sold_on', 'customer_id', 'total_amount', 'notes', 'recorded_by'])]
class RetailSale extends Model
{
    use HasEditLock, RecordsActivity;

    /**
     * @var list<string>
     */
    protected $appends = ['number'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sold_on' => 'date:Y-m-d',
            'total_amount' => 'decimal:2',
        ];
    }

    /**
     * The memo number, e.g. RS-000042.
     */
    public function getNumberAttribute(): string
    {
        return 'RS-'.str_pad((string) $this->id, 6, '0', STR_PAD_LEFT);
    }

    /**
     * @return HasMany<RetailSaleItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(RetailSaleItem::class);
    }

    /**
     * Money taken at the time of the sale, if any.
     *
     * @return HasOne<CustomerPayment, $this>
     */
    public function payment(): HasOne
    {
        return $this->hasOne(CustomerPayment::class);
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
