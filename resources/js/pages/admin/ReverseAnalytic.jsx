import React, { useState, useEffect } from 'react';
import {
    FlaskConical, Calendar, Store, RefreshCw, AlertTriangle,
    CheckCircle2, Clock, Settings, ArrowRight, Layers, Download
} from 'lucide-react';
import { formatDateIndo } from '../../utils/formatters';
import { exportAuditReport } from '../../utils/excelEngine';

export default function ReverseAnalytic({ stands = [], tanggal }) {
    const [selectedStandId, setSelectedStandId] = useState('all');
    const [startDate, setStartDate] = useState(tanggal);
    const [endDate, setEndDate] = useState(tanggal);
    const [analyticData, setAnalyticData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Recipe Parameter Change Modal / Form
    const [showParamModal, setShowParamModal] = useState(false);
    const [paramKey, setParamKey] = useState('VOL_REG');
    const [newVolReg, setNewVolReg] = useState('185');
    const [effectiveDate, setEffectiveDate] = useState(tanggal);
    const [savingParam, setSavingParam] = useState(false);
    const [paramMsg, setParamMsg] = useState('');

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

    const handleSaveParam = async (e) => {
        e.preventDefault();
        setSavingParam(true);
        setParamMsg('');

        const paramName = paramKey === 'VOL_CUP_JUMBO' ? 'Volume Saji Jumbo per Cup' : 'Volume Saji Reguler per Cup';

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/admin/update-recipe-param', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    param_key: paramKey,
                    nama_parameter: paramName,
                    nilai_param: parseFloat(newVolReg) || (paramKey === 'VOL_CUP_JUMBO' ? 350.0 : 185.0),
                    satuan: 'ml',
                    effective_date: effectiveDate,
                    keterangan: `Revisi parameter ${paramKey} menjadi ${newVolReg} ml mulai ${effectiveDate}`,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setParamMsg('Parameter berhasil disimpan dengan tanggal efektif!');
                setTimeout(() => {
                    setShowParamModal(false);
                    fetchAnalytic();
                }, 1200);
            }
        } catch (err) {
            setParamMsg('Gagal menyimpan parameter.');
        } finally {
            setSavingParam(false);
        }
    };

    const handleExportAudit = () => {
        if (!table2 || table2.length === 0) {
            alert('Tidak ada data audit untuk diexport');
            return;
        }
        const standObj = stands.find(s => String(s.id) === String(selectedStandId));
        const standNama = standObj ? standObj.nama_stand : (selectedStandId === 'all' ? 'Semua Stand' : 'Stand');
        exportAuditReport(table2, `${startDate}_sd_${endDate}`, standNama);
    };

    const table1 = analyticData?.table1_batch_needs || [];
    const table2 = analyticData?.table2_audit_comparison || [];
    const volRegUsed = analyticData?.vol_reg_used || 185.0;

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                            Reverse Analytic Check <span className="text-amber-600 font-mono">(`RESEPAMK`)</span>
                        </h2>
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black text-amber-800">
                            VOL_REG: {volRegUsed} ml
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500">
                        Audit Otomatis Konversi Penjualan Menu 2 vs Barang Terpakai Aktual Menu 3
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={selectedStandId}
                        onChange={(e) => setSelectedStandId(e.target.value)}
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-xs focus:border-amber-500 focus:outline-none"
                    >
                        <option value="all">Semua Stand (Konsolidasi)</option>
                        {stands.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.kode_stand} - {s.nama_stand}
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
                        title="Download Sheet Audit Excel"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export Excel</span>
                    </button>

                    <button
                        onClick={() => setShowParamModal(true)}
                        className="flex items-center space-x-1.5 rounded-2xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        <span>Ubah Resep (Effective Date)</span>
                    </button>
                </div>
            </div>

            {/* TABEL 1: Kebutuhan Batch Dapur (Lapis 1 & 2) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                            <Layers className="h-4 w-4 text-amber-600" />
                            <span>Tabel 1: Kebutuhan Adonan Setengah Jadi & Sub-Batch (Lapis 1 & 2)</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                            Total volume adonan yang dibutuhkan menurut rincian penjualan Menu 2
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {table1.map((batch, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-center">
                            <span className="text-[11px] font-bold text-slate-600 block truncate mb-1">
                                {batch.nama}
                            </span>
                            <span className="text-base font-black text-slate-900 font-mono block">
                                {batch.volume_ml.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">ml cairan</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* TABEL 2: Komparasi Bahan Baku Mentah Menu 2 vs Menu 3 */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Tabel 2: Komparasi Bahan Baku Mentah (Teoritis Menu 2 vs Aktual Menu 3)
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Hijau: Wajar (&le;5%) | Kuning: Warning (5-10%) | Merah: Anomali (&gt;10%)
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3.5">Kode & Nama Bahan</th>
                                <th className="px-4 py-3.5">Satuan</th>
                                <th className="px-4 py-3.5 text-right">Pemakaian Teoritis (Menu 2)</th>
                                <th className="px-4 py-3.5 text-right">Pemakaian Aktual (Menu 3)</th>
                                <th className="px-4 py-3.5 text-right">Selisih (Aktual - Teoritis)</th>
                                <th className="px-4 py-3.5 text-right">% Deviasi</th>
                                <th className="px-4 py-3.5 text-center">Status Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {table2.map((row) => (
                                <tr key={row.kode_bahan} className="hover:bg-slate-50/80 transition">
                                    <td className="px-4 py-3 font-bold text-slate-900">
                                        {row.nama_bahan_baku}
                                        <span className="block text-[10px] text-slate-400 font-mono">
                                            {row.kode_bahan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                            {row.satuan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                        {row.teoritis.toLocaleString('id-ID')}
                                        {row.teoritis_desc && (
                                            <span className="block text-[10px] text-amber-700 font-sans font-semibold">
                                                {row.teoritis_desc}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                        {row.aktual.toLocaleString('id-ID')}
                                        {row.aktual_desc && (
                                            <span className="block text-[10px] text-emerald-700 font-sans font-semibold">
                                                {row.aktual_desc}
                                            </span>
                                        )}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-mono font-bold ${row.selisih === 0 ? 'text-slate-500' : row.selisih > 0 ? 'text-amber-700' : 'text-blue-700'}`}>
                                        {row.selisih > 0 ? `+${row.selisih.toLocaleString('id-ID')}` : row.selisih.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                        {row.deviasi_percent}%
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

            {/* Modal Update Parameter Resep (Effective Date Versioning) */}
            {showParamModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-900">
                                Ubah Parameter Takaran Resep
                            </h3>
                            <button
                                onClick={() => setShowParamModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                Tutup
                            </button>
                        </div>

                        {paramMsg && (
                            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800">
                                {paramMsg}
                            </div>
                        )}

                        <form onSubmit={handleSaveParam} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                                    Pilih Parameter Resep
                                </label>
                                <select
                                    value={paramKey}
                                    onChange={(e) => {
                                        setParamKey(e.target.value);
                                        setNewVolReg(e.target.value === 'VOL_CUP_JUMBO' ? '350' : '185');
                                    }}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-900 mb-3"
                                >
                                    <option value="VOL_REG">Volume Saji Standar / Reguler (VOL_REG / VOL_CUP_STD)</option>
                                    <option value="VOL_CUP_JUMBO">Volume Saji Jumbo (VOL_CUP_JUMBO)</option>
                                </select>

                                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                                    Nilai Volume Cup ({paramKey})
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={newVolReg}
                                        onChange={(e) => setNewVolReg(e.target.value)}
                                        placeholder={paramKey === 'VOL_CUP_JUMBO' ? '350' : '185'}
                                        className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900"
                                    />
                                    <span className="text-xs font-bold text-slate-500">ml</span>
                                </div>
                                <div className="flex items-center space-x-2 mt-1.5">
                                    <span className="text-[10px] text-slate-400 font-semibold">Opsi cepat:</span>
                                    {paramKey === 'VOL_CUP_JUMBO' ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setNewVolReg('350')}
                                                className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                                            >
                                                350 ml (Default Jumbo)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewVolReg('400')}
                                                className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                                            >
                                                400 ml
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setNewVolReg('185')}
                                                className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                                            >
                                                185 ml (Default)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewVolReg('190')}
                                                className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                                            >
                                                190 ml
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewVolReg('170')}
                                                className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                                            >
                                                170 ml
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                                    Tanggal Mulai Berlaku (Effective Date)
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900"
                                />
                                <p className="mt-1 text-[11px] text-slate-500">
                                    *Laporan sebelum tanggal ini tetap dihitung dengan rumus lama. Laporan mulai tanggal ini dan seterusnya otomatis memakai rumus baru.
                                </p>
                            </div>

                            <div className="pt-2 flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowParamModal(false)}
                                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingParam}
                                    className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {savingParam ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

