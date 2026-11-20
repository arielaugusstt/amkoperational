import React, { useState } from 'react';
import { Coffee, LogOut, LayoutDashboard, FileText, FlaskConical, CheckSquare, Database, KeyRound, X, BarChart3 } from 'lucide-react';

export default function Navbar({ user, onLogout, activeTab, setActiveTab }) {
    const [showPwdModal, setShowPwdModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
    const [savingPwd, setSavingPwd] = useState(false);
    const [pwdMsg, setPwdMsg] = useState('');
    const [pwdErr, setPwdErr] = useState('');

    if (!user) return null;

    const isSuperadmin = user.role === 'superadmin';

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwdMsg('');
        setPwdErr('');

        if (newPassword !== newPasswordConfirmation) {
            setPwdErr('Konfirmasi password baru tidak cocok.');
            return;
        }

        setSavingPwd(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: newPasswordConfirmation,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setPwdMsg(data.message || 'Password Superadmin berhasil diperbarui!');
                setCurrentPassword('');
                setNewPassword('');
                setNewPasswordConfirmation('');
                setTimeout(() => {
                    setShowPwdModal(false);
                    setPwdMsg('');
                }, 1400);
            } else {
                setPwdErr(data.message || 'Gagal memperbarui password.');
            }
        } catch (err) {
            setPwdErr('Terjadi kesalahan koneksi server.');
        } finally {
            setSavingPwd(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                    {/* Logo & Brand */}
                    <div
                        onClick={() => setActiveTab(isSuperadmin ? 'admin_dashboard' : 'spg_dashboard')}
                        className="flex cursor-pointer items-center space-x-3 transition hover:opacity-90"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md shadow-amber-500/30">
                            <Coffee className="h-6 w-6 stroke-[2.5]" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                                    AMK<span className="text-amber-600">.OPS</span>
                                </h1>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${isSuperadmin ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                                    {isSuperadmin ? 'Superadmin' : 'SPG'}
                                </span>
                            </div>
                            <p className="text-xs font-medium text-slate-500 hidden sm:block">
                                Air Mata Kucing & AMKopi Operational
                            </p>
                        </div>
                    </div>

                    {/* Desktop Nav for Superadmin */}
                    {isSuperadmin && (
                        <nav className="hidden lg:flex items-center space-x-1">
                            <button
                                onClick={() => setActiveTab('admin_dashboard')}
                                className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${activeTab === 'admin_dashboard' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Dashboard</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('admin_bi')}
                                className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${activeTab === 'admin_bi' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <BarChart3 className="h-4 w-4" />
                                <span>BI & Pivot Center</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('admin_wa')}
                                className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${activeTab === 'admin_wa' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <FileText className="h-4 w-4" />
                                <span>Generator WA</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('admin_reverse')}
                                className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${activeTab === 'admin_reverse' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <FlaskConical className="h-4 w-4" />
                                <span>Reverse Analytic & Audit Resep</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('admin_opname')}
                                className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${activeTab === 'admin_opname' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <CheckSquare className="h-4 w-4" />
                                <span>Stock Opname</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('admin_master')}
                                className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${activeTab === 'admin_master' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Database className="h-4 w-4" />
                                <span>Master Data</span>
                            </button>
                        </nav>
                    )}

                    {/* User & Actions */}
                    <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <div className="hidden text-right md:block">
                            <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                            <p className="text-[11px] font-mono text-slate-500">@{user.username}</p>
                        </div>

                        {isSuperadmin && (
                            <button
                                onClick={() => {
                                    setPwdMsg('');
                                    setPwdErr('');
                                    setShowPwdModal(true);
                                }}
                                title="Ganti Password Superadmin"
                                className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95"
                            >
                                <KeyRound className="h-4 w-4 text-amber-600" />
                                <span className="hidden sm:inline">Ganti Password</span>
                            </button>
                        )}

                        <button
                            onClick={onLogout}
                            title="Logout"
                            className="flex items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Keluar</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Bar for Superadmin */}
                {isSuperadmin && (
                    <div className="flex lg:hidden overflow-x-auto border-t border-slate-200 bg-slate-50 px-3 py-2 space-x-2 text-xs font-bold no-scrollbar">
                        <button
                            onClick={() => setActiveTab('admin_dashboard')}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition ${activeTab === 'admin_dashboard' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('admin_bi')}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition ${activeTab === 'admin_bi' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                        >
                            BI & Pivot Center
                        </button>
                        <button
                            onClick={() => setActiveTab('admin_wa')}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition ${activeTab === 'admin_wa' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                        >
                            Generator WA
                        </button>
                        <button
                            onClick={() => setActiveTab('admin_reverse')}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition ${activeTab === 'admin_reverse' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                        >
                            Reverse Analytic & Audit Resep
                        </button>
                        <button
                            onClick={() => setActiveTab('admin_opname')}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition ${activeTab === 'admin_opname' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                        >
                            Stock Opname
                        </button>
                        <button
                            onClick={() => setActiveTab('admin_master')}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition ${activeTab === 'admin_master' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                        >
                            Master Excel
                        </button>
                    </div>
                )}
            </header>

            {/* Modal Ganti Password Superadmin */}
            {showPwdModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center space-x-2">
                                <KeyRound className="h-5 w-5 text-amber-600" />
                                <h3 className="text-base font-black text-slate-900">
                                    Ganti Password Superadmin
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowPwdModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {pwdMsg && (
                            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
                                {pwdMsg}
                            </div>
                        )}
                        {pwdErr && (
                            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                                {pwdErr}
                            </div>
                        )}

                        <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold uppercase text-slate-700 mb-1">
                                    Password Lama
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Masukkan password saat ini"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-slate-700 mb-1">
                                    Password Baru (Min. 4 Karakter)
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={4}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Masukkan password baru"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-slate-700 mb-1">
                                    Konfirmasi Password Baru
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={4}
                                    value={newPasswordConfirmation}
                                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                    placeholder="Ketik ulang password baru"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-2 flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPwdModal(false)}
                                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPwd}
                                    className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {savingPwd ? 'Menyimpan...' : 'Simpan Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
