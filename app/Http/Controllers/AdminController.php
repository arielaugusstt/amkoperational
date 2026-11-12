<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use App\Models\DailyInventoryMenu3;
use App\Models\DailyReportMenu1;
use App\Models\DailySaleMenu2;
use App\Models\MasterIngredient;
use App\Models\MasterStand;
use App\Models\RecipeGlobalParam;
use App\Models\StandIngredientStock;
use App\Models\StockOpnameRequest;
use App\Services\ReverseAnalyticService;
use App\Services\WhatsAppReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    protected $reverseService;
    protected $waService;

    public function __construct(ReverseAnalyticService $reverseService, WhatsAppReportService $waService)
    {
        $this->reverseService = $reverseService;
        $this->waService = $waService;
    }

    public function dashboardStats(Request $request)
    {
        $tanggal = $request->query('tanggal', date('Y-m-d'));

        $m1Reports = DailyReportMenu1::with('stand')->where('tanggal', $tanggal)->get();
        $m2Reports = DailySaleMenu2::where('tanggal', $tanggal)->get()->keyBy('stand_id');
        $m3Reports = DailyInventoryMenu3::where('tanggal', $tanggal)->get()->keyBy('stand_id');

        $stands = MasterStand::where('status_aktif', true)->orderBy('urutan_tampil')->get();

        $totalPenjualan = $m1Reports->sum('total_semua_penjualan');
        $totalQris = $m1Reports->sum('nominal_qris');
        $totalTunai = $m1Reports->sum('nominal_tunai');
        $totalBiaya = $m1Reports->sum('total_biaya');
        $totalSisaSetoran = $m1Reports->sum('sisa_setoran_tunai');

        $standProgress = [];
        $m1Keyed = $m1Reports->keyBy('stand_id');
        foreach ($stands as $stand) {
            $m1 = $m1Keyed->get($stand->id);
            $m2 = $m2Reports->get($stand->id);
            $m3 = $m3Reports->get($stand->id);

            $standProgress[] = [
                'stand_id' => $stand->id,
                'kode_stand' => $stand->kode_stand,
                'nama_stand' => $stand->nama_stand,
                'wilayah' => $stand->wilayah_laporan,
                'blok_wa' => $stand->blok_wa,
                'm1_status' => $m1 ? 'Sudah Input' : 'Belum Input',
                'm1_total' => $m1 ? $m1->total_semua_penjualan : 0,
                'm1_data' => $m1,
                'm2_status' => $m2 ? 'Sudah Input' : 'Belum Input',
                'm2_total' => $m2 ? $m2->grand_total : 0,
                'm2_data' => $m2,
                'm3_status' => $m3 ? 'Sudah Input' : 'Belum Input',
                'm3_data' => $m3,
            ];
        }

        $pendingOpnameCount = StockOpnameRequest::where('status', 'Pending')->count();

        return response()->json([
            'tanggal' => $tanggal,
            'summary' => [
                'total_penjualan' => $totalPenjualan,
                'total_qris' => $totalQris,
                'total_tunai' => $totalTunai,
                'total_biaya' => $totalBiaya,
                'total_sisa_setoran' => $totalSisaSetoran,
                'stands_completed_m1' => $m1Reports->count(),
                'total_stands' => $stands->count(),
                'pending_opname_count' => $pendingOpnameCount,
            ],
            'stands_progress' => $standProgress,
        ]);
    }

    public function waText(Request $request)
    {
        $tanggal = $request->query('tanggal', date('Y-m-d'));
        $text = $this->waService->generateText($tanggal);
        return response()->json([
            'tanggal' => $tanggal,
            'text' => $text,
        ]);
    }

    public function reverseAnalytic(Request $request)
    {
        $standId = $request->query('stand_id', 'all');
        $startDate = $request->query('start_date', date('Y-m-d'));
        $endDate = $request->query('end_date', date('Y-m-d'));

        $data = $this->reverseService->compute($standId, $startDate, $endDate);
        return response()->json($data);
    }

    public function stockOpnameList(Request $request)
    {
        $status = $request->query('status');
        $query = StockOpnameRequest::with(['stand', 'requester', 'approver'])->orderBy('created_at', 'desc');
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        $list = $query->get();
        return response()->json(['data' => $list]);
    }

    public function approveStockOpname($id, Request $request)
    {
        $opname = StockOpnameRequest::findOrFail($id);
        if ($opname->status !== 'Pending') {
            return response()->json(['success' => false, 'message' => 'Status opname bukan Pending.'], 400);
        }

        $userId = Auth::id();
        $items = $opname->opname_items ?? [];

        // Apply physical stock as current stock
        foreach ($items as $item) {
            $ingId = $item['ingredient_id'] ?? null;
            $stokFisik = (float)($item['stok_fisik'] ?? 0);
            if ($ingId) {
                StandIngredientStock::updateOrCreate(
                    ['stand_id' => $opname->stand_id, 'ingredient_id' => $ingId],
                    ['stok_terkini' => $stokFisik]
                );
            }
        }

        $opname->update([
            'status' => 'Approved',
            'approved_by' => $userId,
            'approved_at' => Carbon::now(),
            'catatan_superadmin' => $request->input('catatan_superadmin'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Stock Opname berhasil disetujui dan stok stand telah diperbarui.',
            'data' => $opname,
        ]);
    }

    public function rejectStockOpname($id, Request $request)
    {
        $opname = StockOpnameRequest::findOrFail($id);
        $userId = Auth::id();

        $opname->update([
            'status' => 'Rejected',
            'approved_by' => $userId,
            'approved_at' => Carbon::now(),
            'catatan_superadmin' => $request->input('catatan_superadmin'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Stock Opname ditolak.',
            'data' => $opname,
        ]);
    }

    public function updateRecipeParam(Request $request)
    {
        $request->validate([
            'param_key' => 'required|string',
            'nilai_param' => 'required|numeric',
            'effective_date' => 'required|date',
        ]);

        $param = RecipeGlobalParam::create([
            'param_key' => $request->input('param_key'),
            'nama_parameter' => $request->input('nama_parameter', $request->input('param_key')),
            'nilai_param' => (float)$request->input('nilai_param'),
            'satuan' => $request->input('satuan', 'ml'),
            'effective_date' => $request->input('effective_date'),
            'keterangan' => $request->input('keterangan'),
            'status_aktif' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Parameter resep berhasil disimpan dengan tanggal efektif baru!',
            'data' => $param,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $settings = $request->input('settings', []);
        foreach ($settings as $key => $val) {
            AppSetting::updateOrCreate(
                ['setting_key' => $key],
                ['setting_value' => $val]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan berhasil diperbarui.',
        ]);
    }

    public function getSettings()
    {
        $settings = AppSetting::pluck('setting_value', 'setting_key');
        return response()->json(['settings' => $settings]);
    }
}

