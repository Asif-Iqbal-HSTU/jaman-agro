<?php

namespace App\Models;

use App\Concerns\HasEditLock;
use App\Concerns\MarksEdited;
use App\Concerns\RecordsActivity;
use App\Enums\DeductionType;
use App\Enums\DeliveryMode;
use App\Support\Decimal;
use Carbon\CarbonImmutable;
use Database\Factories\LeafReceiptFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One delivery of green leaf weighed in at the factory gate.
 *
 * @property int $id
 * @property CarbonImmutable $received_on
 * @property int $supplier_id
 * @property DeliveryMode $delivery_mode
 * @property int|null $vehicle_id
 * @property string|null $vehicle_no
 * @property string $gross_kg
 * @property string $tare_kg
 * @property DeductionType $deduction_type
 * @property string|null $deduction_percent
 * @property string $deduction_kg
 * @property string $net_kg
 * @property string|null $rate
 * @property string|null $amount
 * @property string|null $notes
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $edited_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read string $number
 */
#[Fillable([
    'received_on', 'supplier_id', 'delivery_mode', 'vehicle_id', 'vehicle_no', 'gross_kg', 'tare_kg',
    'deduction_type', 'deduction_percent', 'deduction_kg', 'notes', 'recorded_by',
])]
class LeafReceipt extends Model
{
    /** @use HasFactory<LeafReceiptFactory> */
    use HasEditLock, HasFactory, MarksEdited, RecordsActivity;

    /**
     * @var list<string>
     */
    protected $appends = ['number'];

    /**
     * The same defaults as the table, so a new receipt knows them before it is saved.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'delivery_mode' => 'supplier',
        'deduction_type' => 'percent',
        'tare_kg' => 0,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'received_on' => 'date:Y-m-d',
            'delivery_mode' => DeliveryMode::class,
            'deduction_type' => DeductionType::class,
            'gross_kg' => 'decimal:2',
            'tare_kg' => 'decimal:2',
            'deduction_percent' => 'decimal:2',
            'deduction_kg' => 'decimal:2',
            'net_kg' => 'decimal:2',
            'rate' => 'decimal:2',
            'amount' => 'decimal:2',
            'edited_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (LeafReceipt $receipt) {
            // A new receipt, or one moved to another day or delivery mode, takes that day's rate for its mode.
            if (! $receipt->exists || $receipt->isDirty(['received_on', 'delivery_mode'])) {
                $receipt->rate = LeafRate::forDate($receipt->received_on)?->rateFor($receipt->delivery_mode);
            }

            $receipt->calculate();
        });
    }

    /**
     * Work out the deduction, net weight and amount from the weighed figures.
     */
    public function calculate(): void
    {
        $leafKg = Decimal::sub($this->gross_kg, $this->tare_kg);

        // A percentage deduction is worked out; a kg deduction is taken as entered.
        if ($this->deduction_type === DeductionType::Percent) {
            $this->deduction_kg = Decimal::percent($leafKg, $this->deduction_percent);
        } else {
            $this->deduction_percent = null;
            $this->deduction_kg = Decimal::add($this->deduction_kg);
        }

        $this->net_kg = Decimal::sub($leafKg, $this->deduction_kg);
        $this->amount = $this->rate === null ? null : Decimal::mul($this->net_kg, $this->rate);
    }

    /**
     * The slip number printed for the supplier, e.g. GL-000042.
     */
    public function getNumberAttribute(): string
    {
        return 'GL-'.str_pad((string) $this->id, 6, '0', STR_PAD_LEFT);
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * @return BelongsTo<Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
