import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart3, Calendar, Store, RefreshCw, Download, FileSpreadsheet,
    TrendingUp, Award, CreditCard, Users, AlertTriangle, CheckCircle2,
    Eye, X, Layers, Package
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { exportOmsExcel, exportPresExcel, exportActivePivotExcel } from '../../utils/biExcelExporter';

export default function BiPivotCenter({ stands = [], tanggal }) {
    const initialMonth = (tanggal || new Date().toISOString().slice(0, 10)).slice(0, 7);
    const [month, setMonth] = useState(initialMonth);
    const [startDate, setStartDate] = useState(`${initialMonth}-01`);
    const [endDate, setEndDate] = useState(() => {
        const [y, m] = initialMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        return `${initialMonth}-${String(lastDay).padStart(2, '0')}`;
    });
    const [selectedStandId, setSelectedStandId] = useState('all');

    const [biData, setBiData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState('');

    // Section 1: 5 Analytic Panels Switcher
    const [activeAnalyticPanel, setActiveAnalyticPanel] = useState('lini'); // 'lini', 'menu', 'finance', 'people', 'stock'
    const [menuGroupFilter, setMenuGroupFilter] = useState('all');
    const [variantFlavorFilter, setVariantFlavorFilter] = useState('all');
    const [specificMenuId, setSpecificMenuId] = useState('all');
    const [variantSearch, setVariantSearch] = useState('');
    const [variantSoldStatus, setVariantSoldStatus] = useState('all'); // 'all', 'sold', 'unsold'
    const [variantSortBy, setVariantSortBy] = useState('qty_desc'); // 'sort_order', 'qty_desc', 'qty_asc', 'omzet_desc', 'omzet_asc'
    const [expandedMenuIds, setExpandedMenuIds] = useState([]);
    const [previewProof, setPreviewProof] = useState(null);

    // Section 2: 8 Pivot Matrix Tabs Switcher
    const [activePivotTab, setActivePivotTab] = useState('omzet');
    // 'omzet', 'cup_12', 'cup_22', 'cup_16', 'cup_kopi', 'spg_schedule', 'qris_tunai', 'biaya'
    const [liniFilter, setLiniFilter] = useState('all'); // 'all', 'amk_murni', 'amkopi', 'kurma', 'ptt', 'mineral'

    const handleMonthChange = (newMonth) => {
        if (!newMonth) return;
        setMonth(newMonth);
        const [y, m] = newMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        setStartDate(`${newMonth}-01`);
        setEndDate(`${newMonth}-${String(lastDay).padStart(2, '0')}`);
    };

    const fetchBiData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                month,
                start_date: startDate,
                end_date: endDate,
                stand_id: selectedStandId,
            });
            const res = await fetch(`/api/admin/bi-analytics?${params.toString()}`);
            const data = await res.json();
            setBiData(data);
        } catch (err) {
            console.error('Failed to load BI Analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBiData();
    }, [month, startDate, endDate, selectedStandId]);

    const calendarDays = biData?.calendar_days || [];
    const analytics = biData?.analytics || {};
    const liniOmzet = analytics?.lini_omzet || {};
    const menuVariants = analytics?.menu_variants || {};
    const financeAudit = analytics?.finance_audit || {};
    const peopleAnalytics = analytics?.people_analytics || [];
    const stockHealth = analytics?.stock_health || {};
    const pivotOutlets = biData?.pivots?.outlets || [];
    const pivotSpg = biData?.pivots?.spg || [];

    const fmtNum = (n) => Number(n || 0).toLocaleString('id-ID');

    // Filtered & Ranked Menus for Panel 2
    const { topMenus, bottomMenus, filteredAllVariants, filteredTotals, grandTotalMenuQty } = useMemo(() => {
        const allList = [...(menuVariants.all_menus_ranked || [])];
        const totalQtyAll = allList.reduce((acc, m) => acc + Number(m.qty || 0), 0);

        let groupList = [...allList];
        if (menuGroupFilter !== 'all') {
            groupList = groupList.filter(m => m.menu_group === menuGroupFilter);
        }
        const sortedDesc = [...groupList].sort((a, b) => b.qty - a.qty || b.omzet - a.omzet);
        const sortedAsc = [...groupList].sort((a, b) => a.qty - b.qty || a.omzet - b.omzet);

        // Detailed Per-Variant & Per-Item Filter across all 54 menus
        let detailed = [...groupList];

        if (specificMenuId !== 'all') {
            detailed = detailed.filter(m => String(m.menu_id) === String(specificMenuId));
        }

        if (variantFlavorFilter !== 'all') {
            detailed = detailed.filter(m => {
                const nm = (m.name || '').toLowerCase();
                if (variantFlavorFilter === 'ori_murni') {
                    return ['amk', 'amk ori', 'amk jumbo', 'amk premium', 'amk ori premium'].includes(nm);
                }
                if (variantFlavorFilter === 'peach') return nm.includes('peach') || nm.includes('mp ') || nm.includes('pk ');
                if (variantFlavorFilter === 'moca') return nm.includes('moca') || nm.includes('mp ') || nm.includes('mk ');
                if (variantFlavorFilter === 'kiwi') return nm.includes('kiwi') || nm.includes('mk ') || nm.includes('pk ');
                if (variantFlavorFilter === 'blend_2in1') {
                    return nm.includes('moca peach') || nm.includes('moca kiwi') || nm.includes('peach kiwi') || nm.includes('mp ') || nm.includes('mk ') || nm.includes('pk ');
                }
                if (variantFlavorFilter === 'cream') return nm.includes('cream');
                if (variantFlavorFilter === 'oreo') return nm.includes('oreo');
                if (variantFlavorFilter === 'coffe') return nm.includes('coffe');
                if (variantFlavorFilter === 'fruit_powder') return nm.includes('lime') || nm.includes('orange') || nm.includes('guava');
                if (variantFlavorFilter === 'amk_tea') return nm.includes('tea') || nm.includes('lite');
                if (variantFlavorFilter === 'amkopi') return m.menu_group === 'amkopi';
                if (variantFlavorFilter === 'kurma') return m.menu_group === 'amk_kurma';
                if (variantFlavorFilter === 'mineral') return m.menu_group === 'kemasan';
                return true;
            });
        }

        if (variantSearch.trim() !== '') {
            const q = variantSearch.trim().toLowerCase();
            detailed = detailed.filter(m =>
                (m.name || '').toLowerCase().includes(q) ||
                String(m.sort_order).includes(q) ||
                (m.kelompok_menu || '').toLowerCase().includes(q)
            );
        }

        if (variantSoldStatus === 'sold') {
            detailed = detailed.filter(m => Number(m.qty || 0) > 0);
        } else if (variantSoldStatus === 'unsold') {
            detailed = detailed.filter(m => Number(m.qty || 0) === 0);
        }

        if (variantSortBy === 'sort_order') {
            detailed.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        } else if (variantSortBy === 'qty_desc') {
            detailed.sort((a, b) => b.qty - a.qty || b.omzet - a.omzet);
        } else if (variantSortBy === 'qty_asc') {
            detailed.sort((a, b) => a.qty - b.qty || a.omzet - b.omzet);
        } else if (variantSortBy === 'omzet_desc') {
            detailed.sort((a, b) => b.omzet - a.omzet || b.qty - a.qty);
        } else if (variantSortBy === 'omzet_asc') {
            detailed.sort((a, b) => a.omzet - b.omzet || a.qty - b.qty);
        }

        const totQtyFiltered = detailed.reduce((acc, m) => acc + Number(m.qty || 0), 0);
        const totOmzetFiltered = detailed.reduce((acc, m) => acc + Number(m.omzet || 0), 0);

        return {
            topMenus: sortedDesc.slice(0, 10),
            bottomMenus: sortedAsc.slice(0, 10),
            filteredAllVariants: detailed,
            filteredTotals: {
                count: detailed.length,
                qty: totQtyFiltered,
                omzet: totOmzetFiltered,
            },
            grandTotalMenuQty: totalQtyAll,
        };
    }, [
        menuVariants.all_menus_ranked,
        menuGroupFilter,
        specificMenuId,
        variantFlavorFilter,
        variantSearch,
        variantSoldStatus,
        variantSortBy,
    ]);

    const toggleExpandMenu = (menuId) => {
        setExpandedMenuIds(prev =>
            prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
        );
    };

    // Export Handlers
    const handleExportOms = async () => {
        if (!biData) return;
        setExporting('oms');
        try {
            await exportOmsExcel(biData);
        } finally {
            setExporting('');
        }
    };

    const handleExportPres = async () => {
        if (!biData) return;
        setExporting('pres');
        try {
            await exportPresExcel(biData);
        } finally {
            setExporting('');
        }
    };

    const handleExportActivePivot = async () => {
        if (!biData) return;
        setExporting('pivot');
        try {
            await exportActivePivotExcel(biData, activePivotTab, liniFilter);
        } finally {
            setExporting('');
        }
    };

    // Helper for Pivot Outlet Value
    const getOutletDayPrimaryValue = (dayObj) => {
        if (!dayObj) return 0;
        if (activePivotTab === 'omzet') {
            if (liniFilter === 'amk_murni') return dayObj.omzet_amk_murni || 0;
            if (liniFilter === 'amkopi') return dayObj.omzet_amkopi || 0;
            if (liniFilter === 'kurma') return dayObj.omzet_kurma || 0;
            if (liniFilter === 'ptt') return dayObj.omzet_ptt || 0;
            if (liniFilter === 'mineral') return dayObj.omzet_mineral || 0;
            return dayObj.omzet_total || 0;
        }
        if (activePivotTab === 'cup_12') return dayObj.cup_12_amk || 0;
        if (activePivotTab === 'cup_22') return dayObj.cup_22_amk || 0;
        if (activePivotTab === 'cup_16') return dayObj.cup_16_amk || 0;
        if (activePivotTab === 'cup_kopi') return dayObj.cup_amkopi || 0;
        if (activePivotTab === 'qris_tunai') return dayObj.qris || 0;
        if (activePivotTab === 'biaya') return dayObj.total_biaya || 0;
        return 0;
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
            {/* TOP HEADER & 3 EXACT EXCEL EXPORT BUTTONS */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-2">
                            <BarChart3 className="h-6 w-6 text-amber-600" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                                BI & Pivot Center <span className="text-amber-600 font-mono">(OMS & PRES)</span>
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                            Business Intelligence Drill-Down, 8 Matriks Pivot Kalender Interaktif (Tgl 1–31), & Exact Excel Export
                        </p>
                    </div>

                    {/* 3 TOMBOL EXPORT EXCEL PRESISI TINGGI */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleExportOms}
                            disabled={!!exporting || !biData}
                            className="flex items-center space-x-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2.5 text-xs font-black text-white shadow-xs hover:bg-emerald-700 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>{exporting === 'oms' ? 'Mengunduh...' : '1. Export Omzet (Format OMS.xlsx)'}</span>
                        </button>

                        <button
                            onClick={handleExportPres}
                            disabled={!!exporting || !biData}
                            className="flex items-center space-x-1.5 rounded-2xl bg-indigo-600 px-3.5 py-2.5 text-xs font-black text-white shadow-xs hover:bg-indigo-700 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <Users className="h-4 w-4" />
                            <span>{exporting === 'pres' ? 'Mengunduh...' : '2. Export Presensi SPG (Format PRES.xlsx)'}</span>
                        </button>

                        <button
                            onClick={handleExportActivePivot}
                            disabled={!!exporting || !biData}
                            className="flex items-center space-x-1.5 rounded-2xl bg-amber-600 px-3.5 py-2.5 text-xs font-black text-white shadow-xs hover:bg-amber-700 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <Download className="h-4 w-4" />
                            <span>{exporting === 'pivot' ? 'Mengunduh...' : '3. Export Pivot Aktif (.xlsx)'}</span>
                        </button>
                    </div>
                </div>

                {/* FILTER PERIODE: BULAN & TAHUN, RENTANG TANGGAL, & OUTLET */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                            Filter Bulan & Tahun (Kalender 1–31)
                        </label>
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => handleMonthChange(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                            Rentang Tanggal Mulai
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                            Rentang Tanggal Akhir
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        />
                    </div>

                    <div className="flex items-end space-x-2">
                        <div className="flex-1">
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                                Filter Outlet / Stand
                            </label>
                            <select
                                value={selectedStandId}
                                onChange={(e) => setSelectedStandId(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                            >
                                <option value="all">Semua Outlet ({stands.length} Stand)</option>
                                {stands.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.kode_stand} - {s.nama_stand}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={fetchBiData}
                            className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                            title="Refresh Analitik"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ========================================================================
                SECTION 1: DASHBOARD ANALITIK KOMPREHENSIF (5 PANEL DRILL-DOWN)
               ======================================================================== */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-5 pt-4 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                1. Dashboard Analitik Komprehensif (5 Panel Drill-Down Semua Input)
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Mengolah data terintegrasi dari Laporan Harian (Menu 1), Detail Menu (Menu 2), Stok & Reject (Menu 3), serta Reverse Analytic
                            </p>
                        </div>
                    </div>

                    {/* 5 Analytic Panel Sub-tabs */}
                    <div className="flex overflow-x-auto space-x-2 no-scrollbar">
                        {[
                            { id: 'lini', label: '1. Lini Omzet & ARPC' },
                            { id: 'menu', label: '2. Menu, Varian & Matrix' },
                            { id: 'finance', label: '3. Keuangan, QRIS & Audit Biaya' },
                            { id: 'people', label: '4. Produktivitas SPG (People)' },
                            { id: 'stock', label: '5. Kesehatan Stok & Reject' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveAnalyticPanel(tab.id)}
                                className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${activeAnalyticPanel === tab.id ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-5">
                    {/* PANEL 1: ANALISA PER LINI & KATEGORI OMZET + ARPC */}
                    {activeAnalyticPanel === 'lini' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                                {[
                                    { label: 'AMK Murni', val: liniOmzet.summary?.amk_murni || 0, color: 'border-amber-200 bg-amber-50/60 text-amber-900' },
                                    { label: 'AMKopi', val: liniOmzet.summary?.amkopi || 0, color: 'border-indigo-200 bg-indigo-50/60 text-indigo-900' },
                                    { label: 'AMK Kurma', val: liniOmzet.summary?.kurma || 0, color: 'border-emerald-200 bg-emerald-50/60 text-emerald-900' },
                                    { label: 'PTT', val: liniOmzet.summary?.ptt || 0, color: 'border-purple-200 bg-purple-50/60 text-purple-900' },
                                    { label: 'Air Mineral', val: liniOmzet.summary?.mineral || 0, color: 'border-sky-200 bg-sky-50/60 text-sky-900' },
                                    { label: 'Penjualan Lain', val: liniOmzet.summary?.lain || 0, color: 'border-slate-200 bg-slate-50 text-slate-800' },
                                    { label: 'ARPC Global', val: liniOmzet.arpc_global || 0, sub: `${fmtNum(liniOmzet.summary?.total_cups || 0)} Total Cup`, color: 'border-slate-900 bg-slate-900 text-white' },
                                ].map((c, idx) => (
                                    <div key={idx} className={`rounded-2xl border p-3.5 ${c.color}`}>
                                        <span className="text-[10px] font-black uppercase tracking-wider block opacity-80">{c.label}</span>
                                        <p className="mt-1 text-sm sm:text-base font-black font-mono">{formatRupiah(c.val)}</p>
                                        {c.sub && <span className="text-[10px] font-bold opacity-75 block mt-0.5">{c.sub}</span>}
                                    </div>
                                ))}
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3.5 py-2.5">Outlet</th>
                                            <th className="px-3.5 py-2.5 text-right">AMK Murni</th>
                                            <th className="px-3.5 py-2.5 text-right">AMKopi</th>
                                            <th className="px-3.5 py-2.5 text-right">Kurma</th>
                                            <th className="px-3.5 py-2.5 text-right">PTT & Mineral</th>
                                            <th className="px-3.5 py-2.5 text-right">Total Omzet</th>
                                            <th className="px-3.5 py-2.5 text-right">Total Cup</th>
                                            <th className="px-3.5 py-2.5 text-right">ARPC (Rp / Cup)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {(liniOmzet.per_outlet || []).map(row => (
                                            <tr key={row.stand_id} className="hover:bg-slate-50">
                                                <td className="px-3.5 py-2.5 font-bold text-slate-900">{row.kode_stand} - {row.nama_stand}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono">{formatRupiah(row.amk_murni)}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono text-indigo-700">{formatRupiah(row.amkopi)}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono">{formatRupiah(row.kurma)}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono">{formatRupiah((row.ptt || 0) + (row.mineral || 0) + (row.lain || 0))}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono font-black text-slate-900">{formatRupiah(row.total_omzet)}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono font-bold">{fmtNum(row.total_cups)}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono font-black text-amber-700">{formatRupiah(row.arpc)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PANEL 2: ANALISA PER MENU & VARIAN (MENU 2 DETAIL) */}
                    {activeAnalyticPanel === 'menu' && (
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-black uppercase text-slate-700">Filter Kelompok Menu:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { id: 'all', label: 'Semua Kelompok' },
                                        { id: 'amk_reguler', label: 'AMK 27 Menu' },
                                        { id: 'amk_jumbo', label: 'AMK Jumbo' },
                                        { id: 'amk_premium', label: 'AMK Premium' },
                                        { id: 'amkopi', label: 'AMKopi' },
                                        { id: 'amk_kurma', label: 'AMK Kurma' },
                                        { id: 'kemasan', label: 'Air Mineral' },
                                    ].map(g => (
                                        <button
                                            key={g.id}
                                            onClick={() => setMenuGroupFilter(g.id)}
                                            className={`rounded-xl px-3 py-1 text-xs font-bold transition ${menuGroupFilter === g.id ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Top 10 Menu */}
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 space-y-2.5">
                                    <h4 className="text-xs font-black uppercase text-emerald-900">Top 10 Menu Terlaris (Qty & Rupiah)</h4>
                                    <div className="divide-y divide-emerald-100 text-xs">
                                        {topMenus.map((m, i) => (
                                            <div key={m.menu_id} className="py-1.5 flex items-center justify-between">
                                                <span className="font-bold text-slate-800">
                                                    <span className="font-mono text-emerald-700 mr-1.5">#{i + 1}</span>
                                                    {m.name}
                                                </span>
                                                <span className="font-mono font-bold text-slate-900">
                                                    {fmtNum(m.qty)} pcs &bull; {formatRupiah(m.omzet)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bottom 10 Menu */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
                                    <h4 className="text-xs font-black uppercase text-slate-700">Bottom 10 Menu (Qty Terendah)</h4>
                                    <div className="divide-y divide-slate-200/70 text-xs">
                                        {bottomMenus.map((m, i) => (
                                            <div key={m.menu_id} className="py-1.5 flex items-center justify-between">
                                                <span className="font-semibold text-slate-700">
                                                    <span className="font-mono text-slate-400 mr-1.5">#{m.sort_order}</span>
                                                    {m.name}
                                                </span>
                                                <span className="font-mono text-slate-600">
                                                    {fmtNum(m.qty)} pcs &bull; {formatRupiah(m.omzet)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* EKSPLORASI & FILTER LENGKAP PER ITEM / VARIAN (SELURUH 54 MENU) */}
                            <div className="rounded-3xl border border-indigo-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-950">
                                            Eksplorasi & Filter Penjualan Lengkap Per Item / Varian (Seluruh 54 Menu)
                                        </h4>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            Filter per rasa/varian, pilih spesifik per item menu, lihat total terjual masing-masing varian, dan klik baris item untuk melihat rincian penjualan di tiap outlet
                                        </p>
                                    </div>

                                    {/* Summary Badges of Filtered Variant/Items */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-right">
                                            <span className="text-[9px] font-black uppercase text-indigo-600 block">Item Terfilter</span>
                                            <span className="text-xs font-black font-mono text-indigo-950">{filteredTotals?.count || 0} Varian</span>
                                        </div>
                                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-right">
                                            <span className="text-[9px] font-black uppercase text-emerald-700 block">Total Qty Terjual</span>
                                            <span className="text-xs font-black font-mono text-emerald-950">{fmtNum(filteredTotals?.qty || 0)} pcs</span>
                                        </div>
                                        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-right">
                                            <span className="text-[9px] font-black uppercase text-amber-700 block">Total Omzet Varian</span>
                                            <span className="text-xs font-black font-mono text-amber-950">{formatRupiah(filteredTotals?.omzet || 0)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pill Filter Rasa / Varian */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-black uppercase text-slate-400 block">
                                        Filter Cepat Rasa / Karakter Varian:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { id: 'all', label: 'Semua Varian (54)' },
                                            { id: 'ori_murni', label: 'AMK Original / Murni' },
                                            { id: 'peach', label: 'Varian Peach' },
                                            { id: 'moca', label: 'Varian Moca' },
                                            { id: 'kiwi', label: 'Varian Kiwi' },
                                            { id: 'blend_2in1', label: 'Blend 2-in-1 (MP / MK / PK)' },
                                            { id: 'cream', label: 'Varian Cream' },
                                            { id: 'oreo', label: 'Varian Oreo' },
                                            { id: 'coffe', label: 'Varian Coffe' },
                                            { id: 'fruit_powder', label: 'Lime / Orange / Guava' },
                                            { id: 'amk_tea', label: 'AMK Tea & Lite' },
                                            { id: 'amkopi', label: 'Varian AMKopi' },
                                            { id: 'kurma', label: 'AMK Kurma' },
                                            { id: 'mineral', label: 'Le Minerale' },
                                        ].map(vf => (
                                            <button
                                                key={vf.id}
                                                type="button"
                                                onClick={() => {
                                                    setVariantFlavorFilter(vf.id);
                                                    setSpecificMenuId('all');
                                                }}
                                                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${variantFlavorFilter === vf.id ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                            >
                                                {vf.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Detailed Controls: Search, Specific Item Dropdown, Sold Status, Sort Order */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                                            Cari Nama Item / Varian
                                        </label>
                                        <input
                                            type="text"
                                            value={variantSearch}
                                            onChange={(e) => setVariantSearch(e.target.value)}
                                            placeholder="Ketik misal: Peach Cream, Oreo, Jumbo..."
                                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                                            Pilih Spesifik 1 Item Menu
                                        </label>
                                        <select
                                            value={specificMenuId}
                                            onChange={(e) => setSpecificMenuId(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                                        >
                                            <option value="all">Semua Item Menu (54 Item)</option>
                                            {[...(menuVariants.all_menus_ranked || [])]
                                                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                                                .map(m => (
                                                    <option key={m.menu_id} value={m.menu_id}>
                                                        #{m.sort_order} - {m.name} ({fmtNum(m.qty)} pcs)
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                                            Status Penjualan
                                        </label>
                                        <select
                                            value={variantSoldStatus}
                                            onChange={(e) => setVariantSoldStatus(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                                        >
                                            <option value="all">Semua Item (Terjual & Belum)</option>
                                            <option value="sold">Hanya yang Terjual (&gt; 0 pcs)</option>
                                            <option value="unsold">Belum Terjual (0 pcs)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                                            Urutkan Daftar
                                        </label>
                                        <select
                                            value={variantSortBy}
                                            onChange={(e) => setVariantSortBy(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                                        >
                                            <option value="qty_desc">Qty Terjual Tertinggi &rarr; Terendah</option>
                                            <option value="qty_asc">Qty Terjual Terendah &rarr; Tertinggi</option>
                                            <option value="omzet_desc">Omzet Rupiah Tertinggi &rarr; Terendah</option>
                                            <option value="omzet_asc">Omzet Rupiah Terendah &rarr; Tertinggi</option>
                                            <option value="sort_order">Urutan Baku Menu (#1 s/d #54)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Complete All-Variants Table with Per-Outlet Expandable Breakdown */}
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[540px] overflow-y-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase font-black text-slate-600 border-b border-slate-200">
                                            <tr>
                                                <th className="px-3.5 py-2.5 w-14">No</th>
                                                <th className="px-3.5 py-2.5">Nama Item / Varian Menu</th>
                                                <th className="px-3.5 py-2.5">Kelompok Menu</th>
                                                <th className="px-3.5 py-2.5 text-right">Qty Terjual</th>
                                                <th className="px-3.5 py-2.5 text-right">% Porsi Qty</th>
                                                <th className="px-3.5 py-2.5 text-right">Total Omzet (Rp)</th>
                                                <th className="px-3.5 py-2.5 text-center">Sebaran Outlet</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {filteredAllVariants.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                                        Tidak ada varian menu yang sesuai dengan filter di atas.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredAllVariants.map(item => {
                                                    const isExpanded = expandedMenuIds.includes(item.menu_id) || specificMenuId !== 'all';
                                                    const sharePct = grandTotalMenuQty > 0
                                                        ? ((Number(item.qty || 0) / grandTotalMenuQty) * 100).toFixed(1)
                                                        : '0.0';
                                                    const outletBreakdown = item.by_outlet || [];

                                                    return (
                                                        <React.Fragment key={item.menu_id}>
                                                            <tr
                                                                onClick={() => toggleExpandMenu(item.menu_id)}
                                                                className={`cursor-pointer transition ${item.qty > 0 ? 'hover:bg-indigo-50/40' : 'opacity-75 hover:bg-slate-50'}`}
                                                            >
                                                                <td className="px-3.5 py-2.5 font-mono font-bold text-slate-400">
                                                                    #{item.sort_order}
                                                                </td>
                                                                <td className="px-3.5 py-2.5 font-black text-slate-900">
                                                                    {item.name}
                                                                </td>
                                                                <td className="px-3.5 py-2.5">
                                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                                                        {item.kelompok_menu}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3.5 py-2.5 text-right font-mono font-black text-slate-900">
                                                                    {fmtNum(item.qty)} pcs
                                                                </td>
                                                                <td className="px-3.5 py-2.5 text-right font-mono text-indigo-700 font-bold">
                                                                    {sharePct}%
                                                                </td>
                                                                <td className="px-3.5 py-2.5 text-right font-mono font-black text-emerald-800">
                                                                    {formatRupiah(item.omzet)}
                                                                </td>
                                                                <td className="px-3.5 py-2.5 text-center">
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-800 hover:bg-indigo-100"
                                                                    >
                                                                        {outletBreakdown.length} Outlet {isExpanded ? '▲' : '▼'}
                                                                    </button>
                                                                </td>
                                                            </tr>

                                                            {isExpanded && (
                                                                <tr className="bg-indigo-50/30">
                                                                    <td colSpan={7} className="px-4 py-3 border-b border-indigo-100">
                                                                        <div className="space-y-2">
                                                                            <span className="text-[10px] font-black uppercase text-indigo-900 block">
                                                                                Rincian Penjualan #{item.sort_order} {item.name} per Outlet:
                                                                            </span>
                                                                            {outletBreakdown.length === 0 ? (
                                                                                <span className="text-xs text-slate-400 italic block">
                                                                                    Belum ada penjualan tercatat di outlet mana pun pada periode ini.
                                                                                </span>
                                                                            ) : (
                                                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                                                                    {outletBreakdown.map(ob => (
                                                                                        <div
                                                                                            key={ob.stand_id}
                                                                                            className="rounded-xl border border-indigo-200/80 bg-white p-2.5 flex items-center justify-between"
                                                                                        >
                                                                                            <div>
                                                                                                <span className="font-black text-slate-900 text-xs block">{ob.kode_stand}</span>
                                                                                                <span className="text-[10px] text-slate-400 truncate block max-w-[90px]">{ob.nama_stand}</span>
                                                                                            </div>
                                                                                            <div className="text-right font-mono">
                                                                                                <span className="font-black text-indigo-900 text-xs block">{fmtNum(ob.qty)} pcs</span>
                                                                                                <span className="text-[10px] text-emerald-700 font-bold">{formatRupiah(ob.omzet)}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Product-Outlet Matrix */}
                            <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
                                <h4 className="text-xs font-black uppercase text-slate-900">Product-Outlet Matrix (Menu Paling Laris di Tiap Outlet)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                                    {(menuVariants.product_outlet_matrix || []).map(po => (
                                        <div key={po.stand_id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between">
                                            <div>
                                                <span className="font-black text-slate-900 block">{po.kode_stand} - {po.nama_stand}</span>
                                                <span className="text-[11px] font-bold text-indigo-700">{po.top_menu_name}</span>
                                            </div>
                                            <div className="text-right font-mono">
                                                <span className="font-black text-slate-900 block">{fmtNum(po.top_menu_qty)} pcs</span>
                                                <span className="text-[10px] text-slate-500">{formatRupiah(po.top_menu_omzet)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Unregistered Recap */}
                            {(menuVariants.unregistered_recap || []).length > 0 && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                                    <h4 className="text-xs font-black uppercase text-amber-900">Rekap Item Unregistered yang Diinput SPG</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-amber-200 text-[10px] font-black uppercase text-amber-800">
                                                    <th className="py-1.5">Tanggal</th>
                                                    <th className="py-1.5">Outlet</th>
                                                    <th className="py-1.5">Keterangan</th>
                                                    <th className="py-1.5 text-right">Qty</th>
                                                    <th className="py-1.5 text-right">Nominal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-amber-100">
                                                {menuVariants.unregistered_recap.map((u, idx) => (
                                                    <tr key={idx}>
                                                        <td className="py-1.5 font-mono">{u.tanggal}</td>
                                                        <td className="py-1.5 font-bold">{u.kode_stand}</td>
                                                        <td className="py-1.5">{u.keterangan}</td>
                                                        <td className="py-1.5 text-right font-mono">{u.qty}</td>
                                                        <td className="py-1.5 text-right font-mono font-bold">{formatRupiah(u.nominal)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PANEL 3: ANALISA KEUANGAN, QRIS & AUDIT BIAYA */}
                    {activeAnalyticPanel === 'finance' && (
                        <div className="space-y-5">
                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3.5 py-2.5">Outlet</th>
                                            <th className="px-3.5 py-2.5 text-right">Total Omzet</th>
                                            <th className="px-3.5 py-2.5 text-right">Nominal QRIS</th>
                                            <th className="px-3.5 py-2.5 text-right">Tunai Kotor</th>
                                            <th className="px-3.5 py-2.5 text-right">Total Biaya</th>
                                            <th className="px-3.5 py-2.5 text-right">Sisa Setoran Tunai</th>
                                            <th className="px-3.5 py-2.5 text-center">Cost-to-Revenue %</th>
                                            <th className="px-3.5 py-2.5">Rincian Biaya</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {(financeAudit.per_outlet || []).map(f => (
                                            <tr key={f.stand_id} className={f.is_high_cost ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                                                <td className="px-3.5 py-2.5 font-bold text-slate-900">{f.kode_stand} - {f.nama_stand}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono font-bold">{formatRupiah(f.total_omzet)}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono text-blue-700">{formatRupiah(f.qris)}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono text-emerald-700">{formatRupiah(f.tunai_kotor)}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono text-rose-700 font-bold">{formatRupiah(f.total_biaya)}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono font-black text-indigo-900">{formatRupiah(f.sisa_setoran_tunai)}</td>
                                                <td className="px-3.5 py-2.5 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black ${f.is_high_cost ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800'}`}>
                                                        {f.is_high_cost && <AlertTriangle className="h-3 w-3 mr-1 text-rose-600" />}
                                                        {f.cost_to_revenue_pct}% {f.is_high_cost ? '(>3% Tinggi)' : '(Wajar)'}
                                                    </span>
                                                </td>
                                                <td className="px-3.5 py-2.5 text-[11px] text-slate-600">
                                                    {(f.biaya_rincian || []).length === 0 ? '-' : (
                                                        <div className="space-y-0.5 max-h-20 overflow-y-auto">
                                                            {f.biaya_rincian.map((b, bIdx) => (
                                                                <div key={bIdx} className="font-mono text-[10px]">
                                                                    [{b.tanggal}] {b.keterangan}: <strong>{formatRupiah(b.nominal)}</strong>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* QRIS Settlement Photo Previews */}
                            <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
                                <h4 className="text-xs font-black uppercase text-slate-900">Galeri Bukti Foto Settlement QRIS ({financeAudit.qris_proofs?.length || 0})</h4>
                                {(financeAudit.qris_proofs || []).length === 0 ? (
                                    <p className="text-xs text-slate-400">Belum ada foto bukti settlement QRIS pada periode ini.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2.5">
                                        {financeAudit.qris_proofs.map(pr => (
                                            <button
                                                key={pr.report_id}
                                                onClick={() => setPreviewProof(pr)}
                                                className="flex items-center space-x-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900 hover:bg-blue-100"
                                            >
                                                <Eye className="h-3.5 w-3.5 text-blue-600" />
                                                <span>{pr.kode_stand} ({pr.tanggal}) &bull; {formatRupiah(pr.nominal_qris)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PANEL 4: ANALISA PRODUKTIVITAS & KORELASI SPG (PEOPLE ANALYTICS) */}
                    {activeAnalyticPanel === 'people' && (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-3.5 py-2.5">ID & Nama SPG</th>
                                        <th className="px-3.5 py-2.5 text-center">Hari Masuk</th>
                                        <th className="px-3.5 py-2.5 text-center">Hari Libur (Off)</th>
                                        <th className="px-3.5 py-2.5">Daftar Outlet yang Pernah Dijaga</th>
                                        <th className="px-3.5 py-2.5 text-right">Total Omzet Ditangani</th>
                                        <th className="px-3.5 py-2.5 text-right">Rata-rata Omzet / Shift</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {peopleAnalytics.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                                                Belum ada data SPG atau laporan kehadiran pada periode ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        peopleAnalytics.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-3.5 py-2.5 font-bold text-slate-900">
                                                    {p.name}
                                                    <span className="block text-[10px] font-mono text-slate-400">{p.id_spg} (@{p.username})</span>
                                                </td>
                                                <td className="px-3.5 py-2.5 text-center font-mono font-black text-emerald-700">{p.total_masuk} hari</td>
                                                <td className="px-3.5 py-2.5 text-center font-mono text-slate-500">{p.total_off} hari</td>
                                                <td className="px-3.5 py-2.5">
                                                    {(p.outlets_list || []).length === 0 ? '-' : p.outlets_list.map(c => (
                                                        <span key={c} className="inline-block mr-1 mb-0.5 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-800">
                                                            {c}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td className="px-3.5 py-2.5 text-right font-mono font-black text-slate-900">{formatRupiah(p.total_omzet)}</td>
                                                <td className="px-3.5 py-2.5 text-right font-mono font-bold text-amber-700">{formatRupiah(p.avg_omzet_per_shift)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PANEL 5: ANALISA KESEHATAN STOK, BARANG RUSAK & REVERSE YIELD */}
                    {activeAnalyticPanel === 'stock' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
                                <h4 className="text-xs font-black uppercase text-rose-900">Peringkat Barang Rusak / Reject per Outlet (Menu 3)</h4>
                                <div className="divide-y divide-slate-100 text-xs">
                                    {(stockHealth.reject_per_outlet || []).map(r => (
                                        <div key={r.stand_id} className="py-2 flex items-center justify-between">
                                            <div>
                                                <span className="font-bold text-slate-900">{r.kode_stand} - {r.nama_stand}</span>
                                                {r.details?.length > 0 && (
                                                    <span className="block text-[10px] text-rose-700 font-mono">
                                                        {r.details.map(d => `${d.nama_bahan} (${d.jumlah} ${d.satuan})`).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-mono font-black text-rose-700">{fmtNum(r.total_reject_items)} unit</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
                                <h4 className="text-xs font-black uppercase text-slate-900">Ringkasan Variance Bahan Baku (Teoritis BOM vs Aktual Menu 3)</h4>
                                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                                    {(stockHealth.reverse_variance || []).map(v => (
                                        <div key={v.code} className="py-2 flex items-center justify-between">
                                            <div>
                                                <span className="font-bold text-slate-900">{v.name}</span>
                                                <span className="block text-[10px] font-mono text-slate-400">
                                                    Teoritis: {fmtNum(v.quantity)} {v.base_unit} | Aktual: {fmtNum(v.aktual)} {v.base_unit}
                                                </span>
                                            </div>
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${v.badge_color === 'green' ? 'bg-emerald-50 text-emerald-800' : v.badge_color === 'yellow' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'}`}>
                                                Selisih: {v.selisih > 0 ? `+${v.selisih}` : v.selisih} ({v.deviasi_percent}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================================
                SECTION 2: TABEL MATRIKS PIVOT KALENDER INTERAKTIF (TGL 1 S/D 31)
               ======================================================================== */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs space-y-4 p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            2. Tabel Matriks Pivot Kalender Interaktif (Tgl 1 s/d Tgl 31 — Periode {month})
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Kolom kiri terkunci (Sticky Left), highlight merah otomatis untuk kolom akhir pekan (Sabtu/Minggu), & baris Total Bawah otomatis
                        </p>
                    </div>

                    {/* Dropdown Filter Lini khusus Tab 1 (Pivot Omzet) */}
                    {activePivotTab === 'omzet' && (
                        <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-black uppercase text-slate-500">Filter Lini Omzet:</span>
                            <select
                                value={liniFilter}
                                onChange={(e) => setLiniFilter(e.target.value)}
                                className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-900 focus:outline-none"
                            >
                                <option value="all">Semua Lini (Gabungan + Sub AMKopi)</option>
                                <option value="amk_murni">Khusus AMK Murni</option>
                                <option value="amkopi">Khusus AMKopi</option>
                                <option value="kurma">Khusus AMK Kurma</option>
                                <option value="ptt">Khusus PTT</option>
                                <option value="mineral">Khusus Air Mineral</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* 8 TAB SWITCHER */}
                <div className="flex flex-wrap gap-1.5">
                    {[
                        { id: 'omzet', label: 'Tab 1: Pivot Omzet (Gabungan & Lini)' },
                        { id: 'cup_12', label: 'Tab 2: Cup 12 oz (AMK)' },
                        { id: 'cup_22', label: 'Tab 3: Cup 22 oz (AMK)' },
                        { id: 'cup_16', label: 'Tab 4: Cup 16 oz (AMK)' },
                        { id: 'cup_kopi', label: 'Tab 5: Cup 12 oz AMKopi' },
                        { id: 'spg_schedule', label: 'Tab 6: Jadwal & Omzet Nama SPG' },
                        { id: 'qris_tunai', label: 'Tab 7: QRIS & Setoran Tunai' },
                        { id: 'biaya', label: 'Tab 8: Biaya Operasional' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActivePivotTab(t.id)}
                            className={`rounded-xl px-3 py-2 text-xs font-black transition cursor-pointer ${activePivotTab === t.id ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* MATRIX TABLE CONTAINER WITH STICKY LEFT COLUMNS */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    {activePivotTab !== 'spg_schedule' ? (
                        /* OUTLET PIVOT MATRIX (TABS 1, 2, 3, 4, 5, 7, 8) */
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-[10px] uppercase font-black text-slate-600 border-b border-slate-200">
                                    <th className="sticky left-0 z-20 bg-slate-100 px-2.5 py-3 border-r border-slate-200 w-9 text-center">#</th>
                                    <th className="sticky left-9 z-20 bg-slate-100 px-3 py-3 border-r border-slate-200 min-w-[150px]">Kode & Nama Outlet</th>
                                    <th className="sticky left-[186px] z-20 bg-amber-50 px-3 py-3 border-r-2 border-slate-300 min-w-[130px] text-right text-amber-950">Total Bulanan</th>
                                    {calendarDays.map(cd => (
                                        <th
                                            key={cd.day}
                                            className={`px-2.5 py-2 text-center min-w-[88px] border-r border-slate-200 ${cd.is_weekend ? 'bg-rose-100 text-rose-900' : 'bg-slate-50 text-slate-700'}`}
                                        >
                                            <span className="block text-xs font-black">Tgl {cd.day}</span>
                                            <span className={`block text-[9px] font-mono ${cd.is_weekend ? 'text-rose-700 font-bold' : 'text-slate-400'}`}>
                                                {cd.day_name}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                                {pivotOutlets.map((st, idx) => {
                                    const totObj = st.totals || {};
                                    const mainTotal = getOutletDayPrimaryValue(totObj);
                                    const cupPct = (totObj.total_cups || 0) > 0
                                        ? Math.round((mainTotal / totObj.total_cups) * 100)
                                        : 0;

                                    return (
                                        <tr key={st.stand_id} className={`hover:bg-slate-50/90 ${st.is_premium ? 'bg-cyan-50/40' : ''}`}>
                                            <td className="sticky left-0 z-10 bg-white px-2.5 py-2.5 border-r border-slate-200 text-center font-mono text-slate-400">
                                                {idx + 1}
                                            </td>
                                            <td className="sticky left-9 z-10 bg-white px-3 py-2.5 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                                                {st.kode_stand}
                                                <span className="block text-[10px] font-normal text-slate-400 truncate max-w-[135px]">{st.nama_stand}</span>
                                            </td>
                                            <td className="sticky left-[186px] z-10 bg-amber-50/95 px-3 py-2.5 border-r-2 border-slate-300 text-right font-mono">
                                                <span className="font-black text-slate-900 block">{fmtNum(mainTotal)}</span>
                                                {activePivotTab === 'omzet' && liniFilter === 'all' && totObj.omzet_amkopi > 0 && (
                                                    <span className="text-[10px] font-bold text-amber-600 block">
                                                        +Kopi {fmtNum(totObj.omzet_amkopi)}
                                                    </span>
                                                )}
                                                {['cup_12', 'cup_22', 'cup_16'].includes(activePivotTab) && (
                                                    <span className="text-[10px] font-bold text-indigo-700 block">
                                                        {cupPct}% dr {fmtNum(totObj.total_cups)} cup
                                                    </span>
                                                )}
                                                {activePivotTab === 'cup_kopi' && (
                                                    <span className="text-[10px] font-bold text-amber-700 block">
                                                        {formatRupiah(totObj.omzet_amkopi || 0)}
                                                    </span>
                                                )}
                                                {activePivotTab === 'qris_tunai' && (
                                                    <span className="text-[10px] font-bold text-emerald-700 block">
                                                        Tunai: {fmtNum(totObj.sisa_setoran_tunai)}
                                                    </span>
                                                )}
                                            </td>

                                            {calendarDays.map(cd => {
                                                const dObj = st.days?.[cd.day] || {};
                                                const val = getOutletDayPrimaryValue(dObj);
                                                const dCupPct = (dObj.total_cups || 0) > 0
                                                    ? Math.round((val / dObj.total_cups) * 100)
                                                    : 0;
                                                const biayaTooltip = (dObj.biaya_details || [])
                                                    .map(b => `${b.keterangan}: ${formatRupiah(b.nominal)}`)
                                                    .join(' | ');

                                                return (
                                                    <td
                                                        key={cd.day}
                                                        title={activePivotTab === 'biaya' && biayaTooltip ? biayaTooltip : undefined}
                                                        className={`px-2 py-2 text-right font-mono border-r border-slate-100 whitespace-nowrap ${cd.is_weekend ? 'bg-rose-50/40' : ''}`}
                                                    >
                                                        {val > 0 || (activePivotTab === 'qris_tunai' && dObj.sisa_setoran_tunai > 0) ? (
                                                            <div>
                                                                <span className="font-bold text-slate-900 block">{fmtNum(val)}</span>
                                                                {activePivotTab === 'omzet' && liniFilter === 'all' && dObj.omzet_amkopi > 0 && (
                                                                    <span className="text-[9px] font-bold text-amber-600 block">
                                                                        +Kopi {fmtNum(dObj.omzet_amkopi)}
                                                                    </span>
                                                                )}
                                                                {['cup_12', 'cup_22', 'cup_16'].includes(activePivotTab) && dObj.total_cups > 0 && (
                                                                    <span className="text-[9px] text-slate-400 block">{dCupPct}%</span>
                                                                )}
                                                                {activePivotTab === 'cup_kopi' && dObj.omzet_amkopi > 0 && (
                                                                    <span className="text-[9px] text-amber-600 block">{fmtNum(dObj.omzet_amkopi)}</span>
                                                                )}
                                                                {activePivotTab === 'qris_tunai' && (
                                                                    <span className="text-[9px] text-emerald-700 font-bold block">
                                                                        T: {fmtNum(dObj.sisa_setoran_tunai)}
                                                                    </span>
                                                                )}
                                                                {activePivotTab === 'biaya' && biayaTooltip && (
                                                                    <span className="text-[9px] text-rose-600 block truncate max-w-[80px]">
                                                                        {(dObj.biaya_details || [])[0]?.keterangan}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-amber-100/90 font-black text-slate-900 border-t-2 border-amber-300">
                                    <td className="sticky left-0 z-10 bg-amber-100 px-2.5 py-3 border-r border-amber-200 text-center">Σ</td>
                                    <td className="sticky left-9 z-10 bg-amber-100 px-3 py-3 border-r border-amber-200 uppercase">Total Bawah</td>
                                    <td className="sticky left-[186px] z-10 bg-amber-200/90 px-3 py-3 border-r-2 border-amber-400 text-right font-mono">
                                        {fmtNum(pivotOutlets.reduce((acc, st) => acc + getOutletDayPrimaryValue(st.totals), 0))}
                                    </td>
                                    {calendarDays.map(cd => {
                                        const colSum = pivotOutlets.reduce((acc, st) => acc + getOutletDayPrimaryValue(st.days?.[cd.day]), 0);
                                        return (
                                            <td key={cd.day} className="px-2 py-3 text-right font-mono border-r border-amber-200">
                                                {colSum > 0 ? fmtNum(colSum) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tfoot>
                        </table>
                    ) : (
                        /* TAB 6: PIVOT JADWAL & OMZET NAMA SPG (2 BARIS INFORMASI PER KOTAK TANGGAL) */
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-[10px] uppercase font-black text-slate-600 border-b border-slate-200">
                                    <th className="sticky left-0 z-20 bg-slate-100 px-2.5 py-3 border-r border-slate-200 w-9 text-center">#</th>
                                    <th className="sticky left-9 z-20 bg-slate-100 px-3 py-3 border-r border-slate-200 min-w-[150px]">Nama SPG</th>
                                    <th className="sticky left-[186px] z-20 bg-indigo-50 px-3 py-3 border-r-2 border-slate-300 min-w-[145px] text-right text-indigo-950">Total Bulanan</th>
                                    {calendarDays.map(cd => (
                                        <th
                                            key={cd.day}
                                            className={`px-2.5 py-2 text-center min-w-[88px] border-r border-slate-200 ${cd.is_weekend ? 'bg-rose-100 text-rose-900' : 'bg-slate-50 text-slate-700'}`}
                                        >
                                            <span className="block text-xs font-black">Tgl {cd.day}</span>
                                            <span className={`block text-[9px] font-mono ${cd.is_weekend ? 'text-rose-700 font-bold' : 'text-slate-400'}`}>
                                                {cd.day_name}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                                {pivotSpg.length === 0 ? (
                                    <tr>
                                        <td colSpan={34} className="px-4 py-8 text-center text-slate-400">
                                            Belum ada data SPG terdaftar.
                                        </td>
                                    </tr>
                                ) : (
                                    pivotSpg.map((spg, idx) => (
                                        <tr key={spg.spg_id} className="hover:bg-slate-50">
                                            <td className="sticky left-0 z-10 bg-white px-2.5 py-2.5 border-r border-slate-200 text-center font-mono text-slate-400">
                                                {idx + 1}
                                            </td>
                                            <td className="sticky left-9 z-10 bg-white px-3 py-2.5 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                                                {spg.name}
                                                <span className="block text-[10px] font-mono text-slate-400">{spg.id_spg}</span>
                                            </td>
                                            <td className="sticky left-[186px] z-10 bg-indigo-50/95 px-3 py-2.5 border-r-2 border-slate-300 text-right font-mono">
                                                <span className="font-black text-indigo-950 block">{spg.total_masuk} Hari Masuk</span>
                                                <span className="text-[10px] font-bold text-slate-800 block">Σ {fmtNum(spg.total_omzet)}</span>
                                                <span className="text-[9px] text-amber-700 font-bold block">Avg: {fmtNum(spg.avg_per_shift)}</span>
                                            </td>
                                            {calendarDays.map(cd => {
                                                const cell = spg.days?.[cd.day];
                                                return (
                                                    <td
                                                        key={cd.day}
                                                        className={`px-2 py-2 text-center border-r border-slate-100 whitespace-nowrap ${cd.is_weekend ? 'bg-rose-50/40' : ''}`}
                                                    >
                                                        {cell && cell.stand_code ? (
                                                            <div>
                                                                <span className="inline-block rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-black text-indigo-900">
                                                                    {cell.stand_code}
                                                                </span>
                                                                <span className="block font-mono text-[10px] font-bold text-slate-800 mt-0.5">
                                                                    {fmtNum(cell.omzet)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-indigo-100/90 font-black text-indigo-950 border-t-2 border-indigo-300">
                                    <td className="sticky left-0 z-10 bg-indigo-100 px-2.5 py-3 border-r border-indigo-200 text-center">Σ</td>
                                    <td className="sticky left-9 z-10 bg-indigo-100 px-3 py-3 border-r border-indigo-200 uppercase">SPG Masuk / Hari</td>
                                    <td className="sticky left-[186px] z-10 bg-indigo-200/90 px-3 py-3 border-r-2 border-indigo-400 text-right font-mono">
                                        {pivotSpg.reduce((acc, s) => acc + (s.total_masuk || 0), 0)} Total Shift
                                    </td>
                                    {calendarDays.map(cd => {
                                        const activeCount = pivotSpg.filter(s => !!s.days?.[cd.day]?.stand_code).length;
                                        return (
                                            <td key={cd.day} className="px-2 py-3 text-center font-mono border-r border-indigo-200">
                                                {activeCount > 0 ? `${activeCount} SPG` : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>

            {/* MODAL PREVIEW FOTO SETTLEMENT QRIS */}
            {previewProof && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div>
                                <h4 className="text-sm font-black text-slate-900">
                                    Settlement QRIS — {previewProof.kode_stand} ({previewProof.tanggal})
                                </h4>
                                <span className="text-xs font-mono font-bold text-blue-700">
                                    Nominal QRIS: {formatRupiah(previewProof.nominal_qris)}
                                </span>
                            </div>
                            <button onClick={() => setPreviewProof(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-[70vh] flex items-center justify-center">
                            <img
                                src={previewProof.qris_proof_base64}
                                alt="Bukti QRIS"
                                className="max-h-[68vh] w-auto object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
