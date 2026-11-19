import React, { useState, useEffect } from 'react';
import {
    Database, Download, Upload, Plus, Edit2, Trash2, Check, X,
    FileSpreadsheet, Store, Users, Coffee, Boxes, RefreshCw, AlertTriangle,
    Sliders, BookOpen, AlertCircle
} from 'lucide-react';
import {
    downloadTemplate1, downloadTemplate2, downloadTemplate3,
    downloadTemplate4, parseExcelFile
} from '../../utils/excelEngine';
import { formatRupiah } from '../../utils/formatters';

export default function MasterDataExcel() {
    const [activeTab, setActiveTab] = useState('stands'); // stands, spg, menu2, ingredients, menu1, resep
    const [masterData, setMasterData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Selection for bulk operations
    const [selectedIds, setSelectedIds] = useState([]);

    // Modal state for Create / Edit
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        entityType: '', // 'stand', 'spg', 'menu2', 'ingredient', 'menu1_nominal', 'menu1_qty', 'batch', 'mapping'
        mode: 'create', // 'create' or 'edit'
        formData: {},
    });

    // Import Excel Modal state
    const [importModal, setImportModal] = useState({
        isOpen: false,
        templateType: '',
        fileName: '',
        filePayload: null,
        mode: 'append', // 'replace' or 'append'
    });

    // Reset Operational Data Modal state
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

    // Clear selections on tab switch
    useEffect(() => {
        setSelectedIds([]);
    }, [activeTab]);

    const stands = masterData?.stands || [];
    const spgList = masterData?.spg || [];
    const nominals = masterData?.menu1_nominals || [];
    const qtys = masterData?.menu1_qtys || [];
    const menu2Items = masterData?.menu2_items || [];
    const menu2Prices = masterData?.menu2_prices || {};
    const ingredients = masterData?.ingredients || [];
    const params = masterData?.params || [];
    const batches = masterData?.batches || [];
    const mappings = masterData?.mappings || [];

    // Selection helpers
    const handleToggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (items) => {
        const allIds = items.map(i => i.id);
        if (selectedIds.length === allIds.length && allIds.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(allIds);
        }
    };

    // Generic Delete Single
    const handleDeleteSingle = async (url, label) => {
        if (!window.confirm(`Yakin ingin menghapus ${label}? Tindakan ini tidak dapat dibatalkan.`)) return;

        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message || `Data berhasil dihapus.`);
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

    // Generic Bulk Delete
    const handleBulkDelete = async (url, ids, label) => {
        if (ids.length === 0) return;
        if (!window.confirm(`Yakin ingin menghapus ${ids.length} data ${label} terpilih?`)) return;

        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
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

    // Generic Delete All
    const handleDeleteAll = async (url, label) => {
        const confirmWord = prompt(`PERINGATAN: Anda akan MENGHAPUS SEMUA DATA ${label}!\n\nKetik "HAPUS" untuk mengonfirmasi:`);
        if (confirmWord !== 'HAPUS') {
            if (confirmWord !== null) alert('Konfirmasi tidak sesuai. Penghapusan dibatalkan.');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
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

    // Reset All Operational Data
    const handleResetOperational = async () => {
        setResetting(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch('/api/admin/delete-operational-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
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

    // File selection trigger -> opens Import Modal
    const handleFileSelected = async (e, templateType) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const parsedSheets = await parseExcelFile(file);
            setImportModal({
                isOpen: true,
                templateType,
                fileName: file.name,
                filePayload: parsedSheets,
                mode: 'append',
            });
        } catch (err) {
            setError('Gagal membaca file Excel: ' + err.message);
        } finally {
            e.target.value = '';
        }
    };

    // Submit Import Excel with selected mode (replace vs append)
    const handleConfirmImport = async () => {
        setUploading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/master-data/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    template_type: importModal.templateType,
                    import_mode: importModal.mode,
                    payload: importModal.filePayload,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setMessage(data.message || 'Import data berhasil diproses!');
                setImportModal({ isOpen: false, templateType: '', fileName: '', filePayload: null, mode: 'append' });
                fetchMaster();
            } else {
                setError(data.message || 'Gagal import file Excel.');
            }
        } catch (err) {
            setError('Gagal import: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    // Save entity modal form submit
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
        } else if (entityType === 'menu1_nominal') {
            url = mode === 'create' ? '/api/master-data/menu1/nominal' : `/api/master-data/menu1/nominal/${formData.id}`;
        } else if (entityType === 'menu1_qty') {
            url = mode === 'create' ? '/api/master-data/menu1/qty' : `/api/master-data/menu1/qty/${formData.id}`;
        } else if (entityType === 'batch') {
            url = mode === 'create' ? '/api/master-data/resep/batch' : `/api/master-data/resep/batch/${formData.id}`;
        } else if (entityType === 'mapping') {
            url = mode === 'create' ? '/api/master-data/resep/mapping' : `/api/master-data/resep/mapping/${formData.id}`;
        }

        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
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

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
            {/* Header & Reset Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                        Manajemen Master Data & Kontrol Superadmin
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500">
                        Full CRUD (Edit, Hapus Satuan, Hapus Terpilih, Hapus Semua), Import Mode & Reset Dummy
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowResetModal(true)}
                        className="flex items-center space-x-1.5 rounded-2xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Bersihkan Data Uji Coba</span>
                    </button>

                    <button
                        onClick={fetchMaster}
                        className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:text-amber-600 active:scale-95 shadow-xs"
                        title="Segarkan Data"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Notifications */}
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

            {/* 4 Excel Templates Download & Upload Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Template 1 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900">
                        <Store className="h-5 w-5 text-amber-600" />
                        <h4 className="text-xs font-black uppercase">Template 1: Stand & SPG</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                        Master Stand (Blok 1, 2, 3) & Akun Login SPG
                    </p>
                    <div className="flex space-x-2 pt-1">
                        <button
                            onClick={() => downloadTemplate1(stands, spgList)}
                            className="flex-1 flex items-center justify-center space-x-1 rounded-xl bg-amber-50 border border-amber-200 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                        </button>
                        <label className="flex-1 flex items-center justify-center space-x-1 rounded-xl bg-slate-100 border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload</span>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => handleFileSelected(e, 'template1')}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Template 2 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                        <h4 className="text-xs font-black uppercase">Template 2: Menu 1 Config</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                        Kategori Nominal & Item QTY Laporan Harian
                    </p>
                    <div className="flex space-x-2 pt-1">
                        <button
                            onClick={() => downloadTemplate2(nominals, qtys)}
                            className="flex-1 flex items-center justify-center space-x-1 rounded-xl bg-blue-50 border border-blue-200 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                        </button>
                        <label className="flex-1 flex items-center justify-center space-x-1 rounded-xl bg-slate-100 border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload</span>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => handleFileSelected(e, 'template2')}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Template 3 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900">
                        <Coffee className="h-5 w-5 text-indigo-600" />
                        <h4 className="text-xs font-black uppercase">Template 3: Menu 2 & Harga</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                        Daftar 27+ Item & Matriks Harga per Stand
                    </p>
                    <div className="flex space-x-2 pt-1">
                        <button
                            onClick={() => downloadTemplate3(menu2Items, stands, menu2Prices)}
                            className="flex-1 flex items-center justify-center space-x-1 rounded-xl bg-indigo-50 border border-indigo-200 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                        </button>
                        <label className="flex-1 flex items-center justify-center space-x-1 rounded-xl bg-slate-100 border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload</span>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => handleFileSelected(e, 'template3')}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Template 4 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900">
                        <Boxes className="h-5 w-5 text-teal-600" />
                        <h4 className="text-xs font-black uppercase">Template 4: Resep AMK</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                        4 Sheet: Bahan, Resep Global, Batch & Mapping
                    </p>
                    <div className="flex space-x-2 pt-1">
                        <button
                            onClick={() => downloadTemplate4(ingredients, params, batches, mappings, stands)}
                            className="flex-1 flex items-center justify-center space-x-1 rounded-xl bg-teal-50 border border-teal-200 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                        </button>
                        <label className="flex-1 flex items-center justify-center space-x-1 rounded-xl bg-slate-100 border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload</span>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => handleFileSelected(e, 'template4')}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Sub-tabs for UI Table Management */}
            <div className="flex overflow-x-auto border-b border-slate-200 space-x-2">
                <button
                    onClick={() => setActiveTab('stands')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'stands' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    Master Stand ({stands.length})
                </button>
                <button
                    onClick={() => setActiveTab('spg')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'spg' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    Master SPG & Login ({spgList.length})
                </button>
                <button
                    onClick={() => setActiveTab('menu2')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'menu2' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    Menu 2 & Harga Stand ({menu2Items.length})
                </button>
                <button
                    onClick={() => setActiveTab('ingredients')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'ingredients' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    Bahan Baku (Menu 3) ({ingredients.length})
                </button>
                <button
                    onClick={() => setActiveTab('menu1')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'menu1' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    Konfigurasi Menu 1 ({nominals.length + qtys.length})
                </button>
                <button
                    onClick={() => setActiveTab('resep')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'resep' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    Resep & Batch Dapur ({mappings.length + batches.length})
                </button>
            </div>

            {/* TAB CONTENT & CRUD TOOLBAR */}
            <div className="space-y-3">
                {/* 1. STANDS TAB */}
                {activeTab === 'stands' && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-700">
                                    {selectedIds.length} terpilih dari {stands.length} stand
                                </span>
                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={() => handleBulkDelete('/api/master-data/stand/bulk-delete', selectedIds, 'Stand')}
                                        className="flex items-center space-x-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Hapus Terpilih ({selectedIds.length})</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setModalConfig({
                                        isOpen: true,
                                        entityType: 'stand',
                                        mode: 'create',
                                        formData: {
                                            kode_stand: `ST${stands.length + 1}`,
                                            nama_stand: '',
                                            wilayah_laporan: 'WILAYAH 1',
                                            blok_wa: 'BLOK 1',
                                            urutan_tampil: stands.length + 1,
                                            punya_amkopi: false,
                                            tampilkan_csdng_wa: true,
                                            tampilkan_ptt_wa: true,
                                            status_aktif: true,
                                        }
                                    })}
                                    className="flex items-center space-x-1 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Tambah Stand</span>
                                </button>

                                <button
                                    onClick={() => handleDeleteAll('/api/master-data/stand/delete-all', 'STAND')}
                                    className="flex items-center space-x-1 rounded-xl bg-rose-100 border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-200"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Hapus Semua Stand</span>
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3.5 w-8">
                                                <input
                                                    type="checkbox"
                                                    checked={stands.length > 0 && selectedIds.length === stands.length}
                                                    onChange={() => handleSelectAll(stands)}
                                                    className="rounded border-slate-300"
                                                />
                                            </th>
                                            <th className="px-4 py-3.5">Kode</th>
                                            <th className="px-4 py-3.5">Nama Stand</th>
                                            <th className="px-4 py-3.5">Wilayah</th>
                                            <th className="px-4 py-3.5">Blok WA</th>
                                            <th className="px-4 py-3.5 text-center">Urutan</th>
                                            <th className="px-4 py-3.5 text-center">AMKopi?</th>
                                            <th className="px-4 py-3.5 text-center">Status</th>
                                            <th className="px-4 py-3.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {stands.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                                                    Belum ada data Stand. Tambah baru atau upload via Template 1.
                                                </td>
                                            </tr>
                                        ) : (
                                            stands.map(s => (
                                                <tr key={s.id} className="hover:bg-slate-50/80">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(s.id)}
                                                            onChange={() => handleToggleSelect(s.id)}
                                                            className="rounded border-slate-300"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{s.kode_stand}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-900">{s.nama_stand}</td>
                                                    <td className="px-4 py-3">{s.wilayah_laporan}</td>
                                                    <td className="px-4 py-3 font-bold text-amber-700">{s.blok_wa}</td>
                                                    <td className="px-4 py-3 text-center">{s.urutan_tampil}</td>
                                                    <td className="px-4 py-3 text-center">{s.punya_amkopi ? 'Ya' : 'Tidak'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                            {s.status_aktif ? 'Aktif' : 'Non-Aktif'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center space-x-1.5">
                                                            <button
                                                                onClick={() => setModalConfig({
                                                                    isOpen: true,
                                                                    entityType: 'stand',
                                                                    mode: 'edit',
                                                                    formData: { ...s }
                                                                })}
                                                                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-700"
                                                                title="Edit Stand"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSingle(`/api/master-data/stand/${s.id}`, `Stand ${s.nama_stand}`)}
                                                                className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                                                title="Hapus Stand"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SPG TAB */}
                {activeTab === 'spg' && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-700">
                                    {selectedIds.length} terpilih dari {spgList.length} SPG
                                </span>
                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={() => handleBulkDelete('/api/master-data/spg/bulk-delete', selectedIds, 'SPG')}
                                        className="flex items-center space-x-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Hapus Terpilih ({selectedIds.length})</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setModalConfig({
                                        isOpen: true,
                                        entityType: 'spg',
                                        mode: 'create',
                                        formData: {
                                            id_spg: `SPG${spgList.length + 1}`,
                                            name: '',
                                            username: '',
                                            pin_plain: '1234',
                                            status_aktif: true,
                                        }
                                    })}
                                    className="flex items-center space-x-1 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Tambah SPG</span>
                                </button>

                                <button
                                    onClick={() => handleDeleteAll('/api/master-data/spg/delete-all', 'SPG & LOGIN')}
                                    className="flex items-center space-x-1 rounded-xl bg-rose-100 border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-200"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Hapus Semua Data SPG</span>
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3.5 w-8">
                                                <input
                                                    type="checkbox"
                                                    checked={spgList.length > 0 && selectedIds.length === spgList.length}
                                                    onChange={() => handleSelectAll(spgList)}
                                                    className="rounded border-slate-300"
                                                />
                                            </th>
                                            <th className="px-4 py-3.5">ID SPG</th>
                                            <th className="px-4 py-3.5">Nama Lengkap</th>
                                            <th className="px-4 py-3.5">Username Login</th>
                                            <th className="px-4 py-3.5">PIN / Password</th>
                                            <th className="px-4 py-3.5 text-center">Status</th>
                                            <th className="px-4 py-3.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {spgList.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                                                    Belum ada data SPG. Tambah baru atau upload via Template 1.
                                                </td>
                                            </tr>
                                        ) : (
                                            spgList.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50/80">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(u.id)}
                                                            onChange={() => handleToggleSelect(u.id)}
                                                            className="rounded border-slate-300"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-bold text-amber-800">{u.id_spg}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                                                    <td className="px-4 py-3 font-mono text-slate-600">@{u.username}</td>
                                                    <td className="px-4 py-3 font-mono text-slate-600">{u.pin_plain || '1234'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                            {u.status_aktif ? 'Aktif' : 'Non-Aktif'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center space-x-1.5">
                                                            <button
                                                                onClick={() => setModalConfig({
                                                                    isOpen: true,
                                                                    entityType: 'spg',
                                                                    mode: 'edit',
                                                                    formData: { ...u, pin_plain: u.pin_plain || '' }
                                                                })}
                                                                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-700"
                                                                title="Edit SPG"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSingle(`/api/master-data/spg/${u.id}`, `SPG ${u.name}`)}
                                                                className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                                                title="Hapus SPG"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. MENU 2 TAB */}
                {activeTab === 'menu2' && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-700">
                                    {selectedIds.length} terpilih dari {menu2Items.length} menu
                                </span>
                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={() => handleBulkDelete('/api/master-data/menu2/bulk-delete', selectedIds, 'Menu 2')}
                                        className="flex items-center space-x-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Hapus Item Terpilih ({selectedIds.length})</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setModalConfig({
                                        isOpen: true,
                                        entityType: 'menu2',
                                        mode: 'create',
                                        formData: {
                                            kelompok_menu: 'AMK TEA',
                                            kode_item: `M2_${menu2Items.length + 1}`,
                                            nama_item: '',
                                            harga_default: 15000,
                                            urutan_tampil: menu2Items.length + 1,
                                            status_aktif: true,
                                            recipe_status: 'Unmapped',
                                            prices: {},
                                        }
                                    })}
                                    className="flex items-center space-x-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Tambah Menu 2</span>
                                </button>

                                <button
                                    onClick={() => handleDeleteAll('/api/master-data/menu2/delete-all', 'MENU 2 & HARGA STAND')}
                                    className="flex items-center space-x-1 rounded-xl bg-rose-100 border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-200"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Hapus Semua Menu 2</span>
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3.5 w-8">
                                                <input
                                                    type="checkbox"
                                                    checked={menu2Items.length > 0 && selectedIds.length === menu2Items.length}
                                                    onChange={() => handleSelectAll(menu2Items)}
                                                    className="rounded border-slate-300"
                                                />
                                            </th>
                                            <th className="px-4 py-3.5">Kelompok</th>
                                            <th className="px-4 py-3.5">Kode</th>
                                            <th className="px-4 py-3.5">Nama Menu</th>
                                            <th className="px-4 py-3.5 text-right">Harga Default</th>
                                            <th className="px-4 py-3.5 text-center">Status Resep</th>
                                            <th className="px-4 py-3.5 text-center">Status</th>
                                            <th className="px-4 py-3.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {menu2Items.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                                                    Belum ada data Menu 2. Tambah baru atau upload via Template 3.
                                                </td>
                                            </tr>
                                        ) : (
                                            menu2Items.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50/80">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(item.id)}
                                                            onChange={() => handleToggleSelect(item.id)}
                                                            className="rounded border-slate-300"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-indigo-700">{item.kelompok_menu}</td>
                                                    <td className="px-4 py-3 font-mono text-slate-600">{item.kode_item}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-900">{item.nama_item}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                                        {formatRupiah(item.harga_default)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.recipe_status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                                            {item.recipe_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                            {item.status_aktif ? 'Aktif' : 'Non-Aktif'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center space-x-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    const itemPrices = {};
                                                                    stands.forEach(s => {
                                                                        itemPrices[s.id] = menu2Prices[item.id]?.[s.id] || item.harga_default;
                                                                    });
                                                                    setModalConfig({
                                                                        isOpen: true,
                                                                        entityType: 'menu2',
                                                                        mode: 'edit',
                                                                        formData: { ...item, prices: itemPrices }
                                                                    });
                                                                }}
                                                                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
                                                                title="Edit Menu 2"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSingle(`/api/master-data/menu2/${item.id}`, `Menu ${item.nama_item}`)}
                                                                className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                                                title="Hapus Menu 2"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. INGREDIENTS TAB */}
                {activeTab === 'ingredients' && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-700">
                                    {selectedIds.length} terpilih dari {ingredients.length} bahan baku
                                </span>
                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={() => handleBulkDelete('/api/master-data/ingredient/bulk-delete', selectedIds, 'Bahan Baku')}
                                        className="flex items-center space-x-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Hapus Terpilih ({selectedIds.length})</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setModalConfig({
                                        isOpen: true,
                                        entityType: 'ingredient',
                                        mode: 'create',
                                        formData: {
                                            kode_bahan: `RAW_${ingredients.length + 1}`,
                                            nama_bahan_baku: '',
                                            kategori_bahan: 'Bahan Tambahan',
                                            satuan: 'ml',
                                            link_kode_qty_menu1: '',
                                            urutan_tampil: ingredients.length + 1,
                                            is_resep_amk_core: true,
                                            status_aktif: true,
                                        }
                                    })}
                                    className="flex items-center space-x-1 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Tambah Bahan Baku</span>
                                </button>

                                <button
                                    onClick={() => handleDeleteAll('/api/master-data/ingredient/delete-all', 'BAHAN BAKU (MENU 3)')}
                                    className="flex items-center space-x-1 rounded-xl bg-rose-100 border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-200"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Hapus Semua Bahan Baku</span>
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3.5 w-8">
                                                <input
                                                    type="checkbox"
                                                    checked={ingredients.length > 0 && selectedIds.length === ingredients.length}
                                                    onChange={() => handleSelectAll(ingredients)}
                                                    className="rounded border-slate-300"
                                                />
                                            </th>
                                            <th className="px-4 py-3.5">Kode Bahan</th>
                                            <th className="px-4 py-3.5">Nama Bahan Baku</th>
                                            <th className="px-4 py-3.5">Kategori</th>
                                            <th className="px-4 py-3.5 text-center">Satuan</th>
                                            <th className="px-4 py-3.5">Link QTY Menu 1</th>
                                            <th className="px-4 py-3.5 text-center">Core RESEPAMK?</th>
                                            <th className="px-4 py-3.5 text-center">Status</th>
                                            <th className="px-4 py-3.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {ingredients.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                                                    Belum ada data Bahan Baku. Tambah baru atau upload via Template 4.
                                                </td>
                                            </tr>
                                        ) : (
                                            ingredients.map(ing => (
                                                <tr key={ing.id} className="hover:bg-slate-50/80">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(ing.id)}
                                                            onChange={() => handleToggleSelect(ing.id)}
                                                            className="rounded border-slate-300"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-bold text-teal-800">{ing.kode_bahan}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-900">{ing.nama_bahan_baku}</td>
                                                    <td className="px-4 py-3">{ing.kategori_bahan}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-700">{ing.satuan}</td>
                                                    <td className="px-4 py-3 font-mono text-slate-500">{ing.link_kode_qty_menu1 || '-'}</td>
                                                    <td className="px-4 py-3 text-center">{ing.is_resep_amk_core ? 'Ya' : 'Tidak'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ing.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                            {ing.status_aktif ? 'Aktif' : 'Non-Aktif'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center space-x-1.5">
                                                            <button
                                                                onClick={() => setModalConfig({
                                                                    isOpen: true,
                                                                    entityType: 'ingredient',
                                                                    mode: 'edit',
                                                                    formData: { ...ing }
                                                                })}
                                                                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-teal-700"
                                                                title="Edit Bahan Baku"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSingle(`/api/master-data/ingredient/${ing.id}`, `Bahan Baku ${ing.nama_bahan_baku}`)}
                                                                className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                                                title="Hapus Bahan Baku"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. MENU 1 CONFIG TAB */}
                {activeTab === 'menu1' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <span className="text-xs font-bold text-slate-700">
                                Konfigurasi Baris Nominal ({nominals.length}) & Baris QTY ({qtys.length})
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleDeleteAll('/api/master-data/menu1/delete-all', 'KONFIGURASI MENU 1')}
                                    className="flex items-center space-x-1 rounded-xl bg-rose-100 border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-200"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Hapus Semua Menu 1</span>
                                </button>
                            </div>
                        </div>

                        {/* Nominals Table */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase text-blue-900">Kategori Nominal Menu 1</h4>
                                <button
                                    onClick={() => setModalConfig({
                                        isOpen: true,
                                        entityType: 'menu1_nominal',
                                        mode: 'create',
                                        formData: {
                                            kode_nominal: `NOM_${nominals.length + 1}`,
                                            nama_kategori: '',
                                            tipe_kategori: 'Pemasukan',
                                            urutan_tampil: nominals.length + 1,
                                            is_mandatory: false,
                                            status_aktif: true,
                                        }
                                    })}
                                    className="flex items-center space-x-1 rounded-xl bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700"
                                >
                                    <Plus className="h-3 w-3" />
                                    <span>Tambah Nominal</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2.5">Kode</th>
                                            <th className="px-3 py-2.5">Nama Kategori</th>
                                            <th className="px-3 py-2.5">Tipe</th>
                                            <th className="px-3 py-2.5 text-center">Urutan</th>
                                            <th className="px-3 py-2.5 text-center">Status</th>
                                            <th className="px-3 py-2.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {nominals.map(nom => (
                                            <tr key={nom.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 font-mono font-bold">{nom.kode_nominal}</td>
                                                <td className="px-3 py-2 font-bold text-slate-900">{nom.nama_kategori}</td>
                                                <td className="px-3 py-2">{nom.tipe_kategori}</td>
                                                <td className="px-3 py-2 text-center">{nom.urutan_tampil}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${nom.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                        {nom.status_aktif ? 'Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <button
                                                            onClick={() => setModalConfig({
                                                                isOpen: true,
                                                                entityType: 'menu1_nominal',
                                                                mode: 'edit',
                                                                formData: { ...nom }
                                                            })}
                                                            className="p-1 text-slate-500 hover:text-blue-600"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSingle(`/api/master-data/menu1/nominal/${nom.id}`, `Nominal ${nom.nama_kategori}`)}
                                                            className="p-1 text-slate-500 hover:text-rose-600"
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

                        {/* QTY Table */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase text-blue-900">Item QTY Menu 1</h4>
                                <button
                                    onClick={() => setModalConfig({
                                        isOpen: true,
                                        entityType: 'menu1_qty',
                                        mode: 'create',
                                        formData: {
                                            kode_qty: `QTY_${qtys.length + 1}`,
                                            nama_item_qty: '',
                                            satuan: 'pcs',
                                            urutan_tampil: qtys.length + 1,
                                            is_mandatory: false,
                                            status_aktif: true,
                                        }
                                    })}
                                    className="flex items-center space-x-1 rounded-xl bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700"
                                >
                                    <Plus className="h-3 w-3" />
                                    <span>Tambah QTY</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2.5">Kode</th>
                                            <th className="px-3 py-2.5">Nama Item QTY</th>
                                            <th className="px-3 py-2.5 text-center">Satuan</th>
                                            <th className="px-3 py-2.5 text-center">Urutan</th>
                                            <th className="px-3 py-2.5 text-center">Status</th>
                                            <th className="px-3 py-2.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {qtys.map(q => (
                                            <tr key={q.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 font-mono font-bold">{q.kode_qty}</td>
                                                <td className="px-3 py-2 font-bold text-slate-900">{q.nama_item_qty}</td>
                                                <td className="px-3 py-2 text-center">{q.satuan}</td>
                                                <td className="px-3 py-2 text-center">{q.urutan_tampil}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                        {q.status_aktif ? 'Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <button
                                                            onClick={() => setModalConfig({
                                                                isOpen: true,
                                                                entityType: 'menu1_qty',
                                                                mode: 'edit',
                                                                formData: { ...q }
                                                            })}
                                                            className="p-1 text-slate-500 hover:text-blue-600"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSingle(`/api/master-data/menu1/qty/${q.id}`, `Item QTY ${q.nama_item_qty}`)}
                                                            className="p-1 text-slate-500 hover:text-rose-600"
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

                {/* 6. RESEP & BATCH TAB */}
                {activeTab === 'resep' && (
                    <div className="space-y-4">
                        {/* Batches Table */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase text-amber-900">Rasio Batch Dapur / Galon (Lapis 2)</h4>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setModalConfig({
                                            isOpen: true,
                                            entityType: 'batch',
                                            mode: 'create',
                                            formData: {
                                                nama_batch: '',
                                                volume_batch_ml: 1000,
                                                teh_celup_bag: 0,
                                                air_teh_ml: 0,
                                                sirup_biang_amk_ml: 0,
                                                sirup_premix_ml: 0,
                                                air_adonan_ml: 0,
                                                gula_pasir_ml: 0,
                                                status_aktif: true,
                                            }
                                        })}
                                        className="flex items-center space-x-1 rounded-xl bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700"
                                    >
                                        <Plus className="h-3 w-3" />
                                        <span>Tambah Batch</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAll('/api/master-data/resep/batch/delete-all', 'BATCH DAPUR')}
                                        className="rounded-xl bg-rose-100 border border-rose-300 px-2.5 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-200"
                                    >
                                        Hapus Semua Batch
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2.5">Nama Batch</th>
                                            <th className="px-3 py-2.5 text-right">Volume (ml)</th>
                                            <th className="px-3 py-2.5 text-right">Teh (bag)</th>
                                            <th className="px-3 py-2.5 text-right">Biang AMK (ml)</th>
                                            <th className="px-3 py-2.5 text-right">Premix (ml)</th>
                                            <th className="px-3 py-2.5 text-right">Gula (ml)</th>
                                            <th className="px-3 py-2.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {batches.map(b => (
                                            <tr key={b.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 font-bold text-slate-900">{b.nama_batch}</td>
                                                <td className="px-3 py-2 text-right font-mono font-bold">{b.volume_batch_ml}</td>
                                                <td className="px-3 py-2 text-right font-mono">{b.teh_celup_bag}</td>
                                                <td className="px-3 py-2 text-right font-mono">{b.sirup_biang_amk_ml}</td>
                                                <td className="px-3 py-2 text-right font-mono">{b.sirup_premix_ml}</td>
                                                <td className="px-3 py-2 text-right font-mono">{b.gula_pasir_ml}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <button
                                                            onClick={() => setModalConfig({
                                                                isOpen: true,
                                                                entityType: 'batch',
                                                                mode: 'edit',
                                                                formData: { ...b }
                                                            })}
                                                            className="p-1 text-slate-500 hover:text-amber-700"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSingle(`/api/master-data/resep/batch/${b.id}`, `Batch ${b.nama_batch}`)}
                                                            className="p-1 text-slate-500 hover:text-rose-600"
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

                        {/* Mappings Table */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center space-x-2">
                                    <h4 className="text-xs font-black uppercase text-teal-900">Mapping Resep Menu 2</h4>
                                    {selectedIds.length > 0 && (
                                        <button
                                            onClick={() => handleBulkDelete('/api/master-data/resep/mapping/bulk-delete', selectedIds, 'Mapping Resep')}
                                            className="flex items-center space-x-1 rounded-xl bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            <span>Hapus Terpilih ({selectedIds.length})</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setModalConfig({
                                            isOpen: true,
                                            entityType: 'mapping',
                                            mode: 'create',
                                            formData: {
                                                menu2_item_id: menu2Items[0]?.id || '',
                                                tipe_takaran: 'percent',
                                                adonan_amk_dingin_pct: 100,
                                                adonan_amk_tea_pct: 0,
                                                adonan_peach_pct: 0,
                                                adonan_mocca_pct: 0,
                                                adonan_kiwi_pct: 0,
                                                creamer_ml: 0,
                                                coffee_ml: 0,
                                                perasa_orange_ml: 0,
                                                perasa_lime_ml: 0,
                                                perasa_guava_ml: 0,
                                                oreo_pcs: 0,
                                                lengkeng_porsi: 0,
                                                status_resep: 'Active',
                                            }
                                        })}
                                        className="flex items-center space-x-1 rounded-xl bg-teal-600 px-3 py-1 text-xs font-bold text-white hover:bg-teal-700"
                                    >
                                        <Plus className="h-3 w-3" />
                                        <span>Tambah Mapping</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAll('/api/master-data/resep/mapping/delete-all', 'MAPPING RESEP')}
                                        className="rounded-xl bg-rose-100 border border-rose-300 px-2.5 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-200"
                                    >
                                        Hapus Semua Mapping
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2.5 w-8">
                                                <input
                                                    type="checkbox"
                                                    checked={mappings.length > 0 && selectedIds.length === mappings.length}
                                                    onChange={() => handleSelectAll(mappings)}
                                                    className="rounded border-slate-300"
                                                />
                                            </th>
                                            <th className="px-3 py-2.5">Menu Item</th>
                                            <th className="px-3 py-2.5">Tipe Takaran</th>
                                            <th className="px-3 py-2.5 text-center">Status</th>
                                            <th className="px-3 py-2.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {mappings.map(m => {
                                            const itemObj = menu2Items.find(i => i.id === m.menu2_item_id);
                                            return (
                                                <tr key={m.id} className="hover:bg-slate-50">
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(m.id)}
                                                            onChange={() => handleToggleSelect(m.id)}
                                                            className="rounded border-slate-300"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 font-bold text-slate-900">
                                                        {itemObj ? `${itemObj.kode_item} - ${itemObj.nama_item}` : `Item ID: ${m.menu2_item_id}`}
                                                    </td>
                                                    <td className="px-3 py-2 font-mono text-slate-600">{m.tipe_takaran}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status_resep === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                                            {m.status_resep}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <button
                                                                onClick={() => setModalConfig({
                                                                    isOpen: true,
                                                                    entityType: 'mapping',
                                                                    mode: 'edit',
                                                                    formData: { ...m }
                                                                })}
                                                                className="p-1 text-slate-500 hover:text-teal-700"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSingle(`/api/master-data/resep/mapping/${m.id}`, `Mapping Resep`)}
                                                                className="p-1 text-slate-500 hover:text-rose-600"
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
            </div>

            {/* MODAL 1: IMPORT EXCEL MODE PROMPT (REPLACE ALL VS APPEND) */}
            {importModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center space-x-2">
                                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                                <h3 className="text-base font-black text-slate-900">
                                    Konfirmasi Mode Import Excel
                                </h3>
                            </div>
                            <button
                                onClick={() => setImportModal({ ...importModal, isOpen: false })}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
                            <span className="font-bold block text-slate-900">File Terpilih:</span>
                            <span className="font-mono">{importModal.fileName}</span>
                            <span className="block mt-1 text-[11px] text-slate-500">
                                Template: <strong className="uppercase">{importModal.templateType}</strong>
                            </span>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-bold uppercase text-slate-700">
                                Pilih Cara Import Data:
                            </label>

                            {/* Option 1: Replace All */}
                            <label className={`block rounded-2xl border p-3.5 cursor-pointer transition ${importModal.mode === 'replace' ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="radio"
                                        name="import_mode"
                                        value="replace"
                                        checked={importModal.mode === 'replace'}
                                        onChange={() => setImportModal({ ...importModal, mode: 'replace' })}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <h4 className="text-xs font-black text-rose-900 flex items-center space-x-1.5">
                                            <span>Menimpa / Mengganti Seluruh Data Lama (Replace All)</span>
                                        </h4>
                                        <p className="text-[11px] text-rose-700 mt-1">
                                            Data lama di tabel terkait akan dikosongkan terlebih dahulu, kemudian diisi ulang secara bersih sesuai baris file Excel ini. Cocok untuk membersihkan data dummy.
                                        </p>
                                    </div>
                                </div>
                            </label>

                            {/* Option 2: Append */}
                            <label className={`block rounded-2xl border p-3.5 cursor-pointer transition ${importModal.mode === 'append' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="radio"
                                        name="import_mode"
                                        value="append"
                                        checked={importModal.mode === 'append'}
                                        onChange={() => setImportModal({ ...importModal, mode: 'append' })}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <h4 className="text-xs font-black text-indigo-900">
                                            Menambahkan ke Data Lama (Append & Update)
                                        </h4>
                                        <p className="text-[11px] text-slate-600 mt-1">
                                            Menambahkan baris baru dan memperbarui baris yang sudah ada berdasarkan Kode/ID unik tanpa menghapus data lama lainnya.
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className="pt-2 flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setImportModal({ ...importModal, isOpen: false })}
                                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={uploading}
                                onClick={handleConfirmImport}
                                className={`flex-1 rounded-xl py-2.5 text-xs font-black text-white ${importModal.mode === 'replace' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50`}
                            >
                                {uploading ? 'Memproses Import...' : 'Mulai Import Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: RESET TRANSAKSI UJI COBA */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center space-x-2 text-rose-600">
                            <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
                            <h3 className="text-base font-black text-slate-900">
                                Bersihkan Riwayat Transaksi Uji Coba
                            </h3>
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-2">
                            <p className="font-bold">
                                PERHATIAN: Fitur ini akan mengosongkan:
                            </p>
                            <ul className="list-disc pl-4 space-y-1 text-[11px]">
                                <li>Semua Laporan Harian Menu 1 (Uang & QTY)</li>
                                <li>Semua Rincian Penjualan Menu 2</li>
                                <li>Semua Laporan Pemakaian Bahan Menu 3</li>
                                <li>Semua Log & Pengajuan Stock Opname</li>
                            </ul>
                            <p className="text-[11px] text-emerald-800 font-bold pt-1">
                                ✓ Master Data (Stand, Akun SPG, Menu 2, Bahan Baku, Resep) TIDAK AKAN DIHAPUS.
                            </p>
                        </div>

                        <div className="flex space-x-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowResetModal(false)}
                                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={resetting}
                                onClick={handleResetOperational}
                                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                                {resetting ? 'Membersihkan...' : 'Ya, Bersihkan Transaksi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: ENTITY CREATE / EDIT MODAL */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-900 capitalize">
                                {modalConfig.mode === 'create' ? 'Tambah' : 'Edit'} {modalConfig.entityType.replace('_', ' ')}
                            </h3>
                            <button
                                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEntity} className="space-y-3.5">
                            {/* Stand Form Fields */}
                            {modalConfig.entityType === 'stand' && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Kode Stand</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.kode_stand || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, kode_stand: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Stand</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.nama_stand || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, nama_stand: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah Laporan</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.wilayah_laporan || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, wilayah_laporan: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Blok WA</label>
                                            <select
                                                value={modalConfig.formData.blok_wa || 'BLOK 1'}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, blok_wa: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                            >
                                                <option value="BLOK 1">BLOK 1</option>
                                                <option value="BLOK 2">BLOK 2</option>
                                                <option value="BLOK 3">BLOK 3</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Urutan Tampil</label>
                                            <input
                                                type="number"
                                                required
                                                value={modalConfig.formData.urutan_tampil || 1}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, urutan_tampil: parseInt(e.target.value) || 1 }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                                            />
                                        </div>
                                        <div className="flex items-center pt-5">
                                            <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!modalConfig.formData.status_aktif}
                                                    onChange={(e) => setModalConfig({
                                                        ...modalConfig,
                                                        formData: { ...modalConfig.formData, status_aktif: e.target.checked }
                                                    })}
                                                    className="rounded border-slate-300"
                                                />
                                                <span>Status Aktif</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 pt-1">
                                        <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!modalConfig.formData.punya_amkopi}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, punya_amkopi: e.target.checked }
                                                })}
                                                className="rounded border-slate-300"
                                            />
                                            <span>Punya Menu AMKopi</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!modalConfig.formData.tampilkan_csdng_wa}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, tampilkan_csdng_wa: e.target.checked }
                                                })}
                                                className="rounded border-slate-300"
                                            />
                                            <span>Tampilkan Csdng di WA</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!modalConfig.formData.tampilkan_ptt_wa}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, tampilkan_ptt_wa: e.target.checked }
                                                })}
                                                className="rounded border-slate-300"
                                            />
                                            <span>Tampilkan PTT di WA</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {/* SPG Form Fields */}
                            {modalConfig.entityType === 'spg' && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">ID SPG</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.id_spg || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, id_spg: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.name || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, name: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.username || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, username: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">PIN / Password (4-6 Digit)</label>
                                            <input
                                                type="text"
                                                value={modalConfig.formData.pin_plain || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, pin_plain: e.target.value }
                                                })}
                                                placeholder="Kosongkan jika tidak diubah"
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center pt-2">
                                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!modalConfig.formData.status_aktif}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, status_aktif: e.target.checked }
                                                })}
                                                className="rounded border-slate-300"
                                            />
                                            <span>Status Akun Aktif</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {/* Menu 2 Form Fields */}
                            {modalConfig.entityType === 'menu2' && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Kelompok Menu</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.kelompok_menu || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, kelompok_menu: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Kode Item</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.kode_item || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, kode_item: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Nama Item Menu</label>
                                        <input
                                            type="text"
                                            required
                                            value={modalConfig.formData.nama_item || ''}
                                            onChange={(e) => setModalConfig({
                                                ...modalConfig,
                                                formData: { ...modalConfig.formData, nama_item: e.target.value }
                                            })}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Harga Default (Rp)</label>
                                            <input
                                                type="number"
                                                required
                                                value={modalConfig.formData.harga_default || 0}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, harga_default: parseFloat(e.target.value) || 0 }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Status Resep</label>
                                            <select
                                                value={modalConfig.formData.recipe_status || 'Unmapped'}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, recipe_status: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                            >
                                                <option value="Active">Active (Terpetakan)</option>
                                                <option value="Unmapped">Unmapped (Belum Terpetakan)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Stand Custom Prices Section */}
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                                        <span className="text-[11px] font-black uppercase text-slate-700 block">
                                            Matriks Harga Khusus Stand (Opsional)
                                        </span>
                                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                            {stands.map(s => (
                                                <div key={s.id} className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-700 truncate pr-2 font-medium">{s.kode_stand} - {s.nama_stand}</span>
                                                    <input
                                                        type="number"
                                                        value={modalConfig.formData.prices?.[s.id] ?? modalConfig.formData.harga_default ?? 0}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setModalConfig({
                                                                ...modalConfig,
                                                                formData: {
                                                                    ...modalConfig.formData,
                                                                    prices: { ...modalConfig.formData.prices, [s.id]: val }
                                                                }
                                                            });
                                                        }}
                                                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right font-mono font-bold text-xs"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center pt-1">
                                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!modalConfig.formData.status_aktif}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, status_aktif: e.target.checked }
                                                })}
                                                className="rounded border-slate-300"
                                            />
                                            <span>Status Aktif</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {/* Ingredient Form Fields */}
                            {modalConfig.entityType === 'ingredient' && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Kode Bahan</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.kode_bahan || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, kode_bahan: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.satuan || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, satuan: e.target.value }
                                                })}
                                                placeholder="ml / bag / keping / porsi"
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bahan Baku</label>
                                        <input
                                            type="text"
                                            required
                                            value={modalConfig.formData.nama_bahan_baku || ''}
                                            onChange={(e) => setModalConfig({
                                                ...modalConfig,
                                                formData: { ...modalConfig.formData, nama_bahan_baku: e.target.value }
                                            })}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Bahan</label>
                                            <select
                                                value={modalConfig.formData.kategori_bahan || 'Bahan Tambahan'}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, kategori_bahan: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                            >
                                                <option value="Bahan Dasar">Bahan Dasar (Hasil Batch)</option>
                                                <option value="Bahan Tambahan">Bahan Tambahan Langsung</option>
                                                <option value="Packaging">Packaging</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Link QTY Menu 1</label>
                                            <input
                                                type="text"
                                                value={modalConfig.formData.link_kode_qty_menu1 || ''}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, link_kode_qty_menu1: e.target.value }
                                                })}
                                                placeholder="Contoh: QTY_CUP_REG"
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4 pt-1">
                                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!modalConfig.formData.is_resep_amk_core}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, is_resep_amk_core: e.target.checked }
                                                })}
                                                className="rounded border-slate-300"
                                            />
                                            <span>Core RESEPAMK (Masuk Audit)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!modalConfig.formData.status_aktif}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, status_aktif: e.target.checked }
                                                })}
                                                className="rounded border-slate-300"
                                            />
                                            <span>Status Aktif</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {/* Menu 1 Nominal / Qty Form */}
                            {(modalConfig.entityType === 'menu1_nominal' || modalConfig.entityType === 'menu1_qty') && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Kode</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalConfig.formData.kode_nominal || modalConfig.formData.kode_qty || ''}
                                                onChange={(e) => {
                                                    const key = modalConfig.entityType === 'menu1_nominal' ? 'kode_nominal' : 'kode_qty';
                                                    setModalConfig({
                                                        ...modalConfig,
                                                        formData: { ...modalConfig.formData, [key]: e.target.value }
                                                    });
                                                }}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                {modalConfig.entityType === 'menu1_nominal' ? 'Tipe Kategori' : 'Satuan'}
                                            </label>
                                            {modalConfig.entityType === 'menu1_nominal' ? (
                                                <select
                                                    value={modalConfig.formData.tipe_kategori || 'Pemasukan'}
                                                    onChange={(e) => setModalConfig({
                                                        ...modalConfig,
                                                        formData: { ...modalConfig.formData, tipe_kategori: e.target.value }
                                                    })}
                                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                                >
                                                    <option value="Pemasukan">Pemasukan</option>
                                                    <option value="Pengeluaran">Pengeluaran</option>
                                                    <option value="Setoran">Setoran</option>
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    required
                                                    value={modalConfig.formData.satuan || ''}
                                                    onChange={(e) => setModalConfig({
                                                        ...modalConfig,
                                                        formData: { ...modalConfig.formData, satuan: e.target.value }
                                                    })}
                                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            {modalConfig.entityType === 'menu1_nominal' ? 'Nama Kategori Nominal' : 'Nama Item QTY'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={modalConfig.formData.nama_kategori || modalConfig.formData.nama_item_qty || ''}
                                            onChange={(e) => {
                                                const key = modalConfig.entityType === 'menu1_nominal' ? 'nama_kategori' : 'nama_item_qty';
                                                setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, [key]: e.target.value }
                                                });
                                            }}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-4 pt-1">
                                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!modalConfig.formData.status_aktif}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, status_aktif: e.target.checked }
                                                })}
                                                className="rounded border-slate-300"
                                            />
                                            <span>Status Aktif</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {/* Batch Form */}
                            {modalConfig.entityType === 'batch' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Nama Batch Dapur</label>
                                        <input
                                            type="text"
                                            required
                                            value={modalConfig.formData.nama_batch || ''}
                                            onChange={(e) => setModalConfig({
                                                ...modalConfig,
                                                formData: { ...modalConfig.formData, nama_batch: e.target.value }
                                            })}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Total Volume Batch (ml)</label>
                                            <input
                                                type="number"
                                                step="any"
                                                required
                                                value={modalConfig.formData.volume_batch_ml || 0}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, volume_batch_ml: parseFloat(e.target.value) || 0 }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Teh Celup (bag)</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={modalConfig.formData.teh_celup_bag || 0}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, teh_celup_bag: parseFloat(e.target.value) || 0 }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Biang AMK (ml)</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={modalConfig.formData.sirup_biang_amk_ml || 0}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, sirup_biang_amk_ml: parseFloat(e.target.value) || 0 }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-2 py-1.5 text-xs font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Premix (ml)</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={modalConfig.formData.sirup_premix_ml || 0}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, sirup_premix_ml: parseFloat(e.target.value) || 0 }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-2 py-1.5 text-xs font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Gula (ml)</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={modalConfig.formData.gula_pasir_ml || 0}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, gula_pasir_ml: parseFloat(e.target.value) || 0 }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-2 py-1.5 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Mapping Form */}
                            {modalConfig.entityType === 'mapping' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Item Menu 2</label>
                                        <select
                                            value={modalConfig.formData.menu2_item_id || ''}
                                            onChange={(e) => setModalConfig({
                                                ...modalConfig,
                                                formData: { ...modalConfig.formData, menu2_item_id: parseInt(e.target.value) || '' }
                                            })}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                        >
                                            {menu2Items.map(i => (
                                                <option key={i.id} value={i.id}>
                                                    {i.kode_item} - {i.nama_item}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Takaran</label>
                                            <select
                                                value={modalConfig.formData.tipe_takaran || 'percent'}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, tipe_takaran: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                            >
                                                <option value="percent">Persentase (%) dari Cup</option>
                                                <option value="fixed_ml">Mililiter (ml) Tetap</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Status Resep</label>
                                            <select
                                                value={modalConfig.formData.status_resep || 'Active'}
                                                onChange={(e) => setModalConfig({
                                                    ...modalConfig,
                                                    formData: { ...modalConfig.formData, status_resep: e.target.value }
                                                })}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Draft">Draft</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                                        <span className="text-[11px] font-black uppercase text-slate-700 block">
                                            Komposisi Adonan Dasar ({modalConfig.formData.tipe_takaran === 'percent' ? '%' : 'ml'})
                                        </span>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">AMK Dingin</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={modalConfig.formData.adonan_amk_dingin_pct || 0}
                                                    onChange={(e) => setModalConfig({
                                                        ...modalConfig,
                                                        formData: { ...modalConfig.formData, adonan_amk_dingin_pct: parseFloat(e.target.value) || 0 }
                                                    })}
                                                    className="w-full rounded-lg border border-slate-300 px-2 py-1 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">AMK Tea</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={modalConfig.formData.adonan_amk_tea_pct || 0}
                                                    onChange={(e) => setModalConfig({
                                                        ...modalConfig,
                                                        formData: { ...modalConfig.formData, adonan_amk_tea_pct: parseFloat(e.target.value) || 0 }
                                                    })}
                                                    className="w-full rounded-lg border border-slate-300 px-2 py-1 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">Varian Peach</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={modalConfig.formData.adonan_peach_pct || 0}
                                                    onChange={(e) => setModalConfig({
                                                        ...modalConfig,
                                                        formData: { ...modalConfig.formData, adonan_peach_pct: parseFloat(e.target.value) || 0 }
                                                    })}
                                                    className="w-full rounded-lg border border-slate-300 px-2 py-1 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">Varian Mocca</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={modalConfig.formData.adonan_mocca_pct || 0}
                                                    onChange={(e) => setModalConfig({
                                                        ...modalConfig,
                                                        formData: { ...modalConfig.formData, adonan_mocca_pct: parseFloat(e.target.value) || 0 }
                                                    })}
                                                    className="w-full rounded-lg border border-slate-300 px-2 py-1 font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="pt-2 flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {loading ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
