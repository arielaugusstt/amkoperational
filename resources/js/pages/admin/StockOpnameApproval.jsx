import React, { useState, useEffect } from 'react';
import { CheckSquare, Check, X, Clock, Store, Calendar, User, RefreshCw } from 'lucide-react';
import { formatDateIndo } from '../../utils/formatters';

export default function StockOpnameApproval() {
    const [opnameList, setOpnameList] = useState([]);
    const [filterStatus, setFilterStatus] = useState('Pending');
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState('');

    const fetchOpname = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/stock-opname?status=${filterStatus}`);
            const data = await res.json();
            setOpnameList(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpname();
    }, [filterStatus]);

    const handleApprove = async (id) => {
        setProcessingId(id);
        setMessage('');
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/api/admin/stock-opname/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ catatan_superadmin: 'Disetujui oleh Superadmin' }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Stock Opname berhasil disetujui! Stok stand telah diperbarui.');
                fetchOpname();
            }
        } catch (err) {
            setMessage('Gagal menyetujui opname.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        setProcessingId(id);
        setMessage('');
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/api/admin/stock-opname/${id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ catatan_superadmin: 'Ditolak oleh Superadmin' }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Stock Opname ditolak.');
                fetchOpname();
            }
        } catch (err) {
            setMessage('Gagal menolak opname.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                        Approval Stock Opname Fisik Stand
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500">
                        Validasi Penyesuaian Stok Fisik Hasil Perhitungan Ulang di Lapangan
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs focus:border-amber-500 focus:outline-none"
                    >
                        <option value="Pending">Menunggu Approval (Pending)</option>
                        <option value="Approved">Sudah Disetujui (Approved)</option>
                        <option value="Rejected">Ditolak (Rejected)</option>
                        <option value="all">Semua Status</option>
                    </select>

                    <button
                        onClick={fetchOpname}
                        className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:text-amber-600 active:scale-95 shadow-xs"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {message && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800">
                    {message}
                </div>
            )}

            <div className="space-y-4">
                {opnameList.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                        <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-bold">Tidak ada pengajuan Stock Opname pada filter ini.</p>
                    </div>
                ) : (
                    opnameList.map(opname => (
                        <div
                            key={opname.id}
                            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-base font-black text-slate-900">
                                            {opname.stand?.kode_stand} - {opname.stand?.nama_stand}
                                        </h3>
                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${opname.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : opname.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                                            {opname.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Diajukan pada: {formatDateIndo(opname.tanggal)} oleh {opname.requester?.name || 'SPG'}
                                    </p>
                                </div>

                                {opname.status === 'Pending' && (
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleReject(opname.id)}
                                            disabled={processingId === opname.id}
                                            className="flex items-center space-x-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                                        >
                                            <X className="h-4 w-4" />
                                            <span>Tolak</span>
                                        </button>
                                        <button
                                            onClick={() => handleApprove(opname.id)}
                                            disabled={processingId === opname.id}
                                            className="flex items-center space-x-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 active:scale-95 shadow-sm disabled:opacity-50"
                                        >
                                            <Check className="h-4 w-4" />
                                            <span>{processingId === opname.id ? 'Memproses...' : 'Setujui & Terapkan'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {opname.catatan_spg && (
                                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                                    <strong>Catatan SPG:</strong> {opname.catatan_spg}
                                </p>
                            )}

                            {/* Items Detail Table */}
                            <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                                        <tr>
                                            <th className="px-3.5 py-2.5">Bahan Baku</th>
                                            <th className="px-3.5 py-2.5 text-center">Satuan</th>
                                            <th className="px-3.5 py-2.5 text-right">Stok Sistem</th>
                                            <th className="px-3.5 py-2.5 text-right font-black text-slate-800">Stok Fisik Riil</th>
                                            <th className="px-3.5 py-2.5 text-right">Selisih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(opname.opname_items || []).map((it, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-3.5 py-2 font-bold text-slate-800">
                                                    {it.nama_bahan_baku}
                                                </td>
                                                <td className="px-3.5 py-2 text-center text-slate-500">
                                                    {it.satuan}
                                                </td>
                                                <td className="px-3.5 py-2 text-right font-mono text-slate-600">
                                                    {it.stok_sistem}
                                                </td>
                                                <td className="px-3.5 py-2 text-right font-mono font-black text-purple-900 bg-purple-50/30">
                                                    {it.stok_fisik}
                                                </td>
                                                <td className={`px-3.5 py-2 text-right font-mono font-bold ${it.selisih === 0 ? 'text-slate-400' : it.selisih > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {it.selisih > 0 ? `+${it.selisih}` : it.selisih}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

