<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use App\Models\MasterIngredient;
use App\Models\MasterStand;
use App\Models\Menu1NominalConfig;
use App\Models\Menu1QtyConfig;
use App\Models\Menu2Item;
use App\Models\Menu2StandPrice;
use App\Models\RecipeBatch;
use App\Models\RecipeBatchComponent;
use App\Models\RecipeGlobalParam;
use App\Models\RecipeMenuMapping;
use App\Models\StandIngredientStock;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Users (Superadmin & SPG)
        User::create([
            'id_spg' => 'ADM-01',
            'name' => 'Super Admin AMK',
            'username' => 'admin',
            'email' => 'admin@amkoperational.com',
            'pin_plain' => 'admin123',
            'password' => Hash::make('admin123'),
            'role' => 'superadmin',
            'status_aktif' => true,
        ]);

        $spgNames = [
            'Siti Rahma', 'Dewi Lestari', 'Anisa Putri', 'Rina Marlina', 'Fitri Handayani',
            'Indah Permata', 'Nadia Safitri', 'Dian Kusuma', 'Maya Anggraini', 'Putri Ayu',
            'Nurul Hidayah', 'Tri Wahyuni', 'Lestari Wulandari', 'Ratna Sari', 'Eka Novita'
        ];

        foreach ($spgNames as $index => $name) {
            $num = $index + 1;
            User::create([
                'id_spg' => sprintf('SPG-%02d', $num),
                'name' => $name,
                'username' => 'spg' . $num,
                'email' => 'spg' . $num . '@amkoperational.com',
                'pin_plain' => '1234',
                'password' => Hash::make('1234'),
                'role' => 'spg',
                'status_aktif' => true,
            ]);
        }

        // 2. Seed Master Stand (Pre-loaded Default 19 Stand)
        $stands = [
            // Blok 1: Utara / Pusat (12 Stand)
            ['kode' => 'WTC', 'nama' => 'WTC Surabaya', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 1, 'amkopi' => false, 'csdng' => true, 'ptt' => false],
            ['kode' => 'Delta', 'nama' => 'Delta Plaza', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 2, 'amkopi' => true, 'csdng' => false, 'ptt' => false, 'urutan_amkopi' => 9],
            ['kode' => 'PA 1', 'nama' => 'Plaza Atom 1', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 3, 'amkopi' => false, 'csdng' => false, 'ptt' => false],
            ['kode' => 'ITC UG', 'nama' => 'ITC Mega Grosir UG', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 4, 'amkopi' => false, 'csdng' => false, 'ptt' => false],
            ['kode' => 'BG-L2', 'nama' => 'BG Junction L2', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 5, 'amkopi' => true, 'csdng' => false, 'ptt' => false, 'urutan_amkopi' => 11],
            ['kode' => 'ITC FC 2', 'nama' => 'ITC Food Court 2', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 6, 'amkopi' => false, 'csdng' => false, 'ptt' => false],
            ['kode' => 'KAZA', 'nama' => 'Kaza City Mall', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 7, 'amkopi' => false, 'csdng' => true, 'ptt' => false],
            ['kode' => 'TP 1', 'nama' => 'Tunjungan Plaza 1', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 8, 'amkopi' => true, 'csdng' => false, 'ptt' => false, 'urutan_amkopi' => 4],
            ['kode' => 'TP 2', 'nama' => 'Tunjungan Plaza 2', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 9, 'amkopi' => true, 'csdng' => true, 'ptt' => false, 'urutan_amkopi' => 5],
            ['kode' => 'TP 3', 'nama' => 'Tunjungan Plaza 3', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 10, 'amkopi' => true, 'csdng' => false, 'ptt' => false, 'urutan_amkopi' => 6],
            ['kode' => 'BG LL', 'nama' => 'BG Junction LL', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 11, 'amkopi' => true, 'csdng' => false, 'ptt' => false, 'urutan_amkopi' => 10],
            ['kode' => 'GC', 'nama' => 'Grand City Mall', 'wilayah' => 'Utara', 'blok' => 'Blok 1', 'urutan' => 12, 'amkopi' => true, 'csdng' => false, 'ptt' => false, 'urutan_amkopi' => 8],

            // Blok 2: Selatan (6 Stand)
            ['kode' => 'R-1', 'nama' => 'Royal Plaza 1', 'wilayah' => 'Selatan', 'blok' => 'Blok 2', 'urutan' => 1, 'amkopi' => true, 'csdng' => false, 'ptt' => true, 'urutan_amkopi' => 1],
            ['kode' => 'R-2', 'nama' => 'Royal Plaza 2', 'wilayah' => 'Selatan', 'blok' => 'Blok 2', 'urutan' => 2, 'amkopi' => true, 'csdng' => false, 'ptt' => false, 'urutan_amkopi' => 2],
            ['kode' => 'SUNCITY', 'nama' => 'Suncity Mall', 'wilayah' => 'Selatan', 'blok' => 'Blok 2', 'urutan' => 3, 'amkopi' => false, 'csdng' => false, 'ptt' => false],
            ['kode' => 'LIPPO', 'nama' => 'Lippo Plaza Sidoarjo', 'wilayah' => 'Selatan', 'blok' => 'Blok 2', 'urutan' => 4, 'amkopi' => false, 'csdng' => false, 'ptt' => false],
            ['kode' => 'TRANS', 'nama' => 'Trans Icon Mall', 'wilayah' => 'Selatan', 'blok' => 'Blok 2', 'urutan' => 5, 'amkopi' => false, 'csdng' => true, 'ptt' => false],
            ['kode' => 'R-4', 'nama' => 'Royal Plaza 4', 'wilayah' => 'Selatan', 'blok' => 'Blok 2', 'urutan' => 6, 'amkopi' => true, 'csdng' => false, 'ptt' => false, 'urutan_amkopi' => 3],

            // Blok 3: Barat (1 Stand + 10 AMKopi)
            ['kode' => 'PTC', 'nama' => 'Pakuwon Trade Center', 'wilayah' => 'Barat', 'blok' => 'Blok 3', 'urutan' => 1, 'amkopi' => false, 'csdng' => false, 'ptt' => false],
        ];

        $createdStands = [];
        foreach ($stands as $s) {
            $createdStands[$s['kode']] = MasterStand::create([
                'kode_stand' => $s['kode'],
                'nama_stand' => $s['nama'],
                'wilayah_laporan' => $s['wilayah'],
                'blok_wa' => $s['blok'],
                'urutan_tampil' => $s['urutan'],
                'punya_amkopi' => $s['amkopi'],
                'urutan_amkopi_wa' => $s['urutan_amkopi'] ?? null,
                'tampilkan_csdng_wa' => $s['csdng'],
                'tampilkan_ptt_wa' => $s['ptt'],
                'status_aktif' => true,
            ]);
        }

        // 3. Seed Menu 1 Configurations
        // Sheet 1: Kategori Nominal
        $nominals = [
            ['kode' => 'NOM_AMK', 'label' => 'Nominal Total Penjualan AMK (Rp)', 'ket' => 'AMK Murni, tidak dikurangi Kurma', 'urutan' => 1],
            ['kode' => 'NOM_KURMA', 'label' => 'Nominal Total Penjualan Kurma (Rp)', 'ket' => 'Kategori Mandiri', 'urutan' => 2],
            ['kode' => 'NOM_AMKOPI', 'label' => 'Nominal Total Penjualan AMKopi (Rp)', 'ket' => 'Kategori Mandiri', 'urutan' => 3],
            ['kode' => 'NOM_PTT', 'label' => 'Nominal Total Penjualan PTT (Rp)', 'ket' => 'Penjualan PTT', 'urutan' => 4],
            ['kode' => 'NOM_MINERAL', 'label' => 'Nominal Total Penjualan Air Mineral (Rp)', 'ket' => 'Penjualan Air Mineral', 'urutan' => 5],
        ];
        foreach ($nominals as $n) {
            Menu1NominalConfig::create([
                'kode_kategori' => $n['kode'],
                'label_input_nominal' => $n['label'],
                'keterangan_bantu' => $n['ket'],
                'urutan' => $n['urutan'],
                'status_aktif' => true,
            ]);
        }

        // Sheet 2: Item QTY Menu 1
        $qtys = [
            ['kode' => 'QTY_CUP_12', 'label' => 'Cup 12 oz AMK', 'urutan' => 1],
            ['kode' => 'QTY_CUP_22', 'label' => 'Cup 22 oz AMK', 'urutan' => 2],
            ['kode' => 'QTY_CUP_16', 'label' => 'Cup 16 oz AMK', 'urutan' => 3],
            ['kode' => 'QTY_CUP_KURMA', 'label' => 'Cup Kurma', 'urutan' => 4],
            ['kode' => 'QTY_CUP_KOPI', 'label' => 'Cup AMKopi', 'urutan' => 5],
            ['kode' => 'QTY_PTT', 'label' => 'Jumlah PTT', 'urutan' => 6],
            ['kode' => 'QTY_MINERAL', 'label' => 'Jumlah Air Mineral', 'urutan' => 7],
        ];
        foreach ($qtys as $q) {
            Menu1QtyConfig::create([
                'kode_qty_menu1' => $q['kode'],
                'label_input_qty' => $q['label'],
                'urutan' => $q['urutan'],
                'status_aktif' => true,
            ]);
        }

        // 4. Seed Menu 2 Items & Prices per Stand
        $menu2Items = [
            // Kelompok: AMK 27 Menu
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'AMK_ORI', 'nama' => 'AMK Original', 'harga' => 10000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'AMK_LENGKENG', 'nama' => 'AMK Lengkeng', 'harga' => 14000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'AMK_CREAM', 'nama' => 'AMK Cream', 'harga' => 12000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'AMK_TEA_POLOS', 'nama' => 'AMK Tea Polos', 'harga' => 10000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'AMK_TEA_CREAM', 'nama' => 'AMK Tea Cream', 'harga' => 12000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'PEACH_POLOS', 'nama' => 'Peach Polos', 'harga' => 12000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'PEACH_CREAM', 'nama' => 'Peach Cream', 'harga' => 14000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'MOCCA_POLOS', 'nama' => 'Mocca Polos', 'harga' => 12000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'MOCCA_CREAM', 'nama' => 'Mocca Cream', 'harga' => 14000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'KIWI_POLOS', 'nama' => 'Kiwi Polos', 'harga' => 12000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'KIWI_CREAM', 'nama' => 'Kiwi Cream', 'harga' => 14000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'PEACH_MOCCA_POLOS', 'nama' => 'Peach Mocca Polos', 'harga' => 15000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'PEACH_MOCCA_CREAM_LIME', 'nama' => 'Peach Mocca Cream Lime', 'harga' => 17000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'KIWI_MOCCA_POLOS', 'nama' => 'Kiwi Mocca Polos', 'harga' => 15000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'KIWI_MOCCA_CREAM_LIME', 'nama' => 'Kiwi Mocca Cream Lime', 'harga' => 17000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'PEACH_KIWI_POLOS', 'nama' => 'Peach Kiwi Polos', 'harga' => 15000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'PEACH_KIWI_CREAM_LIME', 'nama' => 'Peach Kiwi Cream Lime', 'harga' => 17000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'ORANGE_POLOS', 'nama' => 'Orange Polos', 'harga' => 11000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'LIME_POLOS', 'nama' => 'Lime Polos', 'harga' => 11000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'GUAVA_POLOS', 'nama' => 'Guava Polos', 'harga' => 11000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'OREO_AMK', 'nama' => 'Oreo AMK', 'harga' => 14000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'OREO_CREAM', 'nama' => 'Oreo Cream', 'harga' => 15000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'COFFEE_AMK', 'nama' => 'Coffee AMK', 'harga' => 13000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'COFFEE_CREAM', 'nama' => 'Coffee Cream', 'harga' => 15000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'AMK_KURMA_CUP', 'nama' => 'AMK Kurma Cup', 'harga' => 15000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'AMK_KURMA_CREAM', 'nama' => 'AMK Kurma Cream', 'harga' => 17000, 'resep' => 'Active'],
            ['kelompok' => 'AMK 27 Menu', 'kode' => 'AMK_KURMA_LENGKENG', 'nama' => 'AMK Kurma Lengkeng', 'harga' => 19000, 'resep' => 'Active'],

            // Kelompok: Jumbo
            ['kelompok' => 'Jumbo', 'kode' => 'JUMBO_AMK_ORI', 'nama' => 'AMK Jumbo Original', 'harga' => 16000, 'resep' => 'Active'],
            ['kelompok' => 'Jumbo', 'kode' => 'JUMBO_AMK_LENGKENG', 'nama' => 'AMK Jumbo Lengkeng', 'harga' => 20000, 'resep' => 'Active'],
            ['kelompok' => 'Jumbo', 'kode' => 'JUMBO_AMK_TEA', 'nama' => 'AMK Jumbo Tea', 'harga' => 16000, 'resep' => 'Active'],
            ['kelompok' => 'Jumbo', 'kode' => 'JUMBO_PEACH', 'nama' => 'AMK Jumbo Peach', 'harga' => 18000, 'resep' => 'Active'],
            ['kelompok' => 'Jumbo', 'kode' => 'JUMBO_MOCCA', 'nama' => 'AMK Jumbo Mocca', 'harga' => 18000, 'resep' => 'Active'],

            // Kelompok: Air Mineral
            ['kelompok' => 'Air Mineral', 'kode' => 'MINERAL_600ML', 'nama' => 'Air Mineral 600ml', 'harga' => 5000, 'resep' => 'Active'],

            // Kelompok: AMKOPI (Status default Unmapped sesuai spec)
            ['kelompok' => 'AMKOPI', 'kode' => 'KOPI_AMKOPI_REG', 'nama' => 'AMKopi Regular', 'harga' => 12000, 'resep' => 'Unmapped'],
            ['kelompok' => 'AMKOPI', 'kode' => 'KOPI_AMKOPI_SUSU', 'nama' => 'AMKopi Susu', 'harga' => 15000, 'resep' => 'Unmapped'],
            ['kelompok' => 'AMKOPI', 'kode' => 'KOPI_AMKOPI_AREN', 'nama' => 'AMKopi Gula Aren', 'harga' => 16000, 'resep' => 'Unmapped'],

            // Kelompok: PTT
            ['kelompok' => 'PTT', 'kode' => 'PTT_CUP', 'nama' => 'PTT Cup', 'harga' => 15000, 'resep' => 'Active'],
        ];

        $createdMenuItems = [];
        $urutanMenu = 1;
        foreach ($menu2Items as $mi) {
            $item = Menu2Item::create([
                'kelompok_menu' => $mi['kelompok'],
                'kode_item' => $mi['kode'],
                'nama_item' => $mi['nama'],
                'harga_default' => $mi['harga'],
                'recipe_status' => $mi['resep'],
                'urutan' => $urutanMenu++,
                'status_aktif' => true,
            ]);
            $createdMenuItems[$mi['kode']] = $item;

            // Generate harga per Stand (Default sama dengan harga_default, TP & Mall Premium bisa disesuaikan)
            foreach ($createdStands as $stand) {
                $customHarga = $mi['harga'];
                // Contoh diferensiasi harga di TP jika diperlukan
                if (in_array($stand->kode_stand, ['TP 1', 'TP 2', 'TP 3']) && $mi['kelompok'] === 'AMK 27 Menu') {
                    $customHarga = $mi['harga'] + 1000;
                }
                Menu2StandPrice::create([
                    'menu2_item_id' => $item->id,
                    'stand_id' => $stand->id,
                    'harga' => $customHarga,
                ]);
            }
        }

        // 5. Seed Master Bahan Baku Menu 3 & RESEPAMK Core
        $ingredients = [
            // Kemasan & Produk Jadi
            ['kode' => 'CUP_12', 'kategori' => 'Kemasan', 'nama' => 'Cup 12oz', 'satuan' => 'pcs', 'link' => 'QTY_CUP_12', 'core' => false, 'stok' => 300],
            ['kode' => 'CUP_16', 'kategori' => 'Kemasan', 'nama' => 'Cup 16oz', 'satuan' => 'pcs', 'link' => 'QTY_CUP_16', 'core' => false, 'stok' => 200],
            ['kode' => 'CUP_22', 'kategori' => 'Kemasan', 'nama' => 'Cup 22oz', 'satuan' => 'pcs', 'link' => 'QTY_CUP_22', 'core' => false, 'stok' => 250],
            ['kode' => 'CUP_KURMA', 'kategori' => 'Kemasan', 'nama' => 'Cup Kurma', 'satuan' => 'pcs', 'link' => 'QTY_CUP_KURMA', 'core' => false, 'stok' => 150],
            ['kode' => 'CUP_KOPI', 'kategori' => 'Kemasan', 'nama' => 'Cup AMKopi', 'satuan' => 'pcs', 'link' => 'QTY_CUP_KOPI', 'core' => false, 'stok' => 200],
            ['kode' => 'MINERAL', 'kategori' => 'Produk Jadi', 'nama' => 'Air Mineral', 'satuan' => 'btl', 'link' => 'QTY_MINERAL', 'core' => false, 'stok' => 48],
            ['kode' => 'PTT', 'kategori' => 'Produk Jadi', 'nama' => 'PTT', 'satuan' => 'pcs', 'link' => null, 'core' => false, 'stok' => 50],

            // 13 Bahan Baku Utama RESEPAMK
            // 6 Bahan Dasar (Batch Dapur)
            ['kode' => 'SYRUP_AMK', 'kategori' => 'Bahan Dasar Dapur', 'nama' => 'Syrup Biang AMK', 'satuan' => 'ml', 'link' => null, 'core' => true, 'stok' => 5000],
            ['kode' => 'TEA_BAG', 'kategori' => 'Bahan Dasar Dapur', 'nama' => 'Tea Bag', 'satuan' => 'bag', 'link' => null, 'core' => true, 'stok' => 100],
            ['kode' => 'GULA_PASIR', 'kategori' => 'Bahan Dasar Dapur', 'nama' => 'Gula Pasir', 'satuan' => 'ml', 'link' => null, 'core' => true, 'stok' => 3000],
            ['kode' => 'PREMIX_PEACH', 'kategori' => 'Bahan Dasar Dapur', 'nama' => 'Sirup Premix Peach', 'satuan' => 'ml', 'link' => null, 'core' => true, 'stok' => 2000],
            ['kode' => 'PREMIX_MOCCA', 'kategori' => 'Bahan Dasar Dapur', 'nama' => 'Sirup Premix Mocca', 'satuan' => 'ml', 'link' => null, 'core' => true, 'stok' => 2000],
            ['kode' => 'PREMIX_KIWI', 'kategori' => 'Bahan Dasar Dapur', 'nama' => 'Sirup Premix Kiwi', 'satuan' => 'ml', 'link' => null, 'core' => true, 'stok' => 2000],

            // 7 Bahan Tambahan Langsung (Direct Mix / Topping)
            ['kode' => 'CREAMER', 'kategori' => 'Direct Mix / Topping', 'nama' => 'Creamer', 'satuan' => 'ml', 'link' => null, 'core' => true, 'stok' => 1500],
            ['kode' => 'COFFEE', 'kategori' => 'Direct Mix / Topping', 'nama' => 'Coffee', 'satuan' => 'ml', 'link' => null, 'core' => true, 'stok' => 1000],
            ['kode' => 'PERASA_ORANGE', 'kategori' => 'Direct Mix / Topping', 'nama' => 'Perasa Orange', 'satuan' => 'ml', 'link' => null, 'core' => true, 'stok' => 500],
            ['kode' => 'PERASA_LIME', 'kategori' => 'Direct Mix / Topping', 'nama' => 'Perasa Lime', 'satuan' => 'ml', 'link' => null, 'core' => true, 'stok' => 500],
            ['kode' => 'PERASA_GUAVA', 'kategori' => 'Direct Mix / Topping', 'nama' => 'Perasa Guava', 'satuan' => 'ml', 'link' => null, 'core' => true, 'stok' => 500],
            ['kode' => 'OREO', 'kategori' => 'Direct Mix / Topping', 'nama' => 'Oreo', 'satuan' => 'pcs', 'link' => null, 'core' => true, 'stok' => 60],
            ['kode' => 'LENGKENG', 'kategori' => 'Direct Mix / Topping', 'nama' => 'Lengkeng', 'satuan' => 'porsi', 'link' => null, 'core' => true, 'stok' => 80],
        ];

        $createdIngredients = [];
        $urutanIng = 1;
        foreach ($ingredients as $ing) {
            $created = MasterIngredient::create([
                'kode_bahan' => $ing['kode'],
                'kategori_bahan' => $ing['kategori'],
                'nama_bahan_baku' => $ing['nama'],
                'satuan' => $ing['satuan'],
                'link_kode_qty_menu1' => $ing['link'],
                'is_resep_amk_core' => $ing['core'],
                'urutan' => $urutanIng++,
                'status_aktif' => true,
            ]);
            $createdIngredients[$ing['kode']] = $created;

            // Seed initial stock per stand
            foreach ($createdStands as $stand) {
                StandIngredientStock::create([
                    'stand_id' => $stand->id,
                    'ingredient_id' => $created->id,
                    'stok_awal_master' => $ing['stok'],
                    'stok_terkini' => $ing['stok'],
                ]);
            }
        }

        // 6. Parameter Global Resep (Effective Date Versioning)
        $globalParams = [
            ['key' => 'VOL_REG', 'nama' => 'Volume Saji Reguler per Cup', 'nilai' => 185.0, 'satuan' => 'ml', 'date' => '2026-01-01', 'ket' => 'Default 185ml (opsi cepat 190ml / 170ml)'],
            ['key' => 'VOL_JUMBO', 'nama' => 'Volume Saji Jumbo per Cup', 'nilai' => 350.0, 'satuan' => 'ml', 'date' => '2026-01-01', 'ket' => 'Porsi Jumbo 22oz'],
            ['key' => 'SDK_BESAR_CREAMER', 'nama' => 'Takaran Sendok Besar Creamer', 'nilai' => 15.0, 'satuan' => 'ml', 'date' => '2026-01-01', 'ket' => 'Sendok besar creamer'],
            ['key' => 'SDK_SEDANG_CREAMER', 'nama' => 'Takaran Sendok Sedang Creamer', 'nilai' => 7.5, 'satuan' => 'ml', 'date' => '2026-01-01', 'ket' => 'Sendok sedang creamer (varian 2-in-1)'],
            ['key' => 'STD_COFFEE', 'nama' => 'Takaran Standar Coffee', 'nilai' => 15.0, 'satuan' => 'ml', 'date' => '2026-01-01', 'ket' => 'Direct mix coffee'],
            ['key' => 'TAK_2SDK_PERASA', 'nama' => 'Takaran 2 Sendok Kecil Perasa Buah', 'nilai' => 10.0, 'satuan' => 'ml', 'date' => '2026-01-01', 'ket' => 'Perasa Orange/Lime/Guava polos'],
            ['key' => 'TAK_1SDK_PERASA', 'nama' => 'Takaran 1 Sendok Kecil Perasa Buah', 'nilai' => 5.0, 'satuan' => 'ml', 'date' => '2026-01-01', 'ket' => 'Perasa Lime pada varian 2-in-1 Cream Lime'],
            ['key' => 'STD_OREO', 'nama' => 'Takaran Oreo per Cup', 'nilai' => 1.0, 'satuan' => 'pcs', 'date' => '2026-01-01', 'ket' => '1 keping biskuit oreo'],
            ['key' => 'STD_LENGKENG', 'nama' => 'Porsi Lengkeng per Cup', 'nilai' => 1.0, 'satuan' => 'porsi', 'date' => '2026-01-01', 'ket' => '1 porsi lengkeng'],
        ];

        foreach ($globalParams as $gp) {
            RecipeGlobalParam::create([
                'param_key' => $gp['key'],
                'nama_parameter' => $gp['nama'],
                'nilai_param' => $gp['nilai'],
                'satuan' => $gp['satuan'],
                'effective_date' => $gp['date'],
                'keterangan' => $gp['ket'],
                'status_aktif' => true,
            ]);
        }

        // 7. Rumus Batch Dapur / Adonan Setengah Jadi (Layer 2)
        $batches = [
            [
                'kode' => 'BATCH_TEA_PEKAT',
                'nama' => 'Batch Tea Pekat (2.200 ml)',
                'volume' => 2200,
                'components' => [
                    ['tipe' => 'raw_ingredient', 'ref' => 'TEA_BAG', 'nama' => 'Tea Bag', 'jumlah' => 12, 'satuan' => 'bag'],
                    ['tipe' => 'water', 'ref' => 'AIR', 'nama' => 'Air Panas', 'jumlah' => 2200, 'satuan' => 'ml'],
                ]
            ],
            [
                'kode' => 'BATCH_AMK_DINGIN',
                'nama' => 'Batch Adonan AMK Dingin (1.750 ml)',
                'volume' => 1750,
                'components' => [
                    ['tipe' => 'raw_ingredient', 'ref' => 'SYRUP_AMK', 'nama' => 'Syrup Biang AMK', 'jumlah' => 250, 'satuan' => 'ml'],
                    ['tipe' => 'water', 'ref' => 'AIR', 'nama' => 'Air', 'jumlah' => 1500, 'satuan' => 'ml'],
                ]
            ],
            [
                'kode' => 'BATCH_AMK_TEA',
                'nama' => 'Batch Adonan AMK Tea (1.250 ml)',
                'volume' => 1250,
                'components' => [
                    ['tipe' => 'sub_batch', 'ref' => 'BATCH_TEA_PEKAT', 'nama' => 'Tea Pekat', 'jumlah' => 600, 'satuan' => 'ml'],
                    ['tipe' => 'sub_batch', 'ref' => 'BATCH_AMK_DINGIN', 'nama' => 'Adonan AMK Dingin', 'jumlah' => 250, 'satuan' => 'ml'],
                    ['tipe' => 'raw_ingredient', 'ref' => 'GULA_PASIR', 'nama' => 'Gula Pasir', 'jumlah' => 100, 'satuan' => 'ml'],
                    ['tipe' => 'water', 'ref' => 'AIR', 'nama' => 'Air', 'jumlah' => 400, 'satuan' => 'ml'],
                ]
            ],
            [
                'kode' => 'BATCH_PEACH',
                'nama' => 'Batch Adonan Varian Peach (1.400 ml)',
                'volume' => 1400,
                'components' => [
                    ['tipe' => 'raw_ingredient', 'ref' => 'PREMIX_PEACH', 'nama' => 'Sirup Premix Peach', 'jumlah' => 200, 'satuan' => 'ml'],
                    ['tipe' => 'sub_batch', 'ref' => 'BATCH_TEA_PEKAT', 'nama' => 'Tea Pekat', 'jumlah' => 500, 'satuan' => 'ml'],
                    ['tipe' => 'water', 'ref' => 'AIR', 'nama' => 'Air', 'jumlah' => 700, 'satuan' => 'ml'],
                ]
            ],
            [
                'kode' => 'BATCH_MOCCA',
                'nama' => 'Batch Adonan Varian Mocca (1.400 ml)',
                'volume' => 1400,
                'components' => [
                    ['tipe' => 'raw_ingredient', 'ref' => 'PREMIX_MOCCA', 'nama' => 'Sirup Premix Mocca', 'jumlah' => 200, 'satuan' => 'ml'],
                    ['tipe' => 'sub_batch', 'ref' => 'BATCH_TEA_PEKAT', 'nama' => 'Tea Pekat', 'jumlah' => 500, 'satuan' => 'ml'],
                    ['tipe' => 'water', 'ref' => 'AIR', 'nama' => 'Air', 'jumlah' => 700, 'satuan' => 'ml'],
                ]
            ],
            [
                'kode' => 'BATCH_KIWI',
                'nama' => 'Batch Adonan Varian Kiwi (1.400 ml)',
                'volume' => 1400,
                'components' => [
                    ['tipe' => 'raw_ingredient', 'ref' => 'PREMIX_KIWI', 'nama' => 'Sirup Premix Kiwi', 'jumlah' => 200, 'satuan' => 'ml'],
                    ['tipe' => 'sub_batch', 'ref' => 'BATCH_TEA_PEKAT', 'nama' => 'Tea Pekat', 'jumlah' => 500, 'satuan' => 'ml'],
                    ['tipe' => 'water', 'ref' => 'AIR', 'nama' => 'Air', 'jumlah' => 700, 'satuan' => 'ml'],
                ]
            ],
        ];

        foreach ($batches as $b) {
            $createdBatch = RecipeBatch::create([
                'kode_batch' => $b['kode'],
                'nama_batch' => $b['nama'],
                'volume_batch_ml' => $b['volume'],
                'effective_date' => '2026-01-01',
                'status_aktif' => true,
            ]);

            foreach ($b['components'] as $comp) {
                RecipeBatchComponent::create([
                    'recipe_batch_id' => $createdBatch->id,
                    'tipe_komponen' => $comp['tipe'],
                    'kode_referensi' => $comp['ref'],
                    'nama_komponen' => $comp['nama'],
                    'jumlah' => $comp['jumlah'],
                    'satuan' => $comp['satuan'],
                ]);
            }
        }

        // 8. Mapping Resep Menu 2 (Layer 3)
        // Single base 100% VOL_REG
        $mappingRules = [
            'AMK_ORI' => [['adonan', 'BATCH_AMK_DINGIN', 'percent', 100]],
            'AMK_LENGKENG' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'LENGKENG', 'fixed', 1, 'porsi']
            ],
            'AMK_CREAM' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'CREAMER', 'fixed', 15, 'ml']
            ],
            'AMK_TEA_POLOS' => [['adonan', 'BATCH_AMK_TEA', 'percent', 100]],
            'AMK_TEA_CREAM' => [
                ['adonan', 'BATCH_AMK_TEA', 'percent', 100],
                ['direct', 'CREAMER', 'fixed', 15, 'ml']
            ],
            'PEACH_POLOS' => [['adonan', 'BATCH_PEACH', 'percent', 100]],
            'PEACH_CREAM' => [
                ['adonan', 'BATCH_PEACH', 'percent', 100],
                ['direct', 'CREAMER', 'fixed', 15, 'ml']
            ],
            'MOCCA_POLOS' => [['adonan', 'BATCH_MOCCA', 'percent', 100]],
            'MOCCA_CREAM' => [
                ['adonan', 'BATCH_MOCCA', 'percent', 100],
                ['direct', 'CREAMER', 'fixed', 15, 'ml']
            ],
            'KIWI_POLOS' => [['adonan', 'BATCH_KIWI', 'percent', 100]],
            'KIWI_CREAM' => [
                ['adonan', 'BATCH_KIWI', 'percent', 100],
                ['direct', 'CREAMER', 'fixed', 15, 'ml']
            ],
            // 2-in-1 Blending
            'PEACH_MOCCA_POLOS' => [
                ['adonan', 'BATCH_PEACH', 'fixed', 120, 'ml'],
                ['adonan', 'BATCH_MOCCA', 'fixed', 180, 'ml'],
            ],
            'PEACH_MOCCA_CREAM_LIME' => [
                ['adonan', 'BATCH_PEACH', 'fixed', 100, 'ml'],
                ['adonan', 'BATCH_MOCCA', 'fixed', 150, 'ml'],
                ['direct', 'CREAMER', 'fixed', 7.5, 'ml'],
                ['direct', 'PERASA_LIME', 'fixed', 5.0, 'ml'],
            ],
            'KIWI_MOCCA_POLOS' => [
                ['adonan', 'BATCH_KIWI', 'fixed', 160, 'ml'],
                ['adonan', 'BATCH_MOCCA', 'fixed', 140, 'ml'],
            ],
            'KIWI_MOCCA_CREAM_LIME' => [
                ['adonan', 'BATCH_KIWI', 'fixed', 130, 'ml'],
                ['adonan', 'BATCH_MOCCA', 'fixed', 120, 'ml'],
                ['direct', 'CREAMER', 'fixed', 7.5, 'ml'],
                ['direct', 'PERASA_LIME', 'fixed', 5.0, 'ml'],
            ],
            'PEACH_KIWI_POLOS' => [
                ['adonan', 'BATCH_PEACH', 'fixed', 120, 'ml'],
                ['adonan', 'BATCH_KIWI', 'fixed', 180, 'ml'],
            ],
            'PEACH_KIWI_CREAM_LIME' => [
                ['adonan', 'BATCH_PEACH', 'fixed', 100, 'ml'],
                ['adonan', 'BATCH_KIWI', 'fixed', 150, 'ml'],
                ['direct', 'CREAMER', 'fixed', 7.5, 'ml'],
                ['direct', 'PERASA_LIME', 'fixed', 5.0, 'ml'],
            ],
            // Perasa Polos
            'ORANGE_POLOS' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'PERASA_ORANGE', 'fixed', 10, 'ml']
            ],
            'LIME_POLOS' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'PERASA_LIME', 'fixed', 10, 'ml']
            ],
            'GUAVA_POLOS' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'PERASA_GUAVA', 'fixed', 10, 'ml']
            ],
            // Oreo
            'OREO_AMK' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'OREO', 'fixed', 1, 'pcs']
            ],
            'OREO_CREAM' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'CREAMER', 'fixed', 15, 'ml'],
                ['direct', 'OREO', 'fixed', 1, 'pcs']
            ],
            // Coffee
            'COFFEE_AMK' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'COFFEE', 'fixed', 15, 'ml']
            ],
            'COFFEE_CREAM' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'CREAMER', 'fixed', 15, 'ml'],
                ['direct', 'COFFEE', 'fixed', 15, 'ml']
            ],
            // Kurma
            'AMK_KURMA_CUP' => [['adonan', 'BATCH_AMK_DINGIN', 'percent', 100]],
            'AMK_KURMA_CREAM' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'CREAMER', 'fixed', 15, 'ml']
            ],
            'AMK_KURMA_LENGKENG' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'percent', 100],
                ['direct', 'LENGKENG', 'fixed', 1, 'porsi']
            ],
            // Jumbo
            'JUMBO_AMK_ORI' => [['adonan', 'BATCH_AMK_DINGIN', 'fixed', 350, 'ml']],
            'JUMBO_AMK_LENGKENG' => [
                ['adonan', 'BATCH_AMK_DINGIN', 'fixed', 350, 'ml'],
                ['direct', 'LENGKENG', 'fixed', 1.5, 'porsi']
            ],
            'JUMBO_AMK_TEA' => [['adonan', 'BATCH_AMK_TEA', 'fixed', 350, 'ml']],
            'JUMBO_PEACH' => [['adonan', 'BATCH_PEACH', 'fixed', 350, 'ml']],
            'JUMBO_MOCCA' => [['adonan', 'BATCH_MOCCA', 'fixed', 350, 'ml']],
        ];

        foreach ($mappingRules as $itemCode => $rules) {
            if (isset($createdMenuItems[$itemCode])) {
                $itemId = $createdMenuItems[$itemCode]->id;
                foreach ($rules as $r) {
                    RecipeMenuMapping::create([
                        'menu2_item_id' => $itemId,
                        'tipe_komponen' => $r[0] === 'adonan' ? 'batch_adonan' : 'direct_ingredient',
                        'kode_referensi' => $r[1],
                        'mode_takaran' => $r[2] === 'percent' ? 'percent_vol_reg' : 'fixed_ml_or_qty',
                        'nilai_takaran' => $r[3],
                        'satuan' => $r[4] ?? 'ml',
                        'effective_date' => '2026-01-01',
                    ]);
                }
            }
        }

        // 9. App Settings
        AppSetting::create([
            'setting_key' => 'google_sheets_webhook_url',
            'setting_value' => '',
        ]);
        AppSetting::create([
            'setting_key' => 'google_sheets_sync_enabled',
            'setting_value' => 'false',
        ]);
        AppSetting::create([
            'setting_key' => 'wa_header_title',
            'setting_value' => 'LAPORAN HARIAN AMK & AMKOPI',
        ]);
    }
}
