<?php

namespace App\Http\Controllers;

use App\Models\DailyInventoryMenu3;
use App\Models\DailyReportMenu1;
use App\Models\DailySaleMenu2;
use App\Models\MasterIngredient;
use App\Models\MasterStand;
use App\Models\Menu1NominalConfig;
use App\Models\Menu1QtyConfig;
use App\Models\Menu2Item;
use App\Models\Menu2StandPrice;
use App\Models\StandIngredientStock;
use App\Models\StockOpnameRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OperationalController extends Controller
{
    public function initialData()
    {
        $stands = MasterStand::where('status_aktif', true)->orderBy('urutan_tampil')->get();
        $spgList = User::where('role', 'spg')->where('status_aktif', true)->orderBy('name')->get(['id', 'id_spg', 'name', 'username']);
        $menu1Nominals = Menu1NominalConfig::where('status_aktif', true)->orderBy('urutan')->get();
        $menu1Qtys = Menu1QtyConfig::where('status_aktif', true)->orderBy('urutan')->get();

        $menu2Items = Menu2Item::where('status_aktif', true)->orderBy('urutan')->get();
        $menu2Prices = Menu2StandPrice::all()->groupBy('menu2_item_id');

        $ingredients = MasterIngredient::where('status_aktif', true)->orderBy('urutan')->get();
        $stocks = StandIngredientStock::all()->groupBy('stand_id');

        return response()->json([
            'stands' => $stands,
            'spg_list' => $spgList,
            'menu1_nominals' => $menu1Nominals,
            'menu1_qtys' => $menu1Qtys,
            'menu2_items' => $menu2Items,
            'menu2_prices' => $menu2Prices,
            'ingredients' => $ingredients,
            'stocks' => $stocks,
        ]);
    }

    public function todayStatus(Request $request)
    {
        $standId = $request->query('stand_id');
        $tanggal = $request->query('tanggal', date('Y-m-d'));

        if (!$standId) {
            return response()->json(['error' => 'stand_id diperlukan'], 400);
        }

        $m1 = DailyReportMenu1::where('stand_id', $standId)->where('tanggal', $tanggal)->first();
        $m2 = DailySaleMenu2::where('stand_id', $standId)->where('tanggal', $tanggal)->first();
        $m3 = DailyInventoryMenu3::where('stand_id', $standId)->where('tanggal', $tanggal)->first();

        return response()->json([
            'stand_id' => (int)$standId,
            'tanggal' => $tanggal,
            'menu1' => [
                'status' => $m1 ? 'Sudah Input' : 'Belum Input',
                'id' => $m1 ? $m1->id : null,
                'total_penjualan' => $m1 ? $m1->total_semua_penjualan : 0,
                'qty_per_item' => $m1 ? $m1->qty_per_item : [],
            ],
            'menu2' => [
                'status' => $m2 ? 'Sudah Input' : 'Belum Input',
                'id' => $m2 ? $m2->id : null,
                'grand_total' => $m2 ? $m2->grand_total : 0,
            ],
            'menu3' => [
                'status' => $m3 ? 'Sudah Input' : 'Belum Input',
                'id' => $m3 ? $m3->id : null,
            ],
        ]);
    }

    public function getMenu1(Request $request)
    {
        $standId = $request->query('stand_id');
        $tanggal = $request->query('tanggal', date('Y-m-d'));

        $report = DailyReportMenu1::where('stand_id', $standId)->where('tanggal', $tanggal)->first();
        return response()->json(['data' => $report]);
    }

    public function submitMenu1(Request $request)
    {
        $request->validate([
            'stand_id' => 'required|exists:master_stands,id',
            'tanggal' => 'required|date',
            'spg_list' => 'required|array|min:1',
            'total_semua_penjualan' => 'required|numeric',
            'nominal_qris' => 'required|numeric',
            'nominal_tunai' => 'required|numeric',
        ]);

        $standId = $request->input('stand_id');
        $tanggal = $request->input('tanggal');
        $totalPenjualan = (int)$request->input('total_semua_penjualan');
        $qris = (int)$request->input('nominal_qris');
        $tunai = (int)$request->input('nominal_tunai');

        // Validation lock: QRIS + Tunai must equal Total Penjualan
        if (($qris + $tunai) !== $totalPenjualan) {
            $selisih = abs($totalPenjualan - ($qris + $tunai));
            return response()->json([
                'success' => false,
                'message' => "Selisih Rp " . number_format($selisih, 0, ',', '.') . " dengan Total Penjualan! Nominal QRIS + Tunai harus sama dengan Total Penjualan.",
            ], 422);
        }

        $userId = Auth::id();

        $report = DailyReportMenu1::updateOrCreate(
            ['stand_id' => $standId, 'tanggal' => $tanggal],
            [
                'spg_list' => $request->input('spg_list'),
                'nominal_per_kategori' => $request->input('nominal_per_kategori', []),
                'penjualan_tambahan' => $request->input('penjualan_tambahan', []),
                'total_semua_penjualan' => $totalPenjualan,
                'nominal_qris' => $qris,
                'nominal_tunai' => $tunai,
                'biaya_harian' => $request->input('biaya_harian', []),
                'total_biaya' => (int)$request->input('total_biaya', 0),
                'sisa_setoran_tunai' => (int)$request->input('sisa_setoran_tunai', 0),
                'qris_proof_base64' => $request->input('qris_proof_base64'),
                'qty_per_item' => $request->input('qty_per_item', []),
                'submitted_by' => $userId,
                'updated_by' => $userId,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Laporan Harian (Menu 1) berhasil disimpan!',
            'data' => $report,
        ]);
    }

    public function getMenu2(Request $request)
    {
        $standId = $request->query('stand_id');
        $tanggal = $request->query('tanggal', date('Y-m-d'));

        $menu1 = DailyReportMenu1::where('stand_id', $standId)->where('tanggal', $tanggal)->first();
        $menu2 = DailySaleMenu2::where('stand_id', $standId)->where('tanggal', $tanggal)->first();

        return response()->json([
            'menu1_available' => $menu1 !== null,
            'menu1_total' => $menu1 ? $menu1->total_semua_penjualan : 0,
            'data' => $menu2,
        ]);
    }

    public function submitMenu2(Request $request)
    {
        $request->validate([
            'stand_id' => 'required|exists:master_stands,id',
            'tanggal' => 'required|date',
            'items_sold' => 'required|array',
            'grand_total' => 'required|numeric',
        ]);

        $standId = $request->input('stand_id');
        $tanggal = $request->input('tanggal');
        $grandTotal = (int)$request->input('grand_total');

        // Gatekeeper check: Menu 1 MUST exist
        $menu1 = DailyReportMenu1::where('stand_id', $standId)->where('tanggal', $tanggal)->first();
        if (!$menu1) {
            return response()->json([
                'success' => false,
                'message' => 'Data Laporan Harian (Menu 1) untuk Stand dan Tanggal ini belum tersedia! Harap segera input di Menu 1 terlebih dahulu.',
            ], 422);
        }

        // Lock validation: Grand Total Menu 2 MUST equal Total Penjualan Menu 1
        if ($grandTotal !== (int)$menu1->total_semua_penjualan) {
            $selisih = abs((int)$menu1->total_semua_penjualan - $grandTotal);
            return response()->json([
                'success' => false,
                'message' => "Grand Total Menu 2 (Rp " . number_format($grandTotal, 0, ',', '.') . ") berbeda Rp " . number_format($selisih, 0, ',', '.') . " dengan Total Penjualan di Menu 1 (Rp " . number_format($menu1->total_semua_penjualan, 0, ',', '.') . ")! Nominal harus sama persis.",
            ], 422);
        }

        $userId = Auth::id();

        $sale = DailySaleMenu2::updateOrCreate(
            ['stand_id' => $standId, 'tanggal' => $tanggal],
            [
                'menu1_report_id' => $menu1->id,
                'items_sold' => $request->input('items_sold'),
                'unregistered_items' => $request->input('unregistered_items', []),
                'grand_total' => $grandTotal,
                'submitted_by' => $userId,
                'updated_by' => $userId,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Form Penjualan (Menu 2) berhasil disimpan!',
            'data' => $sale,
        ]);
    }

    public function getMenu3(Request $request)
    {
        $standId = $request->query('stand_id');
        $tanggal = $request->query('tanggal', date('Y-m-d'));

        $menu1 = DailyReportMenu1::where('stand_id', $standId)->where('tanggal', $tanggal)->first();
        $existing = DailyInventoryMenu3::where('stand_id', $standId)->where('tanggal', $tanggal)->first();

        // Previous day stok akhir or initial stock
        $prevDate = Carbon::parse($tanggal)->subDay()->format('Y-m-d');
        $prevReport = DailyInventoryMenu3::where('stand_id', $standId)->where('tanggal', $prevDate)->first();

        $prevStocksMap = [];
        if ($prevReport && !empty($prevReport->inventory_items)) {
            foreach ($prevReport->inventory_items as $item) {
                $prevStocksMap[$item['ingredient_id']] = (float)($item['stok_akhir'] ?? 0);
            }
        }

        // Master stock fallback
        $masterStocks = StandIngredientStock::where('stand_id', $standId)->get()->keyBy('ingredient_id');
        $ingredients = MasterIngredient::where('status_aktif', true)->orderBy('urutan')->get();

        $preparedItems = [];
        foreach ($ingredients as $ing) {
            // Determine stok awal
            $stokAwal = 0.0;
            if (isset($prevStocksMap[$ing->id])) {
                $stokAwal = $prevStocksMap[$ing->id];
            } elseif (isset($masterStocks[$ing->id])) {
                $stokAwal = (float)$masterStocks[$ing->id]->stok_terkini;
            }

            // Link to Menu 1 QTY if available
            $refMenu1Qty = null;
            if ($ing->link_kode_qty_menu1 && $menu1 && isset($menu1->qty_per_item[$ing->link_kode_qty_menu1])) {
                $refMenu1Qty = (float)$menu1->qty_per_item[$ing->link_kode_qty_menu1];
            }

            $preparedItems[] = [
                'ingredient_id' => $ing->id,
                'kode_bahan' => $ing->kode_bahan,
                'kategori_bahan' => $ing->kategori_bahan,
                'nama_bahan_baku' => $ing->nama_bahan_baku,
                'satuan' => $ing->satuan,
                'link_kode_qty_menu1' => $ing->link_kode_qty_menu1,
                'ref_menu1_qty' => $refMenu1Qty,
                'stok_awal' => $stokAwal,
                'barang_masuk' => 0,
                'barang_terpakai' => $refMenu1Qty !== null ? $refMenu1Qty : 0,
                'barang_rusak' => 0,
                'stok_akhir' => $stokAwal,
            ];
        }

        return response()->json([
            'menu1_available' => $menu1 !== null,
            'existing' => $existing,
            'prepared_items' => $preparedItems,
        ]);
    }

    public function submitMenu3(Request $request)
    {
        $request->validate([
            'stand_id' => 'required|exists:master_stands,id',
            'tanggal' => 'required|date',
            'inventory_items' => 'required|array',
        ]);

        $standId = $request->input('stand_id');
        $tanggal = $request->input('tanggal');

        // Gatekeeper check: Menu 1 MUST exist
        $menu1 = DailyReportMenu1::where('stand_id', $standId)->where('tanggal', $tanggal)->first();
        if (!$menu1) {
            return response()->json([
                'success' => false,
                'message' => 'Data Laporan Harian (Menu 1) untuk Stand dan Tanggal ini belum tersedia! Harap segera input di Menu 1 terlebih dahulu.',
            ], 422);
        }

        $userId = Auth::id();
        $items = $request->input('inventory_items');

        // Ensure calculated stok akhir
        foreach ($items as &$item) {
            $awal = (float)($item['stok_awal'] ?? 0);
            $masuk = (float)($item['barang_masuk'] ?? 0);
            $terpakai = (float)($item['barang_terpakai'] ?? 0);
            $rusak = (float)($item['barang_rusak'] ?? 0);
            $item['stok_akhir'] = $awal + $masuk - $terpakai - $rusak;

            // Also update stand_ingredient_stocks
            StandIngredientStock::updateOrCreate(
                ['stand_id' => $standId, 'ingredient_id' => $item['ingredient_id']],
                ['stok_terkini' => $item['stok_akhir']]
            );
        }

        $inventory = DailyInventoryMenu3::updateOrCreate(
            ['stand_id' => $standId, 'tanggal' => $tanggal],
            [
                'menu1_report_id' => $menu1->id,
                'inventory_items' => $items,
                'submitted_by' => $userId,
                'updated_by' => $userId,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Form Bahan Baku (Menu 3) berhasil disimpan!',
            'data' => $inventory,
        ]);
    }

    public function submitStockOpname(Request $request)
    {
        $request->validate([
            'stand_id' => 'required|exists:master_stands,id',
            'tanggal' => 'required|date',
            'opname_items' => 'required|array',
        ]);

        $userId = Auth::id();
        $opname = StockOpnameRequest::create([
            'stand_id' => $request->input('stand_id'),
            'tanggal' => $request->input('tanggal'),
            'opname_items' => $request->input('opname_items'),
            'catatan_spg' => $request->input('catatan_spg'),
            'status' => 'Pending',
            'requested_by' => $userId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan Stock Opname berhasil dikirim dan menunggu persetujuan Superadmin.',
            'data' => $opname,
        ]);
    }
}
