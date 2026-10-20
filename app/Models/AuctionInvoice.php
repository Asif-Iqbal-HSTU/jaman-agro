<?php

namespace App\Models;

use App\Concerns\HasEditLock;
use App\Concerns\MarksEdited;
use App\Concerns\RecordsActivity;
use App\Enums\PackageType;
use App\Support\Decimal;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/**
 * A garden invoice: packages of one grade sent to auction, and what became of them.
 *
 * @property int $id
 * @property string $invoice_no
 * @property CarbonImmutable $packed_on
 * @property int $tea_grade_id
 * @property PackageType $package_type
 * @property int $packages
 * @property string $kg_per_package
 * @property string $net_kg
 * @property int|null $broker_id
 * @property int|null $warehouse_id
 * @property string|null $auction_centre
 * @property string|null $sale_no
 * @property string|null $lot_no
 * @property CarbonImmutable|null $dispatched_on
 * @property CarbonImmutable|null $sold_on
 * @property string|null $buyer
 * @property string|null $price_per_kg
 * @property string|null $gross_amount
 * @property string $deductions
 * @property string|null $net_amount
 * @property CarbonImmutable|null $paid_on
 * @property string|null $payment_reference
 * @property string|null $notes
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $edited_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read string $status
 */
#[Fillable([
    'invoice_no', 'packed_on', 'tea_grade_id', 'package_type', 'packages', 'kg_per_package',
    'broker_id', 'warehouse_id', 'auction_centre', 'sale_no', 'lot_no', 'dispatched_on', 'sold_on', 'buyer',
    'price_per_kg', 'deductions', 'paid_on', 'payment_reference', 'notes', 'recorded_by',
])]
class AuctionInvoice extends Model
{
    use HasEditLock, MarksEdited, RecordsActivity;

    /**
     * @var list<string>
     */
    protected $appends = ['status'];

    /**
     * Only changes to the packing count as an edit. Filling in dispatch, the
     * auction result and the payment later is normal progress, and stays
     * open after the edit time limit.
     *
     * @var list<string>
     */
    public array $editTrackedFields = ['invoice_no', 'packed_on', 'tea_grade_id', 'package_type', 'packages', 'kg_per_package'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'packed_on' => 'date:Y-m-d',
            'package_type' => PackageType::class,
            'packages' => 'integer',
            'kg_per_package' => 'decimal:2',
            'net_kg' => 'decimal:2',
            'dispatched_on' => 'date:Y-m-d',
            'sold_on' => 'date:Y-m-d',
            'price_per_kg' => 'decimal:2',
            'gross_amount' => 'decimal:2',
            'deductions' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'paid_on' => 'date:Y-m-d',
            'edited_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (AuctionInvoice $invoice) {
            $invoice->net_kg = Decimal::mul($invoice->packages, $invoice->kg_per_package);
            $invoice->gross_amount = $invoice->price_per_kg === null ? null : Decimal::mul($invoice->net_kg, $invoice->price_per_kg);
            $invoice->net_amount = $invoice->gross_amount === null ? null : Decimal::sub($invoice->gross_amount, $invoice->deductions);
        });
    }

    /**
     * Where the invoice is: packed, dispatched, sold or paid.
     */
    public function getStatusAttribute(): string
    {
        return match (true) {
            $this->paid_on !== null => 'paid',
            $this->price_per_kg !== null => 'sold',
            $this->dispatched_on !== null => 'dispatched',
            default => 'packed',
        };
    }

    /**
     * Invoices in the given status.
     *
     * @param  Builder<AuctionInvoice>  $query
     */
    public function scopeStatus(Builder $query, string $status): void
    {
        match ($status) {
            'paid' => $query->whereNotNull('paid_on'),
            'sold' => $query->whereNotNull('price_per_kg')->whereNull('paid_on'),
            'dispatched' => $query->whereNotNull('dispatched_on')->whereNull('price_per_kg'),
            'packed' => $query->whereNull('dispatched_on')->whereNull('price_per_kg'),
            default => null,
        };
    }

    /**
     * Suggest the next invoice number, e.g. JA-0007.
     */
    public static function nextNumber(): string
    {
        $last = self::query()->where('invoice_no', 'like', 'JA-%')->orderByDesc('id')->value('invoice_no');
        $next = $last && preg_match('/(\d+)$/', $last, $m) ? ((int) $m[1]) + 1 : 1;

        return 'JA-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * @return BelongsTo<TeaGrade, $this>
     */
    public function grade(): BelongsTo
    {
        return $this->belongsTo(TeaGrade::class, 'tea_grade_id');
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * @return BelongsTo<Broker, $this>
     */
    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    /**
     * The line in the stock ledger that took this tea out of the factory stock.
     *
     * @return MorphOne<StockMovement, $this>
     */
    public function stockMovement(): MorphOne
    {
        return $this->morphOne(StockMovement::class, 'source');
    }
}
