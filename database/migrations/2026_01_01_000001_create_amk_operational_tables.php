<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Outlets (Master Stand)
        Schema::create('outlets', function (Blueprint $table) {
            $table->id();
            $table->string('kode_stand', 50)->unique();
            $table->string('nama_stand', 150);
            $table->string('wilayah_laporan', 50)->default('Utara');
            $table->string('blok_wa', 50)->default('Blok 1');
            $table->integer('urutan_tampil')->default(1);
            $table->boolean('punya_amkopi')->default(false);
            $table->integer('urutan_amkopi_wa')->nullable();
            $table->boolean('tampilkan_csdng_wa')->default(false);
            $table->boolean('tampilkan_ptt_wa')->default(false);
            $table->boolean('is_premium')->default(false);
            $table->string('price_tier', 30)->default('all_outlet'); // all_outlet|tp1|ptc|tp2
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });

        // 2. Layer 1 — Bahan Baku Murni & Kemasan
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('code', 80)->unique();
            $table->string('name', 200);
            $table->string('category', 50)->default('amk'); // amk|amkopi|kurma|packaging|retail
            $table->tinyInteger('dashboard_tier')->default(1); // 1|2
            $table->string('base_unit', 50)->default('ml'); // ml|gram|buah|bag|keping|botol|pcs
            $table->string('conversion_unit', 50)->nullable(); // botol|kg
            $table->decimal('conversion_factor', 12, 4)->nullable(); // 1500 or 1000
            $table->decimal('density_g_per_ml', 8, 4)->nullable();
            $table->integer('display_order')->default(1);
            $table->string('notes', 255)->nullable();
            $table->string('link_kode_qty_menu1', 80)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Layer 2 — 7 Base Adonan
        Schema::create('base_recipes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 80)->unique();
            $table->string('name', 200);
            $table->decimal('yield_ml', 12, 4);
            $table->timestamps();
        });

        Schema::create('base_recipe_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('base_recipe_id')->constrained('base_recipes')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->nullable()->constrained('ingredients')->cascadeOnDelete();
            $table->foreignId('child_base_recipe_id')->nullable()->constrained('base_recipes')->cascadeOnDelete();
            $table->decimal('quantity', 12, 6);
            $table->string('unit', 50);
            $table->timestamps();
        });

        // 4. Layer 3 — 54 Menu LISTMENUAMK
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->integer('sort_order')->default(1);
            $table->string('name', 200);
            $table->string('menu_group', 50); // amk_reguler|amk_jumbo|amk_premium|amkopi|amk_kurma|kemasan
            $table->string('report_category', 50); // amk_murni|amkopi|kurma|kemasan
            $table->foreignId('cup_ingredient_id')->nullable()->constrained('ingredients')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('menu_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->string('price_tier', 30); // all_outlet|tp1|ptc|tp2
            $table->integer('price')->nullable();
            $table->timestamps();
            $table->unique(['menu_id', 'price_tier']);
        });

        Schema::create('menu_recipe_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->foreignId('base_recipe_id')->nullable()->constrained('base_recipes')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->nullable()->constrained('ingredients')->cascadeOnDelete();
            $table->decimal('quantity', 12, 6);
            $table->string('input_unit', 50);
            $table->timestamps();
        });

        // 5. Master Konfigurasi Menu 1 (Protected operational tables)
        Schema::create('menu1_nominal_configs', function (Blueprint $table) {
            $table->id();
            $table->string('kode_kategori', 80)->unique();
            $table->string('label_input_nominal', 200);
            $table->string('keterangan_bantu', 255)->nullable();
            $table->integer('urutan')->default(1);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('menu1_qty_configs', function (Blueprint $table) {
            $table->id();
            $table->string('kode_qty_menu1', 80)->unique();
            $table->string('label_input_qty', 200);
            $table->integer('urutan')->default(1);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });

        // 6. Stand Ingredient Stocks
        Schema::create('stand_ingredient_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stand_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->decimal('stok_awal_master', 14, 2)->default(0);
            $table->decimal('stok_terkini', 14, 2)->default(0);
            $table->timestamps();
            $table->unique(['stand_id', 'ingredient_id']);
        });

        // 7. Transaksi Modul 1: Laporan Harian (Menu 1) & QRIS Settlement
        Schema::create('daily_reports_menu1', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stand_id')->constrained('outlets')->cascadeOnDelete();
            $table->date('tanggal');
            $table->json('spg_list');
            $table->json('nominal_per_kategori');
            $table->json('penjualan_tambahan')->nullable();
            $table->bigInteger('total_semua_penjualan')->default(0);
            $table->bigInteger('nominal_qris')->default(0);
            $table->bigInteger('nominal_tunai')->default(0);
            $table->json('biaya_harian')->nullable();
            $table->bigInteger('total_biaya')->default(0);
            $table->bigInteger('sisa_setoran_tunai')->default(0);
            $table->longText('qris_proof_base64')->nullable();
            $table->string('qris_proof_path')->nullable();
            $table->json('qty_per_item');
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['stand_id', 'tanggal']);
        });

        // 8. Transaksi Modul 2: Form Penjualan Detail (Menu 2)
        Schema::create('daily_sales_menu2', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stand_id')->constrained('outlets')->cascadeOnDelete();
            $table->date('tanggal');
            $table->foreignId('menu1_report_id')->nullable()->constrained('daily_reports_menu1')->nullOnDelete();
            $table->json('items_sold');
            $table->json('unregistered_items')->nullable();
            $table->bigInteger('grand_total')->default(0);
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['stand_id', 'tanggal']);
        });

        // 9. Transaksi Modul 3: Form Bahan Baku Harian (Menu 3)
        Schema::create('daily_inventories_menu3', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stand_id')->constrained('outlets')->cascadeOnDelete();
            $table->date('tanggal');
            $table->foreignId('menu1_report_id')->nullable()->constrained('daily_reports_menu1')->nullOnDelete();
            $table->json('inventory_items');
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['stand_id', 'tanggal']);
        });

        // 10. Pengajuan Stock Opname & Approval Superadmin
        Schema::create('stock_opname_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stand_id')->constrained('outlets')->cascadeOnDelete();
            $table->date('tanggal');
            $table->json('opname_items');
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            $table->text('catatan_spg')->nullable();
            $table->text('catatan_superadmin')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        // 11. Pengaturan Sistem & Google Sheets Webhook
        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key', 100)->unique();
            $table->text('setting_value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
        Schema::dropIfExists('stock_opname_requests');
        Schema::dropIfExists('daily_inventories_menu3');
        Schema::dropIfExists('daily_sales_menu2');
        Schema::dropIfExists('daily_reports_menu1');
        Schema::dropIfExists('stand_ingredient_stocks');
        Schema::dropIfExists('menu1_qty_configs');
        Schema::dropIfExists('menu1_nominal_configs');
        Schema::dropIfExists('menu_recipe_items');
        Schema::dropIfExists('menu_prices');
        Schema::dropIfExists('menus');
        Schema::dropIfExists('base_recipe_items');
        Schema::dropIfExists('base_recipes');
        Schema::dropIfExists('ingredients');
        Schema::dropIfExists('outlets');

        // Legacy tables drop if present
        Schema::dropIfExists('recipe_menu_mappings');
        Schema::dropIfExists('recipe_batch_components');
        Schema::dropIfExists('recipe_batches');
        Schema::dropIfExists('recipe_global_params');
        Schema::dropIfExists('master_ingredients');
        Schema::dropIfExists('menu2_stand_prices');
        Schema::dropIfExists('menu2_items');
        Schema::dropIfExists('master_stands');
    }
};
