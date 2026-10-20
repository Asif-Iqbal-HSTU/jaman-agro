<?php

namespace App\Models;

use App\Concerns\RecordsActivity;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * A request to change an entry that is past the edit time limit.
 *
 * @property int $id
 * @property string $subject_type
 * @property int $subject_id
 * @property int $requested_by
 * @property string $reason
 * @property string $status pending, approved, rejected
 * @property int|null $decided_by
 * @property CarbonImmutable|null $decided_at
 * @property CarbonImmutable|null $expires_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['subject_type', 'subject_id', 'requested_by', 'reason', 'status', 'decided_by', 'decided_at', 'expires_at'])]
class UnlockRequest extends Model
{
    use RecordsActivity;

    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const REJECTED = 'rejected';

    /**
     * The kinds of entry that can be unlocked, by the short name the screens use.
     *
     * @var array<string, class-string<Model>>
     */
    public const SUBJECTS = [
        'leaf_receipt' => LeafReceipt::class,
        'leaf_rate' => LeafRate::class,
        'supplier_payment' => SupplierPayment::class,
        'production_batch' => ProductionBatch::class,
        'auction_invoice' => AuctionInvoice::class,
        'retail_sale' => RetailSale::class,
        'customer_payment' => CustomerPayment::class,
        'expense' => Expense::class,
        'attendance' => Attendance::class,
        'piece_work' => PieceWork::class,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'decided_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * The short name of the entry kind, e.g. "leaf_receipt".
     */
    public static function keyFor(Model $model): ?string
    {
        return array_search($model::class, self::SUBJECTS, true) ?: null;
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
