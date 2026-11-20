<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use App\Models\Menu1NominalConfig;
use App\Models\Menu1QtyConfig;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Protected Users / Auth (Superadmin) — use firstOrCreate to preserve custom changed password
        User::firstOrCreate(
            ['username' => 'admin'],
            [
                'id_spg' => 'ADM-01',
                'name' => 'Superadmin AMK',
                'email' => 'admin@amk.ops',
                'role' => 'superadmin',
                'password' => Hash::make('admin123'),
                'pin_plain' => 'admin123',
                'status_aktif' => true,
            ]
        );

        // 2. Protected Menu 1 Nominal & QTY Configs (for Daily Cash/QRIS/WA Reports)
        $nominals = [
            ['kode_kategori' => 'NOM_AMK',    'label_input_nominal' => 'Penjualan AMK Murni (Rp)',   'keterangan_bantu' => 'Total omzet seluruh varian AMK Reguler, Jumbo & Premium (tanpa Kurma)', 'urutan' => 1],
            ['kode_kategori' => 'NOM_KURMA',  'label_input_nominal' => 'Penjualan AMK Kurma (Rp)',   'keterangan_bantu' => 'Total omzet khusus menu AMK Kurma', 'urutan' => 2],
            ['kode_kategori' => 'NOM_AMKOPI', 'label_input_nominal' => 'Penjualan AMKopi (Rp)',      'keterangan_bantu' => 'Total omzet khusus menu AMKopi', 'urutan' => 3],
            ['kode_kategori' => 'NOM_KEMASAN','label_input_nominal' => 'Penjualan Air Mineral (Rp)', 'keterangan_bantu' => 'Total omzet penjualan Le Minerale 600 ml', 'urutan' => 4],
        ];
        foreach ($nominals as $nom) {
            Menu1NominalConfig::updateOrCreate(
                ['kode_kategori' => $nom['kode_kategori']],
                array_merge($nom, ['status_aktif' => true])
            );
        }

        $qtys = [
            ['kode_qty_menu1' => 'QTY_CUP_12',    'label_input_qty' => 'Cup Kecil 12 oz AMK (Ck)',    'urutan' => 1],
            ['kode_qty_menu1' => 'QTY_CUP_22',    'label_input_qty' => 'Cup Besar 22 oz AMK (Cb)',    'urutan' => 2],
            ['kode_qty_menu1' => 'QTY_CUP_16',    'label_input_qty' => 'Cup Sedang 16 oz (Csdng)',    'urutan' => 3],
            ['kode_qty_menu1' => 'QTY_CUP_KURMA', 'label_input_qty' => 'Cup Kurma 22 oz (Cb Kurma)',  'urutan' => 4],
            ['kode_qty_menu1' => 'QTY_CUP_KOPI',  'label_input_qty' => 'Cup AMKopi 12 oz (Ck Kopi)',  'urutan' => 5],
            ['kode_qty_menu1' => 'QTY_PTT',       'label_input_qty' => 'Cup Potato / PTT',            'urutan' => 6],
        ];
        foreach ($qtys as $q) {
            Menu1QtyConfig::updateOrCreate(
                ['kode_qty_menu1' => $q['kode_qty_menu1']],
                array_merge($q, ['status_aktif' => true])
            );
        }

        // 3. Protected App Settings (Google Sheets Webhook)
        AppSetting::updateOrCreate(
            ['setting_key' => 'google_sheets_webhook_url'],
            ['setting_value' => '']
        );

        // 4. Seed 3-Layer Recursive BOM Master Data
        $this->call([
            OutletSeeder::class,
            IngredientSeeder::class,
            BaseRecipeSeeder::class,
            MenuSeeder::class,
        ]);
    }
}
