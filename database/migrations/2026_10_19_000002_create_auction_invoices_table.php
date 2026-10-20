<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // One garden invoice: packages of a single grade sent to auction.
        Schema::create('auction_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no', 30)->unique();
            $table->date('packed_on')->index();
            $table->foreignId('tea_grade_id')->constrained()->restrictOnDelete();
            $table->string('package_type', 10);
            $table->unsignedInteger('packages');
            $table->decimal('kg_per_package', 8, 2);
            $table->decimal('net_kg', 12, 2);

            // Auction details, filled in as the invoice moves along.
            $table->foreignId('broker_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('auction_centre', 50)->nullable();
            $table->string('sale_no', 20)->nullable();
            $table->string('lot_no', 20)->nullable();
            $table->date('dispatched_on')->nullable();
            $table->date('sold_on')->nullable()->index();
            $table->string('buyer')->nullable();
            $table->decimal('price_per_kg', 10, 2)->nullable();
            $table->decimal('gross_amount', 14, 2)->nullable();
            // Brokerage, warehouse charges, taxes and the like taken out by the broker.
            $table->decimal('deductions', 12, 2)->default(0);
            $table->decimal('net_amount', 14, 2)->nullable();
            $table->date('paid_on')->nullable();
            $table->string('payment_reference', 100)->nullable();

            $table->string('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auction_invoices');
    }
};
