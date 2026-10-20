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
        // People (or contract crews) paid by the factory.
        Schema::create('workers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 20)->nullable();
            // "hourly": paid by time in and out. "contract": paid per kg, bag or job.
            $table->string('pay_type', 10);
            $table->decimal('hourly_rate', 8, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index('name');
        });

        // One line per hourly worker per day.
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->date('work_date')->index();
            $table->foreignId('worker_id')->constrained()->restrictOnDelete();
            $table->time('time_in');
            $table->time('time_out');
            $table->decimal('hours', 5, 2);
            // Copied from the worker when recorded, so a later rate change does not rewrite history.
            $table->decimal('rate', 8, 2);
            $table->decimal('amount', 10, 2);
            $table->string('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();

            $table->unique(['worker_id', 'work_date']);
        });

        // Contract jobs and their current rates, e.g. "Bagging" at ৳8 per bag.
        Schema::create('piece_rates', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            // kg, bag, ton or job.
            $table->string('unit', 10);
            $table->decimal('rate', 8, 2);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('piece_works', function (Blueprint $table) {
            $table->id();
            $table->date('work_date')->index();
            $table->foreignId('worker_id')->constrained()->restrictOnDelete();
            $table->foreignId('piece_rate_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 10, 2);
            // Copied from the job when recorded.
            $table->decimal('rate', 8, 2);
            $table->decimal('amount', 10, 2);
            $table->string('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
        });

        // Extra money such as heat, cold or Eid bonuses.
        Schema::create('wage_bonuses', function (Blueprint $table) {
            $table->id();
            $table->date('given_on')->index();
            $table->foreignId('worker_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('reason');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('wage_payments', function (Blueprint $table) {
            $table->id();
            $table->date('paid_on')->index();
            $table->foreignId('worker_id')->constrained()->restrictOnDelete();
            $table->date('period_from');
            $table->date('period_to');
            $table->decimal('amount', 10, 2);
            $table->string('method', 20);
            $table->string('reference', 100)->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wage_payments');
        Schema::dropIfExists('wage_bonuses');
        Schema::dropIfExists('piece_works');
        Schema::dropIfExists('piece_rates');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('workers');
    }
};
