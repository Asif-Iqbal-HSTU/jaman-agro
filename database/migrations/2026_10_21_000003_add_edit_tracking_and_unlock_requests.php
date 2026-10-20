<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Records the manager enters day to day; each gets an "edited" mark when changed after saving.
     *
     * @var list<string>
     */
    private array $tables = [
        'leaf_receipts', 'leaf_rates', 'supplier_payments', 'production_batches',
        'auction_invoices', 'expenses', 'customer_payments',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->timestamp('edited_at')->nullable());
        }

        // A manager's request to change an entry that is past the edit time limit.
        Schema::create('unlock_requests', function (Blueprint $table) {
            $table->id();
            $table->morphs('subject');
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('reason');
            $table->string('status', 10)->default('pending')->index();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            // An approved unlock allows changes until this moment.
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unlock_requests');

        foreach ($this->tables as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn('edited_at'));
        }
    }
};
