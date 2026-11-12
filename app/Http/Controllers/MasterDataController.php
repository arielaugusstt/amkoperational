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

    public function importMasterData(Request $request)
    {
        $type = $request->input('template_type'); // template1, template2, template3, template4
        $payload = $request->input('payload'); // parsed sheets array/objects from SheetJS

        if (!$payload || !is_array($payload)) {
            return response()->json(['success' => false, 'message' => 'Data payload kosong.'], 400);
        }

        DB::beginTransaction();
        try {
            if ($type === 'template1') {
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
                                'punya_amkopi' => strtolower(trim($row['Punya_AMKopi'] ?? '')) === 'ya',
                                'tampilkan_csdng_wa' => strtolower(trim($row['Tampilkan_Csdng_WA'] ?? '')) === 'ya',
                                'tampilkan_ptt_wa' => strtolower(trim($row['Tampilkan_PTT_WA'] ?? '')) === 'ya',
                                'status_aktif' => strtolower(trim($row['Status_Aktif'] ?? 'ya')) !== 'tidak',
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
                                'status_aktif' => strtolower(trim($row['Status_Aktif'] ?? 'ya')) !== 'tidak',
                            ]
                        );
                    }
                }
            } elseif ($type === 'template3') {
                // Master Menu & Harga Stand
                $sheetData = $payload['Master_Menu2'] ?? $payload['Sheet1'] ?? reset($payload);
                if (!empty($sheetData)) {
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
                                'status_aktif' => strtolower(trim($row['Status_Aktif'] ?? 'ya')) !== 'tidak',
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
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Import Master Data berhasil diproses!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal import: ' . $e->getMessage()], 500);
        }
    }
}
