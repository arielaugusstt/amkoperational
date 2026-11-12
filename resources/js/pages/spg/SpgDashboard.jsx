import React, { useState, useEffect } from 'react';
import { Store, Calendar, FileText, ShoppingBag, Boxes, CheckCircle2, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { formatDateIndo, formatRupiah } from '../../utils/formatters';

export default function SpgDashboard({
    stands = [],
    selectedStand,
    setSelectedStand,
    tanggal,
    setTanggal,
    onNavigate,
}) {
    const [statusData, setStatusData] = useState({
        menu1: { status: 'Belum Input', total_penjualan: 0 },
        menu2: { status: 'Belum Input', grand_total: 0 },
        menu3: { status: 'Belum Input' },
    });
    const [loadingStatus, setLoadingStatus] = useState(false);

    const fetchStatus = async () => {
        if (!selectedStand?.id) return;
        setLoadingStatus(true);
        try {
            const res = await fetch(`/api/status-today?stand_id=${selectedStand.id}&tanggal=${tanggal}`);
            const data = await res.json();
            if (data && data.menu1) {
                setStatusData(data);
            }
        } catch (e) {
            console.error('Failed to fetch status', e);
        } finally {
            setLoadingStatus(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [selectedStand?.id, tanggal]);

    return (
        <div className="mx-auto max-w-lg px-4 py-4 sm:py-6">
            {/* Stand & Date Selector Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm mb-5">
                <div className="space-y-3.5">
                    <div>
                        <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            <Store className="h-4 w-4 mr-1.5 text-amber-600" />
                            Pilih Stand Outlet
                        </label>
                        <select
                            value={selectedStand?.id || ''}
                            onChange={(e) => {
                                const st = stands.find(s => s.id === parseInt(e.target.value, 10));
                                setSelectedStand(st || stands[0]);
                            }}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 shadow-inner focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                            {stands.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.kode_stand} - {s.nama_stand} ({s.wilayah_laporan})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            <Calendar className="h-4 w-4 mr-1.5 text-amber-600" />
                            Tanggal Operasional
                        </label>
                        <input
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 shadow-inner focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                            {formatDateIndo(tanggal)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu Header Title */}
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Modul Input Penjualan & Bahan
                </h3>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                    Urutan: 1 → 2 → 3
                </span>
            </div>

            {/* 3 Main Action Cards */}
            <div className="space-y-3.5">
                {/* Modul 1: Laporan Harian */}
                <div
                    onClick={() => onNavigate('menu1')}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-amber-500 hover:shadow-md active:scale-[0.98]"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3.5">
                            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                                <FileText className="h-7 w-7" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-black text-amber-600 uppercase tracking-wider">Modul 1</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Wajib Awal</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 leading-tight">Laporan Harian</h4>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    Rekap omset harian, QRIS, tunai & cup
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-amber-600 transition" />
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <div className="flex items-center space-x-1.5 font-bold">
                            {statusData.menu1?.status === 'Sudah Input' ? (
                                <span className="flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                    Sudah Input ({formatRupiah(statusData.menu1.total_penjualan)})
                                </span>
                            ) : (
                                <span className="flex items-center text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs">
                                    <Clock className="h-3.5 w-3.5 mr-1 text-amber-600" />
                                    Belum Input
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] font-bold text-amber-600 group-hover:underline">
                            Buka Form →
                        </span>
                    </div>
                </div>

                {/* Modul 2: Form Penjualan */}
                <div
                    onClick={() => onNavigate('menu2')}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md active:scale-[0.98]"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3.5">
                            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                                <ShoppingBag className="h-7 w-7" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-black text-blue-600 uppercase tracking-wider">Modul 2</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Detail Menu</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 leading-tight">Form Penjualan</h4>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    Rincian penjualan 27 varian item & unregistered
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-blue-600 transition" />
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <div className="flex items-center space-x-1.5 font-bold">
                            {statusData.menu2?.status === 'Sudah Input' ? (
                                <span className="flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                    Sudah Input ({formatRupiah(statusData.menu2.grand_total)})
                                </span>
                            ) : (
                                <span className="flex items-center text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs">
                                    <Clock className="h-3.5 w-3.5 mr-1 text-amber-600" />
                                    Belum Input
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
                            Buka Form →
                        </span>
                    </div>
                </div>

                {/* Modul 3: Form Bahan Baku */}
                <div
                    onClick={() => onNavigate('menu3')}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-teal-500 hover:shadow-md active:scale-[0.98]"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3.5">
                            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/30">
                                <Boxes className="h-7 w-7" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-black text-teal-600 uppercase tracking-wider">Modul 3</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Inventori</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 leading-tight">Form Bahan Baku</h4>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    Pergerakan stok harian & Stock Opname
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-teal-600 transition" />
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <div className="flex items-center space-x-1.5 font-bold">
                            {statusData.menu3?.status === 'Sudah Input' ? (
                                <span className="flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                    Sudah Input
                                </span>
                            ) : (
                                <span className="flex items-center text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs">
                                    <Clock className="h-3.5 w-3.5 mr-1 text-amber-600" />
                                    Belum Input
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] font-bold text-teal-600 group-hover:underline">
                            Buka Form →
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

