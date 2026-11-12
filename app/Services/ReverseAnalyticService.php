<?php

namespace App\Services;

use App\Models\DailyInventoryMenu3;
use App\Models\DailySaleMenu2;
use App\Models\MasterIngredient;
use App\Models\Menu2Item;
use App\Models\RecipeBatch;
use App\Models\RecipeGlobalParam;
use App\Models\RecipeMenuMapping;

class ReverseAnalyticService
{
    /**
     * Compute reverse analytic for a given stand and date range.
     */
    public function compute($standId, $startDate, $endDate)
    {
        // 1. Fetch Menu 2 sales for stand & date range
        $query = DailySaleMenu2::query();
        if ($standId && $standId !== 'all') {
            $query->where('stand_id', $standId);
        }
        $query->whereBetween('tanggal', [$startDate, $endDate]);
        $salesReports = $query->get();

        // 2. Aggregate item quantities sold
        $totalItemsSold = [];
        foreach ($salesReports as $report) {
            $items = $report->items_sold ?? [];
            foreach ($items as $item) {
                $code = $item['kode_item'] ?? null;
                $qty = (float)($item['qty'] ?? 0);
                if ($code && $qty > 0) {
                    $totalItemsSold[$code] = ($totalItemsSold[$code] ?? 0) + $qty;
                }
            }
        }

        // 3. Fetch Recipe Parameters active for target date
        $targetDate = $endDate; // use the effective date threshold for the period
        $volRegParam = RecipeGlobalParam::where('param_key', 'VOL_REG')
            ->where('effective_date', '<=', $targetDate)
            ->orderBy('effective_date', 'desc')
            ->first();
        $volReg = $volRegParam ? (float)$volRegParam->nilai_param : 185.0;

        // Fetch batches active
        $batches = RecipeBatch::with('components')
            ->where('effective_date', '<=', $targetDate)
            ->where('status_aktif', true)
            ->get()
            ->keyBy('kode_batch');

        // 4. Calculate Batch Adonan requirements (Table 1)
        // Adonan AMK Dingin, Adonan AMK Tea, Adonan Peach, Adonan Mocca, Adonan Kiwi
        $batchAdonanNeeds = [
            'BATCH_AMK_DINGIN' => 0.0,
            'BATCH_AMK_TEA' => 0.0,
            'BATCH_PEACH' => 0.0,
            'BATCH_MOCCA' => 0.0,
            'BATCH_KIWI' => 0.0,
        ];

        // Direct toppings / ingredients theoretical usage
        $directNeeds = [];

        // All menu items
        $allMenuItems = Menu2Item::with(['recipeMappings' => function ($q) use ($targetDate) {
            $q->where('effective_date', '<=', $targetDate)->orderBy('effective_date', 'desc');
        }])->get()->keyBy('kode_item');

        foreach ($totalItemsSold as $itemCode => $qtySold) {
            $menuItem = $allMenuItems->get($itemCode);
            if (!$menuItem || $menuItem->recipe_status === 'Unmapped') {
                continue; // Skip unmapped like AMKopi
            }

            foreach ($menuItem->recipeMappings as $mapping) {
                if ($mapping->tipe_komponen === 'batch_adonan') {
                    $batchCode = $mapping->kode_referensi;
                    $volumeMl = 0.0;
                    if ($mapping->mode_takaran === 'percent_vol_reg') {
                        $volumeMl = ($mapping->nilai_takaran / 100.0) * $volReg;
                    } else {
                        $volumeMl = (float)$mapping->nilai_takaran;
                    }
                    $totalMl = $volumeMl * $qtySold;
                    if (isset($batchAdonanNeeds[$batchCode])) {
                        $batchAdonanNeeds[$batchCode] += $totalMl;
                    } else {
                        $batchAdonanNeeds[$batchCode] = ($batchAdonanNeeds[$batchCode] ?? 0) + $totalMl;
                    }
                } elseif ($mapping->tipe_komponen === 'direct_ingredient') {
                    $ingCode = $mapping->kode_referensi;
                    $amount = (float)$mapping->nilai_takaran * $qtySold;
                    $directNeeds[$ingCode] = ($directNeeds[$ingCode] ?? 0) + $amount;
                }
            }
        }

        // Calculate Sub-batch: Tea Pekat needs from AMK Tea and Fruit Premixes
        // Batch Adonan AMK Tea (1.250 ml): 600 ml Tea Pekat, 250 ml AMK Dingin, 100 ml Gula Pasir
        // Batch Adonan Peach / Mocca / Kiwi (1.400 ml): 500 ml Tea Pekat
        $teaPekatFromAmkTea = ($batchAdonanNeeds['BATCH_AMK_TEA'] / 1250.0) * 600.0;
        $amkDinginFromAmkTea = ($batchAdonanNeeds['BATCH_AMK_TEA'] / 1250.0) * 250.0;
        $gulaPasirFromAmkTea = ($batchAdonanNeeds['BATCH_AMK_TEA'] / 1250.0) * 100.0;

        $teaPekatFromPeach = ($batchAdonanNeeds['BATCH_PEACH'] / 1400.0) * 500.0;
        $premixPeach = ($batchAdonanNeeds['BATCH_PEACH'] / 1400.0) * 200.0;

        $teaPekatFromMocca = ($batchAdonanNeeds['BATCH_MOCCA'] / 1400.0) * 500.0;
        $premixMocca = ($batchAdonanNeeds['BATCH_MOCCA'] / 1400.0) * 200.0;

        $teaPekatFromKiwi = ($batchAdonanNeeds['BATCH_KIWI'] / 1400.0) * 500.0;
        $premixKiwi = ($batchAdonanNeeds['BATCH_KIWI'] / 1400.0) * 200.0;

        $totalTeaPekatNeeded = $teaPekatFromAmkTea + $teaPekatFromPeach + $teaPekatFromMocca + $teaPekatFromKiwi;

        // Total AMK Dingin needed = direct AMK Dingin + AMK Dingin inside AMK Tea
        $totalAmkDinginAll = $batchAdonanNeeds['BATCH_AMK_DINGIN'] + $amkDinginFromAmkTea;
        $syrupBiangAmk = ($totalAmkDinginAll / 1750.0) * 250.0;

        // Total Tea Bag needed = (Total Tea Pekat / 2200) * 12 bag
        $teaBagNeeded = ($totalTeaPekatNeeded / 2200.0) * 12.0;

        // Raw Ingredients Theoretical Totals
        $teoritisRaw = [
            'SYRUP_AMK' => round($syrupBiangAmk, 2),
            'TEA_BAG' => round($teaBagNeeded, 2),
            'GULA_PASIR' => round($gulaPasirFromAmkTea, 2),
            'PREMIX_PEACH' => round($premixPeach, 2),
            'PREMIX_MOCCA' => round($premixMocca, 2),
            'PREMIX_KIWI' => round($premixKiwi, 2),
            'CREAMER' => round($directNeeds['CREAMER'] ?? 0, 2),
            'COFFEE' => round($directNeeds['COFFEE'] ?? 0, 2),
            'PERASA_ORANGE' => round($directNeeds['PERASA_ORANGE'] ?? 0, 2),
            'PERASA_LIME' => round($directNeeds['PERASA_LIME'] ?? 0, 2),
            'PERASA_GUAVA' => round($directNeeds['PERASA_GUAVA'] ?? 0, 2),
            'OREO' => round($directNeeds['OREO'] ?? 0, 2),
            'LENGKENG' => round($directNeeds['LENGKENG'] ?? 0, 2),
        ];

        // 5. Fetch Actual Usage from Menu 3 reports
        $invQuery = DailyInventoryMenu3::query();
        if ($standId && $standId !== 'all') {
            $invQuery->where('stand_id', $standId);
        }
        $invQuery->whereBetween('tanggal', [$startDate, $endDate]);
        $invReports = $invQuery->get();

        $actualUsage = [];
        foreach ($invReports as $report) {
            $items = $report->inventory_items ?? [];
            foreach ($items as $item) {
                $code = $item['kode_bahan'] ?? null;
                $used = (float)($item['barang_terpakai'] ?? 0);
                if ($code) {
                    $actualUsage[$code] = ($actualUsage[$code] ?? 0) + $used;
                }
            }
        }

        // 6. Build Audit Comparison Table (Table 2)
        $masterIngredients = MasterIngredient::where('is_resep_amk_core', true)
            ->orWhereIn('kode_bahan', array_keys($teoritisRaw))
            ->orderBy('urutan')
            ->get();

        $auditTable = [];
        foreach ($masterIngredients as $ing) {
            $code = $ing->kode_bahan;
            $teoritis = (float)($teoritisRaw[$code] ?? 0);
            $aktual = (float)($actualUsage[$code] ?? 0);
            $selisih = $aktual - $teoritis;

            $deviasiPercent = 0.0;
            if ($teoritis > 0) {
                $deviasiPercent = round((abs($selisih) / $teoritis) * 100.0, 1);
            } elseif ($aktual > 0) {
                $deviasiPercent = 100.0;
            }

            // Status: Hijau <=5%, Kuning 5-10%, Merah >10%
            $status = 'Hijau';
            $badgeColor = 'green';
            if ($deviasiPercent > 10.0) {
                $status = 'Merah (Anomali)';
                $badgeColor = 'red';
            } elseif ($deviasiPercent > 5.0) {
                $status = 'Kuning (Warning)';
                $badgeColor = 'yellow';
            } else {
                $status = 'Hijau (Wajar)';
                $badgeColor = 'green';
            }

            $auditTable[] = [
                'kode_bahan' => $code,
                'nama_bahan_baku' => $ing->nama_bahan_baku,
                'satuan' => $ing->satuan,
                'teoritis' => $teoritis,
                'aktual' => $aktual,
                'selisih' => round($selisih, 2),
                'deviasi_percent' => $deviasiPercent,
                'status' => $status,
                'badge_color' => $badgeColor,
            ];
        }

        // Table 1 Data
        $table1BatchNeeds = [
            ['nama' => 'Adonan AMK Dingin', 'volume_ml' => round($batchAdonanNeeds['BATCH_AMK_DINGIN'], 1)],
            ['nama' => 'Adonan AMK Tea', 'volume_ml' => round($batchAdonanNeeds['BATCH_AMK_TEA'], 1)],
            ['nama' => 'Adonan Peach', 'volume_ml' => round($batchAdonanNeeds['BATCH_PEACH'], 1)],
            ['nama' => 'Adonan Mocca', 'volume_ml' => round($batchAdonanNeeds['BATCH_MOCCA'], 1)],
            ['nama' => 'Adonan Kiwi', 'volume_ml' => round($batchAdonanNeeds['BATCH_KIWI'], 1)],
            ['nama' => 'Tea Pekat (Sub-batch)', 'volume_ml' => round($totalTeaPekatNeeded, 1)],
        ];

        return [
            'stand_id' => $standId,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'vol_reg_used' => $volReg,
            'total_items_sold' => $totalItemsSold,
            'table1_batch_needs' => $table1BatchNeeds,
            'table2_audit_comparison' => $auditTable,
        ];
    }
}

