import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Save, Trash2, AlertTriangle, AlertCircle,
    CheckCircle2, Store, Calendar, ClipboardCheck, Send
} from 'lucide-react';
import NotificationBanner from '../../components/NotificationBanner';
import { useLocalStoragePersistence } from '../../hooks/useLocalStoragePersistence';
import { formatDateIndo } from '../../utils/formatters';

export default function Menu3FormBahanBaku({
    stands = [],
    selectedStand,
    setSelectedStand,
    tanggal,
    setTanggal,
    onBack,
    onNavigateMenu1,
}) {
    const initialFormState = {
        items: [], // [{ ingredient_id, kode_bahan, nama_bahan_baku, satuan, link_kode_qty_menu1, ref_menu1_qty, stok_awal, barang_masuk, barang_terpakai, barang_rusak, stok_akhir }]
    };

    const {
        formData,
        setFormData,
        restoredBanner,
        dismissBanner,
        clearDraft,
    } = useLocalStoragePersistence('MENU3', selectedStand?.id, tanggal, initialFormState);

    const [menu1Available, setMenu1Available] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    // Stock Opname Mode
    const [isOpnameMode, setIsOpnameMode] = useState(false);
    const [opnamePhysicalStocks, setOpnamePhysicalStocks] = useState({});
    const [opnameCatatan, setOpnameCatatan] = useState('');
    const [opnameSuccess, setOpnameSuccess] = useState(false);

    // Fetch Menu 3 prepared data & gatekeeper check
    useEffect(() => {
        if (!selectedStand?.id || !tanggal) return;

        setLoadingData(true);
        fetch(`/api/menu3/get?stand_id=${selectedStand.id}&tanggal=${tanggal}`)
            .then(res => res.json())
            .then(data => {
                setMenu1Available(!!data.menu1_available);

                // If no draft in localStorage, load prepared items from server
                if ((!formData.items || formData.items.length === 0) && data.prepared_items) {
                    if (data.existing && data.existing.inventory_items) {
                        setFormData({ items: data.existing.inventory_items });
                    } else {
                        setFormData({ items: data.prepared_items });
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoadingData(false));
    }, [selectedStand?.id, tanggal]);

    // Handle field updates for an item
    const updateItemField = (index, field, value) => {
        const num = parseFloat(value) || 0;
        const list = [...(formData.items || [])];
        list[index][field] = num >= 0 ? num : 0;

        // Auto-calculate Stok Akhir: Stok Awal + Masuk - Terpakai - Rusak
        const awal = parseFloat(list[index].stok_awal) || 0;
        const masuk = parseFloat(list[index].barang_masuk) || 0;
        const terpakai = parseFloat(list[index].barang_terpakai) || 0;
        const rusak = parseFloat(list[index].barang_rusak) || 0;

        list[index].stok_akhir = awal + masuk - terpakai - rusak;
        setFormData(prev => ({ ...prev, items: list }));
    };

    // Submit Daily Inventory
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!menu1Available) {
            setSubmitError('Data Laporan Harian (Menu 1) belum tersedia. Harap input Menu 1 terlebih dahulu.');
            return;
        }

        setIsSubmitting(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/menu3/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    stand_id: selectedStand.id,
                    tanggal: tanggal,
                    inventory_items: formData.items || [],
                }),
            });

            const data = await res.json();
            if (data.success) {
                clearDraft();
                setSubmitSuccess(true);
                setTimeout(() => {
                    setSubmitSuccess(false);
                    onBack();
                }, 1200);
            } else {
                setSubmitError(data.message || 'Gagal menyimpan Form Bahan Baku.');
            }
        } catch (err) {
            setSubmitError('Terjadi kesalahan koneksi server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit Stock Opname
    const handleStockOpnameSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setIsSubmitting(true);

        const opnameItems = (formData.items || []).map(it => {
            const stokSistem = parseFloat(it.stok_akhir) || 0;
            const stokFisik = parseFloat(opnamePhysicalStocks[it.ingredient_id] !== undefined ? opnamePhysicalStocks[it.ingredient_id] : stokSistem);
            return {
                ingredient_id: it.ingredient_id,
                kode_bahan: it.kode_bahan,
                nama_bahan_baku: it.nama_bahan_baku,
                satuan: it.satuan,
                stok_sistem: stokSistem,
                stok_fisik: stokFisik,
                selisih: stokFisik - stokSistem,
            };
        });

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/stock-opname/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    stand_id: selectedStand.id,
                    tanggal: tanggal,
                    opname_items: opnameItems,
                    catatan_spg: opnameCatatan,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setOpnameSuccess(true);
                setTimeout(() => {
                    setOpnameSuccess(false);
                    setIsOpnameMode(false);
                }, 1800);
            } else {
                setSubmitError(data.message || 'Gagal mengajukan stock opname.');
            }
        } catch (err) {
            setSubmitError('Gagal mengirim data stock opname.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg px-4 py-4 sm:py-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl active:scale-95 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>KEMBALI</span>
                </button>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => setIsOpnameMode(!isOpnameMode)}
                        className={`rounded-xl px-2.5 py-1.5 text-[11px] font-black tracking-wide border transition flex items-center space-x-1 ${isOpnameMode ? 'bg-purple-600 text-white border-purple-700' : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'}`}
                    >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        <span>{isOpnameMode ? 'Batal Opname' : 'Mode Stock Opname'}</span>
                    </button>
                    <span className="rounded-full bg-teal-100 border border-teal-300 px-2.5 py-1 text-[11px] font-black text-teal-800 uppercase tracking-wider">
                        Menu 3: Bahan Baku
                    </span>
                </div>
            </div>

            {/* Restored Banner */}
            {restoredBanner && (
                <NotificationBanner
                    type="restore"
                    message="Draft input terakhir berhasil dipulihkan dari penyimpanan perangkat."
                    onDismiss={dismissBanner}
                />
            )}

            {submitSuccess && (
                <NotificationBanner
                    type="success"
                    message="Form Bahan Baku (Menu 3) berhasil disimpan ke server!"
                />
            )}

            {opnameSuccess && (
                <NotificationBanner
                    type="success"
                    message="Pengajuan Stock Opname berhasil dikirim (Status: Pending Approval Superadmin)."
                />
            )}

            {submitError && (
                <NotificationBanner
                    type="error"
                    message={submitError}
                    onDismiss={() => setSubmitError('')}
                />
            )}

            {/* Stand & Tanggal Display */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm mb-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Stand Outlet</span>
                        <span className="text-sm font-black text-slate-900 truncate block">
                            {selectedStand?.kode_stand} - {selectedStand?.nama_stand}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Tanggal</span>
                        <span className="text-sm font-black text-slate-900 block">
                            {formatDateIndo(tanggal)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Gatekeeper Check Box */}
            {!menu1Available ? (
                <div className="rounded-3xl border-2 border-rose-300 bg-rose-50 p-6 text-center space-y-3 mb-6 shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/30">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <h3 className="text-base font-black text-rose-950">
                        Data Laporan Harian (Menu 1) Belum Ada!
                    </h3>
                    <p className="text-xs font-semibold text-rose-800 leading-relaxed">
                        Data Laporan Harian (Menu 1) untuk Stand <strong>{selectedStand?.kode_stand}</strong> pada tanggal <strong>{tanggal}</strong> belum tersedia! Harap segera input di Menu 1 terlebih dahulu.
                    </p>
                    <button
                        type="button"
                        onClick={onNavigateMenu1}
                        className="mt-2 inline-flex items-center space-x-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-black text-white shadow-md hover:bg-rose-700 active:scale-95 transition"
                    >
                        <span>INPUT MENU 1 SEKARANG</span>
                    </button>
                </div>
            ) : isOpnameMode ? (
                /* Mode Stock Opname */
                <form onSubmit={handleStockOpnameSubmit} className="space-y-4">
                    <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                        <div className="flex items-center space-x-2 text-purple-900 mb-1">
                            <ClipboardCheck className="h-5 w-5 text-purple-700" />
                            <h4 className="text-sm font-black uppercase tracking-wider">
                                Formulir Pengajuan Stock Opname Fisik
                            </h4>
                        </div>
                        <p className="text-xs text-purple-700 font-medium">
                            Masukkan stok fisik riil hasil hitung langsung di stand. Pengajuan ini membutuhkan persetujuan (Approval) Superadmin sebelum memperbarui stok awal.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {(formData.items || []).map((item) => {
                            const stokSistem = parseFloat(item.stok_akhir) || 0;
                            const stokFisik = opnamePhysicalStocks[item.ingredient_id] !== undefined ? opnamePhysicalStocks[item.ingredient_id] : stokSistem;
                            const selisih = stokFisik - stokSistem;

                            return (
                                <div key={item.ingredient_id} className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-800">
                                            {item.nama_bahan_baku} ({item.satuan})
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-500">
                                            Stok Sistem: {stokSistem}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                                Stok Fisik Riil
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={stokFisik}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setOpnamePhysicalStocks(prev => ({
                                                        ...prev,
                                                        [item.ingredient_id]: val
                                                    }));
                                                }}
                                                className="w-full rounded-xl border border-purple-300 bg-purple-50/40 px-3 py-2 text-sm font-bold text-purple-950 focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                                Selisih Fisik - Sistem
                                            </label>
                                            <div className={`rounded-xl border px-3 py-2 text-sm font-bold font-mono text-center ${selisih === 0 ? 'bg-slate-50 border-slate-200 text-slate-600' : selisih > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                                                {selisih > 0 ? `+${selisih}` : selisih}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Catatan Opname SPG (Opsional)
                        </label>
                        <textarea
                            value={opnameCatatan}
                            onChange={(e) => setOpnameCatatan(e.target.value)}
                            placeholder="Alasan selisih stok jika ada..."
                            className="w-full rounded-2xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-purple-500 focus:outline-none"
                            rows="2"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-purple-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-700 active:scale-95 disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                        <span>{isSubmitting ? 'MENGIRIM PENGAJUAN...' : 'KIRIM STOCK OPNAME KE SUPERADMIN'}</span>
                    </button>
                </form>
            ) : (
                /* Normal Daily Inventory Form (Opsi A) */
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                            Pergerakan Stok Harian
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400">
                            Awal + Masuk - Pakai - Rusak = Akhir
                        </span>
                    </div>

                    <div className="space-y-3.5">
                        {(formData.items || []).map((item, index) => {
                            const isLinkedToMenu1 = !!item.link_kode_qty_menu1 && item.ref_menu1_qty !== null && item.ref_menu1_qty !== undefined;

                            return (
                                <div
                                    key={item.ingredient_id}
                                    className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3"
                                >
                                    {/* 1. Nama Bahan & Satuan */}
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <div>
                                            <span className="text-sm font-black text-slate-900 block leading-tight">
                                                {item.nama_bahan_baku}
                                            </span>
                                            <span className="text-[11px] font-semibold text-slate-400">
                                                Kategori: {item.kategori_bahan}
                                            </span>
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                                            {item.satuan}
                                        </span>
                                    </div>

                                    {/* Grid Input 5 Kolom Sesuai Pola */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        {/* 2. Stok Awal (Read-Only) */}
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-center">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                                                Stok Awal
                                            </label>
                                            <span className="text-sm font-black text-slate-700 font-mono">
                                                {item.stok_awal}
                                            </span>
                                        </div>

                                        {/* 3. Barang Masuk (Manual) */}
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-0.5">
                                                + Masuk
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={item.barang_masuk || ''}
                                                onChange={(e) => updateItemField(index, 'barang_masuk', e.target.value)}
                                                placeholder="0"
                                                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-800 focus:border-teal-500 focus:outline-none"
                                            />
                                        </div>

                                        {/* 4. Barang Terpakai (Manual + Badge Menu 1) */}
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <label className="text-[10px] font-bold uppercase text-slate-600 block">
                                                    - Terpakai
                                                </label>
                                                {isLinkedToMenu1 && (
                                                    <span className="rounded-md bg-amber-100 border border-amber-300 px-1 py-0.2 text-[9px] font-black text-amber-800">
                                                        [Menu 1: {item.ref_menu1_qty}]
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={item.barang_terpakai || ''}
                                                onChange={(e) => updateItemField(index, 'barang_terpakai', e.target.value)}
                                                placeholder="0"
                                                className={`w-full rounded-xl border px-2.5 py-1.5 text-sm font-bold text-slate-800 focus:outline-none ${isLinkedToMenu1 ? 'border-amber-400 bg-amber-50/30 focus:border-amber-600' : 'border-slate-300 bg-white focus:border-teal-500'}`}
                                            />
                                        </div>

                                        {/* 5. Barang Rusak (Manual) */}
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-0.5">
                                                - Rusak
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={item.barang_rusak || ''}
                                                onChange={(e) => updateItemField(index, 'barang_rusak', e.target.value)}
                                                placeholder="0"
                                                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-800 focus:border-teal-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* 6. Stok Akhir (Auto-Calculate / Read-Only) */}
                                    <div className="flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50/70 px-3.5 py-2">
                                        <span className="text-xs font-bold text-teal-800">
                                            [AUTO] Stok Akhir:
                                        </span>
                                        <span className="text-base font-black text-teal-950 font-mono">
                                            {item.stok_akhir} {item.satuan}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="sticky bottom-3 z-30 pt-2 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent">
                        <div className="flex items-center space-x-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 flex items-center justify-center space-x-2 rounded-2xl bg-teal-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-teal-600/30 transition hover:bg-teal-700 active:scale-95 disabled:opacity-50"
                            >
                                <Save className="h-5 w-5" />
                                <span>{isSubmitting ? 'MENYIMPAN...' : 'SUBMIT BAHAN BAKU'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowConfirmClear(true)}
                                className="rounded-2xl border border-slate-300 bg-white px-3.5 py-4 text-slate-600 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition"
                                title="Clear Draft"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Clear Confirmation Modal */}
            {showConfirmClear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="text-base font-black text-slate-900">Kosongkan Data Form?</h3>
                        <p className="mt-2 text-xs text-slate-600 font-medium">
                            Draft pergerakan barang yang tersimpan di perangkat ini akan dibersihkan.
                        </p>
                        <div className="mt-5 flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowConfirmClear(false)}
                                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    clearDraft();
                                    setShowConfirmClear(false);
                                }}
                                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700"
                            >
                                Ya, Bersihkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

