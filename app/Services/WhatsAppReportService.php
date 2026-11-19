<?php

namespace App\Services;

use App\Models\DailyReportMenu1;
use App\Models\MasterStand;
use Carbon\Carbon;

class WhatsAppReportService
{
    public function generateText(string $dateString): string
    {
        $date = Carbon::parse($dateString);
        $dSlashM = $date->format('j/n'); // e.g. 12/11

        // Fetch all Menu 1 reports for the date
        $reports = DailyReportMenu1::where('tanggal', $dateString)->get()->keyBy('stand_id');

        // Fetch all stands ordered
        $stands = MasterStand::where('status_aktif', true)->orderBy('urutan_tampil')->get();

        $blok1Stands = $stands->where('blok_wa', 'Blok 1')->values();
        $blok2Stands = $stands->where('blok_wa', 'Blok 2')->values();
        $blok3Stands = $stands->where('blok_wa', 'Blok 3')->values();

        $formatRupiahSimple = function ($num) {
            return number_format((int)$num, 0, ',', '.');
        };

        $totalAmkAll = 0;
        $totalKurmaNominalAll = 0;
        $totalKurmaCupsAll = 0;
        $totalAmkopiNominalAll = 0;
        $totalAmkopiCupsAll = 0;

        // Blok 1 Generator
        $linesBlok1 = [];
        $linesBlok1[] = "TGL {$dSlashM}";
        $idx = 1;
        foreach ($blok1Stands as $stand) {
            $rep = $reports->get($stand->id);
            $nomAmk = $rep ? ($rep->nominal_per_kategori['NOM_AMK'] ?? 0) : 0;
            $nomKurma = $rep ? ($rep->nominal_per_kategori['NOM_KURMA'] ?? 0) : 0;
            $nomAmkopi = $rep ? ($rep->nominal_per_kategori['NOM_AMKOPI'] ?? 0) : 0;

            $qty12 = $rep ? ($rep->qty_per_item['QTY_CUP_12'] ?? 0) : 0;
            $qty22 = $rep ? ($rep->qty_per_item['QTY_CUP_22'] ?? 0) : 0;
            $qty16 = $rep ? ($rep->qty_per_item['QTY_CUP_16'] ?? 0) : 0;
            $qtyKurma = $rep ? ($rep->qty_per_item['QTY_CUP_KURMA'] ?? 0) : 0;
            $qtyKopi = $rep ? ($rep->qty_per_item['QTY_CUP_KOPI'] ?? 0) : 0;

            $totalAmkAll += $nomAmk;
            $totalKurmaNominalAll += $nomKurma;
            $totalKurmaCupsAll += $qtyKurma;
            $totalAmkopiNominalAll += $nomAmkopi;
            $totalAmkopiCupsAll += $qtyKopi;

            $parts = ["{$formatRupiahSimple($nomAmk)}", "Ck {$qty12}", "Cb {$qty22}"];
            if ($stand->tampilkan_csdng_wa) {
                $parts[] = "Csdng {$qty16}";
            }

            $lineText = sprintf(" %d. %s : %s", $idx++, $stand->kode_stand, implode(',', $parts));
            $linesBlok1[] = $lineText;
        }

        // Blok 2 Generator
        $linesBlok2 = [];
        $linesBlok2[] = "TGL {$dSlashM}";
        $idx = 1;
        foreach ($blok2Stands as $stand) {
            $rep = $reports->get($stand->id);
            $nomAmk = $rep ? ($rep->nominal_per_kategori['NOM_AMK'] ?? 0) : 0;
            $nomKurma = $rep ? ($rep->nominal_per_kategori['NOM_KURMA'] ?? 0) : 0;
            $nomAmkopi = $rep ? ($rep->nominal_per_kategori['NOM_AMKOPI'] ?? 0) : 0;

            $qty12 = $rep ? ($rep->qty_per_item['QTY_CUP_12'] ?? 0) : 0;
            $qty22 = $rep ? ($rep->qty_per_item['QTY_CUP_22'] ?? 0) : 0;
            $qty16 = $rep ? ($rep->qty_per_item['QTY_CUP_16'] ?? 0) : 0;
            $qtyPtt = $rep ? ($rep->qty_per_item['QTY_PTT'] ?? 0) : 0;
            $qtyKurma = $rep ? ($rep->qty_per_item['QTY_CUP_KURMA'] ?? 0) : 0;
            $qtyKopi = $rep ? ($rep->qty_per_item['QTY_CUP_KOPI'] ?? 0) : 0;

            $totalAmkAll += $nomAmk;
            $totalKurmaNominalAll += $nomKurma;
            $totalKurmaCupsAll += $qtyKurma;
            $totalAmkopiNominalAll += $nomAmkopi;
            $totalAmkopiCupsAll += $qtyKopi;

            $parts = ["{$formatRupiahSimple($nomAmk)}", "Ck {$qty12}", "Cb {$qty22}"];
            if ($stand->tampilkan_csdng_wa) {
                $parts[] = "Csdng {$qty16}";
            }
            if ($stand->tampilkan_ptt_wa) {
                $parts[] = " PTT {$qtyPtt}";
            }

            $lineText = sprintf(" %d. %s : %s", $idx++, $stand->kode_stand, implode(',', $parts));
            $linesBlok2[] = $lineText;
        }

        // Blok 3 Generator (PTC + 10 Stand AMKopi)
        $linesBlok3 = [];
        $linesBlok3[] = "TGL {$dSlashM}";
        $idx = 1;

        // PTC
        $ptcStand = $blok3Stands->firstWhere('kode_stand', 'PTC') ?? $blok3Stands->first();
        if ($ptcStand) {
            $rep = $reports->get($ptcStand->id);
            $nomAmk = $rep ? ($rep->nominal_per_kategori['NOM_AMK'] ?? 0) : 0;
            $nomKurma = $rep ? ($rep->nominal_per_kategori['NOM_KURMA'] ?? 0) : 0;
            $nomAmkopi = $rep ? ($rep->nominal_per_kategori['NOM_AMKOPI'] ?? 0) : 0;

            $qty12 = $rep ? ($rep->qty_per_item['QTY_CUP_12'] ?? 0) : 0;
            $qty22 = $rep ? ($rep->qty_per_item['QTY_CUP_22'] ?? 0) : 0;
            $qtyKurma = $rep ? ($rep->qty_per_item['QTY_CUP_KURMA'] ?? 0) : 0;
            $qtyKopi = $rep ? ($rep->qty_per_item['QTY_CUP_KOPI'] ?? 0) : 0;

            $totalAmkAll += $nomAmk;
            $totalKurmaNominalAll += $nomKurma;
            $totalKurmaCupsAll += $qtyKurma;
            $totalAmkopiNominalAll += $nomAmkopi;
            $totalAmkopiCupsAll += $qtyKopi;

            $linesBlok3[] = sprintf(" %d. %s : %s,Ck %s,Cb %s", $idx++, $ptcStand->kode_stand, $formatRupiahSimple($nomAmk), $qty12, $qty22);
        }

        // 10 Stand AMKopi in exact order:
        // R-1, R-2, R-4, TP-1, TP-2, TP-3, GC, Delta, BG-LL, BG-L2
        $amkopiCodes = [
            'R-1' => 'AMKopi R-1',
            'R-2' => 'AMKopi R-2',
            'R-4' => 'AMKopi R-4',
            'TP-1' => 'AMKopi TP-1',
            'TP-2' => 'AMKopi TP-2',
            'TP-3' => 'AMKopi TP-3',
            'GC' => 'AMKopi GC',
            'Delta' => 'AMKopi Delta',
            'BG-LL' => 'AMKopi BG-LL',
            'BG-L2' => 'AMKopi BG-L2',
        ];

        foreach ($amkopiCodes as $standCode => $label) {
            $stand = $stands->firstWhere('kode_stand', $standCode);
            $rep = $stand ? $reports->get($stand->id) : null;
            $nomKopi = $rep ? ($rep->nominal_per_kategori['NOM_AMKOPI'] ?? 0) : 0;
            $qtyKopi = $rep ? ($rep->qty_per_item['QTY_CUP_KOPI'] ?? 0) : 0;

            $linesBlok3[] = sprintf(" %d. %s : %s,Ck %s", $idx++, $label, $formatRupiahSimple($nomKopi), $qtyKopi);
        }

        // Keterangan Footer
        $footer = [
            " Keterangan :",
            " Total AMK : " . $formatRupiahSimple($totalAmkAll),
            " Total Kurma : " . $formatRupiahSimple($totalKurmaNominalAll) . ", Cb " . $totalKurmaCupsAll,
            " Total AMKopi : " . $formatRupiahSimple($totalAmkopiNominalAll) . ", Ck " . $totalAmkopiCupsAll,
        ];

        return implode("\n", $linesBlok1) . "\n\n" .
            implode("\n", $linesBlok2) . "\n\n" .
            implode("\n", $linesBlok3) . "\n\n" .
            implode("\n", $footer);
    }
}

