import React from 'react';
import { Coffee, LogOut, ShieldCheck, User as UserIcon, LayoutDashboard, FileText, FlaskConical, CheckSquare, Database } from 'lucide-react';

export default function Navbar({ user, onLogout, activeTab, setActiveTab }) {
    if (!user) return null;

    const isSuperadmin = user.role === 'superadmin';

    return (
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
                            <span>RESEPAMK</span>
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

                {/* User & Logout */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="hidden text-right md:block">
                        <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                        <p className="text-[11px] font-mono text-slate-500">@{user.username}</p>
                    </div>

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
                        onClick={() => setActiveTab('admin_wa')}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition ${activeTab === 'admin_wa' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                    >
                        Generator WA
                    </button>
                    <button
                        onClick={() => setActiveTab('admin_reverse')}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition ${activeTab === 'admin_reverse' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                    >
                        RESEPAMK
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
    );
}
