import React, { useState, useEffect } from 'react';
import {
    FlaskConical, RefreshCw, AlertTriangle, CheckCircle2,
    Layers, Download, Package, Droplets, Scale, Sparkles
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { exportAuditReport } from '../../utils/excelEngine';

export default function ReverseAnalytic({ stands = [], tanggal }) {
    const [selectedStandId, setSelectedStandId] = useState('all');
    const [startDate, setStartDate] = useState(tanggal);
    const [endDate, setEndDate] = useState(tanggal);
    const [analyticData, setAnalyticData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchAnalytic = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reverse-analytic?stand_id=${selectedStandId}&start_date=${startDate}&end_date=${endDate}`);
            const data = await res.json();
            setAnalyticData(data);
        } catch (e) {
            console.error('Failed to fetch reverse analytic data', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytic();
    }, [selectedStandId, startDate, endDate]);

    const tier1 = analyticData?.tier1_highlights || [];
    const tier2 = analyticData?.tier2_details || [];
    const table1 = analyticData?.table1_batch_needs || [];
    const table2 = analyticData?.table2_audit_comparison || [];
    const cupVal = analyticData?.cup_validation || {};
    const salesCat = analyticData?.sales_by_category || {};
    const ingMap = analyticData?.ingredients || {};

    const handleExportAudit = () => {
        if (!table2 || table2.length === 0) {
            alert('Tidak ada data audit untuk diexport');
            return;
        }
        const standObj = stands.find(s => String(s.id) === String(selectedStandId));
        const standNama = standObj ? standObj.nama_stand : (selectedStandId === 'all' ? 'Semua Stand' : 'Stand');
        exportAuditReport(table2, `${startDate}_sd_${endDate}`, standNama);
    };

    const formatNumberId = (val, decimals = 2) => {
        return Number(val || 0).toLocaleString('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    const formatPowderWeight = (item) => {
        const g = Number(item?.quantity || 0);
        if (g >= 1000) {
            const kg = g / 1000;
            return `${formatNumberId(kg, 2)} kg`;
        }
        return `${formatNumberId(g, 2)} gram`;
    };

    const cupItems = tier1.filter(i => i.category === 'packaging');
    const syrupItems = tier1.filter(i => ['SIRUP_AMK', 'PREMIK_PEACH', 'PREMIK_MOCA', 'PREMIK_KIWI'].includes(i.code));
    const solidTier1 = tier1.filter(i => ['KELENGKENG', 'GULA_PASIR', 'CREAMER'].includes(i.code));

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                            3-Layer Reverse Analytics <span className="text-amber-600 font-mono">(Recursive BOM)</span>
                        </h2>
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                            Presisi Tinggi &bull; 0% Susut
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500">
                        Pemisahan Omzet Penjualan vs Penggabungan Stok Fisik Lintas Kategori (AMK Murni, AMKopi, Kurma, Kemasan)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={selectedStandId}
                        onChange={(e) => setSelectedStandId(e.target.value)}
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-xs focus:border-amber-500 focus:outline-none"
                    >
                        <option value="all">Semua Outlet (19 Stand)</option>
                        {stands.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.kode_stand} - {s.nama_stand} ({s.price_tier})
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-2xl px-2 py-1 shadow-xs">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                        />
                        <span className="text-xs text-slate-400">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                        />
                    </div>

                    <button
                        onClick={fetchAnalytic}
                        className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-amber-600 active:scale-95 shadow-xs"
                        title="Segarkan Data"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={handleExportAudit}
                        className="flex items-center space-x-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {/* OMZET BY REPORT CATEGORY (PEMISAHAN TEGAS OMZET) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                        1. Omzet AMK Murni
                    </span>
                    <p className="mt-1 text-lg font-black text-slate-900 font-mono">
                        {formatRupiah(salesCat.amk_murni?.omzet || 0)}
                    </p>
                    <span className="text-[11px] font-bold text-amber-700">
                        {salesCat.amk_murni?.qty || 0} cup (Tanpa dikurangi Kurma)
                    </span>
                </div>

                <div className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 block">
                        2. Omzet AMKopi Mandiri
                    </span>
                    <p className="mt-1 text-lg font-black text-slate-900 font-mono">
                        {formatRupiah(salesCat.amkopi?.omzet || 0)}
                    </p>
                    <span className="text-[11px] font-bold text-indigo-700">
                        {salesCat.amkopi?.qty || 0} cup (Menu #47-#52)
                    </span>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                        3. Omzet AMK Kurma
                    </span>
                    <p className="mt-1 text-lg font-black text-slate-900 font-mono">
                        {formatRupiah(salesCat.kurma?.omzet || 0)}
                    </p>
                    <span className="text-[11px] font-bold text-emerald-700">
                        {salesCat.kurma?.qty || 0} cup (Menu #53)
                    </span>
                </div>

                <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 block">
                        4. Omzet Kemasan / Retail
                    </span>
                    <p className="mt-1 text-lg font-black text-slate-900 font-mono">
                        {formatRupiah(salesCat.kemasan?.omzet || 0)}
                    </p>
                    <span className="text-[11px] font-bold text-sky-700">
                        {salesCat.kemasan?.qty || 0} botol Le Minerale (#54)
                    </span>
                </div>
            </div>

            {/* BLOK TIER 1 HIGHLIGHT UTAMA HALAMAN DEPAN */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                            <Sparkles className="h-4 w-4 text-amber-600" />
                            <span>Blok Tier 1 Highlight — Bahan Baku & Kemasan Utama (11 Item)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Akumulasi fisik lintas kategori dengan konversi botol (1.500 ml) & kilogram (1.000 g)
                        </p>
                    </div>

                    {/* Validasi Silang Gelas + Le Minerale == Total Qty Penjualan */}
                    <div className={`inline-flex items-center space-x-2 rounded-2xl px-3.5 py-2 text-xs font-bold border ${cupVal.is_valid ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'}`}>
                        {cupVal.is_valid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                        <span>
                            Validasi Silang Kemasan: 4 Gelas ({cupVal.total_four_cups || 0}) + Le Minerale ({cupVal.le_minerale || 0}) = <strong>{cupVal.total_packaging_qty || 0}</strong> / Total Qty Terjual: <strong>{cupVal.total_sales_qty || 0}</strong>
                        </span>
                    </div>
                </div>

                {/* 1A. 4 Jenis Gelas (pcs) */}
                <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center space-x-1">
                        <Package className="h-3.5 w-3.5 text-slate-600" />
                        <span>A. 4 Jenis Gelas Kemasan (pcs)</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {cupItems.map(cup => (
                            <div key={cup.code} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                                <span className="text-[10px] font-mono font-bold text-slate-400 block">{cup.code}</span>
                                <span className="text-xs font-bold text-slate-800 block truncate">{cup.name}</span>
                                <p className="mt-2 text-xl font-black text-slate-900 font-mono">
                                    {Number(cup.quantity || 0).toLocaleString('id-ID')} <span className="text-xs font-sans font-bold text-slate-500">pcs</span>
                                </p>
                                {cup.code === 'CUP_22_AMK' && (
                                    <span className="mt-1 block text-[10px] font-semibold text-amber-700">
                                        AMK: {cup.breakdown_by_category?.amk_murni || 0} | Kurma: {cup.breakdown_by_category?.kurma || 0}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 1B. Sirup AMK (SB) & Premik Peach/Moca/Kiwi (ml + botol 1500ml) */}
                <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center space-x-1">
                        <Droplets className="h-3.5 w-3.5 text-amber-600" />
                        <span>B. Sirup AMK (SB) & Premik Varian (Konversi 1 Botol = 1.500 ml)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {syrupItems.map(syr => (
                            <div key={syr.code} className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-3.5">
                                <span className="text-[10px] font-mono font-bold text-amber-700 block">{syr.code}</span>
                                <span className="text-xs font-black text-slate-900 block">{syr.name}</span>
                                <p className="mt-2 text-base font-black text-slate-900 font-mono">
                                    {formatNumberId(syr.quantity, 2)} ml
                                    <span className="ml-1.5 inline-block rounded-lg bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-black text-amber-900">
                                        {formatNumberId(syr.converted_quantity, 2)} botol
                                    </span>
                                </p>
                                {syr.code === 'SIRUP_AMK' && (
                                    <div className="mt-2 pt-2 border-t border-amber-200/70 text-[10px] font-bold text-slate-700 space-y-0.5">
                                        <div className="flex justify-between">
                                            <span>AMK Murni:</span>
                                            <span className="font-mono">{formatNumberId(syr.breakdown_by_category?.amk_murni || 0)} ml</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>AMK Kurma:</span>
                                            <span className="font-mono">{formatNumberId(syr.breakdown_by_category?.kurma || 0)} ml</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>AMKopi:</span>
                                            <span className="font-mono">{formatNumberId(syr.breakdown_by_category?.amkopi || 0)} ml</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 1C. Kelengkeng, Gula Pasir, & Creamer */}
                <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center space-x-1">
                        <Scale className="h-3.5 w-3.5 text-teal-600" />
                        <span>C. Kelengkeng, Gula Pasir & Creamer (Otomatis Format kg bila &ge; 1.000 g)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {solidTier1.map(sol => (
                            <div key={sol.code} className="rounded-2xl border border-teal-200/80 bg-teal-50/30 p-3.5">
                                <span className="text-[10px] font-mono font-bold text-teal-700 block">{sol.code}</span>
                                <span className="text-xs font-black text-slate-900 block">{sol.name}</span>
                                {sol.code === 'KELENGKENG' ? (
                                    <>
                                        <p className="mt-2 text-xl font-black text-slate-900 font-mono">
                                            {Number(sol.quantity || 0).toLocaleString('id-ID')} <span className="text-xs font-sans font-bold text-slate-600">buah</span>
                                        </p>
                                        <span className="mt-1 inline-block rounded-md bg-teal-100/80 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                                            {sol.notes || 'Ref: 36-40 buah/kaleng'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <p className="mt-2 text-xl font-black text-slate-900 font-mono">
                                            {formatPowderWeight(sol)}
                                        </p>
                                        <span className="mt-1 block text-[10px] font-semibold text-slate-500 font-mono">
                                            Total: {formatNumberId(sol.quantity, 2)} gram {sol.density_g_per_ml ? `(\u03C1 = ${sol.density_g_per_ml} g/ml)` : ''}
                                        </span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* LAYER 2: Kebutuhan 7 Base Adonan */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                            <Layers className="h-4 w-4 text-amber-600" />
                            <span>Layer 2: Volume 7 Base Adonan Terpakai (Termasuk Nested BASE_AMK_TEA & BASE_LITE)</span>
                        </h3>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {table1.map((batch, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 text-center">
                            <span className="text-[11px] font-bold text-slate-700 block truncate mb-1">
                                {batch.nama}
                            </span>
                            <span className="text-sm font-black text-slate-900 font-mono block">
                                {formatNumberId(batch.volume_ml, 2)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">ml adonan</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* DETAIL ANALISA (TIER 2 — BAHAN PENDUKUNG: AMK -> AMKopi -> Kurma -> Retail) */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Detail Analisa Tier 2 — Bahan Pendukung (Urutan: AMK &rarr; AMKopi &rarr; Kurma &rarr; Retail)
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Termasuk total kebutuhan Air Putih (ml), Teh (bag), Serbuk Rasa, Bahan AMKopi, Sirup Kurma, & Le Minerale
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3.5">No</th>
                                <th className="px-4 py-3.5">Kode & Nama Bahan</th>
                                <th className="px-4 py-3.5">Kategori</th>
                                <th className="px-4 py-3.5">Satuan</th>
                                <th className="px-4 py-3.5 text-right">Pemakaian Teoritis (BOM)</th>
                                <th className="px-4 py-3.5 text-right">Pemakaian Aktual (Menu 3)</th>
                                <th className="px-4 py-3.5 text-right">Selisih</th>
                                <th className="px-4 py-3.5 text-center">Status Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {tier2.map((row, index) => (
                                <tr key={row.code} className="hover:bg-slate-50/80 transition">
                                    <td className="px-4 py-3 font-mono text-slate-400">{index + 12}</td>
                                    <td className="px-4 py-3 font-bold text-slate-900">
                                        {row.name}
                                        <span className="block text-[10px] text-slate-400 font-mono">
                                            {row.code}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                                            {row.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                            {row.base_unit}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                        {row.base_unit === 'gram' ? formatPowderWeight(row) : `${formatNumberId(row.quantity, 2)} ${row.base_unit}`}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                        {formatNumberId(row.aktual, 2)}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-mono font-bold ${row.selisih === 0 ? 'text-slate-500' : row.selisih > 0 ? 'text-amber-700' : 'text-blue-700'}`}>
                                        {row.selisih > 0 ? `+${formatNumberId(row.selisih, 2)}` : formatNumberId(row.selisih, 2)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {row.badge_color === 'green' && (
                                            <span className="inline-flex items-center text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full text-[11px]">
                                                <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                                                Wajar (&le;5%)
                                            </span>
                                        )}
                                        {row.badge_color === 'yellow' && (
                                            <span className="inline-flex items-center text-amber-800 font-bold bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full text-[11px]">
                                                <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
                                                Warning (5-10%)
                                            </span>
                                        )}
                                        {row.badge_color === 'red' && (
                                            <span className="inline-flex items-center text-rose-800 font-bold bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-full text-[11px]">
                                                <AlertTriangle className="h-3 w-3 mr-1 text-rose-600" />
                                                Anomali (&gt;10%)
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
