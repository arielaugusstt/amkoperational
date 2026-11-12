import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, Calendar, RefreshCw } from 'lucide-react';
import { formatDateIndo } from '../../utils/formatters';

export default function GeneratorWA({ tanggal, setTanggal }) {
    const [waText, setWaText] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchWaText = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/wa-text?tanggal=${tanggal}`);
            const data = await res.json();
            setWaText(data.text || '');
        } catch (e) {
            console.error('Failed to fetch WA text', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWaText();
    }, [tanggal]);

    const handleCopy = () => {
        if (!waText) return;
        navigator.clipboard.writeText(waText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                        Generator Teks Laporan WhatsApp
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500">
                        Format 100% Identik Pelaporan Pribadi (Blok 1, 2, 3 & Rekap Total)
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-xs focus:border-amber-500 focus:outline-none"
                    />
                    <button
                        onClick={fetchWaText}
                        className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:text-amber-600 active:scale-95 shadow-xs"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={!waText}
                        className="flex items-center space-x-1.5 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-amber-600/30 hover:bg-amber-700 active:scale-95 disabled:opacity-50"
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span>{copied ? 'BERHASIL DISALIN!' : 'COPY TEKS WA'}</span>
                    </button>
                </div>
            </div>

            {/* WhatsApp Card Display */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Pratinjau Teks WhatsApp: {formatDateIndo(tanggal)}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="text-xs font-bold text-amber-600 hover:underline flex items-center space-x-1"
                    >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Tersalin' : 'Salin Semua'}</span>
                    </button>
                </div>

                <div className="relative">
                    <pre className="w-full overflow-x-auto rounded-2xl bg-slate-900 p-5 font-mono text-xs sm:text-sm font-semibold text-emerald-400 whitespace-pre leading-relaxed shadow-inner">
                        {loading ? 'Memuat data laporan...' : waText || 'Belum ada data input pada tanggal ini.'}
                    </pre>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>*Ck = Cup 12oz, Cb = Cup 22oz, Csdng = Cup 16oz, PTT = Jumlah PTT</span>
                    <span>Siap dipaste langsung ke chat WhatsApp</span>
                </div>
            </div>
        </div>
    );
}

