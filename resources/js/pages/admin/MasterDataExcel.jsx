import React, { useState, useEffect } from 'react';
import {
    Database, Download, Upload, Plus, Edit2, Check, X,
    FileSpreadsheet, Store, Users, Coffee, Boxes, RefreshCw
} from 'lucide-react';
import {
    downloadTemplate1, downloadTemplate2, downloadTemplate3,
    downloadTemplate4, parseExcelFile
} from '../../utils/excelEngine';
import { formatRupiah } from '../../utils/formatters';

export default function MasterDataExcel() {
    const [activeTab, setActiveTab] = useState('stands'); // stands, spg, menu2, ingredients
    const [masterData, setMasterData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const fetchMaster = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/master-data');
            const data = await res.json();
            setMasterData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaster();
    }, []);

    // File Upload Handler (SheetJS parser)
    const handleFileUpload = async (e, templateType) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage('');
        setError('');

        try {
            const parsedSheets = await parseExcelFile(file);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/master-data/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    template_type: templateType,
                    payload: parsedSheets,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setMessage(data.message || 'Import data berhasil diproses!');
                fetchMaster();
            } else {
                setError(data.message || 'Gagal import file Excel.');
            }
        } catch (err) {
            setError('Gagal membaca atau mengunggah file: ' + err.message);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

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

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                        Manajemen Master Data & Template Excel
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500">
                        Download Template, Upload / Import (.xlsx SheetJS) & Kelola Seluruh Data Dinamis
                    </p>
                </div>

                <button
                    onClick={fetchMaster}
                    className="self-start rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:text-amber-600 active:scale-95 shadow-xs"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Notifications */}
            {message && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800">
                    {message}
                </div>
            )}
            {error && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
                    {error}
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
                                onChange={(e) => handleFileUpload(e, 'template1')}
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
                                onChange={(e) => handleFileUpload(e, 'template2')}
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
                                onChange={(e) => handleFileUpload(e, 'template3')}
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
                                onChange={(e) => handleFileUpload(e, 'template4')}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Sub-tabs for UI Table Management */}
            <div className="flex border-b border-slate-200 space-x-2">
                <button
                    onClick={() => setActiveTab('stands')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition ${activeTab === 'stands' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    Master Stand ({stands.length})
                </button>
                <button
                    onClick={() => setActiveTab('spg')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition ${activeTab === 'spg' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    Master SPG ({spgList.length})
                </button>
                <button
                    onClick={() => setActiveTab('menu2')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition ${activeTab === 'menu2' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    Menu 2 & Harga Stand ({menu2Items.length})
                </button>
                <button
                    onClick={() => setActiveTab('ingredients')}
                    className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition ${activeTab === 'ingredients' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                    Bahan Baku & Resep ({ingredients.length})
                </button>
            </div>

            {/* Table Content */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                {activeTab === 'stands' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3.5">Kode</th>
                                    <th className="px-4 py-3.5">Nama Stand</th>
                                    <th className="px-4 py-3.5">Wilayah</th>
                                    <th className="px-4 py-3.5">Blok WA</th>
                                    <th className="px-4 py-3.5 text-center">Urutan</th>
                                    <th className="px-4 py-3.5 text-center">AMKopi?</th>
                                    <th className="px-4 py-3.5 text-center">Csdng WA?</th>
                                    <th className="px-4 py-3.5 text-center">PTT WA?</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {stands.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/80">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{s.kode_stand}</td>
                                        <td className="px-4 py-3 font-bold text-slate-900">{s.nama_stand}</td>
                                        <td className="px-4 py-3">{s.wilayah_laporan}</td>
                                        <td className="px-4 py-3 font-bold text-amber-700">{s.blok_wa}</td>
                                        <td className="px-4 py-3 text-center">{s.urutan_tampil}</td>
                                        <td className="px-4 py-3 text-center">{s.punya_amkopi ? 'Ya' : 'Tidak'}</td>
                                        <td className="px-4 py-3 text-center">{s.tampilkan_csdng_wa ? 'Ya' : 'Tidak'}</td>
                                        <td className="px-4 py-3 text-center">{s.tampilkan_ptt_wa ? 'Ya' : 'Tidak'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                {s.status_aktif ? 'Aktif' : 'Non-Aktif'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'spg' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3.5">ID SPG</th>
                                    <th className="px-4 py-3.5">Nama Lengkap</th>
                                    <th className="px-4 py-3.5">Username Login</th>
                                    <th className="px-4 py-3.5">PIN Default</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {spgList.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-slate-400 font-medium">
                                            Belum ada data SPG. Silakan upload file Template 1 (Master Stand & SPG) untuk menambahkan SPG riil.
                                        </td>
                                    </tr>
                                ) : (
                                    spgList.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/80">
                                            <td className="px-4 py-3 font-mono font-bold text-amber-800">{u.id_spg}</td>
                                            <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                                            <td className="px-4 py-3 font-mono text-slate-600">@{u.username}</td>
                                            <td className="px-4 py-3 font-mono text-slate-400">{u.pin_plain || '1234'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                    {u.status_aktif ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'menu2' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3.5">Kelompok</th>
                                    <th className="px-4 py-3.5">Kode</th>
                                    <th className="px-4 py-3.5">Nama Menu</th>
                                    <th className="px-4 py-3.5 text-right">Harga Default</th>
                                    <th className="px-4 py-3.5 text-center">Status Resep</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {menu2Items.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-slate-400 font-medium">
                                            Belum ada data Menu 2 & Harga Stand. Silakan upload file Template 3 (Master Menu 2 & Harga) untuk memasukkan menu riil.
                                        </td>
                                    </tr>
                                ) : (
                                    menu2Items.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/80">
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
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'ingredients' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3.5">Kode Bahan</th>
                                    <th className="px-4 py-3.5">Nama Bahan Baku</th>
                                    <th className="px-4 py-3.5">Kategori</th>
                                    <th className="px-4 py-3.5 text-center">Satuan</th>
                                    <th className="px-4 py-3.5">Link QTY Menu 1</th>
                                    <th className="px-4 py-3.5 text-center">Core RESEPAMK?</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {ingredients.map(ing => (
                                    <tr key={ing.id} className="hover:bg-slate-50/80">
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

