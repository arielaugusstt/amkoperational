<?php

namespace App\Http\Controllers;

use App\Models\BaseRecipe;
use App\Models\BaseRecipeItem;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\Menu1NominalConfig;
use App\Models\Menu1QtyConfig;
use App\Models\MenuPrice;
use App\Models\MenuRecipeItem;
use App\Models\Outlet;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class MasterDataController extends Controller
{
    public static function ensureSystemBootstrapped(bool $forceReseed = false): void
    {
        try {
            $needsMigrate = !Schema::hasTable('outlets')
                || !Schema::hasTable('menus')
                || !Schema::hasTable('base_recipes')
                || Schema::hasTable('master_stands')
                || Schema::hasTable('menu2_items');

            if ($needsMigrate) {
                Artisan::call('migrate', ['--force' => true]);
            }

            if ($forceReseed || (!app()->runningUnitTests() && (Menu::count() === 0 || Ingredient::count() === 0 || BaseRecipe::count() === 0 || Outlet::count() === 0))) {
                app(DatabaseSeeder::class)->run();
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Auto-bootstrap error: ' . $e->getMessage());
        }
    }

    public function seedDefaultMasterData()
    {
        self::ensureSystemBootstrapped(true);

        return response()->json([
            'success' => true,
            'message' => 'Seluruh Master Data Baku (19 Outlet, 28 Bahan Baku, 7 Base Adonan, & 54 Menu + Formula Resep BOM) berhasil dimuat ke dalam sistem!',
        ]);
    }

    public function getFullMaster()
    {
        self::ensureSystemBootstrapped();

        $stands = Outlet::orderBy('blok_wa')->orderBy('urutan_tampil')->get();
        $spg = User::where('role', 'spg')->orderBy('id')->get();
        $menu1Nominals = Menu1NominalConfig::orderBy('urutan')->get();
        $menu1Qtys = Menu1QtyConfig::orderBy('urutan')->get();
        $menus = Menu::with(['prices', 'cupIngredient', 'recipeItems.baseRecipe', 'recipeItems.ingredient'])
            ->orderBy('sort_order')
            ->get();
        $menuPrices = MenuPrice::all()->groupBy('menu_id');
        $ingredients = Ingredient::orderBy('dashboard_tier')->orderBy('display_order')->get();
        $baseRecipes = BaseRecipe::with(['items.ingredient', 'items.childBaseRecipe'])->orderBy('id')->get();
        $menuRecipeItems = MenuRecipeItem::with(['menu', 'baseRecipe', 'ingredient'])->get();

        return response()->json([
            'stands' => $stands,
            'outlets' => $stands,
            'spg' => $spg,
            'menu1_nominals' => $menu1Nominals,
            'menu1_qtys' => $menu1Qtys,
            'menu2_items' => $menus,
            'menus' => $menus,
            'menu2_prices' => $menuPrices,
            'ingredients' => $ingredients,
            'batches' => $baseRecipes,
            'base_recipes' => $baseRecipes,
            'mappings' => $menuRecipeItems,
        ]);
    }

    // =========================================================
    // 1. OUTLETS (STANDS) CRUD
    // =========================================================
    public function createStand(Request $request)
    {
        $request->validate([
            'kode_stand' => 'required|string|max:50|unique:outlets,kode_stand',
            'nama_stand' => 'required|string|max:150',
        ]);

        $stand = Outlet::create([
            'kode_stand' => $request->input('kode_stand'),
            'nama_stand' => $request->input('nama_stand'),
            'wilayah_laporan' => $request->input('wilayah_laporan', 'Utara'),
            'blok_wa' => $request->input('blok_wa', 'Blok 1'),
            'urutan_tampil' => (int)$request->input('urutan_tampil', 1),
            'punya_amkopi' => (bool)$request->input('punya_amkopi', false),
            'tampilkan_csdng_wa' => (bool)$request->input('tampilkan_csdng_wa', false),
            'tampilkan_ptt_wa' => (bool)$request->input('tampilkan_ptt_wa', false),
            'is_premium' => (bool)$request->input('is_premium', false),
            'price_tier' => $request->input('price_tier', 'all_outlet'),
            'status_aktif' => (bool)$request->input('status_aktif', true),
        ]);

        return response()->json(['success' => true, 'message' => 'Outlet berhasil ditambahkan!', 'data' => $stand]);
    }

    public function updateStand($id, Request $request)
    {
        $stand = Outlet::findOrFail($id);
        $stand->update($request->only([
            'kode_stand',
            'nama_stand',
            'wilayah_laporan',
            'blok_wa',
            'urutan_tampil',
            'punya_amkopi',
            'tampilkan_csdng_wa',
            'tampilkan_ptt_wa',
            'is_premium',
            'price_tier',
            'status_aktif',
        ]));

        return response()->json(['success' => true, 'message' => 'Data Outlet berhasil diperbarui!', 'data' => $stand]);
    }

    public function destroyStand($id)
    {
        $stand = Outlet::findOrFail($id);
        $stand->delete();
        return response()->json(['success' => true, 'message' => 'Outlet berhasil dihapus.']);
    }

    public function bulkDestroyStand(Request $request)
    {
        $ids = $request->input('ids', []);
        Outlet::whereIn('id', $ids)->delete();
        return response()->json(['success' => true, 'message' => count($ids) . ' Outlet berhasil dihapus.']);
    }

    public function destroyAllStands()
    {
        Outlet::query()->delete();
        return response()->json(['success' => true, 'message' => 'Seluruh data Outlet berhasil dihapus.']);
    }

    // =========================================================
    // 2. SPG CRUD (Protected Users Auth)
    // =========================================================
    public function createSPG(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:150',
            'username' => 'required|string|max:100|unique:users,username',
        ]);

        $pin = $request->input('pin_plain') ?: $request->input('password', '1234');
        $spg = User::create([
            'id_spg' => $request->input('id_spg', 'SPG-' . rand(100, 999)),
            'name' => $request->input('name'),
            'username' => $request->input('username'),
            'email' => $request->input('username') . '@amk.ops',
            'role' => 'spg',
            'password' => Hash::make($pin),
            'pin_plain' => $pin,
            'status_aktif' => (bool)$request->input('status_aktif', true),
        ]);

        return response()->json(['success' => true, 'message' => 'Akun SPG berhasil dibuat!', 'data' => $spg]);
    }

    public function updateSPG($id, Request $request)
    {
        $spg = User::findOrFail($id);
        $updates = [
            'id_spg' => $request->input('id_spg', $spg->id_spg),
            'name' => $request->input('name', $spg->name),
            'username' => $request->input('username', $spg->username),
            'status_aktif' => $request->has('status_aktif') ? (bool)$request->input('status_aktif') : $spg->status_aktif,
        ];

        $pin = $request->input('pin_plain') ?: $request->input('password');
        if ($pin) {
            $updates['password'] = Hash::make($pin);
            $updates['pin_plain'] = $pin;
        }

        $spg->update($updates);
        return response()->json(['success' => true, 'message' => 'Akun SPG berhasil diperbarui!', 'data' => $spg]);
    }

    public function destroySPG($id)
    {
        $spg = User::where('role', 'spg')->findOrFail($id);
        $spg->delete();
        return response()->json(['success' => true, 'message' => 'Akun SPG berhasil dihapus.']);
    }

    public function bulkDestroySPG(Request $request)
    {
        $ids = $request->input('ids', []);
        User::where('role', 'spg')->whereIn('id', $ids)->delete();
        return response()->json(['success' => true, 'message' => count($ids) . ' Akun SPG berhasil dihapus.']);
    }

    public function destroyAllSPG()
    {
        User::where('role', 'spg')->delete();
        return response()->json(['success' => true, 'message' => 'Seluruh data SPG berhasil dikosongkan.']);
    }

    // =========================================================
    // 3. INGREDIENTS (LAYER 1) CRUD
    // =========================================================
    public function createIngredient(Request $request)
    {
        $code = $request->input('code') ?: $request->input('kode_bahan');
        $name = $request->input('name') ?: $request->input('nama_bahan_baku');

        $ing = Ingredient::create([
            'code' => $code,
            'name' => $name,
            'category' => $request->input('category', $request->input('kategori_bahan', 'amk')),
            'dashboard_tier' => (int)$request->input('dashboard_tier', 1),
            'base_unit' => $request->input('base_unit', $request->input('satuan', 'ml')),
            'conversion_unit' => $request->input('conversion_unit') ?: null,
            'conversion_factor' => $request->input('conversion_factor') !== null && $request->input('conversion_factor') !== '' ? (float)$request->input('conversion_factor') : null,
            'density_g_per_ml' => $request->input('density_g_per_ml') !== null && $request->input('density_g_per_ml') !== '' ? (float)$request->input('density_g_per_ml') : null,
            'display_order' => (int)$request->input('display_order', $request->input('urutan_tampil', 1)),
            'notes' => $request->input('notes'),
            'link_kode_qty_menu1' => $request->input('link_kode_qty_menu1'),
            'is_active' => (bool)$request->input('is_active', $request->input('status_aktif', true)),
        ]);

        return response()->json(['success' => true, 'message' => 'Bahan Baku berhasil ditambahkan!', 'data' => $ing]);
    }

    public function updateIngredient($id, Request $request)
    {
        $ing = Ingredient::findOrFail($id);
        $ing->update([
            'code' => $request->input('code', $request->input('kode_bahan', $ing->code)),
            'name' => $request->input('name', $request->input('nama_bahan_baku', $ing->name)),
            'category' => $request->input('category', $request->input('kategori_bahan', $ing->category)),
            'dashboard_tier' => (int)$request->input('dashboard_tier', $ing->dashboard_tier),
            'base_unit' => $request->input('base_unit', $request->input('satuan', $ing->base_unit)),
            'conversion_unit' => $request->has('conversion_unit') ? ($request->input('conversion_unit') ?: null) : $ing->conversion_unit,
            'conversion_factor' => $request->has('conversion_factor') ? ($request->input('conversion_factor') !== null && $request->input('conversion_factor') !== '' ? (float)$request->input('conversion_factor') : null) : $ing->conversion_factor,
            'density_g_per_ml' => $request->has('density_g_per_ml') ? ($request->input('density_g_per_ml') !== null && $request->input('density_g_per_ml') !== '' ? (float)$request->input('density_g_per_ml') : null) : $ing->density_g_per_ml,
            'display_order' => (int)$request->input('display_order', $request->input('urutan_tampil', $ing->display_order)),
            'notes' => $request->has('notes') ? $request->input('notes') : $ing->notes,
            'link_kode_qty_menu1' => $request->has('link_kode_qty_menu1') ? $request->input('link_kode_qty_menu1') : $ing->link_kode_qty_menu1,
            'is_active' => $request->has('is_active') ? (bool)$request->input('is_active') : ($request->has('status_aktif') ? (bool)$request->input('status_aktif') : $ing->is_active),
        ]);

        return response()->json(['success' => true, 'message' => 'Bahan Baku berhasil diperbarui!', 'data' => $ing]);
    }

    public function destroyIngredient($id)
    {
        $ing = Ingredient::findOrFail($id);
        $ing->delete();
        return response()->json(['success' => true, 'message' => 'Bahan Baku berhasil dihapus.']);
    }

    public function bulkDestroyIngredient(Request $request)
    {
        $ids = $request->input('ids', []);
        Ingredient::whereIn('id', $ids)->delete();
        return response()->json(['success' => true, 'message' => count($ids) . ' Bahan Baku berhasil dihapus.']);
    }

    public function destroyAllIngredients()
    {
        Ingredient::query()->delete();
        return response()->json(['success' => true, 'message' => 'Seluruh Bahan Baku berhasil dihapus.']);
    }

    // =========================================================
    // 4. BASE RECIPES (LAYER 2) CRUD
    // =========================================================
    public function createBatch(Request $request)
    {
        $base = BaseRecipe::create([
            'code' => $request->input('code', 'BASE_' . strtoupper(uniqid())),
            'name' => $request->input('name', $request->input('nama_batch', 'Base Baru')),
            'yield_ml' => (float)$request->input('yield_ml', $request->input('volume_batch_ml', 1400)),
        ]);

        if ($request->has('items') && is_array($request->input('items'))) {
            foreach ($request->input('items') as $it) {
                BaseRecipeItem::create([
                    'base_recipe_id' => $base->id,
                    'ingredient_id' => !empty($it['ingredient_id']) ? (int)$it['ingredient_id'] : null,
                    'child_base_recipe_id' => !empty($it['child_base_recipe_id']) ? (int)$it['child_base_recipe_id'] : null,
                    'quantity' => (float)($it['quantity'] ?? 0),
                    'unit' => $it['unit'] ?? 'ml',
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Base Adonan berhasil ditambahkan!', 'data' => $base->load('items')]);
    }

    public function updateBatch($id, Request $request)
    {
        $base = BaseRecipe::findOrFail($id);
        $base->update([
            'code' => $request->input('code', $base->code),
            'name' => $request->input('name', $request->input('nama_batch', $base->name)),
            'yield_ml' => (float)$request->input('yield_ml', $request->input('volume_batch_ml', $base->yield_ml)),
        ]);

        if ($request->has('items') && is_array($request->input('items'))) {
            BaseRecipeItem::where('base_recipe_id', $base->id)->delete();
            foreach ($request->input('items') as $it) {
                if (empty($it['ingredient_id']) && empty($it['child_base_recipe_id'])) {
                    continue;
                }
                BaseRecipeItem::create([
                    'base_recipe_id' => $base->id,
                    'ingredient_id' => !empty($it['ingredient_id']) ? (int)$it['ingredient_id'] : null,
                    'child_base_recipe_id' => !empty($it['child_base_recipe_id']) ? (int)$it['child_base_recipe_id'] : null,
                    'quantity' => (float)($it['quantity'] ?? 0),
                    'unit' => $it['unit'] ?? 'ml',
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Base Adonan berhasil diperbarui!', 'data' => $base->load('items')]);
    }

    public function destroyBatch($id)
    {
        $base = BaseRecipe::findOrFail($id);
        $base->delete();
        return response()->json(['success' => true, 'message' => 'Base Adonan berhasil dihapus.']);
    }

    public function destroyAllBatches()
    {
        BaseRecipe::query()->delete();
        return response()->json(['success' => true, 'message' => 'Seluruh Base Adonan berhasil dihapus.']);
    }

    // =========================================================
    // 5. MENUS & 4-TIER PRICES (LAYER 3) CRUD
    // =========================================================
    public function createMenu2Item(Request $request)
    {
        $menu = Menu::create([
            'sort_order' => (int)$request->input('sort_order', $request->input('urutan_tampil', Menu::max('sort_order') + 1)),
            'name' => $request->input('name', $request->input('nama_item', 'Menu Baru')),
            'menu_group' => $request->input('menu_group', $request->input('kelompok_menu', 'amk_reguler')),
            'report_category' => $request->input('report_category', 'amk_murni'),
            'cup_ingredient_id' => $request->input('cup_ingredient_id') ?: null,
            'is_active' => (bool)$request->input('is_active', $request->input('status_aktif', true)),
        ]);

        $this->syncMenuPricesAndRecipe($menu, $request);

        return response()->json(['success' => true, 'message' => 'Menu berhasil ditambahkan!', 'data' => $menu->load(['prices', 'recipeItems'])]);
    }

    public function updateMenu2Item($id, Request $request)
    {
        $menu = Menu::findOrFail($id);
        $menu->update([
            'sort_order' => (int)$request->input('sort_order', $request->input('urutan_tampil', $menu->sort_order)),
            'name' => $request->input('name', $request->input('nama_item', $menu->name)),
            'menu_group' => $request->input('menu_group', $request->input('kelompok_menu', $menu->menu_group)),
            'report_category' => $request->input('report_category', $menu->report_category),
            'cup_ingredient_id' => $request->has('cup_ingredient_id') ? ($request->input('cup_ingredient_id') ?: null) : $menu->cup_ingredient_id,
            'is_active' => $request->has('is_active') ? (bool)$request->input('is_active') : ($request->has('status_aktif') ? (bool)$request->input('status_aktif') : $menu->is_active),
        ]);

        $this->syncMenuPricesAndRecipe($menu, $request);

        return response()->json(['success' => true, 'message' => 'Menu berhasil diperbarui!', 'data' => $menu->load(['prices', 'recipeItems'])]);
    }

    protected function syncMenuPricesAndRecipe(Menu $menu, Request $request): void
    {
        $tiers = ['all_outlet', 'tp1', 'ptc', 'tp2'];
        $tierPrices = $request->input('tier_prices', $request->input('prices', []));
        $defaultPrice = $request->input('harga_default');

        if (!empty($tierPrices) || $defaultPrice !== null) {
            foreach ($tiers as $tier) {
                if (array_key_exists($tier, $tierPrices)) {
                    $val = $tierPrices[$tier];
                    $price = ($val === null || $val === '') ? null : (int)$val;
                    MenuPrice::updateOrCreate(
                        ['menu_id' => $menu->id, 'price_tier' => $tier],
                        ['price' => $price]
                    );
                } elseif ($defaultPrice !== null) {
                    MenuPrice::updateOrCreate(
                        ['menu_id' => $menu->id, 'price_tier' => $tier],
                        ['price' => (int)$defaultPrice]
                    );
                }
            }
        }

        if ($request->has('recipe_items') && is_array($request->input('recipe_items'))) {
            MenuRecipeItem::where('menu_id', $menu->id)->delete();
            foreach ($request->input('recipe_items') as $ri) {
                if (empty($ri['base_recipe_id']) && empty($ri['ingredient_id'])) {
                    continue;
                }
                MenuRecipeItem::create([
                    'menu_id' => $menu->id,
                    'base_recipe_id' => !empty($ri['base_recipe_id']) ? (int)$ri['base_recipe_id'] : null,
                    'ingredient_id' => !empty($ri['ingredient_id']) ? (int)$ri['ingredient_id'] : null,
                    'quantity' => (float)($ri['quantity'] ?? 0),
                    'input_unit' => $ri['input_unit'] ?? 'ml',
                ]);
            }
        }
    }

    public function destroyMenu2Item($id)
    {
        $menu = Menu::findOrFail($id);
        $menu->delete();
        return response()->json(['success' => true, 'message' => 'Menu beserta harga dan resepnya berhasil dihapus.']);
    }

    public function bulkDestroyMenu2Item(Request $request)
    {
        $ids = $request->input('ids', []);
        Menu::whereIn('id', $ids)->delete();
        return response()->json(['success' => true, 'message' => count($ids) . ' Menu berhasil dihapus.']);
    }

    public function destroyAllMenu2Items()
    {
        Menu::query()->delete();
        return response()->json(['success' => true, 'message' => 'Seluruh Menu berhasil dihapus.']);
    }

    // =========================================================
    // 6. MENU 1 CONFIG & RECIPE MAPPINGS
    // =========================================================
    public function createMenu1Nominal(Request $request)
    {
        $nom = Menu1NominalConfig::create([
            'kode_kategori' => $request->input('kode_kategori', $request->input('kode_nominal', 'NOM_' . rand(10, 99))),
            'label_input_nominal' => $request->input('label_input_nominal', $request->input('nama_kategori', 'Kategori Baru')),
            'keterangan_bantu' => $request->input('keterangan_bantu'),
            'urutan' => (int)$request->input('urutan', $request->input('urutan_tampil', 1)),
            'status_aktif' => (bool)$request->input('status_aktif', true),
        ]);
        return response()->json(['success' => true, 'message' => 'Kategori Nominal berhasil ditambahkan!', 'data' => $nom]);
    }

    public function updateMenu1Nominal($id, Request $request)
    {
        $nom = Menu1NominalConfig::findOrFail($id);
        $nom->update([
            'kode_kategori' => $request->input('kode_kategori', $request->input('kode_nominal', $nom->kode_kategori)),
            'label_input_nominal' => $request->input('label_input_nominal', $request->input('nama_kategori', $nom->label_input_nominal)),
            'keterangan_bantu' => $request->input('keterangan_bantu', $nom->keterangan_bantu),
            'urutan' => (int)$request->input('urutan', $request->input('urutan_tampil', $nom->urutan)),
            'status_aktif' => $request->has('status_aktif') ? (bool)$request->input('status_aktif') : $nom->status_aktif,
        ]);
        return response()->json(['success' => true, 'message' => 'Kategori Nominal berhasil diperbarui!', 'data' => $nom]);
    }

    public function destroyMenu1Nominal($id)
    {
        Menu1NominalConfig::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Kategori Nominal berhasil dihapus.']);
    }

    public function createMenu1Qty(Request $request)
    {
        $qty = Menu1QtyConfig::create([
            'kode_qty_menu1' => $request->input('kode_qty_menu1', $request->input('kode_qty', 'QTY_' . rand(10, 99))),
            'label_input_qty' => $request->input('label_input_qty', $request->input('nama_item_qty', 'Item QTY Baru')),
            'urutan' => (int)$request->input('urutan', $request->input('urutan_tampil', 1)),
            'status_aktif' => (bool)$request->input('status_aktif', true),
        ]);
        return response()->json(['success' => true, 'message' => 'Item QTY berhasil ditambahkan!', 'data' => $qty]);
    }

    public function updateMenu1Qty($id, Request $request)
    {
        $qty = Menu1QtyConfig::findOrFail($id);
        $qty->update([
            'kode_qty_menu1' => $request->input('kode_qty_menu1', $request->input('kode_qty', $qty->kode_qty_menu1)),
            'label_input_qty' => $request->input('label_input_qty', $request->input('nama_item_qty', $qty->label_input_qty)),
            'urutan' => (int)$request->input('urutan', $request->input('urutan_tampil', $qty->urutan)),
            'status_aktif' => $request->has('status_aktif') ? (bool)$request->input('status_aktif') : $qty->status_aktif,
        ]);
        return response()->json(['success' => true, 'message' => 'Item QTY berhasil diperbarui!', 'data' => $qty]);
    }

    public function destroyMenu1Qty($id)
    {
        Menu1QtyConfig::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Item QTY berhasil dihapus.']);
    }

    public function destroyAllMenu1()
    {
        Menu1NominalConfig::query()->delete();
        Menu1QtyConfig::query()->delete();
        return response()->json(['success' => true, 'message' => 'Seluruh konfigurasi Menu 1 berhasil dihapus.']);
    }

    public function createMapping(Request $request)
    {
        $item = MenuRecipeItem::create([
            'menu_id' => (int)$request->input('menu_id', $request->input('menu2_item_id')),
            'base_recipe_id' => $request->input('base_recipe_id') ?: null,
            'ingredient_id' => $request->input('ingredient_id') ?: null,
            'quantity' => (float)$request->input('quantity', 0),
            'input_unit' => $request->input('input_unit', 'ml'),
        ]);
        return response()->json(['success' => true, 'message' => 'Komponen resep menu berhasil ditambahkan!', 'data' => $item]);
    }

    public function updateMapping($id, Request $request)
    {
        $item = MenuRecipeItem::findOrFail($id);
        $item->update([
            'menu_id' => (int)$request->input('menu_id', $request->input('menu2_item_id', $item->menu_id)),
            'base_recipe_id' => $request->has('base_recipe_id') ? ($request->input('base_recipe_id') ?: null) : $item->base_recipe_id,
            'ingredient_id' => $request->has('ingredient_id') ? ($request->input('ingredient_id') ?: null) : $item->ingredient_id,
            'quantity' => (float)$request->input('quantity', $item->quantity),
            'input_unit' => $request->input('input_unit', $item->input_unit),
        ]);
        return response()->json(['success' => true, 'message' => 'Komponen resep menu berhasil diperbarui!', 'data' => $item]);
    }

    public function destroyMapping($id)
    {
        MenuRecipeItem::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Komponen resep menu berhasil dihapus.']);
    }

    public function bulkDestroyMapping(Request $request)
    {
        $ids = $request->input('ids', []);
        MenuRecipeItem::whereIn('id', $ids)->delete();
        return response()->json(['success' => true, 'message' => count($ids) . ' Komponen resep berhasil dihapus.']);
    }

    public function destroyAllMappings()
    {
        MenuRecipeItem::query()->delete();
        return response()->json(['success' => true, 'message' => 'Seluruh komponen resep menu berhasil dihapus.']);
    }

    public function importMasterData(Request $request)
    {
        $templateType = $request->input('template_type');
        $importMode = $request->input('import_mode', 'append');
        $payload = $request->input('payload', []);

        DB::beginTransaction();
        try {
            if ($templateType === 'template1') {
                if ($importMode === 'replace') {
                    User::where('role', 'spg')->delete();
                }
                foreach (($payload['Master_Stand'] ?? []) as $row) {
                    if (empty($row['Kode_Stand'])) continue;
                    Outlet::updateOrCreate(
                        ['kode_stand' => trim($row['Kode_Stand'])],
                        [
                            'nama_stand' => $row['Nama_Stand'] ?? $row['Kode_Stand'],
                            'wilayah_laporan' => $row['Wilayah_Laporan'] ?? 'Utara',
                            'blok_wa' => $row['Blok_WA'] ?? 'Blok 1',
                            'urutan_tampil' => (int)($row['Urutan_Tampil'] ?? 1),
                            'punya_amkopi' => in_array(strtolower((string)($row['Punya_AMKopi'] ?? '')), ['ya', 'true', '1']),
                            'tampilkan_csdng_wa' => in_array(strtolower((string)($row['Tampilkan_Csdng_WA'] ?? '')), ['ya', 'true', '1']),
                            'tampilkan_ptt_wa' => in_array(strtolower((string)($row['Tampilkan_PTT_WA'] ?? '')), ['ya', 'true', '1']),
                            'price_tier' => $row['Price_Tier'] ?? 'all_outlet',
                            'is_premium' => in_array(strtolower((string)($row['Is_Premium'] ?? '')), ['ya', 'true', '1']),
                            'status_aktif' => !in_array(strtolower((string)($row['Status_Aktif'] ?? 'aktif')), ['non-aktif', 'false', '0']),
                        ]
                    );
                }
                foreach (($payload['Master_SPG'] ?? []) as $row) {
                    if (empty($row['Username_Login'])) continue;
                    $pin = (string)($row['PIN_Default'] ?? '1234');
                    User::updateOrCreate(
                        ['username' => trim($row['Username_Login'])],
                        [
                            'id_spg' => $row['ID_SPG'] ?? ('SPG-' . rand(100, 999)),
                            'name' => $row['Nama_SPG'] ?? $row['Username_Login'],
                            'email' => trim($row['Username_Login']) . '@amk.ops',
                            'role' => 'spg',
                            'password' => Hash::make($pin),
                            'pin_plain' => $pin,
                            'status_aktif' => !in_array(strtolower((string)($row['Status_Aktif'] ?? 'aktif')), ['non-aktif', 'false', '0']),
                        ]
                    );
                }
            } elseif ($templateType === 'template2') {
                if ($importMode === 'replace') {
                    Menu1NominalConfig::query()->delete();
                    Menu1QtyConfig::query()->delete();
                }
                foreach (($payload['Menu1_Kategori_Nominal'] ?? []) as $row) {
                    $code = $row['Kode_Kategori'] ?? $row['Kode_Nominal'] ?? null;
                    if (!$code) continue;
                    Menu1NominalConfig::updateOrCreate(
                        ['kode_kategori' => trim($code)],
                        [
                            'label_input_nominal' => $row['Label_Input_Nominal'] ?? $row['Nama_Kategori'] ?? $code,
                            'keterangan_bantu' => $row['Keterangan_Bantu'] ?? null,
                            'urutan' => (int)($row['Urutan_Tampil'] ?? 1),
                            'status_aktif' => !in_array(strtolower((string)($row['Status_Aktif'] ?? 'aktif')), ['non-aktif', 'false', '0']),
                        ]
                    );
                }
                foreach (($payload['Menu1_Item_QTY'] ?? []) as $row) {
                    $code = $row['Kode_QTY_Menu1'] ?? $row['Kode_QTY'] ?? null;
                    if (!$code) continue;
                    Menu1QtyConfig::updateOrCreate(
                        ['kode_qty_menu1' => trim($code)],
                        [
                            'label_input_qty' => $row['Label_Input_QTY'] ?? $row['Nama_Item_QTY'] ?? $code,
                            'urutan' => (int)($row['Urutan_Tampil'] ?? 1),
                            'status_aktif' => !in_array(strtolower((string)($row['Status_Aktif'] ?? 'aktif')), ['non-aktif', 'false', '0']),
                        ]
                    );
                }
            } elseif ($templateType === 'template3') {
                if ($importMode === 'replace') {
                    Menu::query()->delete();
                }
                $ingMap = Ingredient::pluck('id', 'code');
                $sheetRows = $payload['Menu_4Tier_Harga'] ?? $payload['Menu2_Matriks_Harga'] ?? reset($payload) ?: [];
                foreach ($sheetRows as $row) {
                    $sortOrder = (int)($row['Urutan'] ?? $row['Sort_Order'] ?? 0);
                    $name = $row['Nama_Menu'] ?? $row['Nama_Item_Menu'] ?? null;
                    if (!$name && !$sortOrder) continue;

                    $cupCode = $row['Kode_Gelas'] ?? $row['Cup_Code'] ?? null;
                    $menu = Menu::updateOrCreate(
                        ['sort_order' => $sortOrder ?: (Menu::max('sort_order') + 1)],
                        [
                            'name' => trim($name),
                            'menu_group' => $row['Kelompok_Menu'] ?? 'amk_reguler',
                            'report_category' => $row['Kategori_Laporan'] ?? 'amk_murni',
                            'cup_ingredient_id' => $cupCode ? ($ingMap[trim($cupCode)] ?? null) : null,
                            'is_active' => !in_array(strtolower((string)($row['Status_Aktif'] ?? 'aktif')), ['non-aktif', 'false', '0']),
                        ]
                    );

                    $tierCols = [
                        'all_outlet' => $row['Harga_All_Outlet'] ?? $row['Harga_Default'] ?? null,
                        'tp1' => $row['Harga_TP1'] ?? null,
                        'ptc' => $row['Harga_PTC'] ?? null,
                        'tp2' => $row['Harga_TP2'] ?? null,
                    ];
                    foreach ($tierCols as $tier => $val) {
                        $price = ($val === null || $val === '' || $val === '-') ? null : (int)$val;
                        MenuPrice::updateOrCreate(
                            ['menu_id' => $menu->id, 'price_tier' => $tier],
                            ['price' => $price]
                        );
                    }
                }
            } elseif ($templateType === 'template4') {
                // Sheet 1: Master_Bahan_Baku
                foreach (($payload['Master_Bahan_Baku'] ?? []) as $row) {
                    $code = $row['Kode_Bahan'] ?? $row['Code'] ?? null;
                    if (!$code) continue;
                    Ingredient::updateOrCreate(
                        ['code' => trim($code)],
                        [
                            'name' => $row['Nama_Bahan_Baku'] ?? $row['Name'] ?? $code,
                            'category' => $row['Kategori'] ?? 'amk',
                            'dashboard_tier' => (int)($row['Dashboard_Tier'] ?? 1),
                            'base_unit' => $row['Satuan_Dasar'] ?? $row['Satuan'] ?? 'ml',
                            'conversion_unit' => !empty($row['Satuan_Konversi']) ? $row['Satuan_Konversi'] : null,
                            'conversion_factor' => !empty($row['Faktor_Konversi']) ? (float)$row['Faktor_Konversi'] : null,
                            'density_g_per_ml' => !empty($row['Massa_Jenis']) ? (float)$row['Massa_Jenis'] : null,
                            'display_order' => (int)($row['Urutan'] ?? 1),
                            'notes' => $row['Catatan'] ?? null,
                            'is_active' => true,
                        ]
                    );
                }

                $ingMap = Ingredient::pluck('id', 'code');

                // Sheet 2: Base_Adonan
                foreach (($payload['Base_Adonan'] ?? []) as $row) {
                    $code = $row['Kode_Base'] ?? null;
                    if (!$code) continue;
                    BaseRecipe::updateOrCreate(
                        ['code' => trim($code)],
                        [
                            'name' => $row['Nama_Base'] ?? $code,
                            'yield_ml' => (float)($row['Yield_ML'] ?? 1400),
                        ]
                    );
                }

                $baseMap = BaseRecipe::pluck('id', 'code');

                // Sheet 3: Komposisi_Base_Adonan
                if (!empty($payload['Komposisi_Base_Adonan'])) {
                    foreach ($payload['Komposisi_Base_Adonan'] as $row) {
                        $bCode = $row['Kode_Base'] ?? null;
                        if (!$bCode || !isset($baseMap[$bCode])) continue;
                    }
                }

                // Sheet 4: Formula_Resep_Menu
                if (!empty($payload['Formula_Resep_Menu'])) {
                    if ($importMode === 'replace') {
                        MenuRecipeItem::query()->delete();
                    }
                    $menuMap = Menu::pluck('id', 'sort_order');
                    foreach ($payload['Formula_Resep_Menu'] as $row) {
                        $sortOrder = (int)($row['Urutan_Menu'] ?? 0);
                        $menuId = $menuMap[$sortOrder] ?? null;
                        if (!$menuId) continue;

                        $kompCode = trim((string)($row['Kode_Komponen'] ?? ''));
                        MenuRecipeItem::create([
                            'menu_id' => $menuId,
                            'base_recipe_id' => $baseMap[$kompCode] ?? null,
                            'ingredient_id' => $ingMap[$kompCode] ?? null,
                            'quantity' => (float)($row['Takaran'] ?? 0),
                            'input_unit' => $row['Satuan'] ?? 'ml',
                        ]);
                    }
                }
            }
            DB::commit();
            return response()->json(['success' => true, 'message' => "Import Excel ({$templateType} - {$importMode}) berhasil diproses!"]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal import: ' . $e->getMessage()], 500);
        }
    }
}
