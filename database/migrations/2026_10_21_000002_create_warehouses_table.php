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
        // Auction warehouses where invoices wait to be sold; brokers sell from here.
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('auction_invoices', function (Blueprint $table) {
            $table->foreignId('warehouse_id')->nullable()->after('broker_id')->constrained()->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auction_invoices', fn (Blueprint $table) => $table->dropConstrainedForeignId('warehouse_id'));
        Schema::dropIfExists('warehouses');
    }
};
