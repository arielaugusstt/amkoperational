import React, { useState } from 'react';
import { Coffee, KeyRound, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            if (data.success && data.user) {
                onLoginSuccess(data.user);
            } else {
                setError(data.message || 'Username atau PIN salah.');
            }
        } catch (err) {
            setError('Gagal menghubungi server. Periksa koneksi internet.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = (u, p) => {
        setUsername(u);
        setPassword(p);
        setError('');
    };

    return (
        <div className="flex min-h-screen flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-amber-50/50 via-slate-50 to-slate-100">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Brand Header */}
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-xl shadow-amber-500/30">
                        <Coffee className="h-9 w-9 stroke-[2.5]" />
                    </div>
                </div>
                <h2 className="mt-4 text-center text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    AIR MATA KUCING
                </h2>
                <p className="mt-1 text-center text-xs sm:text-sm font-semibold text-slate-600">
                    Sistem Operasional, Inventori & Reverse Analytic
                </p>
            </div>

            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Username
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <User className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Contoh: spg1 atau admin"
                                    className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                PIN / Password
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan PIN"
                                    className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex w-full items-center justify-center space-x-2 rounded-xl bg-amber-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-amber-600/30 transition hover:bg-amber-700 active:scale-95 disabled:opacity-60"
                        >
                            <span>{loading ? 'Memverifikasi...' : 'MASUK SEKARANG'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>

                    {/* Quick Demo Credentials for Fast Testing */}
                    <div className="mt-6 border-t border-slate-100 pt-5">
                        <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                            Akun Demo Cepat
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('spg1', '1234')}
                                className="flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50/70 p-2 text-center transition hover:bg-emerald-100/80 active:scale-95"
                            >
                                <span className="text-xs font-black text-emerald-800">SPG 1</span>
                                <span className="text-[10px] text-emerald-600">spg1 / 1234</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('admin', 'admin123')}
                                className="flex flex-col items-center rounded-xl border border-indigo-200 bg-indigo-50/70 p-2 text-center transition hover:bg-indigo-100/80 active:scale-95"
                            >
                                <span className="text-xs font-black text-indigo-800">Super Admin</span>
                                <span className="text-[10px] text-indigo-600">admin / admin123</span>
                            </button>
                        </div>
                    </div>
                </div>

                <p className="mt-4 text-center text-xs text-slate-400 font-medium">
                    &copy; 2026 Air Mata Kucing (AMK). All rights reserved.
                </p>
            </div>
        </div>
    );
}

