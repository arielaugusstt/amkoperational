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
        ]);

        $setting = AppSetting::updateOrCreate(
            ['setting_key' => $request->input('param_key')],
            ['setting_value' => (string)$request->input('nilai_param')]
        );

        return response()->json([
            'success' => true,
            'message' => 'Parameter berhasil diperbarui!',
            'data' => $setting,
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

    public function deleteOperationalData(Request $request)
    {
        $scope = $request->input('scope', 'date'); // 'date', 'stand', 'all'
        $tanggal = $request->input('tanggal', date('Y-m-d'));
        $standId = $request->input('stand_id');

        $deletedM1 = 0;
        $deletedM2 = 0;
        $deletedM3 = 0;
        $deletedOpname = 0;

        if ($scope === 'all') {
            $deletedM1 = DailyReportMenu1::count();
            $deletedM2 = DailySaleMenu2::count();
            $deletedM3 = DailyInventoryMenu3::count();
            $deletedOpname = StockOpnameRequest::count();

            DailySaleMenu2::query()->delete();
            DailyInventoryMenu3::query()->delete();
            DailyReportMenu1::query()->delete();
            StockOpnameRequest::query()->delete();

            $msg = "Seluruh data transaksi operasional ({$deletedM1} Menu 1, {$deletedM2} Menu 2, {$deletedM3} Menu 3, {$deletedOpname} Opname) berhasil dihapus.";
        } elseif ($scope === 'stand' && $standId) {
            $m1Q = DailyReportMenu1::where('stand_id', $standId)->where('tanggal', $tanggal);
            $m2Q = DailySaleMenu2::where('stand_id', $standId)->where('tanggal', $tanggal);
            $m3Q = DailyInventoryMenu3::where('stand_id', $standId)->where('tanggal', $tanggal);
            $opQ = StockOpnameRequest::where('stand_id', $standId)->whereDate('created_at', $tanggal);

            $deletedM1 = $m1Q->count();
            $deletedM2 = $m2Q->count();
            $deletedM3 = $m3Q->count();
            $deletedOpname = $opQ->count();

            $m2Q->delete();
            $m3Q->delete();
            $m1Q->delete();
            $opQ->delete();

            $msg = "Data stand pada tanggal {$tanggal} berhasil dihapus ({$deletedM1} Menu 1, {$deletedM2} Menu 2, {$deletedM3} Menu 3).";
        } else {
            // scope === 'date'
            $m1Q = DailyReportMenu1::where('tanggal', $tanggal);
            $m2Q = DailySaleMenu2::where('tanggal', $tanggal);
            $m3Q = DailyInventoryMenu3::where('tanggal', $tanggal);
            $opQ = StockOpnameRequest::whereDate('created_at', $tanggal);

            $deletedM1 = $m1Q->count();
            $deletedM2 = $m2Q->count();
            $deletedM3 = $m3Q->count();
            $deletedOpname = $opQ->count();

            $m2Q->delete();
            $m3Q->delete();
            $m1Q->delete();
            $opQ->delete();

            $msg = "Seluruh data laporan pada tanggal {$tanggal} berhasil dihapus ({$deletedM1} Menu 1, {$deletedM2} Menu 2, {$deletedM3} Menu 3).";
        }

        return response()->json([
            'success' => true,
            'message' => $msg,
            'details' => [
                'deleted_m1' => $deletedM1,
                'deleted_m2' => $deletedM2,
                'deleted_m3' => $deletedM3,
                'deleted_opname' => $deletedOpname,
            ],
        ]);
    }

    public function biAnalytics(Request $request)
    {
        $monthParam = $request->query('month', date('Y-m')); // e.g. 2026-11
        $monthStart = Carbon::parse($monthParam . '-01')->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $daysInMonth = (int)$monthStart->daysInMonth;

        $startDate = $request->query('start_date') ?: $monthStart->format('Y-m-d');
        $endDate = $request->query('end_date') ?: $monthEnd->format('Y-m-d');
        $standFilter = $request->query('stand_id', 'all');

        // Calendar metadata 1..31
        $calendarDays = [];
        for ($d = 1; $d <= 31; $d++) {
            if ($d <= $daysInMonth) {
                $dt = $monthStart->copy()->day($d);
                $dayName = $dt->format('D'); // Mon..Sun
                $isWeekend = in_array((int)$dt->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY], true);
                $calendarDays[] = [
                    'day' => $d,
                    'date' => $dt->format('Y-m-d'),
                    'day_name' => $dayName,
                    'is_weekend' => $isWeekend,
                    'is_sunday' => (int)$dt->dayOfWeek === Carbon::SUNDAY,
                    'in_month' => true,
                ];
            } else {
                $calendarDays[] = [
                    'day' => $d,
                    'date' => null,
                    'day_name' => '-',
                    'is_weekend' => false,
                    'is_sunday' => false,
                    'in_month' => false,
                ];
            }
        }

        $outlets = MasterStand::where('status_aktif', true)->orderBy('blok_wa')->orderBy('urutan_tampil')->get();
        $outletsById = $outlets->keyBy('id');
        $spgUsers = \App\Models\User::where('role', 'spg')->orderBy('name')->get(['id', 'id_spg', 'name', 'username', 'status_aktif']);
        $spgById = $spgUsers->keyBy('id');
        $allMenus = \App\Models\Menu::orderBy('sort_order')->get()->keyBy('id');

        // Query reports in range
        $m1Query = DailyReportMenu1::whereBetween('tanggal', [$startDate, $endDate]);
        $m2Query = DailySaleMenu2::whereBetween('tanggal', [$startDate, $endDate]);
        $m3Query = DailyInventoryMenu3::whereBetween('tanggal', [$startDate, $endDate]);

        if ($standFilter && $standFilter !== 'all') {
            $m1Query->where('stand_id', $standFilter);
            $m2Query->where('stand_id', $standFilter);
            $m3Query->where('stand_id', $standFilter);
        }

        $m1List = $m1Query->orderBy('tanggal')->get();
        $m2List = $m2Query->orderBy('tanggal')->get();
        $m3List = $m3Query->orderBy('tanggal')->get();

        // Also fetch full month reports for calendar pivot 1..31
        $m1MonthList = DailyReportMenu1::whereBetween('tanggal', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
            ->when($standFilter && $standFilter !== 'all', fn ($q) => $q->where('stand_id', $standFilter))
            ->get();

        // 1. ANALISA PER LINI & KATEGORI OMZET + ARPC
        $liniSummary = [
            'amk_murni' => 0,
            'amkopi' => 0,
            'kurma' => 0,
            'ptt' => 0,
            'mineral' => 0,
            'lain' => 0,
            'total_omzet' => 0,
            'total_cups' => 0,
        ];
        $dailyTrendMap = [];
        $outletArpcMap = [];
        foreach ($outlets as $st) {
            $outletArpcMap[$st->id] = [
                'stand_id' => $st->id,
                'kode_stand' => $st->kode_stand,
                'nama_stand' => $st->nama_stand,
                'amk_murni' => 0,
                'amkopi' => 0,
                'kurma' => 0,
                'ptt' => 0,
                'mineral' => 0,
                'lain' => 0,
                'total_omzet' => 0,
                'total_cups' => 0,
                'arpc' => 0,
            ];
        }

        // 3. ANALISA KEUANGAN, QRIS & AUDIT BIAYA
        $financeByOutlet = [];
        $qrisProofsList = [];
        foreach ($outlets as $st) {
            $financeByOutlet[$st->id] = [
                'stand_id' => $st->id,
                'kode_stand' => $st->kode_stand,
                'nama_stand' => $st->nama_stand,
                'total_omzet' => 0,
                'qris' => 0,
                'tunai_kotor' => 0,
                'total_biaya' => 0,
                'sisa_setoran_tunai' => 0,
                'cost_to_revenue_pct' => 0.0,
                'is_high_cost' => false,
                'biaya_rincian' => [],
                'high_cost_days' => [],
            ];
        }

        // 4. PEOPLE ANALYTICS (SPG)
        $spgStats = [];
        foreach ($spgUsers as $u) {
            $spgStats[$u->id] = [
                'spg_id' => $u->id,
                'id_spg' => $u->id_spg,
                'name' => $u->name,
                'username' => $u->username,
                'days_worked' => [],
                'outlets_guarded' => [],
                'total_omzet_handled' => 0,
                'shift_count' => 0,
            ];
        }

        foreach ($m1List as $rep) {
            $stId = $rep->stand_id;
            $tgl = $rep->tanggal;
            $noms = $rep->nominal_per_kategori ?? [];
            $qtys = $rep->qty_per_item ?? [];
            $tambahan = $rep->penjualan_tambahan ?? [];

            $nomAmk = (int)($noms['NOM_AMK'] ?? 0);
            $nomKopi = (int)($noms['NOM_AMKOPI'] ?? 0);
            $nomKurma = (int)($noms['NOM_KURMA'] ?? 0);
            $nomPtt = (int)($noms['NOM_PTT'] ?? 0);
            $nomMineral = (int)($noms['NOM_KEMASAN'] ?? $noms['NOM_MINERAL'] ?? 0);
            $nomLain = 0;
            foreach ($tambahan as $t) {
                $nomLain += (int)($t['nominal'] ?? 0);
            }
            $totOmzet = (int)$rep->total_semua_penjualan;

            $c12 = (int)($qtys['QTY_CUP_12'] ?? 0);
            $c22 = (int)($qtys['QTY_CUP_22'] ?? 0);
            $c16 = (int)($qtys['QTY_CUP_16'] ?? 0);
            $cKurma = (int)($qtys['QTY_CUP_KURMA'] ?? 0);
            $cKopi = (int)($qtys['QTY_CUP_KOPI'] ?? 0);
            $cPtt = (int)($qtys['QTY_PTT'] ?? 0);
            $totCups = $c12 + $c22 + $c16 + $cKurma + $cKopi + $cPtt;

            $liniSummary['amk_murni'] += $nomAmk;
            $liniSummary['amkopi'] += $nomKopi;
            $liniSummary['kurma'] += $nomKurma;
            $liniSummary['ptt'] += $nomPtt;
            $liniSummary['mineral'] += $nomMineral;
            $liniSummary['lain'] += $nomLain;
            $liniSummary['total_omzet'] += $totOmzet;
            $liniSummary['total_cups'] += $totCups;

            if (!isset($dailyTrendMap[$tgl])) {
                $dailyTrendMap[$tgl] = [
                    'tanggal' => $tgl,
                    'amk_murni' => 0,
                    'amkopi' => 0,
                    'kurma' => 0,
                    'ptt' => 0,
                    'mineral' => 0,
                    'lain' => 0,
                    'total_omzet' => 0,
                    'total_cups' => 0,
                ];
            }
            $dailyTrendMap[$tgl]['amk_murni'] += $nomAmk;
            $dailyTrendMap[$tgl]['amkopi'] += $nomKopi;
            $dailyTrendMap[$tgl]['kurma'] += $nomKurma;
            $dailyTrendMap[$tgl]['ptt'] += $nomPtt;
            $dailyTrendMap[$tgl]['mineral'] += $nomMineral;
            $dailyTrendMap[$tgl]['lain'] += $nomLain;
            $dailyTrendMap[$tgl]['total_omzet'] += $totOmzet;
            $dailyTrendMap[$tgl]['total_cups'] += $totCups;

            if (isset($outletArpcMap[$stId])) {
                $outletArpcMap[$stId]['amk_murni'] += $nomAmk;
                $outletArpcMap[$stId]['amkopi'] += $nomKopi;
                $outletArpcMap[$stId]['kurma'] += $nomKurma;
                $outletArpcMap[$stId]['ptt'] += $nomPtt;
                $outletArpcMap[$stId]['mineral'] += $nomMineral;
                $outletArpcMap[$stId]['lain'] += $nomLain;
                $outletArpcMap[$stId]['total_omzet'] += $totOmzet;
                $outletArpcMap[$stId]['total_cups'] += $totCups;
            }

            // Finance & Cost Audit
            if (isset($financeByOutlet[$stId])) {
                $financeByOutlet[$stId]['total_omzet'] += $totOmzet;
                $financeByOutlet[$stId]['qris'] += (int)$rep->nominal_qris;
                $financeByOutlet[$stId]['tunai_kotor'] += (int)$rep->nominal_tunai;
                $financeByOutlet[$stId]['total_biaya'] += (int)$rep->total_biaya;
                $financeByOutlet[$stId]['sisa_setoran_tunai'] += (int)$rep->sisa_setoran_tunai;

                $dayRatio = $totOmzet > 0 ? round(((int)$rep->total_biaya / $totOmzet) * 100, 2) : 0;
                $biayaItems = $rep->biaya_harian ?? [];
                foreach ($biayaItems as $bItem) {
                    if (!empty($bItem['nominal']) && (int)$bItem['nominal'] > 0) {
                        $financeByOutlet[$stId]['biaya_rincian'][] = [
                            'tanggal' => $tgl,
                            'keterangan' => $bItem['keterangan'] ?? 'Biaya',
                            'nominal' => (int)$bItem['nominal'],
                        ];
                    }
                }
                if ($dayRatio > 3.0) {
                    $financeByOutlet[$stId]['high_cost_days'][] = [
                        'tanggal' => $tgl,
                        'total_biaya' => (int)$rep->total_biaya,
                        'total_omzet' => $totOmzet,
                        'ratio_pct' => $dayRatio,
                        'rincian' => $biayaItems,
                    ];
                }
            }

            if (!empty($rep->qris_proof_base64)) {
                $stObj = $outletsById->get($stId);
                $qrisProofsList[] = [
                    'report_id' => $rep->id,
                    'tanggal' => $tgl,
                    'stand_id' => $stId,
                    'kode_stand' => $stObj ? $stObj->kode_stand : '-',
                    'nama_stand' => $stObj ? $stObj->nama_stand : '-',
                    'nominal_qris' => (int)$rep->nominal_qris,
                    'qris_proof_base64' => $rep->qris_proof_base64,
                ];
            }

            // People analytics from spg_list
            $stCode = $outletsById->get($stId)?->kode_stand ?? '-';
            foreach (($rep->spg_list ?? []) as $rawSpg) {
                $spgId = is_numeric($rawSpg) ? (int)$rawSpg : null;
                if (!$spgId || !isset($spgStats[$spgId])) {
                    // Fallback if name stored or dynamic SPG
                    $key = 'raw_' . $rawSpg;
                    if (!isset($spgStats[$key])) {
                        $spgStats[$key] = [
                            'spg_id' => $rawSpg,
                            'id_spg' => (string)$rawSpg,
                            'name' => is_numeric($rawSpg) ? ("SPG #" . $rawSpg) : (string)$rawSpg,
                            'username' => (string)$rawSpg,
                            'days_worked' => [],
                            'outlets_guarded' => [],
                            'total_omzet_handled' => 0,
                            'shift_count' => 0,
                        ];
                    }
                    $spgId = $key;
                }
                $spgStats[$spgId]['days_worked'][$tgl] = true;
                $spgStats[$spgId]['outlets_guarded'][$stCode] = true;
                $spgStats[$spgId]['total_omzet_handled'] += $totOmzet;
                $spgStats[$spgId]['shift_count'] += 1;
            }
        }

        foreach ($outletArpcMap as &$oArpc) {
            $oArpc['arpc'] = $oArpc['total_cups'] > 0 ? (int)round($oArpc['total_omzet'] / $oArpc['total_cups']) : 0;
        }
        unset($oArpc);

        foreach ($financeByOutlet as &$fin) {
            $fin['cost_to_revenue_pct'] = $fin['total_omzet'] > 0
                ? round(($fin['total_biaya'] / $fin['total_omzet']) * 100, 2)
                : 0.0;
            $fin['is_high_cost'] = $fin['cost_to_revenue_pct'] > 3.0 || count($fin['high_cost_days']) > 0;
        }
        unset($fin);

        $peopleAnalytics = [];
        foreach ($spgStats as $spgRow) {
            $masukCount = count($spgRow['days_worked']);
            $offCount = max(0, $daysInMonth - $masukCount);
            $shifts = $spgRow['shift_count'];
            $peopleAnalytics[] = [
                'spg_id' => $spgRow['spg_id'],
                'id_spg' => $spgRow['id_spg'],
                'name' => $spgRow['name'],
                'username' => $spgRow['username'],
                'total_masuk' => $masukCount,
                'total_off' => $offCount,
                'outlets_list' => array_keys($spgRow['outlets_guarded']),
                'total_omzet' => $spgRow['total_omzet_handled'],
                'avg_omzet_per_shift' => $shifts > 0 ? (int)round($spgRow['total_omzet_handled'] / $shifts) : 0,
            ];
        }

        // 2. ANALISA PER MENU & VARIAN (Menu 2 Detail)
        $menuRankingMap = [];
        foreach ($allMenus as $m) {
            $menuRankingMap[$m->id] = [
                'menu_id' => $m->id,
                'sort_order' => $m->sort_order,
                'name' => $m->name,
                'menu_group' => $m->menu_group,
                'kelompok_menu' => $m->kelompok_menu,
                'qty' => 0,
                'omzet' => 0,
            ];
        }

        $productOutletAgg = []; // [stand_id][menu_id] => ['name'=>..., 'qty'=>..., 'omzet'=>...]
        $unregisteredByOutlet = [];

        foreach ($m2List as $sale) {
            $stId = $sale->stand_id;
            $stObj = $outletsById->get($stId);
            $stCode = $stObj ? $stObj->kode_stand : '-';

            foreach (($sale->items_sold ?? []) as $it) {
                $mId = (int)($it['menu_id'] ?? $it['menu2_item_id'] ?? 0);
                $qty = (int)($it['qty'] ?? 0);
                $sub = (int)($it['subtotal'] ?? ($qty * (int)($it['harga'] ?? 0)));
                $mName = $it['nama_item'] ?? $it['name'] ?? ($allMenus->get($mId)?->name ?? "Menu #{$mId}");

                if (isset($menuRankingMap[$mId])) {
                    $menuRankingMap[$mId]['qty'] += $qty;
                    $menuRankingMap[$mId]['omzet'] += $sub;
                }
                if (!isset($productOutletAgg[$stId][$mId])) {
                    $productOutletAgg[$stId][$mId] = [
                        'menu_id' => $mId,
                        'name' => $mName,
                        'qty' => 0,
                        'omzet' => 0,
                    ];
                }
                $productOutletAgg[$stId][$mId]['qty'] += $qty;
                $productOutletAgg[$stId][$mId]['omzet'] += $sub;
            }

            foreach (($sale->unregistered_items ?? []) as $unreg) {
                $nom = (int)($unreg['nominal'] ?? 0);
                if ($nom > 0 || !empty($unreg['keterangan'])) {
                    $unregisteredByOutlet[] = [
                        'tanggal' => $sale->tanggal,
                        'stand_id' => $stId,
                        'kode_stand' => $stCode,
                        'keterangan' => $unreg['keterangan'] ?? 'Tanpa Keterangan',
                        'qty' => (int)($unreg['qty'] ?? 1),
                        'nominal' => $nom,
                    ];
                }
            }
        }

        $productOutletMatrix = [];
        foreach ($outlets as $st) {
            $itemsForStand = array_values($productOutletAgg[$st->id] ?? []);
            usort($itemsForStand, fn ($a, $b) => $b['qty'] <=> $a['qty']);
            $topItem = $itemsForStand[0] ?? null;
            $productOutletMatrix[] = [
                'stand_id' => $st->id,
                'kode_stand' => $st->kode_stand,
                'nama_stand' => $st->nama_stand,
                'top_menu_name' => $topItem ? $topItem['name'] : '-',
                'top_menu_qty' => $topItem ? $topItem['qty'] : 0,
                'top_menu_omzet' => $topItem ? $topItem['omzet'] : 0,
                'top_3_menus' => array_slice($itemsForStand, 0, 3),
            ];
        }

        // 5. ANALISA KESEHATAN STOK, BARANG RUSAK & REVERSE YIELD (Menu 3 & RESEPAMK)
        $rusakByOutlet = [];
        $rusakByIngredient = [];
        foreach ($outlets as $st) {
            $rusakByOutlet[$st->id] = [
                'stand_id' => $st->id,
                'kode_stand' => $st->kode_stand,
                'nama_stand' => $st->nama_stand,
                'total_reject_items' => 0.0,
                'details' => [],
            ];
        }

        foreach ($m3List as $inv) {
            $stId = $inv->stand_id;
            foreach (($inv->inventory_items ?? []) as $item) {
                $rusak = (float)($item['barang_rusak'] ?? 0);
                if ($rusak > 0) {
                    $bName = $item['nama_bahan_baku'] ?? $item['kode_bahan'] ?? 'Bahan';
                    $sat = $item['satuan'] ?? '';
                    if (isset($rusakByOutlet[$stId])) {
                        $rusakByOutlet[$stId]['total_reject_items'] += $rusak;
                        $rusakByOutlet[$stId]['details'][] = [
                            'tanggal' => $inv->tanggal,
                            'nama_bahan' => $bName,
                            'jumlah' => $rusak,
                            'satuan' => $sat,
                        ];
                    }
                    $code = $item['kode_bahan'] ?? $bName;
                    if (!isset($rusakByIngredient[$code])) {
                        $rusakByIngredient[$code] = [
                            'kode_bahan' => $code,
                            'nama_bahan' => $bName,
                            'satuan' => $sat,
                            'total_rusak' => 0.0,
                        ];
                    }
                    $rusakByIngredient[$code]['total_rusak'] += $rusak;
                }
            }
        }

        $reverseResult = $this->reverseService->compute($standFilter, $startDate, $endDate);

        // =========================================================================
        // SECTION 2: 8 INTERACTIVE CALENDAR PIVOT MATRICES (TGL 1 S/D 31)
        // =========================================================================
        $pivotOutlets = [];
        foreach ($outlets as $st) {
            $daysMap = [];
            for ($d = 1; $d <= 31; $d++) {
                $daysMap[$d] = [
                    'omzet_total' => 0,
                    'omzet_amk_murni' => 0,
                    'omzet_amkopi' => 0,
                    'omzet_kurma' => 0,
                    'omzet_ptt' => 0,
                    'omzet_mineral' => 0,
                    'omzet_lain' => 0,
                    'cup_12_amk' => 0,
                    'cup_22_amk' => 0,
                    'cup_16_amk' => 0,
                    'cup_amkopi' => 0,
                    'cup_kurma' => 0,
                    'cup_ptt' => 0,
                    'total_cups' => 0,
                    'qris' => 0,
                    'tunai_kotor' => 0,
                    'sisa_setoran_tunai' => 0,
                    'total_biaya' => 0,
                    'biaya_details' => [],
                ];
            }
            $pivotOutlets[$st->id] = [
                'stand_id' => $st->id,
                'kode_stand' => $st->kode_stand,
                'nama_stand' => $st->nama_stand,
                'wilayah' => $st->wilayah_laporan,
                'blok_wa' => $st->blok_wa,
                'punya_amkopi' => (bool)$st->punya_amkopi,
                'is_premium' => (bool)$st->is_premium,
                'days' => $daysMap,
                'totals' => [
                    'omzet_total' => 0,
                    'omzet_amk_murni' => 0,
                    'omzet_amkopi' => 0,
                    'omzet_kurma' => 0,
                    'omzet_ptt' => 0,
                    'omzet_mineral' => 0,
                    'omzet_lain' => 0,
                    'cup_12_amk' => 0,
                    'cup_22_amk' => 0,
                    'cup_16_amk' => 0,
                    'cup_amkopi' => 0,
                    'cup_kurma' => 0,
                    'cup_ptt' => 0,
                    'total_cups' => 0,
                    'qris' => 0,
                    'tunai_kotor' => 0,
                    'sisa_setoran_tunai' => 0,
                    'total_biaya' => 0,
                    'active_days' => 0,
                ],
            ];
        }

        // SPG Calendar Matrix 1..31
        $pivotSpg = [];
        foreach ($spgUsers as $u) {
            $sDays = [];
            for ($d = 1; $d <= 31; $d++) {
                $sDays[$d] = [
                    'stands' => [],
                    'stand_code' => '',
                    'omzet' => 0,
                ];
            }
            $pivotSpg[$u->id] = [
                'spg_id' => $u->id,
                'id_spg' => $u->id_spg,
                'name' => $u->name,
                'username' => $u->username,
                'days' => $sDays,
                'total_masuk' => 0,
                'total_off' => $daysInMonth,
                'total_omzet' => 0,
                'avg_per_shift' => 0,
            ];
        }

        foreach ($m1MonthList as $rep) {
            $stId = $rep->stand_id;
            $dayNum = (int)Carbon::parse($rep->tanggal)->day;
            if ($dayNum < 1 || $dayNum > 31) continue;

            $noms = $rep->nominal_per_kategori ?? [];
            $qtys = $rep->qty_per_item ?? [];
            $tambahan = $rep->penjualan_tambahan ?? [];

            $nomAmk = (int)($noms['NOM_AMK'] ?? 0);
            $nomKopi = (int)($noms['NOM_AMKOPI'] ?? 0);
            $nomKurma = (int)($noms['NOM_KURMA'] ?? 0);
            $nomPtt = (int)($noms['NOM_PTT'] ?? 0);
            $nomMineral = (int)($noms['NOM_KEMASAN'] ?? $noms['NOM_MINERAL'] ?? 0);
            $nomLain = 0;
            foreach ($tambahan as $t) {
                $nomLain += (int)($t['nominal'] ?? 0);
            }
            $totOmzet = (int)$rep->total_semua_penjualan;

            $c12 = (int)($qtys['QTY_CUP_12'] ?? 0);
            $c22 = (int)($qtys['QTY_CUP_22'] ?? 0);
            $c16 = (int)($qtys['QTY_CUP_16'] ?? 0);
            $cKurma = (int)($qtys['QTY_CUP_KURMA'] ?? 0);
            $cKopi = (int)($qtys['QTY_CUP_KOPI'] ?? 0);
            $cPtt = (int)($qtys['QTY_PTT'] ?? 0);
            $totCups = $c12 + $c22 + $c16 + $cKurma + $cKopi + $cPtt;

            if (isset($pivotOutlets[$stId])) {
                $pivotOutlets[$stId]['days'][$dayNum] = [
                    'omzet_total' => $totOmzet,
                    'omzet_amk_murni' => $nomAmk,
                    'omzet_amkopi' => $nomKopi,
                    'omzet_kurma' => $nomKurma,
                    'omzet_ptt' => $nomPtt,
                    'omzet_mineral' => $nomMineral,
                    'omzet_lain' => $nomLain,
                    'cup_12_amk' => $c12,
                    'cup_22_amk' => $c22,
                    'cup_16_amk' => $c16,
                    'cup_amkopi' => $cKopi,
                    'cup_kurma' => $cKurma,
                    'cup_ptt' => $cPtt,
                    'total_cups' => $totCups,
                    'qris' => (int)$rep->nominal_qris,
                    'tunai_kotor' => (int)$rep->nominal_tunai,
                    'sisa_setoran_tunai' => (int)$rep->sisa_setoran_tunai,
                    'total_biaya' => (int)$rep->total_biaya,
                    'biaya_details' => $rep->biaya_harian ?? [],
                ];

                $pivotOutlets[$stId]['totals']['omzet_total'] += $totOmzet;
                $pivotOutlets[$stId]['totals']['omzet_amk_murni'] += $nomAmk;
                $pivotOutlets[$stId]['totals']['omzet_amkopi'] += $nomKopi;
                $pivotOutlets[$stId]['totals']['omzet_kurma'] += $nomKurma;
                $pivotOutlets[$stId]['totals']['omzet_ptt'] += $nomPtt;
                $pivotOutlets[$stId]['totals']['omzet_mineral'] += $nomMineral;
                $pivotOutlets[$stId]['totals']['omzet_lain'] += $nomLain;
                $pivotOutlets[$stId]['totals']['cup_12_amk'] += $c12;
                $pivotOutlets[$stId]['totals']['cup_22_amk'] += $c22;
                $pivotOutlets[$stId]['totals']['cup_16_amk'] += $c16;
                $pivotOutlets[$stId]['totals']['cup_amkopi'] += $cKopi;
                $pivotOutlets[$stId]['totals']['cup_kurma'] += $cKurma;
                $pivotOutlets[$stId]['totals']['cup_ptt'] += $cPtt;
                $pivotOutlets[$stId]['totals']['total_cups'] += $totCups;
                $pivotOutlets[$stId]['totals']['qris'] += (int)$rep->nominal_qris;
                $pivotOutlets[$stId]['totals']['tunai_kotor'] += (int)$rep->nominal_tunai;
                $pivotOutlets[$stId]['totals']['sisa_setoran_tunai'] += (int)$rep->sisa_setoran_tunai;
                $pivotOutlets[$stId]['totals']['total_biaya'] += (int)$rep->total_biaya;
                if ($totOmzet > 0) {
                    $pivotOutlets[$stId]['totals']['active_days'] += 1;
                }
            }

            // Populate SPG Calendar Matrix
            $stCode = $outletsById->get($stId)?->kode_stand ?? '-';
            foreach (($rep->spg_list ?? []) as $rawSpg) {
                $spgKey = is_numeric($rawSpg) ? (int)$rawSpg : null;
                if (!$spgKey || !isset($pivotSpg[$spgKey])) {
                    $dynKey = 'raw_' . $rawSpg;
                    if (!isset($pivotSpg[$dynKey])) {
                        $sDays = [];
                        for ($d = 1; $d <= 31; $d++) {
                            $sDays[$d] = ['stands' => [], 'stand_code' => '', 'omzet' => 0];
                        }
                        $pivotSpg[$dynKey] = [
                            'spg_id' => $rawSpg,
                            'id_spg' => (string)$rawSpg,
                            'name' => is_numeric($rawSpg) ? ("SPG #" . $rawSpg) : (string)$rawSpg,
                            'username' => (string)$rawSpg,
                            'days' => $sDays,
                            'total_masuk' => 0,
                            'total_off' => $daysInMonth,
                            'total_omzet' => 0,
                            'avg_per_shift' => 0,
                        ];
                    }
                    $spgKey = $dynKey;
                }
                if (!in_array($stCode, $pivotSpg[$spgKey]['days'][$dayNum]['stands'], true)) {
                    $pivotSpg[$spgKey]['days'][$dayNum]['stands'][] = $stCode;
                }
                $pivotSpg[$spgKey]['days'][$dayNum]['stand_code'] = implode('/', $pivotSpg[$spgKey]['days'][$dayNum]['stands']);
                $pivotSpg[$spgKey]['days'][$dayNum]['omzet'] += $totOmzet;
            }
        }

        foreach ($pivotSpg as &$sRow) {
            $masuk = 0;
            $totOmz = 0;
            for ($d = 1; $d <= $daysInMonth; $d++) {
                if (!empty($sRow['days'][$d]['stand_code'])) {
                    $masuk++;
                    $totOmz += (int)$sRow['days'][$d]['omzet'];
                }
            }
            $sRow['total_masuk'] = $masuk;
            $sRow['total_off'] = max(0, $daysInMonth - $masuk);
            $sRow['total_omzet'] = $totOmz;
            $sRow['avg_per_shift'] = $masuk > 0 ? (int)round($totOmz / $masuk) : 0;
        }
        unset($sRow);

        return response()->json([
            'month' => $monthParam,
            'days_in_month' => $daysInMonth,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'stand_id' => $standFilter,
            'calendar_days' => $calendarDays,
            'analytics' => [
                'lini_omzet' => [
                    'summary' => $liniSummary,
                    'arpc_global' => $liniSummary['total_cups'] > 0
                        ? (int)round($liniSummary['total_omzet'] / $liniSummary['total_cups'])
                        : 0,
                    'daily_trend' => array_values($dailyTrendMap),
                    'per_outlet' => array_values($outletArpcMap),
                ],
                'menu_variants' => [
                    'all_menus_ranked' => array_values($menuRankingMap),
                    'product_outlet_matrix' => $productOutletMatrix,
                    'unregistered_recap' => $unregisteredByOutlet,
                ],
                'finance_audit' => [
                    'per_outlet' => array_values($financeByOutlet),
                    'qris_proofs' => $qrisProofsList,
                ],
                'people_analytics' => $peopleAnalytics,
                'stock_health' => [
                    'reject_per_outlet' => array_values($rusakByOutlet),
                    'reject_per_ingredient' => array_values($rusakByIngredient),
                    'reverse_variance' => $reverseResult['table2_audit_comparison'] ?? [],
                ],
            ],
            'pivots' => [
                'outlets' => array_values($pivotOutlets),
                'spg' => array_values($pivotSpg),
            ],
        ]);
    }
}

