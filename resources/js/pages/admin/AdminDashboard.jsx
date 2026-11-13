import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Calendar, Store, CheckCircle2, Clock,
    DollarSign, CreditCard, Banknote, ArrowDownCircle,
    TrendingUp, Download, RefreshCw, ChevronRight, FileSpreadsheet,
    Trash2, AlertTriangle, X, Check, ShieldAlert
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { exportComprehensiveReport } from '../../utils/excelEngine';

export default function AdminDashboard({ tanggal, setTanggal, onNavigate }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteScope, setDeleteScope] = useState('date'); // 'date' | 'all'
    const [clearStorage, setClearStorage] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/dashboard-stats?tanggal=${tanggal}`);
            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [tanggal]);

    const handleExportExcel = () => {
        if (!stats) return;
        exportComprehensiveReport(stats.summary, stats.stands_progress, tanggal);
    };

    const clearLocalDrafts = () => {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('amk_') || k.includes('menu'))) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (err) {
            console.warn('Gagal membersihkan localStorage:', err);
        }
    };

    const handleExecuteDelete = async () => {
        setDeleting(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/admin/delete-operational-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    scope: deleteScope,
                    tanggal: tanggal,
                }),
            });

            const data = await res.json();
            if (data.success) {
                if (clearStorage) {
                    clearLocalDrafts();
                }
                setShowDeleteModal(false);
                setFeedback({
                    type: 'success',
                    message: data.message || 'Data operasional berhasil dihapus.',
                });
                await fetchStats();
            } else {
                setFeedback({
                    type: 'error',
                    message: data.message || 'Gagal menghapus data.',
                });
            }
        } catch (err) {
            setFeedback({
                type: 'error',
                message: 'Terjadi kesalahan jaringan saat menghapus data.',
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteSingleStand = async (standId, standName) => {
        const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus seluruh data input hari ini (${formatDateIndo(tanggal)}) untuk stand ${standName}?`);
        if (!confirmed) return;

        setLoading(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/admin/delete-operational-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    scope: 'stand',
                    stand_id: standId,
                    tanggal: tanggal,
                }),
            });

            const data = await res.json();
            if (data.success) {
                clearLocalDrafts();
                setFeedback({
                    type: 'success',
                    message: data.message || `Data stand ${standName} berhasil dihapus.`,
                });
                await fetchStats();
            } else {
                setFeedback({
                    type: 'error',
                    message: data.message || 'Gagal menghapus data stand.',
                });
            }
        } catch (err) {
            setFeedback({
                type: 'error',
                message: 'Terjadi kesalahan saat menghapus data stand.',
            });
        } finally {
            setLoading(false);
        }
    };

    const summary = stats?.summary || {};
    const standsProgress = stats?.stands_progress || [];

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
            {/* Top Header & Date Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                        Executive Dashboard Operasional
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500">
                        Monitoring Real-time Omset, Setoran Kas & Status Input SPG
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <input
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            className="rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-xs focus:border-amber-500 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={fetchStats}
                        title="Refresh"
                        className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:text-amber-600 active:scale-95 shadow-xs"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center space-x-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 cursor-pointer"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span className="hidden sm:inline">Export Excel</span>
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        title="Hapus Data Operasional (Mode Development)"
                        className="flex items-center space-x-1.5 rounded-2xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-bold text-rose-700 shadow-xs hover:bg-rose-100 hover:border-rose-300 active:scale-95 transition cursor-pointer"
                    >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                        <span className="hidden sm:inline">Hapus Data (Dev)</span>
                    </button>
                </div>
            </div>

            {/* Notification Feedback Banner */}
            {feedback && (
                <div className={`flex items-center justify-between rounded-2xl p-4 text-xs font-bold ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    <div className="flex items-center space-x-2">
                        {feedback.type === 'success' ? <Check className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* 5 Main Summary Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Total Penjualan */}
                <div className="col-span-2 sm:col-span-1 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-md shadow-amber-500/20">
                    <div className="flex items-center justify-between opacity-80">
                        <span className="text-[11px] font-black uppercase tracking-wider">Total Penjualan</span>
                        <DollarSign className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-2xl font-black font-mono tracking-tight">
                        {formatRupiah(summary.total_penjualan || 0)}
                    </p>
                    <span className="mt-1 text-[11px] font-medium opacity-90 block">
                        {summary.stands_completed_m1 || 0} dari {summary.total_stands || 0} Stand Input
                    </span>
                </div>

                {/* QRIS */}
                <div className="rounded-3xl border border-blue-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-blue-600">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Nominal QRIS</span>
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
                        {formatRupiah(summary.total_qris || 0)}
                    </p>
                    <span className="text-[10px] font-bold text-blue-600 mt-1 block">
                        Non-Tunai
                    </span>
                </div>

                {/* Tunai */}
                <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-emerald-600">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Nominal Tunai</span>
                        <Banknote className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
                        {formatRupiah(summary.total_tunai || 0)}
                    </p>
                    <span className="text-[10px] font-bold text-emerald-600 mt-1 block">
                        Uang Cash Fisik
                    </span>
                </div>

                {/* Biaya */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-rose-600">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Biaya Stand</span>
                        <ArrowDownCircle className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
                        {formatRupiah(summary.total_biaya || 0)}
                    </p>
                    <span className="text-[10px] font-bold text-rose-600 mt-1 block">
                        Operasional Harian
                    </span>
                </div>

                {/* Sisa Setoran Tunai */}
                <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-indigo-700">
                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800">Sisa Setoran Tunai</span>
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-lg sm:text-xl font-black text-indigo-950 font-mono tracking-tight">
                        {formatRupiah(summary.total_sisa_setoran || 0)}
                    </p>
                    <span className="text-[10px] font-bold text-indigo-700 mt-1 block">
                        Tunai Bersih Disetor
                    </span>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                    onClick={() => onNavigate('admin_wa')}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 hover:border-amber-500 hover:shadow-md transition flex items-center justify-between"
                >
                    <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase">Generator Laporan WA</h4>
                        <p className="text-[11px] text-slate-500">Salin teks laporan siap kirim ke WhatsApp</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>

                <div
                    onClick={() => onNavigate('admin_reverse')}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-500 hover:shadow-md transition flex items-center justify-between"
                >
                    <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase">Reverse Analytic (RESEPAMK)</h4>
                        <p className="text-[11px] text-slate-500">Audit bahan teoritis vs terpakai aktual</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>

                <div
                    onClick={() => onNavigate('admin_opname')}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 hover:border-purple-500 hover:shadow-md transition flex items-center justify-between"
                >
                    <div className="flex items-center space-x-2">
                        <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase">Approval Stock Opname</h4>
                            <p className="text-[11px] text-slate-500">Persetujuan penyesuaian stok fisik stand</p>
                        </div>
                        {summary.pending_opname_count > 0 && (
                            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">
                                {summary.pending_opname_count}
                            </span>
                        )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
            </div>

            {/* Stand Progress Matrix Table */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                            Status Input Seluruh Stand Hari Ini ({formatDateIndo(tanggal)})
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Pantau kelengkapan pengisian Menu 1, Menu 2, dan Menu 3
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3.5">Stand Outlet</th>
                                <th className="px-4 py-3.5">Wilayah</th>
                                <th className="px-4 py-3.5">Blok WA</th>
                                <th className="px-4 py-3.5 text-center">Menu 1 (Harian)</th>
                                <th className="px-4 py-3.5 text-right">Total Menu 1</th>
                                <th className="px-4 py-3.5 text-center">Menu 2 (Detail)</th>
                                <th className="px-4 py-3.5 text-right">Grand Total Menu 2</th>
                                <th className="px-4 py-3.5 text-center">Menu 3 (Bahan)</th>
                                <th className="px-4 py-3.5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {standsProgress.map(s => {
                                const hasData = s.m1_status === 'Sudah Input' || s.m2_status === 'Sudah Input' || s.m3_status === 'Sudah Input';
                                return (
                                <tr key={s.stand_id} className="hover:bg-slate-50/80 transition">
                                    <td className="px-4 py-3 font-bold text-slate-900">
                                        {s.kode_stand} - {s.nama_stand}
                                    </td>
                                    <td className="px-4 py-3">{s.wilayah}</td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                            {s.blok_wa}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {s.m1_status === 'Sudah Input' ? (
                                            <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                                                <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                                                Sudah
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Belum
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                        {formatRupiah(s.m1_total)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {s.m2_status === 'Sudah Input' ? (
                                            <span className="inline-flex items-center text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-[11px]">
                                                <CheckCircle2 className="h-3 w-3 mr-1 text-blue-600" />
                                                Sudah
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Belum
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                        {formatRupiah(s.m2_total)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {s.m3_status === 'Sudah Input' ? (
                                            <span className="inline-flex items-center text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full text-[11px]">
                                                <CheckCircle2 className="h-3 w-3 mr-1 text-teal-600" />
                                                Sudah
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Belum
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {hasData ? (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSingleStand(s.stand_id, s.nama_stand)}
                                                title={`Hapus input ${s.nama_stand} (${formatDateIndo(tanggal)})`}
                                                className="inline-flex items-center justify-center p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Dialog Hapus Data Operasional (Development Mode) */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center space-x-2.5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                                    <Trash2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase">
                                        Hapus Data Terlampir (Dev Mode)
                                    </h3>
                                    <p className="text-[11px] font-medium text-slate-500">
                                        Khusus pengujian & reset data laporan operasional
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs font-medium text-amber-900 flex items-start space-x-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <span>
                                    Tindakan ini akan menghapus data transaksi operasional. Master Stand, SPG, Daftar Menu, dan Resep tetap aman.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                    Pilih Cakupan Penghapusan:
                                </label>
                                <div className="space-y-2">
                                    <label className={`flex items-start p-3.5 rounded-2xl border cursor-pointer transition ${deleteScope === 'date' ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input
                                            type="radio"
                                            name="scope"
                                            value="date"
                                            checked={deleteScope === 'date'}
                                            onChange={() => setDeleteScope('date')}
                                            className="mt-0.5 text-rose-600 focus:ring-rose-500"
                                        />
                                        <div className="ml-3 text-xs">
                                            <p className="font-bold text-slate-900">
                                                Hanya Tanggal Ini ({formatDateIndo(tanggal)})
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                Menghapus laporan Menu 1, Menu 2, Menu 3, dan Opname pada tanggal {tanggal}.
                                            </p>
                                        </div>
                                    </label>

                                    <label className={`flex items-start p-3.5 rounded-2xl border cursor-pointer transition ${deleteScope === 'all' ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input
                                            type="radio"
                                            name="scope"
                                            value="all"
                                            checked={deleteScope === 'all'}
                                            onChange={() => setDeleteScope('all')}
                                            className="mt-0.5 text-rose-600 focus:ring-rose-500"
                                        />
                                        <div className="ml-3 text-xs">
                                            <p className="font-bold text-rose-900">
                                                Seluruh Data Transaksi (Semua Tanggal)
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                Mengosongkan semua riwayat penjualan & laporan stand sehingga kembali bersih ke titik nol.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <label className="flex items-center space-x-2.5 pt-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={clearStorage}
                                    onChange={(e) => setClearStorage(e.target.checked)}
                                    className="rounded text-rose-600 focus:ring-rose-500"
                                />
                                <span>Bersihkan juga draft auto-save di localStorage browser</span>
                            </label>
                        </div>

                        <div className="mt-6 flex items-center justify-end space-x-2 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleExecuteDelete}
                                className="flex items-center space-x-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white hover:bg-rose-700 active:scale-95 disabled:opacity-50 transition shadow-sm cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>{deleting ? 'Menghapus...' : 'Ya, Hapus Data Sekarang'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

