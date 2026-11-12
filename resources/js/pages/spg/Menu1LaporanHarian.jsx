import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Save, Trash2, Plus, Upload, CheckCircle2,
    AlertTriangle, Camera, Store, Calendar, Users, X
} from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import NotificationBanner from '../../components/NotificationBanner';
import { useLocalStoragePersistence } from '../../hooks/useLocalStoragePersistence';
import { formatRupiah, parseRupiah, formatDateIndo } from '../../utils/formatters';
import { compressImageFile } from '../../utils/imageCompressor';

export default function Menu1LaporanHarian({
    stands = [],
    spgList = [],
    nominalConfigs = [],
    qtyConfigs = [],
    selectedStand,
    setSelectedStand,
    tanggal,
    setTanggal,
    onBack,
}) {
    // Initial Form State
    const initialFormState = {
        spg_ids: [spgList[0]?.id || 1],
        nominals: {
            NOM_AMK: 0,
            NOM_KURMA: 0,
            NOM_AMKOPI: 0,
            NOM_PTT: 0,
            NOM_MINERAL: 0,
        },
        penjualan_tambahan: [],
        nominal_qris: 0,
        nominal_tunai: 0,
        biaya_harian: [
            { keterangan: 'Biaya 1', nominal: 0 },
            { keterangan: 'Biaya 2', nominal: 0 },
        ],
        qris_proof_base64: null,
        qty_per_item: {
            QTY_CUP_12: 0,
            QTY_CUP_22: 0,
            QTY_CUP_16: 0,
            QTY_CUP_KURMA: 0,
            QTY_CUP_KOPI: 0,
            QTY_PTT: 0,
            QTY_MINERAL: 0,
        },
    };

    const {
        formData,
        setFormData,
        restoredBanner,
        dismissBanner,
        clearDraft,
    } = useLocalStoragePersistence('MENU1', selectedStand?.id, tanggal, initialFormState);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    // Fetch existing data from server if any
    useEffect(() => {
        if (!selectedStand?.id || !tanggal) return;

        fetch(`/api/menu1/get?stand_id=${selectedStand.id}&tanggal=${tanggal}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.data && !restoredBanner) {
                    const rep = data.data;
                    setFormData({
                        spg_ids: rep.spg_list || [spgList[0]?.id || 1],
                        nominals: rep.nominal_per_kategori || initialFormState.nominals,
                        penjualan_tambahan: rep.penjualan_tambahan || [],
                        nominal_qris: rep.nominal_qris || 0,
                        nominal_tunai: rep.nominal_tunai || 0,
                        biaya_harian: rep.biaya_harian && rep.biaya_harian.length > 0 ? rep.biaya_harian : initialFormState.biaya_harian,
                        qris_proof_base64: rep.qris_proof_base64 || null,
                        qty_per_item: rep.qty_per_item || initialFormState.qty_per_item,
                    });
                }
            })
            .catch(err => console.error(err));
    }, [selectedStand?.id, tanggal]);

    // Autosum calculations
    const sumNominalKategori = Object.values(formData.nominals || {}).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    const sumPenjualanTambahan = (formData.penjualan_tambahan || []).reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
    const totalSemuaPenjualan = sumNominalKategori + sumPenjualanTambahan;

    const totalBiaya = (formData.biaya_harian || []).reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
    const sisaSetoranTunai = (Number(formData.nominal_tunai) || 0) - totalBiaya;

    const qrisPlusTunai = (Number(formData.nominal_qris) || 0) + (Number(formData.nominal_tunai) || 0);
    const selisihPayment = totalSemuaPenjualan - qrisPlusTunai;
    const isPaymentBalanced = totalSemuaPenjualan > 0 && selisihPayment === 0;

    // SPG List Handlers
    const addSpgSlot = () => {
        if (formData.spg_ids.length < 5) {
            setFormData(prev => ({
                ...prev,
                spg_ids: [...prev.spg_ids, spgList[0]?.id || 1]
            }));
        }
    };

    const removeSpgSlot = (index) => {
        if (formData.spg_ids.length > 1) {
            setFormData(prev => ({
                ...prev,
                spg_ids: prev.spg_ids.filter((_, i) => i !== index)
            }));
        }
    };

    const updateSpgId = (index, val) => {
        const updated = [...formData.spg_ids];
        updated[index] = parseInt(val, 10);
        setFormData(prev => ({ ...prev, spg_ids: updated }));
    };

    // Penjualan Tambahan Handlers
    const addPenjualanTambahan = () => {
        setFormData(prev => ({
            ...prev,
            penjualan_tambahan: [...(prev.penjualan_tambahan || []), { keterangan: '', nominal: 0 }]
        }));
    };

    const updatePenjualanTambahan = (index, field, val) => {
        const list = [...(formData.penjualan_tambahan || [])];
        list[index][field] = val;
        setFormData(prev => ({ ...prev, penjualan_tambahan: list }));
    };

    const removePenjualanTambahan = (index) => {
        setFormData(prev => ({
            ...prev,
            penjualan_tambahan: prev.penjualan_tambahan.filter((_, i) => i !== index)
        }));
    };

    // Biaya Harian Handlers
    const addBiayaRow = () => {
        setFormData(prev => ({
            ...prev,
            biaya_harian: [...(prev.biaya_harian || []), { keterangan: '', nominal: 0 }]
        }));
    };

    const updateBiayaRow = (index, field, val) => {
        const list = [...(formData.biaya_harian || [])];
        list[index][field] = val;
        setFormData(prev => ({ ...prev, biaya_harian: list }));
    };

    const removeBiayaRow = (index) => {
        setFormData(prev => ({
            ...prev,
            biaya_harian: prev.biaya_harian.filter((_, i) => i !== index)
        }));
    };

    // QTY Input Handlers
    const updateQty = (key, val) => {
        const num = parseInt(val, 10) || 0;
        setFormData(prev => ({
            ...prev,
            qty_per_item: {
                ...(prev.qty_per_item || {}),
                [key]: num >= 0 ? num : 0
            }
        }));
    };

    // QRIS Image Compression Handler
    const handleProofUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImageFile(file, 1080, 0.75);
            setFormData(prev => ({
                ...prev,
                qris_proof_base64: compressed.base64
            }));
        } catch (err) {
            alert('Gagal memproses gambar bukti QRIS: ' + err.message);
        }
    };

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!isPaymentBalanced) {
            setSubmitError(`Nominal QRIS + Tunai (${formatRupiah(qrisPlusTunai)}) harus SAMA PERSIS dengan Total Penjualan (${formatRupiah(totalSemuaPenjualan)})!`);
            return;
        }

        setIsSubmitting(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/menu1/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    stand_id: selectedStand.id,
                    tanggal: tanggal,
                    spg_list: formData.spg_ids,
                    nominal_per_kategori: formData.nominals,
                    penjualan_tambahan: formData.penjualan_tambahan,
                    total_semua_penjualan: totalSemuaPenjualan,
                    nominal_qris: formData.nominal_qris,
                    nominal_tunai: formData.nominal_tunai,
                    biaya_harian: formData.biaya_harian,
                    total_biaya: totalBiaya,
                    sisa_setoran_tunai: sisaSetoranTunai,
                    qris_proof_base64: formData.qris_proof_base64,
                    qty_per_item: formData.qty_per_item,
                }),
            });

            const data = await res.json();
            if (data.success) {
                // Clear localStorage draft on 100% success
                clearDraft();
                setSubmitSuccess(true);
                setTimeout(() => {
                    setSubmitSuccess(false);
                    onBack();
                }, 1200);
            } else {
                setSubmitError(data.message || 'Gagal menyimpan Laporan Harian.');
            }
        } catch (err) {
            setSubmitError('Terjadi kesalahan koneksi server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg px-4 py-4 sm:py-6">
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl active:scale-95 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>KEMBALI</span>
                </button>
                <div className="text-right">
                    <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-1 text-[11px] font-black text-amber-800 uppercase tracking-wider">
                        Menu 1: Laporan Harian
                    </span>
                </div>
            </div>

            {/* Restored Draft Banner Notification */}
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
                    message="Laporan Harian (Menu 1) berhasil disimpan ke server!"
                />
            )}

            {submitError && (
                <NotificationBanner
                    type="error"
                    message={submitError}
                    onDismiss={() => setSubmitError('')}
                />
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Stand & 2. Tanggal */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
                    <div>
                        <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            <Store className="h-4 w-4 mr-1.5 text-amber-600" />
                            1. Stand Outlet
                        </label>
                        <select
                            value={selectedStand?.id || ''}
                            onChange={(e) => {
                                const st = stands.find(s => s.id === parseInt(e.target.value, 10));
                                setSelectedStand(st || stands[0]);
                            }}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                            {stands.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.kode_stand} - {s.nama_stand} ({s.wilayah_laporan})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            <Calendar className="h-4 w-4 mr-1.5 text-amber-600" />
                            2. Tanggal Laporan
                        </label>
                        <input
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                            {formatDateIndo(tanggal)}
                        </p>
                    </div>
                </div>

                {/* 3. SPG yang Bertugas (1 s/d 5 Orang) */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-700">
                            <Users className="h-4 w-4 mr-1.5 text-amber-600" />
                            3. SPG Bertugas (1 s/d 5 Orang)
                        </label>
                        {formData.spg_ids.length < 5 && (
                            <button
                                type="button"
                                onClick={addSpgSlot}
                                className="flex items-center space-x-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Tambah SPG</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        {formData.spg_ids.map((spgId, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600">
                                    {index + 1}
                                </span>
                                <select
                                    value={spgId}
                                    onChange={(e) => updateSpgId(index, e.target.value)}
                                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                                >
                                    {spgList.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.id_spg} - {u.name} (@{u.username})
                                        </option>
                                    ))}
                                </select>
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSpgSlot(index)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Input Nominal Penjualan */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                            4. Nominal Laporan Penjualan (Rupiah)
                        </h4>
                    </div>

                    <div className="space-y-3">
                        {nominalConfigs.map((cfg) => (
                            <div key={cfg.kode_kategori}>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {cfg.label_input_nominal}
                                    {cfg.keterangan_bantu && (
                                        <span className="block text-[11px] font-normal text-slate-400">
                                            *{cfg.keterangan_bantu}
                                        </span>
                                    )}
                                </label>
                                <CurrencyInput
                                    value={formData.nominals?.[cfg.kode_kategori] || 0}
                                    onChange={(val) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            nominals: {
                                                ...(prev.nominals || {}),
                                                [cfg.kode_kategori]: val,
                                            }
                                        }));
                                    }}
                                />
                            </div>
                        ))}

                        {/* Penjualan Tambahan */}
                        {formData.penjualan_tambahan?.map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-2.5">
                                <input
                                    type="text"
                                    placeholder="Keterangan item lain"
                                    value={item.keterangan}
                                    onChange={(e) => updatePenjualanTambahan(idx, 'keterangan', e.target.value)}
                                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                                />
                                <div className="w-36">
                                    <CurrencyInput
                                        value={item.nominal}
                                        onChange={(val) => updatePenjualanTambahan(idx, 'nominal', val)}
                                        className="py-2 text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removePenjualanTambahan(idx)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addPenjualanTambahan}
                            className="flex items-center justify-center space-x-1.5 w-full rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100/50"
                        >
                            <Plus className="h-4 w-4" />
                            <span>+ Tambah Penjualan Lain</span>
                        </button>
                    </div>

                    {/* Box [AUTOSUM] Total Semua Penjualan */}
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 block">
                            [AUTOSUM] Total Semua Penjualan
                        </span>
                        <span className="text-2xl font-black text-amber-950 font-mono tracking-tight mt-0.5 block">
                            {formatRupiah(totalSemuaPenjualan)}
                        </span>
                    </div>
                </div>

                {/* 5. Pembagian Metode Pembayaran (Validasi Pengunci) */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        5. Pembagian Metode Pembayaran
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                e. Nominal QRIS (Rp)
                            </label>
                            <CurrencyInput
                                value={formData.nominal_qris}
                                onChange={(val) => setFormData(prev => ({ ...prev, nominal_qris: val }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                f. Nominal Tunai (Rp)
                            </label>
                            <CurrencyInput
                                value={formData.nominal_tunai}
                                onChange={(val) => setFormData(prev => ({ ...prev, nominal_tunai: val }))}
                            />
                        </div>
                    </div>

                    {/* Validation Indicator */}
                    {totalSemuaPenjualan > 0 && (
                        <div>
                            {isPaymentBalanced ? (
                                <div className="flex items-center space-x-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                    <span>Nominal Sesuai (Balance): QRIS + Tunai = {formatRupiah(totalSemuaPenjualan)}</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                                    <span>
                                        Selisih {formatRupiah(Math.abs(selisihPayment))} dengan Total Penjualan! Nominal QRIS + Tunai harus sama persis dengan Total Penjualan.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 6. Biaya Harian Stand */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                            6. Biaya Harian Stand (Diambil dari Uang Tunai)
                        </h4>
                        <button
                            type="button"
                            onClick={addBiayaRow}
                            className="text-[11px] font-bold text-amber-600 hover:underline"
                        >
                            + Tambah Biaya
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {formData.biaya_harian?.map((biaya, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder={`Biaya ${idx + 1}`}
                                    value={biaya.keterangan}
                                    onChange={(e) => updateBiayaRow(idx, 'keterangan', e.target.value)}
                                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800"
                                />
                                <div className="w-36">
                                    <CurrencyInput
                                        value={biaya.nominal}
                                        onChange={(val) => updateBiayaRow(idx, 'nominal', val)}
                                        className="py-2.5 text-sm"
                                    />
                                </div>
                                {formData.biaya_harian.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeBiayaRow(idx)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                            <span className="text-[10px] font-black uppercase text-slate-500 block">
                                [AUTOSUM] Total Biaya
                            </span>
                            <span className="text-sm font-black text-slate-800 font-mono">
                                {formatRupiah(totalBiaya)}
                            </span>
                        </div>
                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3 text-center">
                            <span className="text-[10px] font-black uppercase text-indigo-700 block">
                                [AUTO-SUBTRACT] Sisa Setoran Tunai
                            </span>
                            <span className="text-sm font-black text-indigo-900 font-mono">
                                {formatRupiah(sisaSetoranTunai)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 7. Upload Bukti QRIS */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        7. Bukti Settlement QRIS
                    </h4>

                    {formData.qris_proof_base64 ? (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                            <img
                                src={formData.qris_proof_base64}
                                alt="Settlement QRIS"
                                className="w-full max-h-60 object-contain bg-slate-900"
                            />
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, qris_proof_base64: null }))}
                                className="absolute top-2 right-2 rounded-xl bg-rose-600/90 p-2 text-white shadow-md hover:bg-rose-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-6 cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition">
                            <Camera className="h-8 w-8 text-slate-400 mb-2" />
                            <span className="text-xs font-bold text-slate-700">
                                Ambil Foto / Upload Settlement QRIS
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                                Gambar otomatis dikompres sebelum diunggah
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProofUpload}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>

                {/* 8. Laporan Input QTY Item */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        8. Laporan Input QTY Item (Angka Bulat)
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                        {qtyConfigs.map((cfg) => (
                            <div key={cfg.kode_qty_menu1}>
                                <label className="block text-xs font-bold text-slate-700 mb-1 truncate">
                                    {cfg.label_input_qty}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    value={formData.qty_per_item?.[cfg.kode_qty_menu1] || ''}
                                    onChange={(e) => updateQty(cfg.kode_qty_menu1, e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-bold text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 9. Tombol Aksi Bawah */}
                <div className="sticky bottom-3 z-30 pt-2 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent">
                    <div className="flex items-center space-x-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !isPaymentBalanced}
                            className="flex-1 flex items-center justify-center space-x-2 rounded-2xl bg-amber-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-amber-600/30 transition hover:bg-amber-700 active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-5 w-5" />
                            <span>{isSubmitting ? 'MENYIMPAN...' : 'SUBMIT LAPORAN'}</span>
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
                            Draft input yang tersimpan di perangkat ini untuk stand dan tanggal ini akan dihapus.
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

