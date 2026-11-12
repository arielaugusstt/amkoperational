<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Master Stand (Template 1 - Sheet 1)
        Schema::create('master_stands', function (Blueprint $table) {
            $table->id();
            $table->string('kode_stand', 50)->unique();
            $table->string('nama_stand', 150);
            $table->string('wilayah_laporan', 50)->default('Utara'); // Utara / Selatan / Barat
            $table->string('blok_wa', 50)->default('Blok 1'); // Blok 1 / Blok 2 / Blok 3
            $table->integer('urutan_tampil')->default(1);
            $table->boolean('punya_amkopi')->default(false);
            $table->integer('urutan_amkopi_wa')->nullable();
            $table->boolean('tampilkan_csdng_wa')->default(false);
            $table->boolean('tampilkan_ptt_wa')->default(false);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });

        // 2. Master Konfigurasi Menu 1 - Kategori Nominal (Template 2 - Sheet 1)
        Schema::create('menu1_nominal_configs', function (Blueprint $table) {
            $table->id();
            $table->string('kode_kategori', 80)->unique();
            $table->string('label_input_nominal', 200);
            $table->string('keterangan_bantu', 255)->nullable();
            $table->integer('urutan')->default(1);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });

        // 3. Master Konfigurasi Menu 1 - Item QTY (Template 2 - Sheet 2)
        Schema::create('menu1_qty_configs', function (Blueprint $table) {
            $table->id();
            $table->string('kode_qty_menu1', 80)->unique();
            $table->string('label_input_qty', 200);
            $table->integer('urutan')->default(1);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });

        // 4. Master Menu & Harga Stand Menu 2 (Template 3)
        Schema::create('menu2_items', function (Blueprint $table) {
            $table->id();
            $table->string('kelompok_menu', 100); // AMK 27 Menu, Jumbo, Air Mineral, AMKOPI, PTT, etc.
            $table->string('kode_item', 80)->unique();
            $table->string('nama_item', 200);
            $table->bigInteger('harga_default')->default(0);
            $table->enum('recipe_status', ['Active', 'Unmapped'])->default('Active');
            $table->integer('urutan')->default(1);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('menu2_stand_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu2_item_id')->constrained('menu2_items')->cascadeOnDelete();
            $table->foreignId('stand_id')->constrained('master_stands')->cascadeOnDelete();
            $table->bigInteger('harga')->default(0);
            $table->timestamps();
            $table->unique(['menu2_item_id', 'stand_id']);
        });

        // 5. Master Bahan Baku Menu 3 & RESEPAMK (Template 4 - Sheet 1)
        Schema::create('master_ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('kode_bahan', 80)->unique();
            $table->string('kategori_bahan', 100); // Kemasan & Produk Jadi, Bahan Dasar Dapur, Direct Mix / Topping
            $table->string('nama_bahan_baku', 200);
            $table->string('satuan', 50)->default('ml'); // pcs, botol, ml, bag, sdt, porsi, gram
            $table->string('link_kode_qty_menu1', 80)->nullable(); // e.g. QTY_CUP_12
            $table->boolean('is_resep_amk_core')->default(false);
            $table->integer('urutan')->default(1);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('stand_ingredient_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stand_id')->constrained('master_stands')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('master_ingredients')->cascadeOnDelete();
            $table->decimal('stok_awal_master', 14, 2)->default(0);
            $table->decimal('stok_terkini', 14, 2)->default(0);
            $table->timestamps();
            $table->unique(['stand_id', 'ingredient_id']);
        });

        // 6. Parameter Global Resep (Template 4 - Sheet 2) with Effective Date Versioning
        Schema::create('recipe_global_params', function (Blueprint $table) {
            $table->id();
            $table->string('param_key', 80); // VOL_REG, SDK_BESAR_CREAMER, SDK_SEDANG_CREAMER, SDK_COFFEE, etc.
            $table->string('nama_parameter', 200);
            $table->decimal('nilai_param', 12, 4);
            $table->string('satuan', 50)->default('ml');
            $table->date('effective_date')->default('2026-01-01');
            $table->string('keterangan', 255)->nullable();
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
            $table->index(['param_key', 'effective_date']);
        });

        // 7. Rumus Batch Dapur / Adonan Setengah Jadi (Template 4 - Sheet 3)
        Schema::create('recipe_batches', function (Blueprint $table) {
            $table->id();
            $table->string('kode_batch', 80); // BATCH_TEA_PEKAT, BATCH_AMK_DINGIN, BATCH_AMK_TEA, BATCH_PEACH, BATCH_MOCCA, BATCH_KIWI
            $table->string('nama_batch', 200);
            $table->decimal('volume_batch_ml', 12, 2); // 2200, 1750, 1250, 1400
            $table->date('effective_date')->default('2026-01-01');
            $table->string('keterangan', 255)->nullable();
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
            $table->index(['kode_batch', 'effective_date']);
        });

        Schema::create('recipe_batch_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_batch_id')->constrained('recipe_batches')->cascadeOnDelete();
            $table->enum('tipe_komponen', ['raw_ingredient', 'sub_batch', 'water'])->default('raw_ingredient');
            $table->string('kode_referensi', 80); // kode_bahan or kode_batch or AIR
            $table->string('nama_komponen', 200);
            $table->decimal('jumlah', 12, 4);
            $table->string('satuan', 50);
            $table->timestamps();
        });

        // 8. Mapping Resep Menu 2 (Template 4 - Sheet 4)
        Schema::create('recipe_menu_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu2_item_id')->constrained('menu2_items')->cascadeOnDelete();
            $table->enum('tipe_komponen', ['batch_adonan', 'direct_ingredient'])->default('batch_adonan');
            $table->string('kode_referensi', 80); // kode_batch or kode_bahan
            $table->enum('mode_takaran', ['percent_vol_reg', 'fixed_ml_or_qty'])->default('percent_vol_reg');
            $table->decimal('nilai_takaran', 12, 4)->default(0); // e.g. 100 (for 100% VOL_REG) or 120 (120 ml) or 15 (15 ml creamer)
            $table->string('satuan', 50)->default('ml');
            $table->date('effective_date')->default('2026-01-01');
            $table->timestamps();
            $table->index(['menu2_item_id', 'effective_date']);
        });

        // 9. Transaksi Modul 1: Laporan Harian (Menu 1)
        Schema::create('daily_reports_menu1', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stand_id')->constrained('master_stands')->cascadeOnDelete();
            $table->date('tanggal');
            $table->json('spg_list'); // Array of 1 to 5 SPG IDs/Names
            $table->json('nominal_per_kategori'); // {"NOM_AMK": 1200000, "NOM_KURMA": 150000, ...}
            $table->json('penjualan_tambahan')->nullable(); // [{"keterangan": "...", "nominal": 50000}]
            $table->bigInteger('total_semua_penjualan')->default(0);
            $table->bigInteger('nominal_qris')->default(0);
            $table->bigInteger('nominal_tunai')->default(0);
            $table->json('biaya_harian')->nullable(); // [{"keterangan": "Es Batu", "nominal": 25000}, ...]
            $table->bigInteger('total_biaya')->default(0);
            $table->bigInteger('sisa_setoran_tunai')->default(0);
            $table->longText('qris_proof_base64')->nullable();
            $table->string('qris_proof_path')->nullable();
            $table->json('qty_per_item'); // {"QTY_CUP_12": 68, "QTY_CUP_22": 45, ...}
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['stand_id', 'tanggal']);
        });

        // 10. Transaksi Modul 2: Form Penjualan Detail (Menu 2)
        Schema::create('daily_sales_menu2', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stand_id')->constrained('master_stands')->cascadeOnDelete();
            $table->date('tanggal');
            $table->foreignId('menu1_report_id')->nullable()->constrained('daily_reports_menu1')->nullOnDelete();
            $table->json('items_sold'); // [{"menu2_item_id": 1, "kode_item": "AMK_ORI", "nama_item": "AMK Ori", "kelompok_menu": "AMK 27 Menu", "qty": 20, "harga": 10000, "subtotal": 200000}, ...]
            $table->json('unregistered_items')->nullable(); // Max 3 rows: [{"keterangan": "...", "qty": 2, "nominal": 25000}]
            $table->bigInteger('grand_total')->default(0);
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['stand_id', 'tanggal']);
        });

        // 11. Transaksi Modul 3: Form Bahan Baku Harian (Menu 3)
        Schema::create('daily_inventories_menu3', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stand_id')->constrained('master_stands')->cascadeOnDelete();
            $table->date('tanggal');
            $table->foreignId('menu1_report_id')->nullable()->constrained('daily_reports_menu1')->nullOnDelete();
            $table->json('inventory_items');
            // [{"ingredient_id": 1, "kode_bahan": "CUP_12", "nama_bahan_baku": "Cup 12oz", "satuan": "pcs", "stok_awal": 200, "barang_masuk": 100, "ref_menu1_qty": 68, "barang_terpakai": 68, "barang_rusak": 2, "stok_akhir": 230}]
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['stand_id', 'tanggal']);
        });

        // 12. Pengajuan Stock Opname & Approval Superadmin
        Schema::create('stock_opname_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stand_id')->constrained('master_stands')->cascadeOnDelete();
            $table->date('tanggal');
            $table->json('opname_items'); // [{"ingredient_id": 1, "kode_bahan": "CUP_12", "nama_bahan_baku": "Cup 12oz", "satuan": "pcs", "stok_sistem": 230, "stok_fisik": 225, "selisih": -5, "keterangan": "..."}]
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            $table->text('catatan_spg')->nullable();
            $table->text('catatan_superadmin')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        // 13. Pengaturan Sistem & Google Sheets Webhook
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
        Schema::dropIfExists('recipe_menu_mappings');
        Schema::dropIfExists('recipe_batch_components');
        Schema::dropIfExists('recipe_batches');
        Schema::dropIfExists('recipe_global_params');
        Schema::dropIfExists('stand_ingredient_stocks');
        Schema::dropIfExists('master_ingredients');
        Schema::dropIfExists('menu2_stand_prices');
        Schema::dropIfExists('menu2_items');
        Schema::dropIfExists('menu1_qty_configs');
        Schema::dropIfExists('menu1_nominal_configs');
        Schema::dropIfExists('master_stands');
    }
};

