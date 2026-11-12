import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft, Save, Trash2, Plus, ChevronDown, ChevronUp,
    AlertCircle, CheckCircle2, AlertTriangle, Store, Calendar, X
} from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import NotificationBanner from '../../components/NotificationBanner';
import { useLocalStoragePersistence } from '../../hooks/useLocalStoragePersistence';
import { formatRupiah, parseRupiah, formatDateIndo } from '../../utils/formatters';

export default function Menu2FormPenjualan({
    stands = [],
    menu2Items = [],
    menu2Prices = {},
    selectedStand,
    setSelectedStand,
    tanggal,
    setTanggal,
    onBack,
    onNavigateMenu1,
}) {
    const initialFormState = {
        quantities: {}, // { [item_id]: qty }
        unregistered: [], // max 3: [{ keterangan: '', qty: 0, nominal: 0 }]
    };

    const {
        formData,
        setFormData,
        restoredBanner,
        dismissBanner,
        clearDraft,
    } = useLocalStoragePersistence('MENU2', selectedStand?.id, tanggal, initialFormState);

    const [menu1Status, setMenu1Status] = useState({ available: false, total_penjualan: 0 });
    const [loadingGatekeeper, setLoadingGatekeeper] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    // Gatekeeper & Initial Data fetch
    useEffect(() => {
        if (!selectedStand?.id || !tanggal) return;

        setLoadingGatekeeper(true);
        fetch(`/api/menu2/get?stand_id=${selectedStand.id}&tanggal=${tanggal}`)
            .then(res => res.json())
            .then(data => {
                setMenu1Status({
                    available: !!data.menu1_available,
                    total_penjualan: data.menu1_total || 0,
                });

                if (data.data && !restoredBanner) {
                    const saved = data.data;
                    const qMap = {};
                    (saved.items_sold || []).forEach(it => {
                        if (it.menu2_item_id) qMap[it.menu2_item_id] = it.qty;
                    });
                    setFormData({
                        quantities: qMap,
                        unregistered: saved.unregistered_items || [],
                    });
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoadingGatekeeper(false));
    }, [selectedStand?.id, tanggal]);

    // Group items by kelompok_menu
    const groupedItems = useMemo(() => {
        const groups = {};
        menu2Items.forEach(item => {
            const groupName = item.kelompok_menu || 'Lainnya';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(item);
        });
        return groups;
    }, [menu2Items]);

    // Price helper for current stand
    const getItemPrice = (itemId, defaultPrice) => {
        if (!selectedStand?.id) return defaultPrice;
        const pricesList = menu2Prices[itemId] || [];
        const found = pricesList.find(p => p.stand_id === selectedStand.id);
        return found ? found.harga : defaultPrice;
    };

    // Calculate subtotal per group & grand total
    const { groupCalculations, grandTotal } = useMemo(() => {
        const calcs = {};
        let totalAllRp = 0;

        Object.keys(groupedItems).forEach(groupName => {
            let groupQty = 0;
            let groupRp = 0;

            groupedItems[groupName].forEach(item => {
                const qty = parseInt(formData.quantities?.[item.id] || 0, 10);
                const price = getItemPrice(item.id, item.harga_default);
                if (qty > 0) {
                    groupQty += qty;
                    groupRp += (qty * price);
                }
            });

            calcs[groupName] = { qty: groupQty, rp: groupRp };
            totalAllRp += groupRp;
        });

        // Add Unregistered totals (Rule: direct nominal without multiplier!)
        const unregTotal = (formData.unregistered || []).reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
        totalAllRp += unregTotal;

        return { groupCalculations: calcs, grandTotal: totalAllRp };
    }, [groupedItems, formData.quantities, formData.unregistered, selectedStand?.id]);

    const targetTotalMenu1 = menu1Status.total_penjualan || 0;
    const selisih = grandTotal - targetTotalMenu1;
    const isBalancedWithMenu1 = menu1Status.available && targetTotalMenu1 > 0 && selisih === 0;

    const toggleGroup = (groupName) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const handleQtyChange = (itemId, val) => {
        const num = parseInt(val, 10) || 0;
        setFormData(prev => ({
            ...prev,
            quantities: {
                ...(prev.quantities || {}),
                [itemId]: num >= 0 ? num : 0
            }
        }));
    };

    // Unregistered Handlers (Max 3)
    const addUnregistered = () => {
        if ((formData.unregistered || []).length < 3) {
            setFormData(prev => ({
                ...prev,
                unregistered: [
                    ...(prev.unregistered || []),
                    { keterangan: '', qty: 1, nominal: 0 }
                ]
            }));
        }
    };

    const updateUnregistered = (index, field, val) => {
        const list = [...(formData.unregistered || [])];
        list[index][field] = val;
        setFormData(prev => ({ ...prev, unregistered: list }));
    };

    const removeUnregistered = (index) => {
        setFormData(prev => ({
            ...prev,
            unregistered: prev.unregistered.filter((_, i) => i !== index)
        }));
    };

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!menu1Status.available) {
            setSubmitError('Laporan Menu 1 belum diinput. Tidak dapat submit Menu 2.');
            return;
        }

        if (!isBalancedWithMenu1) {
            setSubmitError(`Grand Total Menu 2 (${formatRupiah(grandTotal)}) berbeda ${formatRupiah(Math.abs(selisih))} dengan Total Penjualan Menu 1 (${formatRupiah(targetTotalMenu1)})!`);
            return;
        }

        // Format items_sold array
        const itemsSold = [];
        menu2Items.forEach(item => {
            const qty = parseInt(formData.quantities?.[item.id] || 0, 10);
            const price = getItemPrice(item.id, item.harga_default);
            if (qty > 0) {
                itemsSold.push({
                    menu2_item_id: item.id,
                    kode_item: item.kode_item,
                    nama_item: item.nama_item,
                    kelompok_menu: item.kelompok_menu,
                    qty: qty,
                    harga: price,
                    subtotal: qty * price,
                });
            }
        });

        setIsSubmitting(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/menu2/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    stand_id: selectedStand.id,
                    tanggal: tanggal,
                    items_sold: itemsSold,
                    unregistered_items: formData.unregistered || [],
                    grand_total: grandTotal,
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
                setSubmitError(data.message || 'Gagal menyimpan Form Penjualan Menu 2.');
            }
        } catch (err) {
            setSubmitError('Terjadi kesalahan koneksi server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg px-4 py-4 sm:py-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl active:scale-95 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>KEMBALI</span>
                </button>
                <span className="rounded-full bg-blue-100 border border-blue-300 px-2.5 py-1 text-[11px] font-black text-blue-800 uppercase tracking-wider">
                    Menu 2: Form Penjualan
                </span>
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
                    message="Form Penjualan (Menu 2) berhasil disimpan ke server!"
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
            {!menu1Status.available ? (
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
            ) : (
                /* Gatekeeper Passed - Show Reference Target Total */
                <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-3.5 mb-5 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                            Target Penjualan dari Menu 1
                        </span>
                        <span className="text-xl font-black text-blue-950 font-mono">
                            {formatRupiah(targetTotalMenu1)}
                        </span>
                    </div>
                    <span className="rounded-full bg-blue-200/80 px-2.5 py-1 text-[10px] font-bold text-blue-800">
                        Acuan Validasi
                    </span>
                </div>
            )}

            {/* Menu Items Accordion by Group (Locked if Menu 1 not available) */}
            <form onSubmit={handleSubmit} className={`space-y-4 ${!menu1Status.available ? 'opacity-40 pointer-events-none' : ''}`}>
                {Object.keys(groupedItems).map((groupName) => {
                    const isCollapsed = !!collapsedGroups[groupName];
                    const calc = groupCalculations[groupName] || { qty: 0, rp: 0 };
                    const items = groupedItems[groupName];

                    return (
                        <div
                            key={groupName}
                            className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs transition"
                        >
                            {/* Accordion Header */}
                            <div
                                onClick={() => toggleGroup(groupName)}
                                className="flex cursor-pointer items-center justify-between bg-slate-50/90 px-4 py-3.5 border-b border-slate-100 hover:bg-slate-100/80 transition"
                            >
                                <div>
                                    <h4 className="text-sm font-black text-slate-900">{groupName}</h4>
                                    <span className="text-[11px] font-semibold text-slate-500">
                                        Subtotal: {calc.qty} pcs ({formatRupiah(calc.rp)})
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                        {items.length} Menu
                                    </span>
                                    {isCollapsed ? (
                                        <ChevronDown className="h-5 w-5 text-slate-400" />
                                    ) : (
                                        <ChevronUp className="h-5 w-5 text-slate-400" />
                                    )}
                                </div>
                            </div>

                            {/* Accordion Body */}
                            {!isCollapsed && (
                                <div className="divide-y divide-slate-100 p-2 sm:p-3 space-y-2">
                                    {items.map(item => {
                                        const qty = parseInt(formData.quantities?.[item.id] || 0, 10);
                                        const price = getItemPrice(item.id, item.harga_default);
                                        const subtotal = qty * price;

                                        return (
                                            <div
                                                key={item.id}
                                                className="pt-2 pb-2 first:pt-0 last:pb-0"
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-900 block">
                                                            {item.nama_item}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-slate-400">
                                                            Harga Stand: {formatRupiah(price)}
                                                        </span>
                                                    </div>

                                                    {subtotal > 0 && (
                                                        <span className="text-xs font-black text-blue-700 font-mono">
                                                            {qty} x {formatRupiah(price)} = {formatRupiah(subtotal)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        value={formData.quantities?.[item.id] || ''}
                                                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                                        className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                                                    />
                                                    <span className="text-xs font-bold text-slate-400 shrink-0">
                                                        pcs
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Subtotal Box per Kelompok */}
                                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 text-right mt-2">
                                        <span className="text-[10px] font-bold uppercase text-blue-600 mr-2">
                                            Subtotal {groupName}:
                                        </span>
                                        <span className="text-xs font-black text-blue-950 font-mono">
                                            {calc.qty} pcs | {formatRupiah(calc.rp)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* 3. Opsi Input Unregistered (Maksimal 3 Tipe) */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                                3. Unregistered Items (Maks. 3 Baris)
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                                *Nominal langsung total Rupiah TANPA dikali QTY
                            </p>
                        </div>
                        {(formData.unregistered || []).length < 3 && (
                            <button
                                type="button"
                                onClick={addUnregistered}
                                className="flex items-center space-x-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>+ Unregistered</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        {(formData.unregistered || []).map((unreg, idx) => (
                            <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Keterangan item (opsional)"
                                        value={unreg.keterangan}
                                        onChange={(e) => updateUnregistered(idx, 'keterangan', e.target.value)}
                                        className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeUnregistered(idx)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                            QTY (Catatan)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={unreg.qty || ''}
                                            onChange={(e) => updateUnregistered(idx, 'qty', parseInt(e.target.value, 10) || 0)}
                                            placeholder="1"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                            Nominal Rupiah (Total)
                                        </label>
                                        <CurrencyInput
                                            value={unreg.nominal}
                                            onChange={(val) => updateUnregistered(idx, 'nominal', val)}
                                            className="py-2 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Grand Total & Validasi Akhir Menu 2 */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
                    <div className="rounded-2xl border-2 border-blue-400 bg-blue-50/80 p-4 text-center">
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 block">
                            GRAND TOTAL MENU 2 (RP)
                        </span>
                        <span className="text-3xl font-black text-blue-950 font-mono tracking-tight mt-0.5 block">
                            {formatRupiah(grandTotal)}
                        </span>
                    </div>

                    {/* Balance with Menu 1 check */}
                    {targetTotalMenu1 > 0 && (
                        <div>
                            {isBalancedWithMenu1 ? (
                                <div className="flex items-center space-x-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                    <span>Nominal Sesuai (Balance): Grand Total Menu 2 sama persis dengan Total Penjualan Menu 1!</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                                    <span>
                                        Selisih {formatRupiah(Math.abs(selisih))} dengan Menu 1! Grand Total ({formatRupiah(grandTotal)}) harus sama persis dengan Total Penjualan Menu 1 ({formatRupiah(targetTotalMenu1)}).
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Actions */}
                <div className="sticky bottom-3 z-30 pt-2 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent">
                    <div className="flex items-center space-x-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !isBalancedWithMenu1}
                            className="flex-1 flex items-center justify-center space-x-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-5 w-5" />
                            <span>{isSubmitting ? 'MENYIMPAN...' : 'SUBMIT MENU 2'}</span>
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

            {/* Clear Confirmation Modal */}
            {showConfirmClear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="text-base font-black text-slate-900">Kosongkan Data Form?</h3>
                        <p className="mt-2 text-xs text-slate-600 font-medium">
                            Draft kuantitas yang sudah diketik untuk stand dan tanggal ini akan dibersihkan.
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

