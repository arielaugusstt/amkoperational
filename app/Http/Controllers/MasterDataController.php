<?php

namespace App\Http\Controllers;

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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MasterDataController extends Controller
{
    public function getFullMaster()
    {
        $stands = MasterStand::orderBy('urutan_tampil')->get();
        $spg = User::where('role', 'spg')->orderBy('id_spg')->get();

        $menu1Nominals = Menu1NominalConfig::orderBy('urutan')->get();
        $menu1Qtys = Menu1QtyConfig::orderBy('urutan')->get();

        $menu2Items = Menu2Item::orderBy('urutan')->get();
        $menu2Prices = Menu2StandPrice::all()->groupBy('menu2_item_id');

        $ingredients = MasterIngredient::orderBy('urutan')->get();
        $stocks = StandIngredientStock::all()->groupBy('ingredient_id');

        $params = RecipeGlobalParam::orderBy('effective_date', 'desc')->get();
        $batches = RecipeBatch::with('components')->get();
        $mappings = RecipeMenuMapping::orderBy('menu2_item_id')->get();

        return response()->json([
            'stands' => $stands,
            'spg' => $spg,
            'menu1_nominals' => $menu1Nominals,
            'menu1_qtys' => $menu1Qtys,
            'menu2_items' => $menu2Items,
            'menu2_prices' => $menu2Prices,
            'ingredients' => $ingredients,
            'stocks' => $stocks,
            'params' => $params,
            'batches' => $batches,
            'mappings' => $mappings,
        ]);
    }

    public function updateStand(Request $request, $id)
    {
        $stand = MasterStand::findOrFail($id);
        $stand->update($request->only([
            'nama_stand', 'wilayah_laporan', 'blok_wa', 'urutan_tampil',
            'punya_amkopi', 'urutan_amkopi_wa', 'tampilkan_csdng_wa',
            'tampilkan_ptt_wa', 'status_aktif'
        ]));
        return response()->json(['success' => true, 'data' => $stand]);
    }

    public function createStand(Request $request)
    {
        $request->validate(['kode_stand' => 'required|unique:master_stands,kode_stand', 'nama_stand' => 'required']);
        $stand = MasterStand::create($request->all());

        // Create default stock and menu2 price entries for the new stand
        $ingredients = MasterIngredient::all();
        foreach ($ingredients as $ing) {
            StandIngredientStock::create([
                'stand_id' => $stand->id,
                'ingredient_id' => $ing->id,
                'stok_awal_master' => 0,
                'stok_terkini' => 0,
            ]);
        }

        $menu2Items = Menu2Item::all();
        foreach ($menu2Items as $item) {
            Menu2StandPrice::create([
                'menu2_item_id' => $item->id,
                'stand_id' => $stand->id,
                'harga' => $item->harga_default,
            ]);
        }

        return response()->json(['success' => true, 'data' => $stand]);
    }

    public function updateSPG(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $data = $request->only(['name', 'username', 'pin_plain', 'status_aktif']);
        if (!empty($data['pin_plain'])) {
            $data['password'] = Hash::make($data['pin_plain']);
        }
        $user->update($data);
        return response()->json(['success' => true, 'data' => $user]);
    }

    public function createSPG(Request $request)
    {
        $request->validate([
            'id_spg' => 'required|unique:users,id_spg',
            'name' => 'required',
            'username' => 'required|unique:users,username',
            'pin_plain' => 'required',
        ]);

        $user = User::create([
            'id_spg' => $request->input('id_spg'),
            'name' => $request->input('name'),
            'username' => $request->input('username'),
            'pin_plain' => $request->input('pin_plain'),
            'password' => Hash::make($request->input('pin_plain')),
            'role' => 'spg',
            'status_aktif' => true,
        ]);

        return response()->json(['success' => true, 'data' => $user]);
    }

    public function updateMenu2Item(Request $request, $id)
    {
        $item = Menu2Item::findOrFail($id);
        $item->update($request->only(['nama_item', 'kelompok_menu', 'harga_default', 'recipe_status', 'status_aktif']));

        if ($request->has('stand_prices')) {
            $prices = $request->input('stand_prices'); // [stand_id => harga]
            foreach ($prices as $standId => $harga) {
                Menu2StandPrice::updateOrCreate(
                    ['menu2_item_id' => $item->id, 'stand_id' => $standId],
                    ['harga' => (int)$harga]
                );
            }
        }

        return response()->json(['success' => true, 'data' => $item]);
    }

    public function createMenu2Item(Request $request)
    {
        $request->validate([
            'kode_item' => 'required|unique:menu2_items,kode_item',
            'nama_item' => 'required',
            'kelompok_menu' => 'required',
        ]);

        $item = Menu2Item::create([
            'kelompok_menu' => $request->input('kelompok_menu'),
            'kode_item' => $request->input('kode_item'),
            'nama_item' => $request->input('nama_item'),
            'harga_default' => (int)$request->input('harga_default', 0),
            'recipe_status' => $request->input('recipe_status', 'Unmapped'),
            'urutan' => Menu2Item::max('urutan') + 1,
            'status_aktif' => true,
        ]);

        $stands = MasterStand::all();
        $prices = $request->input('stand_prices', []);
        foreach ($stands as $stand) {
            $harga = isset($prices[$stand->id]) ? (int)$prices[$stand->id] : $item->harga_default;
            Menu2StandPrice::create([
                'menu2_item_id' => $item->id,
                'stand_id' => $stand->id,
                'harga' => $harga,
            ]);
        }

        return response()->json(['success' => true, 'data' => $item]);
    }

    public function updateIngredient(Request $request, $id)
    {
        $ing = MasterIngredient::findOrFail($id);
        $ing->update($request->only(['nama_bahan_baku', 'kategori_bahan', 'satuan', 'link_kode_qty_menu1', 'is_resep_amk_core', 'status_aktif']));

        if ($request->has('stand_stocks')) {
            $stocks = $request->input('stand_stocks'); // [stand_id => stok]
            foreach ($stocks as $standId => $stok) {
                StandIngredientStock::updateOrCreate(
                    ['stand_id' => $standId, 'ingredient_id' => $ing->id],
                    ['stok_awal_master' => (float)$stok, 'stok_terkini' => (float)$stok]
                );
            }
        }

        return response()->json(['success' => true, 'data' => $ing]);
    }

    public function createIngredient(Request $request)
    {
        $request->validate([
            'kode_bahan' => 'required|unique:master_ingredients,kode_bahan',
            'nama_bahan_baku' => 'required',
            'kategori_bahan' => 'required',
        ]);

        $ing = MasterIngredient::create([
            'kode_bahan' => $request->input('kode_bahan'),
            'nama_bahan_baku' => $request->input('nama_bahan_baku'),
            'kategori_bahan' => $request->input('kategori_bahan'),
            'satuan' => $request->input('satuan', 'ml'),
            'link_kode_qty_menu1' => $request->input('link_kode_qty_menu1'),
            'is_resep_amk_core' => (bool)$request->input('is_resep_amk_core', false),
            'urutan' => MasterIngredient::max('urutan') + 1,
            'status_aktif' => true,
        ]);

        $stands = MasterStand::all();
        $stocks = $request->input('stand_stocks', []);
        foreach ($stands as $stand) {
            $stok = isset($stocks[$stand->id]) ? (float)$stocks[$stand->id] : 0;
            StandIngredientStock::create([
                'stand_id' => $stand->id,
                'ingredient_id' => $ing->id,
                'stok_awal_master' => $stok,
                'stok_terkini' => $stok,
            ]);
        }

        return response()->json(['success' => true, 'data' => $ing]);
    }

    public function destroyStand($id)
    {
        $stand = MasterStand::findOrFail($id);
        $stand->delete();
        return response()->json(['success' => true, 'message' => 'Stand berhasil dihapus.']);
    }

    public function bulkDestroyStand(Request $request)
    {
        $ids = $request->input('ids', []);
        MasterStand::whereIn('id', $ids)->delete();
        return response()->json(['success' => true, 'message' => count($ids) . ' Stand berhasil dihapus.']);
    }

    public function destroyAllStands()
    {
        $count = MasterStand::count();
        MasterStand::query()->delete();
        return response()->json(['success' => true, 'message' => "Seluruh data Stand ({$count}) berhasil dihapus."]);
    }

    public function destroySPG($id)
    {
        $user = User::where('role', 'spg')->findOrFail($id);
        $user->delete();
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
        $count = User::where('role', 'spg')->count();
        User::where('role', 'spg')->delete();
        return response()->json(['success' => true, 'message' => "Seluruh data SPG ({$count}) berhasil dihapus."]);
    }

    public function destroyMenu2Item($id)
    {
        $item = Menu2Item::findOrFail($id);
        $item->delete(); // cascade deletes Menu2StandPrice and RecipeMenuMapping
        return response()->json(['success' => true, 'message' => 'Menu berhasil dihapus.']);
    }

    public function bulkDestroyMenu2Item(Request $request)
    {
        $ids = $request->input('ids', []);
        Menu2Item::whereIn('id', $ids)->delete();
        return response()->json(['success' => true, 'message' => count($ids) . ' Menu berhasil dihapus.']);
    }

    public function destroyAllMenu2Items()
    {
        $count = Menu2Item::count();
        Menu2StandPrice::query()->delete();
        RecipeMenuMapping::query()->delete();
        Menu2Item::query()->delete();
        return response()->json(['success' => true, 'message' => "Seluruh Menu 2 ({$count}) berhasil dihapus."]);
    }

    public function destroyIngredient($id)
    {
        $ing = MasterIngredient::findOrFail($id);
        $ing->delete();
        return response()->json(['success' => true, 'message' => 'Bahan baku berhasil dihapus.']);
    }

    public function bulkDestroyIngredient(Request $request)
    {
        $ids = $request->input('ids', []);
        MasterIngredient::whereIn('id', $ids)->delete();
        return response()->json(['success' => true, 'message' => count($ids) . ' Bahan baku berhasil dihapus.']);
    }

    public function destroyAllIngredients()
    {
        $count = MasterIngredient::count();
        StandIngredientStock::query()->delete();
        MasterIngredient::query()->delete();
        return response()->json(['success' => true, 'message' => "Seluruh Bahan Baku ({$count}) berhasil dihapus."]);
    }

    // Menu 1 Config CRUD
    public function createMenu1Nominal(Request $request)
    {
        $request->validate(['kode_kategori' => 'required|unique:menu1_nominal_configs,kode_kategori', 'label_input_nominal' => 'required']);
        $nom = Menu1NominalConfig::create([
            'kode_kategori' => $request->input('kode_kategori'),
            'label_input_nominal' => $request->input('label_input_nominal'),
            'keterangan_bantu' => $request->input('keterangan_bantu'),
            'urutan' => (int)$request->input('urutan', Menu1NominalConfig::max('urutan') + 1),
            'status_aktif' => (bool)$request->input('status_aktif', true),
        ]);
        return response()->json(['success' => true, 'data' => $nom]);
    }

    public function updateMenu1Nominal(Request $request, $id)
    {
        $nom = Menu1NominalConfig::findOrFail($id);
        $nom->update($request->only(['label_input_nominal', 'keterangan_bantu', 'urutan', 'status_aktif']));
        return response()->json(['success' => true, 'data' => $nom]);
    }

    public function destroyMenu1Nominal($id)
    {
        Menu1NominalConfig::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Kategori nominal berhasil dihapus.']);
    }

    public function createMenu1Qty(Request $request)
    {
        $request->validate(['kode_qty_menu1' => 'required|unique:menu1_qty_configs,kode_qty_menu1', 'label_input_qty' => 'required']);
        $qty = Menu1QtyConfig::create([
            'kode_qty_menu1' => $request->input('kode_qty_menu1'),
            'label_input_qty' => $request->input('label_input_qty'),
            'urutan' => (int)$request->input('urutan', Menu1QtyConfig::max('urutan') + 1),
            'status_aktif' => (bool)$request->input('status_aktif', true),
        ]);
        return response()->json(['success' => true, 'data' => $qty]);
    }

    public function updateMenu1Qty(Request $request, $id)
    {
        $qty = Menu1QtyConfig::findOrFail($id);
        $qty->update($request->only(['label_input_qty', 'urutan', 'status_aktif']));
        return response()->json(['success' => true, 'data' => $qty]);
    }

    public function destroyMenu1Qty($id)
    {
        Menu1QtyConfig::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Item QTY berhasil dihapus.']);
    }

    public function destroyAllMenu1(Request $request)
    {
        $target = $request->input('target', 'all'); // 'nominal', 'qty', 'all'
        if ($target === 'nominal' || $target === 'all') {
            Menu1NominalConfig::query()->delete();
        }
        if ($target === 'qty' || $target === 'all') {
            Menu1QtyConfig::query()->delete();
        }
        return response()->json(['success' => true, 'message' => 'Konfigurasi Menu 1 berhasil dikosongkan.']);
    }

    // Master Resep CRUD
    public function createBatch(Request $request)
    {
        $request->validate(['kode_batch' => 'required', 'nama_batch' => 'required', 'volume_batch_ml' => 'required|numeric']);
        $batch = RecipeBatch::create([
            'kode_batch' => $request->input('kode_batch'),
            'nama_batch' => $request->input('nama_batch'),
            'volume_batch_ml' => (float)$request->input('volume_batch_ml'),
            'effective_date' => $request->input('effective_date', '2026-01-01'),
            'keterangan' => $request->input('keterangan'),
            'status_aktif' => true,
        ]);

        $comps = $request->input('components', []);
        foreach ($comps as $c) {
            RecipeBatchComponent::create([
                'recipe_batch_id' => $batch->id,
                'tipe_komponen' => $c['tipe_komponen'] ?? 'raw_ingredient',
                'kode_referensi' => $c['kode_referensi'],
                'nama_komponen' => $c['nama_komponen'] ?? $c['kode_referensi'],
                'jumlah' => (float)($c['jumlah'] ?? 0),
                'satuan' => $c['satuan'] ?? 'ml',
            ]);
        }

        return response()->json(['success' => true, 'data' => $batch->load('components')]);
    }

    public function updateBatch(Request $request, $id)
    {
        $batch = RecipeBatch::findOrFail($id);
        $batch->update($request->only(['nama_batch', 'volume_batch_ml', 'effective_date', 'keterangan', 'status_aktif']));

        if ($request->has('components')) {
            $batch->components()->delete();
            $comps = $request->input('components', []);
            foreach ($comps as $c) {
                RecipeBatchComponent::create([
                    'recipe_batch_id' => $batch->id,
                    'tipe_komponen' => $c['tipe_komponen'] ?? 'raw_ingredient',
                    'kode_referensi' => $c['kode_referensi'],
                    'nama_komponen' => $c['nama_komponen'] ?? $c['kode_referensi'],
                    'jumlah' => (float)($c['jumlah'] ?? 0),
                    'satuan' => $c['satuan'] ?? 'ml',
                ]);
            }
        }

        return response()->json(['success' => true, 'data' => $batch->load('components')]);
    }

    public function destroyBatch($id)
    {
        $batch = RecipeBatch::findOrFail($id);
        $batch->delete(); // cascade components
        return response()->json(['success' => true, 'message' => 'Batch dapur berhasil dihapus.']);
    }

    public function destroyAllBatches()
    {
        RecipeBatchComponent::query()->delete();
        RecipeBatch::query()->delete();
        return response()->json(['success' => true, 'message' => 'Seluruh rumus batch dapur berhasil dihapus.']);
    }

    public function createMapping(Request $request)
    {
        $request->validate([
            'menu2_item_id' => 'required|exists:menu2_items,id',
            'kode_referensi' => 'required',
            'nilai_takaran' => 'required|numeric',
        ]);

        $map = RecipeMenuMapping::create([
            'menu2_item_id' => $request->input('menu2_item_id'),
            'tipe_komponen' => $request->input('tipe_komponen', 'batch_adonan'),
            'kode_referensi' => $request->input('kode_referensi'),
            'mode_takaran' => $request->input('mode_takaran', 'percent_vol_reg'),
            'nilai_takaran' => (float)$request->input('nilai_takaran'),
            'satuan' => $request->input('satuan', 'ml'),
            'effective_date' => $request->input('effective_date', '2026-01-01'),
        ]);

        return response()->json(['success' => true, 'data' => $map]);
    }

    public function updateMapping(Request $request, $id)
    {
        $map = RecipeMenuMapping::findOrFail($id);
        $map->update($request->only(['tipe_komponen', 'kode_referensi', 'mode_takaran', 'nilai_takaran', 'satuan', 'effective_date']));
        return response()->json(['success' => true, 'data' => $map]);
    }

    public function destroyMapping($id)
    {
        RecipeMenuMapping::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Mapping resep berhasil dihapus.']);
    }

    public function bulkDestroyMapping(Request $request)
    {
        $ids = $request->input('ids', []);
        RecipeMenuMapping::whereIn('id', $ids)->delete();
        return response()->json(['success' => true, 'message' => count($ids) . ' Mapping resep berhasil dihapus.']);
    }

    public function destroyAllMappings()
    {
        $count = RecipeMenuMapping::count();
        RecipeMenuMapping::query()->delete();
        return response()->json(['success' => true, 'message' => "Seluruh mapping resep ({$count}) berhasil dihapus."]);
    }

    public function importMasterData(Request $request)
    {
        $type = $request->input('template_type'); // template1, template2, template3, template4
        $importMode = $request->input('import_mode', 'append'); // 'replace' | 'append'
        $payload = $request->input('payload'); // parsed sheets array/objects from SheetJS

        if (!$payload || !is_array($payload)) {
            return response()->json(['success' => false, 'message' => 'Data payload kosong.'], 400);
        }

        DB::beginTransaction();
        try {
            if ($type === 'template1') {
                if ($importMode === 'replace') {
                    if (!empty($payload['Master_Stand'])) {
                        MasterStand::query()->delete();
                    }
                    if (!empty($payload['Master_SPG'])) {
                        User::where('role', 'spg')->delete();
                    }
                }

                // Sheet 1: Master_Stand
                if (!empty($payload['Master_Stand'])) {
                    foreach ($payload['Master_Stand'] as $row) {
                        $kode = trim($row['Kode_Stand'] ?? '');
                        if (!$kode) continue;
                        MasterStand::updateOrCreate(
                            ['kode_stand' => $kode],
                            [
                                'nama_stand' => $row['Nama_Stand'] ?? $kode,
                                'wilayah_laporan' => $row['Wilayah_Laporan'] ?? 'Utara',
                                'blok_wa' => $row['Blok_WA'] ?? 'Blok 1',
                                'urutan_tampil' => (int)($row['Urutan_Tampil'] ?? 1),
                                'punya_amkopi' => strtolower(trim((string)($row['Punya_AMKopi'] ?? ''))) === 'ya',
                                'tampilkan_csdng_wa' => strtolower(trim((string)($row['Tampilkan_Csdng_WA'] ?? ''))) === 'ya',
                                'tampilkan_ptt_wa' => strtolower(trim((string)($row['Tampilkan_PTT_WA'] ?? ''))) === 'ya',
                                'status_aktif' => strtolower(trim((string)($row['Status_Aktif'] ?? 'ya'))) !== 'tidak',
                            ]
                        );
                    }
                }
                // Sheet 2: Master_SPG
                if (!empty($payload['Master_SPG'])) {
                    foreach ($payload['Master_SPG'] as $row) {
                        $username = trim($row['Username'] ?? '');
                        if (!$username) continue;
                        $pin = trim((string)($row['PIN_Password'] ?? '1234'));
                        User::updateOrCreate(
                            ['username' => $username],
                            [
                                'id_spg' => $row['ID_SPG'] ?? null,
                                'name' => $row['Nama_SPG'] ?? $username,
                                'pin_plain' => $pin,
                                'password' => Hash::make($pin),
                                'role' => 'spg',
                                'status_aktif' => strtolower(trim((string)($row['Status_Aktif'] ?? 'ya'))) !== 'tidak',
                            ]
                        );
                    }
                }
            } elseif ($type === 'template2') {
                if ($importMode === 'replace') {
                    if (!empty($payload['Kategori_Nominal_Menu1'])) {
                        Menu1NominalConfig::query()->delete();
                    }
                    if (!empty($payload['Item_QTY_Menu1'])) {
                        Menu1QtyConfig::query()->delete();
                    }
                }

                if (!empty($payload['Kategori_Nominal_Menu1'])) {
                    foreach ($payload['Kategori_Nominal_Menu1'] as $row) {
                        $kode = trim($row['Kode_Kategori'] ?? '');
                        if (!$kode) continue;
                        Menu1NominalConfig::updateOrCreate(
                            ['kode_kategori' => $kode],
                            [
                                'label_input_nominal' => $row['Label_Input_Nominal'] ?? $kode,
                                'urutan' => (int)($row['Urutan'] ?? 1),
                                'status_aktif' => strtolower(trim((string)($row['Status_Aktif'] ?? 'ya'))) !== 'tidak',
                            ]
                        );
                    }
                }

                if (!empty($payload['Item_QTY_Menu1'])) {
                    foreach ($payload['Item_QTY_Menu1'] as $row) {
                        $kode = trim($row['Kode_QTY_Menu1'] ?? '');
                        if (!$kode) continue;
                        Menu1QtyConfig::updateOrCreate(
                            ['kode_qty_menu1' => $kode],
                            [
                                'label_input_qty' => $row['Label_Input_QTY'] ?? $kode,
                                'urutan' => (int)($row['Urutan'] ?? 1),
                                'status_aktif' => strtolower(trim((string)($row['Status_Aktif'] ?? 'ya'))) !== 'tidak',
                            ]
                        );
                    }
                }
            } elseif ($type === 'template3') {
                // Master Menu & Harga Stand
                $sheetData = $payload['Master_Menu2'] ?? $payload['Sheet1'] ?? reset($payload);
                if (!empty($sheetData)) {
                    if ($importMode === 'replace') {
                        Menu2StandPrice::query()->delete();
                        RecipeMenuMapping::query()->delete();
                        Menu2Item::query()->delete();
                    }

                    $stands = MasterStand::all()->keyBy('kode_stand');
                    foreach ($sheetData as $row) {
                        $kode = trim($row['Kode_Item'] ?? '');
                        if (!$kode) continue;
                        $item = Menu2Item::updateOrCreate(
                            ['kode_item' => $kode],
                            [
                                'kelompok_menu' => $row['Kelompok_Menu'] ?? 'AMK 27 Menu',
                                'nama_item' => $row['Nama_Item'] ?? $kode,
                                'harga_default' => (int)($row['Harga_Default'] ?? 0),
                                'status_aktif' => strtolower(trim((string)($row['Status_Aktif'] ?? 'ya'))) !== 'tidak',
                            ]
                        );
                        foreach ($stands as $standKode => $stand) {
                            if (isset($row[$standKode])) {
                                Menu2StandPrice::updateOrCreate(
                                    ['menu2_item_id' => $item->id, 'stand_id' => $stand->id],
                                    ['harga' => (int)$row[$standKode]]
                                );
                            }
                        }
                    }
                }
            } elseif ($type === 'template4') {
                // Master Bahan Baku & Resep
                if ($importMode === 'replace') {
                    if (!empty($payload['Master_Bahan_Menu3'])) {
                        StandIngredientStock::query()->delete();
                        MasterIngredient::query()->delete();
                    }
                    if (!empty($payload['Parameter_Global_Resep'])) {
                        RecipeGlobalParam::query()->delete();
                    }
                    if (!empty($payload['Rumus_Batch_Dapur'])) {
                        RecipeBatchComponent::query()->delete();
                        RecipeBatch::query()->delete();
                    }
                    if (!empty($payload['Mapping_Resep_Menu2'])) {
                        RecipeMenuMapping::query()->delete();
                    }
                }

                // Sheet 1: Master_Bahan_Menu3
                if (!empty($payload['Master_Bahan_Menu3'])) {
                    foreach ($payload['Master_Bahan_Menu3'] as $row) {
                        $kode = trim($row['Kode_Bahan'] ?? '');
                        if (!$kode) continue;
                        MasterIngredient::updateOrCreate(
                            ['kode_bahan' => $kode],
                            [
                                'kategori_bahan' => $row['Kategori_Bahan'] ?? 'Bahan Baku',
                                'nama_bahan_baku' => $row['Nama_Bahan_Baku'] ?? $kode,
                                'satuan' => $row['Satuan'] ?? 'ml',
                                'link_kode_qty_menu1' => !empty($row['Link_Kode_QTY_Menu1']) ? trim($row['Link_Kode_QTY_Menu1']) : null,
                                'status_aktif' => true,
                            ]
                        );
                    }
                }

                // Sheet 2: Parameter_Global_Resep
                if (!empty($payload['Parameter_Global_Resep'])) {
                    foreach ($payload['Parameter_Global_Resep'] as $row) {
                        $key = trim($row['Param_Key'] ?? '');
                        if (!$key) continue;
                        RecipeGlobalParam::create([
                            'param_key' => $key,
                            'nama_parameter' => $row['Nama_Parameter'] ?? $key,
                            'nilai_param' => (float)($row['Nilai'] ?? 185),
                            'satuan' => $row['Satuan'] ?? 'ml',
                            'effective_date' => $row['Effective_Date'] ?? '2026-01-01',
                            'keterangan' => $row['Keterangan'] ?? null,
                            'status_aktif' => true,
                        ]);
                    }
                }

                // Sheet 3: Rumus_Batch_Dapur
                if (!empty($payload['Rumus_Batch_Dapur'])) {
                    $groupedBatches = [];
                    foreach ($payload['Rumus_Batch_Dapur'] as $row) {
                        $batchCode = trim($row['Kode_Batch'] ?? '');
                        if (!$batchCode) continue;
                        if (!isset($groupedBatches[$batchCode])) {
                            $groupedBatches[$batchCode] = [
                                'nama_batch' => $row['Nama_Batch'] ?? $batchCode,
                                'volume' => (float)($row['Volume_Batch_ML'] ?? 1000),
                                'components' => [],
                            ];
                        }
                        if (!empty($row['Kode_Referensi'])) {
                            $groupedBatches[$batchCode]['components'][] = [
                                'tipe_komponen' => $row['Tipe_Komponen'] ?? 'raw_ingredient',
                                'kode_referensi' => $row['Kode_Referensi'],
                                'nama_komponen' => $row['Nama_Komponen'] ?? $row['Kode_Referensi'],
                                'jumlah' => (float)($row['Jumlah'] ?? 0),
                                'satuan' => $row['Satuan'] ?? 'ml',
                            ];
                        }
                    }

                    foreach ($groupedBatches as $batchCode => $bData) {
                        $batch = RecipeBatch::updateOrCreate(
                            ['kode_batch' => $batchCode],
                            [
                                'nama_batch' => $bData['nama_batch'],
                                'volume_batch_ml' => $bData['volume'],
                                'effective_date' => '2026-01-01',
                                'status_aktif' => true,
                            ]
                        );
                        $batch->components()->delete();
                        foreach ($bData['components'] as $comp) {
                            RecipeBatchComponent::create([
                                'recipe_batch_id' => $batch->id,
                                'tipe_komponen' => $comp['tipe_komponen'],
                                'kode_referensi' => $comp['kode_referensi'],
                                'nama_komponen' => $comp['nama_komponen'],
                                'jumlah' => $comp['jumlah'],
                                'satuan' => $comp['satuan'],
                            ]);
                        }
                    }
                }

                // Sheet 4: Mapping_Resep_Menu2
                if (!empty($payload['Mapping_Resep_Menu2'])) {
                    $menuItems = Menu2Item::all()->keyBy('kode_item');
                    foreach ($payload['Mapping_Resep_Menu2'] as $row) {
                        $itemCode = trim($row['Kode_Item'] ?? '');
                        $itemId = $row['Menu2_Item_ID'] ?? null;
                        $targetItem = null;
                        if ($itemCode && isset($menuItems[$itemCode])) {
                            $targetItem = $menuItems[$itemCode];
                        } elseif ($itemId) {
                            $targetItem = Menu2Item::find($itemId);
                        }

                        if ($targetItem && !empty($row['Kode_Referensi'])) {
                            RecipeMenuMapping::create([
                                'menu2_item_id' => $targetItem->id,
                                'tipe_komponen' => $row['Tipe_Komponen'] ?? 'batch_adonan',
                                'kode_referensi' => $row['Kode_Referensi'],
                                'mode_takaran' => $row['Mode_Takaran'] ?? 'percent_vol_reg',
                                'nilai_takaran' => (float)($row['Nilai_Takaran'] ?? 0),
                                'satuan' => $row['Satuan'] ?? 'ml',
                                'effective_date' => $row['Effective_Date'] ?? '2026-01-01',
                            ]);
                        }
                    }
                }
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Import Master Data (' . strtoupper($importMode) . ') berhasil diproses!'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal import: ' . $e->getMessage()], 500);
        }
    }
}

