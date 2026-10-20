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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 20)->nullable();
            $table->string('address')->nullable();
            // What the customer already owed the factory when they were added.
            $table->decimal('opening_balance', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('name');
        });

        Schema::create('retail_sales', function (Blueprint $table) {
            $table->id();
            $table->date('sold_on')->index();
            // Null for a walk-in cash sale.
            $table->foreignId('customer_id')->nullable()->constrained()->restrictOnDelete();
            $table->decimal('total_amount', 14, 2);
            $table->string('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('retail_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('retail_sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tea_grade_id')->constrained()->restrictOnDelete();
            $table->decimal('kg', 10, 2);
            $table->decimal('rate', 10, 2);
            $table->decimal('amount', 12, 2);
            $table->timestamps();
        });

        Schema::create('customer_payments', function (Blueprint $table) {
            $table->id();
            $table->date('paid_on')->index();
            $table->foreignId('customer_id')->nullable()->constrained()->restrictOnDelete();
            // Set when the money was taken with a sale; removed together with that sale.
            $table->foreignId('retail_sale_id')->nullable()->unique()->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('method', 20);
            $table->string('reference', 100)->nullable();
            $table->string('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['customer_id', 'paid_on']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_payments');
        Schema::dropIfExists('retail_sale_items');
        Schema::dropIfExists('retail_sales');
        Schema::dropIfExists('customers');
    }
};
