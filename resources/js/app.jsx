import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import SpgDashboard from './pages/spg/SpgDashboard';
import Menu1LaporanHarian from './pages/spg/Menu1LaporanHarian';
import Menu2FormPenjualan from './pages/spg/Menu2FormPenjualan';
import Menu3FormBahanBaku from './pages/spg/Menu3FormBahanBaku';
import AdminDashboard from './pages/admin/AdminDashboard';
import GeneratorWA from './pages/admin/GeneratorWA';
import ReverseAnalytic from './pages/admin/ReverseAnalytic';
import StockOpnameApproval from './pages/admin/StockOpnameApproval';
import MasterDataExcel from './pages/admin/MasterDataExcel';
import BiPivotCenter from './pages/admin/BiPivotCenter';

function App() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('spg_dashboard');

    // Shared Operational State
    const [initialData, setInitialData] = useState(null);
    const [selectedStand, setSelectedStand] = useState(null);
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

    // Check existing auth session
    useEffect(() => {
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                    setActiveTab(data.user.role === 'superadmin' ? 'admin_dashboard' : 'spg_dashboard');
                }
            })
            .catch(err => console.error(err))
            .finally(() => setAuthLoading(false));
    }, []);

    // Load initial master data
    useEffect(() => {
        if (!user) return;

        fetch('/api/initial-data')
            .then(res => res.json())
            .then(data => {
                setInitialData(data);
                if (data.stands && data.stands.length > 0 && !selectedStand) {
                    setSelectedStand(data.stands[0]);
                }
            })
            .catch(err => console.error(err));
    }, [user]);

    const handleLoginSuccess = (loggedInUser) => {
        setUser(loggedInUser);
        setActiveTab(loggedInUser.role === 'superadmin' ? 'admin_dashboard' : 'spg_dashboard');
    };

    const handleLogout = async () => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });
        } catch (e) {
            console.error(e);
        }
        setUser(null);
        setActiveTab('login');
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center space-y-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Memuat AMK Operational...
                    </span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    const stands = initialData?.stands || [];
    const spgList = initialData?.spg_list || [];
    const nominalConfigs = initialData?.menu1_nominals || [];
    const qtyConfigs = initialData?.menu1_qtys || [];
    const menu2Items = initialData?.menu2_items || [];
    const menu2Prices = initialData?.menu2_prices || {};

    return (
        <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
            <Navbar
                user={user}
                onLogout={handleLogout}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <main className="flex-1 pb-10">
                {/* SPG Pages */}
                {activeTab === 'spg_dashboard' && (
                    <SpgDashboard
                        stands={stands}
                        selectedStand={selectedStand}
                        setSelectedStand={setSelectedStand}
                        tanggal={tanggal}
                        setTanggal={setTanggal}
                        onNavigate={(menu) => setActiveTab(menu)}
                    />
                )}

                {activeTab === 'menu1' && (
                    <Menu1LaporanHarian
                        stands={stands}
                        spgList={spgList}
                        nominalConfigs={nominalConfigs}
                        qtyConfigs={qtyConfigs}
                        selectedStand={selectedStand}
                        setSelectedStand={setSelectedStand}
                        tanggal={tanggal}
                        setTanggal={setTanggal}
                        onBack={() => setActiveTab('spg_dashboard')}
                    />
                )}

                {activeTab === 'menu2' && (
                    <Menu2FormPenjualan
                        stands={stands}
                        menu2Items={menu2Items}
                        menu2Prices={menu2Prices}
                        selectedStand={selectedStand}
                        setSelectedStand={setSelectedStand}
                        tanggal={tanggal}
                        setTanggal={setTanggal}
                        onBack={() => setActiveTab('spg_dashboard')}
                        onNavigateMenu1={() => setActiveTab('menu1')}
                    />
                )}

                {activeTab === 'menu3' && (
                    <Menu3FormBahanBaku
                        stands={stands}
                        selectedStand={selectedStand}
                        setSelectedStand={setSelectedStand}
                        tanggal={tanggal}
                        setTanggal={setTanggal}
                        onBack={() => setActiveTab('spg_dashboard')}
                        onNavigateMenu1={() => setActiveTab('menu1')}
                    />
                )}

                {/* Superadmin Pages */}
                {activeTab === 'admin_dashboard' && (
                    <AdminDashboard
                        tanggal={tanggal}
                        setTanggal={setTanggal}
                        onNavigate={(tab) => setActiveTab(tab)}
                    />
                )}

                {activeTab === 'admin_bi' && (
                    <BiPivotCenter
                        stands={stands}
                        tanggal={tanggal}
                    />
                )}

                {activeTab === 'admin_wa' && (
                    <GeneratorWA
                        tanggal={tanggal}
                        setTanggal={setTanggal}
                    />
                )}

                {activeTab === 'admin_reverse' && (
                    <ReverseAnalytic
                        stands={stands}
                        tanggal={tanggal}
                    />
                )}

                {activeTab === 'admin_opname' && (
                    <StockOpnameApproval />
                )}

                {activeTab === 'admin_master' && (
                    <MasterDataExcel />
                )}
            </main>
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<App />);
}

