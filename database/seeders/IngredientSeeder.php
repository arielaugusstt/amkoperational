<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use Illuminate\Database\Seeder;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        $ingredients = [
            // TIER 1 — HIGHLIGHT UTAMA HALAMAN DEPAN (dashboard_tier = 1)
            ['display_order' => 1,  'code' => 'CUP_12_AMK',     'name' => 'Gelas 12 oz Print AMK',    'category' => 'packaging', 'dashboard_tier' => 1, 'base_unit' => 'pcs',    'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => 'QTY_CUP_12'],
            ['display_order' => 2,  'code' => 'CUP_12_AMKOPI',  'name' => 'Gelas 12 oz Print AMKopi', 'category' => 'packaging', 'dashboard_tier' => 1, 'base_unit' => 'pcs',    'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => 'QTY_CUP_KOPI'],
            ['display_order' => 3,  'code' => 'CUP_16_AMK',     'name' => 'Gelas 16 oz Print AMK',    'category' => 'packaging', 'dashboard_tier' => 1, 'base_unit' => 'pcs',    'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => 'QTY_CUP_16'],
            ['display_order' => 4,  'code' => 'CUP_22_AMK',     'name' => 'Gelas 22 oz Print AMK',    'category' => 'packaging', 'dashboard_tier' => 1, 'base_unit' => 'pcs',    'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => 'QTY_CUP_22'],
            ['display_order' => 5,  'code' => 'SIRUP_AMK',      'name' => 'Sirup AMK (SB)',           'category' => 'amk',       'dashboard_tier' => 1, 'base_unit' => 'ml',     'conversion_unit' => 'botol', 'conversion_factor' => 1500, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 6,  'code' => 'PREMIK_PEACH',   'name' => 'Premik Peach',             'category' => 'amk',       'dashboard_tier' => 1, 'base_unit' => 'ml',     'conversion_unit' => 'botol', 'conversion_factor' => 1500, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 7,  'code' => 'PREMIK_MOCA',    'name' => 'Premik Moca',              'category' => 'amk',       'dashboard_tier' => 1, 'base_unit' => 'ml',     'conversion_unit' => 'botol', 'conversion_factor' => 1500, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 8,  'code' => 'PREMIK_KIWI',    'name' => 'Premik Kiwi',              'category' => 'amk',       'dashboard_tier' => 1, 'base_unit' => 'ml',     'conversion_unit' => 'botol', 'conversion_factor' => 1500, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 9,  'code' => 'KELENGKENG',     'name' => 'Kelengkeng / Longan',      'category' => 'amk',       'dashboard_tier' => 1, 'base_unit' => 'buah',   'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => 'Ref: 36-40 buah/kaleng', 'link_kode_qty_menu1' => null],
            ['display_order' => 10, 'code' => 'GULA_PASIR',     'name' => 'Gula Pasir',               'category' => 'amk',       'dashboard_tier' => 1, 'base_unit' => 'gram',   'conversion_unit' => 'kg',    'conversion_factor' => 1000, 'density_g_per_ml' => 0.85, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 11, 'code' => 'CREAMER',        'name' => 'Creamer',                  'category' => 'amk',       'dashboard_tier' => 1, 'base_unit' => 'gram',   'conversion_unit' => 'kg',    'conversion_factor' => 1000, 'density_g_per_ml' => 0.50, 'notes' => null, 'link_kode_qty_menu1' => null],

            // TIER 2 — BAHAN PENDUKUNG (dashboard_tier = 2, urutan AMK -> AMKopi -> Kurma -> Retail)
            ['display_order' => 12, 'code' => 'TEH',            'name' => 'Teh (Tea Bag)',            'category' => 'amk',       'dashboard_tier' => 2, 'base_unit' => 'bag',    'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 13, 'code' => 'AIR_PUTIH',      'name' => 'Air Putih',                'category' => 'amk',       'dashboard_tier' => 2, 'base_unit' => 'ml',     'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 14, 'code' => 'BUBUK_COFFE',    'name' => 'Bubuk Coffe',              'category' => 'amk',       'dashboard_tier' => 2, 'base_unit' => 'gram',   'conversion_unit' => 'kg',    'conversion_factor' => 1000, 'density_g_per_ml' => 0.40, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 15, 'code' => 'SERBUK_LIME',    'name' => 'Serbuk Lime',              'category' => 'amk',       'dashboard_tier' => 2, 'base_unit' => 'gram',   'conversion_unit' => 'kg',    'conversion_factor' => 1000, 'density_g_per_ml' => 0.80, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 16, 'code' => 'SERBUK_ORANGE',  'name' => 'Serbuk Orange',            'category' => 'amk',       'dashboard_tier' => 2, 'base_unit' => 'gram',   'conversion_unit' => 'kg',    'conversion_factor' => 1000, 'density_g_per_ml' => 0.80, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 17, 'code' => 'SERBUK_GUAVA',   'name' => 'Serbuk Guava',             'category' => 'amk',       'dashboard_tier' => 2, 'base_unit' => 'gram',   'conversion_unit' => 'kg',    'conversion_factor' => 1000, 'density_g_per_ml' => 0.80, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 18, 'code' => 'OREO',           'name' => 'Oreo',                     'category' => 'amk',       'dashboard_tier' => 2, 'base_unit' => 'keping', 'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 19, 'code' => 'BIANG_ARABICA',  'name' => 'Biang Arabica',            'category' => 'amkopi',    'dashboard_tier' => 2, 'base_unit' => 'ml',     'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 20, 'code' => 'BIANG_ROBUSTA',  'name' => 'Biang Robusta',            'category' => 'amkopi',    'dashboard_tier' => 2, 'base_unit' => 'ml',     'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 21, 'code' => 'SUSU',           'name' => 'Susu',                     'category' => 'amkopi',    'dashboard_tier' => 2, 'base_unit' => 'ml',     'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 22, 'code' => 'FRUKTOSE',       'name' => 'Fruktose',                 'category' => 'amkopi',    'dashboard_tier' => 2, 'base_unit' => 'ml',     'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 23, 'code' => 'SIRUP_BERRY',    'name' => 'Sirup Berry',              'category' => 'amkopi',    'dashboard_tier' => 2, 'base_unit' => 'ml',     'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 24, 'code' => 'SIRUP_CARAMEL',  'name' => 'Sirup Caramel',            'category' => 'amkopi',    'dashboard_tier' => 2, 'base_unit' => 'ml',     'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 25, 'code' => 'SIRUP_TIRAMISU', 'name' => 'Sirup Tiramissu',          'category' => 'amkopi',    'dashboard_tier' => 2, 'base_unit' => 'ml',     'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 26, 'code' => 'GULA_AREN',      'name' => 'Gula Aren',                'category' => 'amkopi',    'dashboard_tier' => 2, 'base_unit' => 'ml',     'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 27, 'code' => 'SIRUP_KURMA',    'name' => 'Sirup Kurma',              'category' => 'kurma',     'dashboard_tier' => 2, 'base_unit' => 'botol',  'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
            ['display_order' => 28, 'code' => 'LE_MINERALE',    'name' => 'Le Minerale 600 ml',       'category' => 'retail',    'dashboard_tier' => 2, 'base_unit' => 'botol',  'conversion_unit' => null,    'conversion_factor' => null, 'density_g_per_ml' => null, 'notes' => null, 'link_kode_qty_menu1' => null],
        ];

        foreach ($ingredients as $ing) {
            Ingredient::updateOrCreate(
                ['code' => $ing['code']],
                array_merge($ing, ['is_active' => true])
            );
        }
    }
}
