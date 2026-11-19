<?php

namespace Database\Seeders;

use App\Models\BaseRecipe;
use App\Models\BaseRecipeItem;
use App\Models\Ingredient;
use Illuminate\Database\Seeder;

class BaseRecipeSeeder extends Seeder
{
    public function run(): void
    {
        $ing = Ingredient::pluck('id', 'code');

        $recipes = [
            [
                'code' => 'BASE_AMK',
                'name' => 'Adonan AMK',
                'yield_ml' => 1750,
                'items' => [
                    ['ingredient_code' => 'SIRUP_AMK', 'quantity' => 250, 'unit' => 'ml'],
                    ['ingredient_code' => 'AIR_PUTIH', 'quantity' => 1500, 'unit' => 'ml'],
                ],
            ],
            [
                'code' => 'BASE_MOCA',
                'name' => 'Adonan Moca',
                'yield_ml' => 1400,
                'items' => [
                    ['ingredient_code' => 'PREMIK_MOCA', 'quantity' => 200, 'unit' => 'ml'],
                    ['ingredient_code' => 'TEH',         'quantity' => 3,   'unit' => 'bag'],
                    ['ingredient_code' => 'AIR_PUTIH',   'quantity' => 1200, 'unit' => 'ml'],
                ],
            ],
            [
                'code' => 'BASE_KIWI',
                'name' => 'Adonan Kiwi',
                'yield_ml' => 1400,
                'items' => [
                    ['ingredient_code' => 'PREMIK_KIWI', 'quantity' => 200, 'unit' => 'ml'],
                    ['ingredient_code' => 'TEH',         'quantity' => 3,   'unit' => 'bag'],
                    ['ingredient_code' => 'AIR_PUTIH',   'quantity' => 1200, 'unit' => 'ml'],
                ],
            ],
            [
                'code' => 'BASE_PEACH',
                'name' => 'Adonan Peach Terbaru',
                'yield_ml' => 1400,
                'items' => [
                    ['ingredient_code' => 'PREMIK_PEACH', 'quantity' => 200, 'unit' => 'ml'],
                    ['ingredient_code' => 'TEH',          'quantity' => 7,   'unit' => 'bag'],
                    ['ingredient_code' => 'AIR_PUTIH',    'quantity' => 1200, 'unit' => 'ml'],
                ],
            ],
            [
                'code' => 'BASE_AMK_TEA',
                'name' => 'Adonan AMK Tea',
                'yield_ml' => 1400,
                'items' => [
                    ['ingredient_code' => 'TEH',        'quantity' => 3,    'unit' => 'bag'],
                    ['ingredient_code' => 'AIR_PUTIH',  'quantity' => 1050, 'unit' => 'ml'],
                    ['ingredient_code' => 'GULA_PASIR', 'quantity' => 170,  'unit' => 'gram'],
                    ['child_base_code' => 'BASE_AMK',   'quantity' => 250,  'unit' => 'ml'],
                ],
            ],
            [
                'code' => 'BASE_LITE',
                'name' => 'Premium Adonan Lite',
                'yield_ml' => 1400,
                'items' => [
                    ['ingredient_code' => 'FRUKTOSE',  'quantity' => 150, 'unit' => 'ml'],
                    ['ingredient_code' => 'TEH',       'quantity' => 3,   'unit' => 'bag'],
                    ['ingredient_code' => 'AIR_PUTIH', 'quantity' => 750, 'unit' => 'ml'],
                    ['child_base_code' => 'BASE_AMK',  'quantity' => 500, 'unit' => 'ml'],
                ],
            ],
            [
                'code' => 'BASE_KURMA',
                'name' => 'Adonan Kurma',
                'yield_ml' => 1400,
                'items' => [
                    ['ingredient_code' => 'SIRUP_AMK',   'quantity' => 40,   'unit' => 'ml'],
                    ['ingredient_code' => 'SIRUP_KURMA', 'quantity' => 1,    'unit' => 'botol'],
                    ['ingredient_code' => 'AIR_PUTIH',   'quantity' => 1360, 'unit' => 'ml'],
                ],
            ],
        ];

        $baseIdMap = [];
        foreach ($recipes as $rec) {
            $base = BaseRecipe::updateOrCreate(
                ['code' => $rec['code']],
                [
                    'name' => $rec['name'],
                    'yield_ml' => $rec['yield_ml'],
                ]
            );
            $baseIdMap[$rec['code']] = $base->id;
        }

        // Now populate base_recipe_items
        foreach ($recipes as $rec) {
            $baseId = $baseIdMap[$rec['code']];
            BaseRecipeItem::where('base_recipe_id', $baseId)->delete();

            foreach ($rec['items'] as $item) {
                BaseRecipeItem::create([
                    'base_recipe_id' => $baseId,
                    'ingredient_id' => isset($item['ingredient_code']) ? ($ing[$item['ingredient_code']] ?? null) : null,
                    'child_base_recipe_id' => isset($item['child_base_code']) ? ($baseIdMap[$item['child_base_code']] ?? null) : null,
                    'quantity' => $item['quantity'],
                    'unit' => $item['unit'],
                ]);
            }
        }
    }
}
