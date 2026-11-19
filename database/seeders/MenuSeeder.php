<?php

namespace Database\Seeders;

use App\Models\BaseRecipe;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\MenuPrice;
use App\Models\MenuRecipeItem;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $ing = Ingredient::pluck('id', 'code');
        $base = BaseRecipe::pluck('id', 'code');

        $menus = [
            // --- KELOMPOK 1: AMK REGULER (1..27) ---
            [1,  'AMK',              'amk_reguler', 'amk_murni', 'CUP_12_AMK', [8000, 8000, 8000, null], [['base' => 'BASE_AMK', 'qty' => 180, 'unit' => 'ml']]],
            [2,  'AMK Ori',          'amk_reguler', 'amk_murni', 'CUP_12_AMK', [10000, 10000, 10000, null], [['base' => 'BASE_AMK', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'KELENGKENG', 'qty' => 2, 'unit' => 'buah']]],
            [3,  'AMK Cream',        'amk_reguler', 'amk_murni', 'CUP_12_AMK', [9000, 9000, 9000, null], [['base' => 'BASE_AMK', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 7.5, 'unit' => 'gram']]],
            [4,  'AMK Lime',         'amk_reguler', 'amk_murni', 'CUP_12_AMK', [9000, 9000, 9000, null], [['base' => 'BASE_AMK', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'SERBUK_LIME', 'qty' => 8, 'unit' => 'gram']]],
            [5,  'AMK Oreo',         'amk_reguler', 'amk_murni', 'CUP_12_AMK', [9000, 9000, 9000, null], [['base' => 'BASE_AMK', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 3.75, 'unit' => 'gram'], ['ing' => 'OREO', 'qty' => 1, 'unit' => 'keping']]],
            [6,  'AMK Coffe',        'amk_reguler', 'amk_murni', 'CUP_12_AMK', [9000, 9000, 9000, null], [['base' => 'BASE_AMK', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'BUBUK_COFFE', 'qty' => 6, 'unit' => 'gram']]],
            [7,  'AMK Orange',       'amk_reguler', 'amk_murni', 'CUP_12_AMK', [9000, 9000, 9000, null], [['base' => 'BASE_AMK', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'SERBUK_ORANGE', 'qty' => 8, 'unit' => 'gram']]],
            [8,  'AMK Guava',        'amk_reguler', 'amk_murni', 'CUP_12_AMK', [9000, 9000, 9000, null], [['base' => 'BASE_AMK', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'SERBUK_GUAVA', 'qty' => 8, 'unit' => 'gram']]],
            [9,  'AMK Tea',          'amk_reguler', 'amk_murni', 'CUP_12_AMK', [6000, 6000, 6000, null], [['base' => 'BASE_AMK_TEA', 'qty' => 180, 'unit' => 'ml']]],
            [10, 'AMK Tea Cream',    'amk_reguler', 'amk_murni', 'CUP_12_AMK', [7000, 7000, 7000, null], [['base' => 'BASE_AMK_TEA', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 7.5, 'unit' => 'gram']]],
            [11, 'AMK Tea Lime',     'amk_reguler', 'amk_murni', 'CUP_12_AMK', [7000, 7000, 7000, null], [['base' => 'BASE_AMK_TEA', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'SERBUK_LIME', 'qty' => 8, 'unit' => 'gram']]],
            [12, 'AMK Tea Oreo',     'amk_reguler', 'amk_murni', 'CUP_12_AMK', [7000, 7000, 7000, null], [['base' => 'BASE_AMK_TEA', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 3.75, 'unit' => 'gram'], ['ing' => 'OREO', 'qty' => 1, 'unit' => 'keping']]],
            [13, 'AMK Tea Coffe',    'amk_reguler', 'amk_murni', 'CUP_12_AMK', [7000, 7000, 7000, null], [['base' => 'BASE_AMK_TEA', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'BUBUK_COFFE', 'qty' => 6, 'unit' => 'gram']]],
            [14, 'AMK Tea Orange',   'amk_reguler', 'amk_murni', 'CUP_12_AMK', [7000, 7000, 7000, null], [['base' => 'BASE_AMK_TEA', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'SERBUK_ORANGE', 'qty' => 8, 'unit' => 'gram']]],
            [15, 'AMK Tea Guava',    'amk_reguler', 'amk_murni', 'CUP_12_AMK', [7000, 7000, 7000, null], [['base' => 'BASE_AMK_TEA', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'SERBUK_GUAVA', 'qty' => 8, 'unit' => 'gram']]],
            [16, 'Peach',            'amk_reguler', 'amk_murni', 'CUP_12_AMK', [5000, 5000, 6000, null], [['base' => 'BASE_PEACH', 'qty' => 180, 'unit' => 'ml']]],
            [17, 'Peach Cream',      'amk_reguler', 'amk_murni', 'CUP_12_AMK', [6000, 6500, 7000, null], [['base' => 'BASE_PEACH', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 3.75, 'unit' => 'gram']]],
            [18, 'Moca',             'amk_reguler', 'amk_murni', 'CUP_12_AMK', [5000, 5000, 6000, null], [['base' => 'BASE_MOCA', 'qty' => 180, 'unit' => 'ml']]],
            [19, 'Moca Cream',       'amk_reguler', 'amk_murni', 'CUP_12_AMK', [6000, 6500, 7000, null], [['base' => 'BASE_MOCA', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 7.5, 'unit' => 'gram']]],
            [20, 'Kiwi',             'amk_reguler', 'amk_murni', 'CUP_12_AMK', [5000, 5000, 6000, null], [['base' => 'BASE_KIWI', 'qty' => 180, 'unit' => 'ml']]],
            [21, 'Kiwi Cream',       'amk_reguler', 'amk_murni', 'CUP_12_AMK', [6000, 6500, 7000, null], [['base' => 'BASE_KIWI', 'qty' => 180, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 7.5, 'unit' => 'gram']]],
            [22, 'Moca Peach',       'amk_reguler', 'amk_murni', 'CUP_12_AMK', [5000, 5000, 6000, null], [['base' => 'BASE_PEACH', 'qty' => 75, 'unit' => 'ml'], ['base' => 'BASE_MOCA', 'qty' => 105, 'unit' => 'ml']]],
            [23, 'Moca Peach Cream', 'amk_reguler', 'amk_murni', 'CUP_12_AMK', [6000, 6500, 7000, null], [['base' => 'BASE_PEACH', 'qty' => 75, 'unit' => 'ml'], ['base' => 'BASE_MOCA', 'qty' => 105, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 7.5, 'unit' => 'gram']]],
            [24, 'Moca Kiwi',        'amk_reguler', 'amk_murni', 'CUP_12_AMK', [5000, 5000, 6000, null], [['base' => 'BASE_KIWI', 'qty' => 100, 'unit' => 'ml'], ['base' => 'BASE_MOCA', 'qty' => 80, 'unit' => 'ml']]],
            [25, 'Moca Kiwi Cream',  'amk_reguler', 'amk_murni', 'CUP_12_AMK', [6000, 6500, 7000, null], [['base' => 'BASE_KIWI', 'qty' => 100, 'unit' => 'ml'], ['base' => 'BASE_MOCA', 'qty' => 80, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 7.5, 'unit' => 'gram']]],
            [26, 'Peach Kiwi',       'amk_reguler', 'amk_murni', 'CUP_12_AMK', [5000, 5000, 6000, null], [['base' => 'BASE_PEACH', 'qty' => 75, 'unit' => 'ml'], ['base' => 'BASE_KIWI', 'qty' => 105, 'unit' => 'ml']]],
            [27, 'Peach Kiwi Cream', 'amk_reguler', 'amk_murni', 'CUP_12_AMK', [6000, 6500, 7000, null], [['base' => 'BASE_PEACH', 'qty' => 75, 'unit' => 'ml'], ['base' => 'BASE_KIWI', 'qty' => 105, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 7.5, 'unit' => 'gram']]],

            // --- KELOMPOK 2: AMK JUMBO (28..34) ---
            [28, 'AMK Jumbo',             'amk_jumbo', 'amk_murni', 'CUP_22_AMK', [12000, 12000, 12000, null], [['base' => 'BASE_AMK', 'qty' => 300, 'unit' => 'ml']]],
            [29, 'Peach Jumbo',           'amk_jumbo', 'amk_murni', 'CUP_22_AMK', [7000, 7000, 8000, null], [['base' => 'BASE_PEACH', 'qty' => 300, 'unit' => 'ml']]],
            [30, 'Moca Jumbo',            'amk_jumbo', 'amk_murni', 'CUP_22_AMK', [7000, 7000, 8000, null], [['base' => 'BASE_MOCA', 'qty' => 300, 'unit' => 'ml']]],
            [31, 'Kiwi Jumbo',            'amk_jumbo', 'amk_murni', 'CUP_22_AMK', [7000, 7000, 8000, null], [['base' => 'BASE_KIWI', 'qty' => 300, 'unit' => 'ml']]],
            [32, 'MP (Moca Peach) Jumbo', 'amk_jumbo', 'amk_murni', 'CUP_22_AMK', [7000, 7000, 8000, null], [['base' => 'BASE_PEACH', 'qty' => 125, 'unit' => 'ml'], ['base' => 'BASE_MOCA', 'qty' => 175, 'unit' => 'ml']]],
            [33, 'MK (Moca Kiwi) Jumbo',  'amk_jumbo', 'amk_murni', 'CUP_22_AMK', [7000, 7000, 8000, null], [['base' => 'BASE_KIWI', 'qty' => 180, 'unit' => 'ml'], ['base' => 'BASE_MOCA', 'qty' => 120, 'unit' => 'ml']]],
            [34, 'PK (Peach Kiwi) Jumbo', 'amk_jumbo', 'amk_murni', 'CUP_22_AMK', [7000, 7000, 8000, null], [['base' => 'BASE_PEACH', 'qty' => 125, 'unit' => 'ml'], ['base' => 'BASE_KIWI', 'qty' => 175, 'unit' => 'ml']]],

            // --- KELOMPOK 3: AMK PREMIUM (35..46) ---
            [35, 'AMK Premium',         'amk_premium', 'amk_murni', 'CUP_22_AMK', [null, null, null, 13000], [['base' => 'BASE_AMK', 'qty' => 300, 'unit' => 'ml']]],
            [36, 'AMK Lite Cream',      'amk_premium', 'amk_murni', 'CUP_22_AMK', [null, null, null, 11000], [['base' => 'BASE_LITE', 'qty' => 300, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 11.25, 'unit' => 'gram']]],
            [37, 'Moca Cream Premium',  'amk_premium', 'amk_murni', 'CUP_22_AMK', [null, null, null, 10000], [['base' => 'BASE_MOCA', 'qty' => 300, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 11.25, 'unit' => 'gram']]],
            [38, 'Peach Cream Premium', 'amk_premium', 'amk_murni', 'CUP_22_AMK', [null, null, null, 10000], [['base' => 'BASE_PEACH', 'qty' => 300, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 11.25, 'unit' => 'gram']]],
            [39, 'Kiwi Cream Premium',  'amk_premium', 'amk_murni', 'CUP_22_AMK', [null, null, null, 10000], [['base' => 'BASE_KIWI', 'qty' => 300, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 11.25, 'unit' => 'gram']]],
            [40, 'AMK Cream Premium',   'amk_premium', 'amk_murni', 'CUP_16_AMK', [null, null, null, 13000], [['base' => 'BASE_AMK', 'qty' => 225, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 7.5, 'unit' => 'gram']]],
            [41, 'AMK Ori Premium',     'amk_premium', 'amk_murni', 'CUP_16_AMK', [null, null, null, 13000], [['base' => 'BASE_AMK', 'qty' => 225, 'unit' => 'ml'], ['ing' => 'KELENGKENG', 'qty' => 2, 'unit' => 'buah']]],
            [42, 'AMK Oreo Premium',    'amk_premium', 'amk_murni', 'CUP_16_AMK', [null, null, null, 13000], [['base' => 'BASE_AMK', 'qty' => 225, 'unit' => 'ml'], ['ing' => 'CREAMER', 'qty' => 5.625, 'unit' => 'gram'], ['ing' => 'OREO', 'qty' => 2, 'unit' => 'keping']]],
            [43, 'AMK Coffe Premium',   'amk_premium', 'amk_murni', 'CUP_16_AMK', [null, null, null, 13000], [['base' => 'BASE_AMK', 'qty' => 225, 'unit' => 'ml'], ['ing' => 'BUBUK_COFFE', 'qty' => 9, 'unit' => 'gram']]],
            [44, 'AMK Lime Premium',    'amk_premium', 'amk_murni', 'CUP_16_AMK', [null, null, null, 13000], [['base' => 'BASE_AMK', 'qty' => 225, 'unit' => 'ml'], ['ing' => 'SERBUK_LIME', 'qty' => 9, 'unit' => 'gram']]],
            [45, 'AMK Orange Premium',  'amk_premium', 'amk_murni', 'CUP_16_AMK', [null, null, null, 13000], [['base' => 'BASE_AMK', 'qty' => 225, 'unit' => 'ml'], ['ing' => 'SERBUK_ORANGE', 'qty' => 9, 'unit' => 'gram']]],
            [46, 'AMK Guava Premium',   'amk_premium', 'amk_murni', 'CUP_16_AMK', [null, null, null, 13000], [['base' => 'BASE_AMK', 'qty' => 225, 'unit' => 'ml'], ['ing' => 'SERBUK_GUAVA', 'qty' => 9, 'unit' => 'gram']]],

            // --- KELOMPOK 4: AMKOPI (47..52) ---
            [47, 'AMKopi (Air Mata Kopi)',     'amkopi', 'amkopi', 'CUP_12_AMKOPI', [12000, 12000, 12000, 12000], [['ing' => 'BIANG_ARABICA', 'qty' => 75, 'unit' => 'ml'], ['ing' => 'SIRUP_AMK', 'qty' => 20, 'unit' => 'ml'], ['ing' => 'AIR_PUTIH', 'qty' => 105, 'unit' => 'ml']]],
            [48, 'Mixed-Berry',                'amkopi', 'amkopi', 'CUP_12_AMKOPI', [12000, 12000, 12000, 12000], [['ing' => 'BIANG_ARABICA', 'qty' => 75, 'unit' => 'ml'], ['ing' => 'SIRUP_BERRY', 'qty' => 10, 'unit' => 'ml'], ['ing' => 'FRUKTOSE', 'qty' => 10, 'unit' => 'ml'], ['ing' => 'AIR_PUTIH', 'qty' => 105, 'unit' => 'ml']]],
            [49, 'Arabica',                    'amkopi', 'amkopi', 'CUP_12_AMKOPI', [10000, 10000, 10000, 10000], [['ing' => 'BIANG_ARABICA', 'qty' => 75, 'unit' => 'ml'], ['ing' => 'AIR_PUTIH', 'qty' => 125, 'unit' => 'ml']]],
            [50, 'Cartir (Caramel Tiramissu)', 'amkopi', 'amkopi', 'CUP_12_AMKOPI', [16000, 16000, 16000, 16000], [['ing' => 'SUSU', 'qty' => 100, 'unit' => 'ml'], ['ing' => 'BIANG_ROBUSTA', 'qty' => 75, 'unit' => 'ml'], ['ing' => 'SIRUP_CARAMEL', 'qty' => 5, 'unit' => 'ml'], ['ing' => 'SIRUP_TIRAMISU', 'qty' => 10, 'unit' => 'ml']]],
            [51, 'Aren (Kopi Susu Aren)',      'amkopi', 'amkopi', 'CUP_12_AMKOPI', [14000, 14000, 14000, 14000], [['ing' => 'SUSU', 'qty' => 100, 'unit' => 'ml'], ['ing' => 'BIANG_ROBUSTA', 'qty' => 75, 'unit' => 'ml'], ['ing' => 'GULA_AREN', 'qty' => 15, 'unit' => 'ml']]],
            [52, 'Kaw (Kopi Susu KAW)',        'amkopi', 'amkopi', 'CUP_12_AMKOPI', [12000, 12000, 12000, 12000], [['ing' => 'SUSU', 'qty' => 100, 'unit' => 'ml'], ['ing' => 'BIANG_ROBUSTA', 'qty' => 75, 'unit' => 'ml'], ['ing' => 'FRUKTOSE', 'qty' => 15, 'unit' => 'ml']]],

            // --- KELOMPOK 5 & 6: KURMA & KEMASAN (53..54) ---
            [53, 'AMK Kurma',                      'amk_kurma', 'kurma',   'CUP_22_AMK', [12000, 12000, 12000, 12000], [['base' => 'BASE_KURMA', 'qty' => 350, 'unit' => 'ml']]],
            [54, 'Air Mineral Le Minerale 600 ml', 'kemasan',   'kemasan', null,         [5000, 5000, 5000, 5000],     [['ing' => 'LE_MINERALE', 'qty' => 1, 'unit' => 'botol']]],
        ];

        $tiers = ['all_outlet', 'tp1', 'ptc', 'tp2'];

        foreach ($menus as [$sortOrder, $name, $menuGroup, $reportCategory, $cupCode, $prices, $recipeItems]) {
            $menu = Menu::updateOrCreate(
                ['sort_order' => $sortOrder],
                [
                    'name' => $name,
                    'menu_group' => $menuGroup,
                    'report_category' => $reportCategory,
                    'cup_ingredient_id' => $cupCode ? ($ing[$cupCode] ?? null) : null,
                    'is_active' => true,
                ]
            );

            // Seed 4-Tier Prices
            foreach ($tiers as $idx => $tier) {
                MenuPrice::updateOrCreate(
                    ['menu_id' => $menu->id, 'price_tier' => $tier],
                    ['price' => $prices[$idx]]
                );
            }

            // Seed Recipe Items
            MenuRecipeItem::where('menu_id', $menu->id)->delete();
            foreach ($recipeItems as $ri) {
                MenuRecipeItem::create([
                    'menu_id' => $menu->id,
                    'base_recipe_id' => isset($ri['base']) ? ($base[$ri['base']] ?? null) : null,
                    'ingredient_id' => isset($ri['ing']) ? ($ing[$ri['ing']] ?? null) : null,
                    'quantity' => $ri['qty'],
                    'input_unit' => $ri['unit'],
                ]);
            }
        }
    }
}
