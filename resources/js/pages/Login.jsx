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
        <div className="flex min-h-screen flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-neutral-100 via-neutral-50 to-neutral-200 text-neutral-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Brand Header */}
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-950 text-white shadow-2xl shadow-black/30 border border-neutral-800">
                        <Coffee className="h-9 w-9 stroke-[2.5]" />
                    </div>
                </div>
                <h2 className="mt-4 text-center text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 uppercase">
                    AIR MATA KUCING
                </h2>
                <p className="mt-1 text-center text-xs sm:text-sm font-medium text-neutral-600">
                    Sistem Operasional, Inventori & Reverse Analytic
                </p>
            </div>

            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="rounded-3xl border border-neutral-300/80 bg-white p-6 sm:p-8 shadow-xl shadow-neutral-900/10">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-xl border border-neutral-900 bg-neutral-100 p-3 text-xs font-bold text-neutral-950 flex items-center space-x-2">
                                <span className="h-2 w-2 rounded-full bg-neutral-950 inline-block"></span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                                Username
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                                    <User className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Contoh: spg1 atau admin"
                                    className="w-full rounded-xl border border-neutral-300 pl-11 pr-4 py-3 text-sm font-semibold text-neutral-950 shadow-sm placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                                PIN / Password
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan PIN"
                                    className="w-full rounded-xl border border-neutral-300 pl-11 pr-4 py-3 text-sm font-semibold text-neutral-950 shadow-sm placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 transition"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex w-full items-center justify-center space-x-2 rounded-xl bg-neutral-950 px-4 py-3.5 text-sm font-black text-white shadow-xl shadow-neutral-950/25 transition hover:bg-neutral-800 active:scale-95 disabled:opacity-60 cursor-pointer"
                        >
                            <span>{loading ? 'Memverifikasi...' : 'MASUK SEKARANG'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>

                    {/* Quick Demo Credentials for Fast Testing */}
                    <div className="mt-6 border-t border-neutral-200 pt-5">
                        <p className="text-center text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2.5">
                            Akun Superadmin
                        </p>
                        <div>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('admin', 'admin123')}
                                className="w-full flex flex-col items-center rounded-xl border border-neutral-950 bg-neutral-950 p-2.5 text-center transition hover:bg-neutral-800 active:scale-95 cursor-pointer text-white shadow-sm"
                            >
                                <span className="text-xs font-black text-white">Super Admin AMK</span>
                                <span className="text-[10px] font-medium text-neutral-400">admin / admin123</span>
                            </button>
                        </div>
                    </div>
                </div>

                <p className="mt-4 text-center text-xs text-neutral-500 font-medium">
                    &copy; 2026 Air Mata Kucing (AMK). All rights reserved.
                </p>
            </div>
        </div>
    );
}

