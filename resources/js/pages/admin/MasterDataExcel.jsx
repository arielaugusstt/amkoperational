import React, { useState, useEffect } from 'react';
import {
    Download, Upload, Plus, Edit2, Trash2, X,
    FileSpreadsheet, Store, Coffee, Boxes, RefreshCw, AlertTriangle
} from 'lucide-react';
import {
    downloadTemplate1, downloadTemplate2, downloadTemplate3,
    downloadTemplate4, parseExcelFile
} from '../../utils/excelEngine';
import { formatRupiah } from '../../utils/formatters';

export default function MasterDataExcel() {
    const [activeTab, setActiveTab] = useState('stands'); // stands, ingredients, resep, menu2, spg, menu1
    const [masterData, setMasterData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        entityType: '', // 'stand', 'spg', 'menu2', 'ingredient', 'menu1_nominal', 'menu1_qty', 'batch'
        mode: 'create',
        formData: {},
    });

    const [importModal, setImportModal] = useState({
        isOpen: false,
        templateType: '',
        fileName: '',
        filePayload: null,
        mode: 'append',
    });

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetting, setResetting] = useState(false);

    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const fetchMaster = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/master-data');
            const data = await res.json();
            setMasterData(data);
            setSelectedIds([]);
        } catch (e) {
            console.error(e);
            setError('Gagal memuat master data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaster();
    }, []);

    useEffect(() => {
        setSelectedIds([]);
    }, [activeTab]);

    const stands = masterData?.stands || [];
    const spgList = masterData?.spg || [];
    const nominals = masterData?.menu1_nominals || [];
    const qtys = masterData?.menu1_qtys || [];
    const menu2Items = masterData?.menus || masterData?.menu2_items || [];
    const menu2Prices = masterData?.menu2_prices || {};
    const ingredients = masterData?.ingredients || [];
    const baseRecipes = masterData?.base_recipes || masterData?.batches || [];

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSelectAll = (items) => {
        const allIds = items.map(i => i.id);
        if (selectedIds.length === allIds.length && allIds.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(allIds);
        }
    };

    const handleDeleteSingle = async (url, label) => {
        if (!window.confirm(`Yakin ingin menghapus ${label}?`)) return;
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message || 'Data berhasil dihapus.');
                fetchMaster();
            } else {
                setError(data.message || 'Gagal menghapus data.');
            }
        } catch (err) {
            setError('Terjadi kesalahan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async (url, ids, label) => {
        if (ids.length === 0) return;
        if (!window.confirm(`Yakin ingin menghapus ${ids.length} data ${label} terpilih?`)) return;
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                body: JSON.stringify({ ids }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message || `${ids.length} data berhasil dihapus.`);
                fetchMaster();
            } else {
                setError(data.message || 'Gagal menghapus data terpilih.');
            }
        } catch (err) {
            setError('Terjadi kesalahan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAll = async (url, label) => {
        const confirmWord = prompt(`PERINGATAN: Anda akan MENGHAPUS SEMUA DATA ${label}!\n\nKetik "HAPUS" untuk mengonfirmasi:`);
        if (confirmWord !== 'HAPUS') return;
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message || `Seluruh data ${label} berhasil dikosongkan.`);
                fetchMaster();
            } else {
                setError(data.message || 'Gagal mengosongkan data.');
            }
        } catch (err) {
            setError('Terjadi kesalahan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetOperational = async () => {
        setResetting(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch('/api/admin/delete-operational-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                body: JSON.stringify({ scope: 'all' }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message || 'Seluruh data transaksi uji coba berhasil dibersihkan.');
                setShowResetModal(false);
                fetchMaster();
            } else {
                setError(data.message || 'Gagal membersihkan data transaksi.');
            }
        } catch (err) {
            setError('Terjadi kesalahan: ' + err.message);
        } finally {
            setResetting(false);
        }
    };

    const handleSaveEntity = async (e) => {
        e.preventDefault();
        const { entityType, mode, formData } = modalConfig;
        let url = '';
        let method = mode === 'create' ? 'POST' : 'PUT';

        if (entityType === 'stand') {
            url = mode === 'create' ? '/api/master-data/stand' : `/api/master-data/stand/${formData.id}`;
        } else if (entityType === 'spg') {
            url = mode === 'create' ? '/api/master-data/spg' : `/api/master-data/spg/${formData.id}`;
        } else if (entityType === 'menu2') {
            url = mode === 'create' ? '/api/master-data/menu2' : `/api/master-data/menu2/${formData.id}`;
        } else if (entityType === 'ingredient') {
            url = mode === 'create' ? '/api/master-data/ingredient' : `/api/master-data/ingredient/${formData.id}`;
        } else if (entityType === 'batch') {
            url = mode === 'create' ? '/api/master-data/resep/batch' : `/api/master-data/resep/batch/${formData.id}`;
        } else if (entityType === 'menu1_nominal') {
            url = mode === 'create' ? '/api/master-data/menu1/nominal' : `/api/master-data/menu1/nominal/${formData.id}`;
        } else if (entityType === 'menu1_qty') {
            url = mode === 'create' ? '/api/master-data/menu1/qty' : `/api/master-data/menu1/qty/${formData.id}`;
        }

        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message || 'Data berhasil disimpan!');
                setModalConfig({ isOpen: false, entityType: '', mode: 'create', formData: {} });
                fetchMaster();
            } else {
                setError(data.message || 'Gagal menyimpan data.');
            }
        } catch (err) {
            setError('Terjadi kesalahan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getTierPrice = (menu, tier) => {
        const found = (menu.prices || []).find(p => p.price_tier === tier);
        return found ? found.price : null;
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
            {/* Header & Reset Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                        Master Data 3-Layer BOM & Multi-Tier Pricing
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500">
                        Kelola 19 Outlet, 28 Bahan Baku (Massa Jenis & Konversi Botol), 7 Base Adonan, & 54 Menu (4-Tier Harga)
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowResetModal(true)}
                        className="flex items-center space-x-1.5 rounded-2xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Bersihkan Transaksi Uji Coba</span>
                    </button>

                    <button
                        onClick={fetchMaster}
                        className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:text-amber-600 active:scale-95 shadow-xs"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {message && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 flex items-center justify-between">
                    <span>{message}</span>
                    <button onClick={() => setMessage('')}><X className="h-4 w-4" /></button>
                </div>
            )}
            {error && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-bold text-rose-800 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 space-x-2">
                <button
                    onClick={() => setActiveTab('stands')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'stands' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    1. Master Outlet ({stands.length})
                </button>
                <button
                    onClick={() => setActiveTab('ingredients')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'ingredients' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    2. Layer 1: Bahan Baku ({ingredients.length})
                </button>
                <button
                    onClick={() => setActiveTab('resep')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'resep' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    3. Layer 2: Base Adonan ({baseRecipes.length})
                </button>
                <button
                    onClick={() => setActiveTab('menu2')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'menu2' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    4. Layer 3: Menu & 4-Tier Harga ({menu2Items.length})
                </button>
                <button
                    onClick={() => setActiveTab('spg')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'spg' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    5. Akun SPG ({spgList.length})
                </button>
            </div>

            {/* 1. TAB OUTLETS */}
            {activeTab === 'stands' && (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-700">{stands.length} Outlet Terdaftar</span>
                        <button
                            onClick={() => setModalConfig({
                                isOpen: true,
                                entityType: 'stand',
                                mode: 'create',
                                formData: {
                                    kode_stand: '',
                                    nama_stand: '',
                                    wilayah_laporan: 'Utara',
                                    blok_wa: 'Blok 1',
                                    urutan_tampil: stands.length + 1,
                                    price_tier: 'all_outlet',
                                    is_premium: false,
                                    punya_amkopi: false,
                                    tampilkan_csdng_wa: false,
                                    tampilkan_ptt_wa: false,
                                    status_aktif: true,
                                }
                            })}
                            className="flex items-center space-x-1 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Outlet</span>
                        </button>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3.5">Kode</th>
                                        <th className="px-4 py-3.5">Nama Outlet</th>
                                        <th className="px-4 py-3.5">Wilayah & Blok</th>
                                        <th className="px-4 py-3.5 text-center">Price Tier</th>
                                        <th className="px-4 py-3.5 text-center">Premium?</th>
                                        <th className="px-4 py-3.5 text-center">AMKopi?</th>
                                        <th className="px-4 py-3.5 text-center">Status</th>
                                        <th className="px-4 py-3.5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {stands.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/80">
                                            <td className="px-4 py-3 font-mono font-bold text-slate-900">{s.kode_stand}</td>
                                            <td className="px-4 py-3 font-bold text-slate-900">{s.nama_stand}</td>
                                            <td className="px-4 py-3">{s.wilayah_laporan} &bull; <span className="font-bold text-amber-700">{s.blok_wa}</span> (#{s.urutan_tampil})</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-800">
                                                    {s.price_tier}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">{s.is_premium ? 'Ya (TP-2)' : 'Tidak'}</td>
                                            <td className="px-4 py-3 text-center">{s.punya_amkopi ? 'Ya' : 'Tidak'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                    {s.status_aktif ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center space-x-1.5">
                                                    <button
                                                        onClick={() => setModalConfig({ isOpen: true, entityType: 'stand', mode: 'edit', formData: { ...s } })}
                                                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-700"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSingle(`/api/master-data/stand/${s.id}`, `Outlet ${s.nama_stand}`)}
                                                        className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. TAB LAYER 1: INGREDIENTS */}
            {activeTab === 'ingredients' && (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-700">28 Bahan Baku & Kemasan (Tier 1 & Tier 2)</span>
                        <button
                            onClick={() => setModalConfig({
                                isOpen: true,
                                entityType: 'ingredient',
                                mode: 'create',
                                formData: {
                                    code: '',
                                    name: '',
                                    category: 'amk',
                                    dashboard_tier: 1,
                                    base_unit: 'ml',
                                    conversion_unit: '',
                                    conversion_factor: '',
                                    density_g_per_ml: '',
                                    display_order: ingredients.length + 1,
                                    notes: '',
                                    is_active: true,
                                }
                            })}
                            className="flex items-center space-x-1 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Bahan Baku</span>
                        </button>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3.5">No</th>
                                        <th className="px-4 py-3.5">Kode</th>
                                        <th className="px-4 py-3.5">Nama Bahan</th>
                                        <th className="px-4 py-3.5">Kategori</th>
                                        <th className="px-4 py-3.5 text-center">Tier UI</th>
                                        <th className="px-4 py-3.5 text-center">Satuan Dasar</th>
                                        <th className="px-4 py-3.5 text-center">Konversi Sekunder</th>
                                        <th className="px-4 py-3.5 text-center">Massa Jenis (&rho;)</th>
                                        <th className="px-4 py-3.5">Catatan</th>
                                        <th className="px-4 py-3.5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {ingredients.map(ing => (
                                        <tr key={ing.id} className="hover:bg-slate-50/80">
                                            <td className="px-4 py-3 font-mono text-slate-400">{ing.display_order}</td>
                                            <td className="px-4 py-3 font-mono font-bold text-teal-800">{ing.code}</td>
                                            <td className="px-4 py-3 font-bold text-slate-900">{ing.name}</td>
                                            <td className="px-4 py-3 uppercase text-[10px] font-bold">{ing.category}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ing.dashboard_tier === 1 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                                                    Tier {ing.dashboard_tier}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold">{ing.base_unit}</td>
                                            <td className="px-4 py-3 text-center font-mono">
                                                {ing.conversion_unit ? `1 ${ing.conversion_unit} = ${ing.conversion_factor} ${ing.base_unit}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono">
                                                {ing.density_g_per_ml ? `${ing.density_g_per_ml} g/ml` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-[11px] text-slate-500">{ing.notes || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center space-x-1.5">
                                                    <button
                                                        onClick={() => setModalConfig({ isOpen: true, entityType: 'ingredient', mode: 'edit', formData: { ...ing } })}
                                                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-teal-700"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSingle(`/api/master-data/ingredient/${ing.id}`, `Bahan ${ing.name}`)}
                                                        className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. TAB LAYER 2: BASE RECIPES (7 BASE ADONAN) */}
            {activeTab === 'resep' && (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-700">Layer 2: 7 Base Adonan (Mendukung Nested Child Base)</span>
                        <button
                            onClick={() => setModalConfig({
                                isOpen: true,
                                entityType: 'batch',
                                mode: 'create',
                                formData: {
                                    code: '',
                                    name: '',
                                    yield_ml: 1400,
                                    items: [],
                                }
                            })}
                            className="flex items-center space-x-1 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Base Adonan</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {baseRecipes.map(br => (
                            <div key={br.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div>
                                        <span className="text-[10px] font-mono font-bold text-amber-700 block">{br.code}</span>
                                        <h4 className="text-sm font-black text-slate-900">{br.name}</h4>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1 font-mono text-xs font-black text-amber-900">
                                            Yield: {br.yield_ml} ml
                                        </span>
                                        <button
                                            onClick={() => setModalConfig({
                                                isOpen: true,
                                                entityType: 'batch',
                                                mode: 'edit',
                                                formData: { ...br, items: (br.items || []).map(x => ({ ...x })) }
                                            })}
                                            className="p-1.5 text-slate-500 hover:text-amber-700"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 text-xs">
                                    {(br.items || []).map((it, idx) => (
                                        <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-1.5">
                                            <span className="font-bold text-slate-700">
                                                {it.ingredient ? it.ingredient.name : (it.child_base_recipe ? `[NESTED] ${it.child_base_recipe.name}` : 'Komponen')}
                                            </span>
                                            <span className="font-mono font-bold text-slate-900">
                                                {Number(it.quantity)} {it.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. TAB LAYER 3: 54 MENUS & 4-TIER HARGA */}
            {activeTab === 'menu2' && (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-700">54 Menu LISTMENUAMK (Urutan Baku 1..54 &bull; 4-Tier Harga)</span>
                        <button
                            onClick={() => setModalConfig({
                                isOpen: true,
                                entityType: 'menu2',
                                mode: 'create',
                                formData: {
                                    sort_order: menu2Items.length + 1,
                                    name: '',
                                    menu_group: 'amk_reguler',
                                    report_category: 'amk_murni',
                                    cup_ingredient_id: ingredients.find(i => i.code === 'CUP_12_AMK')?.id || '',
                                    is_active: true,
                                    tier_prices: { all_outlet: 8000, tp1: 8000, ptc: 8000, tp2: '' },
                                    recipe_items: [],
                                }
                            })}
                            className="flex items-center space-x-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Menu</span>
                        </button>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-3.5">No</th>
                                        <th className="px-3 py-3.5">Nama Menu</th>
                                        <th className="px-3 py-3.5">Kelompok & Kategori</th>
                                        <th className="px-3 py-3.5">Gelas / Cup</th>
                                        <th className="px-3 py-3.5">Resep BOM</th>
                                        <th className="px-3 py-3.5 text-right">All Outlet</th>
                                        <th className="px-3 py-3.5 text-right">TP-1</th>
                                        <th className="px-3 py-3.5 text-right">PTC</th>
                                        <th className="px-3 py-3.5 text-right">TP-2</th>
                                        <th className="px-3 py-3.5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {menu2Items.map(item => {
                                        const pAll = getTierPrice(item, 'all_outlet');
                                        const pTp1 = getTierPrice(item, 'tp1');
                                        const pPtc = getTierPrice(item, 'ptc');
                                        const pTp2 = getTierPrice(item, 'tp2');

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/80">
                                                <td className="px-3 py-3 font-mono font-bold text-slate-400">#{item.sort_order}</td>
                                                <td className="px-3 py-3 font-bold text-slate-900">{item.name}</td>
                                                <td className="px-3 py-3">
                                                    <span className="font-bold text-indigo-700 block text-[11px]">{item.menu_group}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">report: {item.report_category}</span>
                                                </td>
                                                <td className="px-3 py-3 font-mono text-[11px] text-slate-600">
                                                    {item.cup_ingredient?.code || '-'}
                                                </td>
                                                <td className="px-3 py-3 text-[11px] text-slate-600">
                                                    {(item.recipe_items || []).map((ri, rIdx) => (
                                                        <span key={rIdx} className="inline-block mr-1.5 mb-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">
                                                            {ri.base_recipe?.code || ri.ingredient?.code} {Number(ri.quantity)}{ri.input_unit}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td className="px-3 py-3 text-right font-mono font-bold">{pAll !== null ? formatRupiah(pAll) : '-'}</td>
                                                <td className="px-3 py-3 text-right font-mono font-bold">{pTp1 !== null ? formatRupiah(pTp1) : '-'}</td>
                                                <td className="px-3 py-3 text-right font-mono font-bold">{pPtc !== null ? formatRupiah(pPtc) : '-'}</td>
                                                <td className="px-3 py-3 text-right font-mono font-bold text-amber-700">{pTp2 !== null ? formatRupiah(pTp2) : '-'}</td>
                                                <td className="px-3 py-3 text-center">
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <button
                                                            onClick={() => setModalConfig({
                                                                isOpen: true,
                                                                entityType: 'menu2',
                                                                mode: 'edit',
                                                                formData: {
                                                                    ...item,
                                                                    tier_prices: {
                                                                        all_outlet: pAll ?? '',
                                                                        tp1: pTp1 ?? '',
                                                                        ptc: pPtc ?? '',
                                                                        tp2: pTp2 ?? '',
                                                                    },
                                                                    recipe_items: (item.recipe_items || []).map(r => ({ ...r })),
                                                                }
                                                            })}
                                                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSingle(`/api/master-data/menu2/${item.id}`, `Menu ${item.name}`)}
                                                            className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. TAB SPG */}
            {activeTab === 'spg' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-700">{spgList.length} Akun SPG</span>
                        <button
                            onClick={() => setModalConfig({
                                isOpen: true,
                                entityType: 'spg',
                                mode: 'create',
                                formData: { id_spg: `SPG${spgList.length + 1}`, name: '', username: '', pin_plain: '1234', status_aktif: true }
                            })}
                            className="flex items-center space-x-1 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah SPG</span>
                        </button>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3.5">ID SPG</th>
                                    <th className="px-4 py-3.5">Nama</th>
                                    <th className="px-4 py-3.5">Username</th>
                                    <th className="px-4 py-3.5">PIN</th>
                                    <th className="px-4 py-3.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {spgList.map(u => (
                                    <tr key={u.id}>
                                        <td className="px-4 py-3 font-mono font-bold">{u.id_spg}</td>
                                        <td className="px-4 py-3 font-bold">{u.name}</td>
                                        <td className="px-4 py-3 font-mono">@{u.username}</td>
                                        <td className="px-4 py-3 font-mono">{u.pin_plain}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setModalConfig({ isOpen: true, entityType: 'spg', mode: 'edit', formData: { ...u } })}
                                                className="p-1.5 text-slate-600 hover:text-amber-700"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSingle(`/api/master-data/spg/${u.id}`, u.name)}
                                                className="p-1.5 text-slate-600 hover:text-rose-600"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* RESET MODAL */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center space-x-2 text-rose-600">
                            <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
                            <h3 className="text-base font-black text-slate-900">Bersihkan Riwayat Transaksi Uji Coba</h3>
                        </div>
                        <p className="text-xs text-slate-600">
                            Semua data transaksi harian (Menu 1, Menu 2, Menu 3, Opname) akan dikosongkan tanpa menghapus Master Data.
                        </p>
                        <div className="flex space-x-2 pt-2">
                            <button onClick={() => setShowResetModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700">Batal</button>
                            <button disabled={resetting} onClick={handleResetOperational} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-black text-white">
                                {resetting ? 'Membersihkan...' : 'Ya, Bersihkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE / EDIT MODAL */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-900">
                                {modalConfig.mode === 'create' ? 'Tambah' : 'Edit'} Data Master
                            </h3>
                            <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEntity} className="space-y-3.5 text-xs">
                            {modalConfig.entityType === 'stand' && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="font-bold block mb-1">Kode Stand</label>
                                            <input type="text" required value={modalConfig.formData.kode_stand || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, kode_stand: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold" />
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Nama Outlet</label>
                                            <input type="text" required value={modalConfig.formData.nama_stand || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, nama_stand: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="font-bold block mb-1">Wilayah</label>
                                            <input type="text" value={modalConfig.formData.wilayah_laporan || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, wilayah_laporan: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Blok WA</label>
                                            <select value={modalConfig.formData.blok_wa || 'Blok 1'} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, blok_wa: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold">
                                                <option value="Blok 1">Blok 1</option>
                                                <option value="Blok 2">Blok 2</option>
                                                <option value="Blok 3">Blok 3</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Price Tier</label>
                                            <select value={modalConfig.formData.price_tier || 'all_outlet'} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, price_tier: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold">
                                                <option value="all_outlet">all_outlet</option>
                                                <option value="tp1">tp1</option>
                                                <option value="ptc">ptc</option>
                                                <option value="tp2">tp2</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <label className="flex items-center space-x-2 font-bold">
                                            <input type="checkbox" checked={!!modalConfig.formData.is_premium} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, is_premium: e.target.checked } })} />
                                            <span>Outlet Premium (TP-2)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 font-bold">
                                            <input type="checkbox" checked={!!modalConfig.formData.punya_amkopi} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, punya_amkopi: e.target.checked } })} />
                                            <span>Jual AMKopi</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {modalConfig.entityType === 'ingredient' && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="font-bold block mb-1">Kode Bahan</label>
                                            <input type="text" required value={modalConfig.formData.code || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, code: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold" />
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Nama Bahan</label>
                                            <input type="text" required value={modalConfig.formData.name || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, name: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="font-bold block mb-1">Kategori</label>
                                            <select value={modalConfig.formData.category || 'amk'} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, category: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold">
                                                <option value="packaging">packaging</option>
                                                <option value="amk">amk</option>
                                                <option value="amkopi">amkopi</option>
                                                <option value="kurma">kurma</option>
                                                <option value="retail">retail</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Dashboard Tier</label>
                                            <select value={modalConfig.formData.dashboard_tier || 1} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, dashboard_tier: parseInt(e.target.value) } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold">
                                                <option value={1}>Tier 1 (Highlight)</option>
                                                <option value={2}>Tier 2 (Detail)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Satuan Dasar</label>
                                            <input type="text" required value={modalConfig.formData.base_unit || 'ml'} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, base_unit: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="font-bold block mb-1">Satuan Konversi</label>
                                            <input type="text" placeholder="botol / kg" value={modalConfig.formData.conversion_unit || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, conversion_unit: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Faktor Konversi</label>
                                            <input type="number" step="any" placeholder="1500 / 1000" value={modalConfig.formData.conversion_factor || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, conversion_factor: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono" />
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Massa Jenis (g/ml)</label>
                                            <input type="number" step="any" placeholder="0.85 / 0.50" value={modalConfig.formData.density_g_per_ml || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, density_g_per_ml: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="font-bold block mb-1">Catatan (Notes)</label>
                                        <input type="text" value={modalConfig.formData.notes || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, notes: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                                    </div>
                                </>
                            )}

                            {modalConfig.entityType === 'batch' && (
                                <>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="font-bold block mb-1">Kode Base</label>
                                            <input type="text" required value={modalConfig.formData.code || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, code: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold" />
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Nama Base</label>
                                            <input type="text" required value={modalConfig.formData.name || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, name: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Yield (ml)</label>
                                            <input type="number" step="any" required value={modalConfig.formData.yield_ml || 1400} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, yield_ml: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {modalConfig.entityType === 'menu2' && (
                                <>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="font-bold block mb-1">Urutan (1..54)</label>
                                            <input type="number" required value={modalConfig.formData.sort_order || 1} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, sort_order: parseInt(e.target.value) } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="font-bold block mb-1">Nama Menu</label>
                                            <input type="text" required value={modalConfig.formData.name || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, name: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="font-bold block mb-1">Kelompok Menu</label>
                                            <select value={modalConfig.formData.menu_group || 'amk_reguler'} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, menu_group: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-2 py-2 font-bold">
                                                <option value="amk_reguler">amk_reguler</option>
                                                <option value="amk_jumbo">amk_jumbo</option>
                                                <option value="amk_premium">amk_premium</option>
                                                <option value="amkopi">amkopi</option>
                                                <option value="amk_kurma">amk_kurma</option>
                                                <option value="kemasan">kemasan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Kategori Laporan</label>
                                            <select value={modalConfig.formData.report_category || 'amk_murni'} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, report_category: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-2 py-2 font-bold">
                                                <option value="amk_murni">amk_murni</option>
                                                <option value="amkopi">amkopi</option>
                                                <option value="kurma">kurma</option>
                                                <option value="kemasan">kemasan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="font-bold block mb-1">Gelas Kemasan</label>
                                            <select value={modalConfig.formData.cup_ingredient_id || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, cup_ingredient_id: e.target.value || null } })} className="w-full rounded-xl border border-slate-300 px-2 py-2 font-bold">
                                                <option value="">Tanpa Gelas</option>
                                                {ingredients.filter(i => i.category === 'packaging').map(c => (
                                                    <option key={c.id} value={c.id}>{c.code}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                                        <span className="font-black uppercase text-[11px] block">4-Tier Harga (Kosongkan jika tidak dijual di tier tsb)</span>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {['all_outlet', 'tp1', 'ptc', 'tp2'].map(t => (
                                                <div key={t}>
                                                    <label className="text-[10px] font-mono font-bold uppercase text-slate-500 block">{t}</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Null"
                                                        value={modalConfig.formData.tier_prices?.[t] ?? ''}
                                                        onChange={e => setModalConfig({
                                                            ...modalConfig,
                                                            formData: {
                                                                ...modalConfig.formData,
                                                                tier_prices: { ...(modalConfig.formData.tier_prices || {}), [t]: e.target.value }
                                                            }
                                                        })}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono font-bold"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {modalConfig.entityType === 'spg' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-bold block mb-1">Nama SPG</label>
                                        <input type="text" required value={modalConfig.formData.name || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, name: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
                                    </div>
                                    <div>
                                        <label className="font-bold block mb-1">Username</label>
                                        <input type="text" required value={modalConfig.formData.username || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, username: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono" />
                                    </div>
                                    <div>
                                        <label className="font-bold block mb-1">PIN / Password</label>
                                        <input type="text" value={modalConfig.formData.pin_plain || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, pin_plain: e.target.value } })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono" />
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex space-x-2">
                                <button type="button" onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-700">Batal</button>
                                <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-amber-600 py-2.5 font-black text-white hover:bg-amber-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
