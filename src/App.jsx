import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './lib/hooks/useAuth';
import { useNotificationGenerator } from './lib/hooks/useNotifications';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CheckEmail from './pages/CheckEmail';
import LoadingScreen from './components/LoadingScreen';

// Dashboard pages
import BrokerBeranda from './dashboard/broker/Beranda';
import PeternakBeranda from './dashboard/peternak/Beranda';
import PeternakFarmBeranda from './dashboard/peternak/FarmBeranda';
import PeternakSiklus from './dashboard/peternak/Siklus';
import PeternakInputHarian from './dashboard/peternak/InputHarian';
import PeternakAnakKandang from './dashboard/peternak/AnakKandang';
import PeternakLaporanSiklus from './dashboard/peternak/LaporanSiklus';
import PeternakPakan from './dashboard/peternak/Pakan';
import RPABeranda from './dashboard/rpa/Beranda'
import RPAOrder from './dashboard/rpa/Order'
import RPAHutang from './dashboard/rpa/Hutang'
import RPADistribusi from './dashboard/rpa/Distribusi'
import RPADistribusiDetail from './dashboard/rpa/DistribusiDetail'
import RPALaporanMargin from './dashboard/rpa/LaporanMargin'
import RPAAkun from './dashboard/rpa/Akun';
import AppSidebar from './dashboard/components/AppSidebar';
import { Menu } from 'lucide-react';

import Transaksi from './dashboard/broker/Transaksi';
import RPA from './dashboard/broker/RPA';
import RPADetail from './dashboard/broker/RPADetail';
import Kandang from './dashboard/broker/Kandang';
import Simulator from './dashboard/broker/Simulator';
import Akun from './dashboard/broker/Akun';
// Dashboard pages
import HargaPasar from './dashboard/pages/HargaPasar';
import Pengiriman from './dashboard/broker/Pengiriman';
import CashFlow from './dashboard/broker/CashFlow';
import Armada from './dashboard/broker/Armada';
import Tim from './dashboard/broker/Tim';
import SopirDashboard from './dashboard/broker/SopirDashboard';
import { BrokerPageRouter } from './dashboard/broker/BrokerRouter';


// Egg Broker Vertical
import EggBeranda from './dashboard/egg/Beranda';

// Sembako Broker Vertical
import SembakoBeranda from './dashboard/sembako/Beranda';
import SembakoPenjualan from './dashboard/sembako/Penjualan';
import SembakoPegawai from './dashboard/sembako/Pegawai';
import SembakoLaporan from './dashboard/sembako/Laporan';
import SembakoProduk from './dashboard/sembako/Produk';
import SembakoGudang from './dashboard/sembako/Gudang';
import EggInventori from './dashboard/egg/Inventori';
import EggPOS from './dashboard/egg/POS';
import EggTransaksi from './dashboard/egg/Transaksi';
import EggSuppliers from './dashboard/egg/Suppliers';
import EggCustomers from './dashboard/egg/Customers';

import AcceptInvite from './pages/AcceptInvite';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutUs from './pages/AboutUs';
import FiturPage from './pages/FiturPage';
import HargaPage from './pages/HargaPage';
import OnboardingFlow from './dashboard/pages/onboarding/OnboardingFlow';
import Market from './dashboard/pages/Market';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './dashboard/components/BottomNav';

import BrokerLayout from './dashboard/layouts/BrokerLayout';
import DesktopSidebarLayout from './dashboard/layouts/DesktopSidebarLayout';
import { useMediaQuery } from './lib/hooks/useMediaQuery';

// Admin
import AdminLayout from './dashboard/admin/AdminLayout';
import AdminBeranda from './dashboard/admin/AdminBeranda';
import AdminUsers from './dashboard/admin/AdminUsers';
import AdminSubscriptions from './dashboard/admin/AdminSubscriptions';
import AdminPricing from './dashboard/admin/AdminPricing';

// ── Vertical-aware beranda path ───────────────────────────────────────────────
function getVerticalBeranda(vertical) {
  if (vertical === 'egg_broker')     return '/egg/beranda'
  return `/broker/${vertical || 'poultry_broker'}/beranda`
}

// ── ComingSoon placeholder for unbuilt sembako pages ─────────────────────────
function SembakoComingSoon({ title }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: '12px',
    }}>
      <span style={{ fontSize: '2.5rem' }}>🚧</span>
      <p style={{ fontWeight: 800, fontSize: '16px', color: '#FEF3C7' }}>{title}</p>
      <p style={{ color: '#92400E', fontSize: '13px' }}>Segera hadir</p>
    </div>
  )
}

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function ProtectedRoute({ children, requiredType, requiredVertical }) {
  const { user, profile, tenant, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  
  if (!user) return <Navigate to="/login" replace />;

  // Allow superadmin to access any business route without guards
  if (profile?.role === 'superadmin') return children;

  if (profile && !profile.onboarded && location.pathname !== '/onboarding' && profile.role === 'owner') {
    return <Navigate to="/onboarding" replace />;
  }

  // Role guard (only check if business model is selected)
  if (profile?.business_model_selected && requiredType && profile.user_type !== requiredType) {
    const role = profile.user_type === 'rpa' ? 'rpa-buyer' : profile.user_type;
    return <Navigate to={`/${role}/beranda`} replace />;
  }

  // Vertical guard
  if (requiredVertical && tenant?.business_vertical && tenant.business_vertical !== requiredVertical) {
    return <Navigate to={getVerticalBeranda(tenant.business_vertical)} replace />;
  }

  return children;
}

function RoleGuard({ allowedRoles, children }) {
  const { profile, tenant, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  // Superadmin bypass
  if (profile?.role === 'superadmin') return children;
  
  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to={getVerticalBeranda(tenant?.business_vertical)} replace />;
  }

  return children;
}

function RoleRedirector() {
  const { user, profile, tenant, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  
  // Superadmin redirects to /admin only if not explicitly on a business path
  if (profile?.role === 'superadmin' && (location.pathname === '/' || location.pathname === '/home' || location.pathname === '/dashboard')) {
    return <Navigate to="/admin" replace />;
  }

  if (!profile) return <Navigate to="/login" replace />;
  
  if (profile.role === 'sopir') return <Navigate to="/broker/sopir" replace />;
  
  const role = profile.user_type === 'rpa' ? 'rpa-buyer' : profile.user_type;
  
  // If broker, point to the vertical-specific beranda
  if (profile.user_type === 'broker') {
    return <Navigate to={getVerticalBeranda(tenant?.business_vertical)} replace />;
  }
  
  return <Navigate to={`/${role}/beranda`} replace />;
}

function DashboardLayout({ children }) {
  useNotificationGenerator()
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (isDesktop) {
    return <DesktopSidebarLayout>{children}</DesktopSidebarLayout>;
  }

  return (
    <div className="bg-background min-h-screen max-w-[480px] mx-auto relative pb-[80px] shadow-2xl overflow-x-hidden">
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#0C1319] border border-white/10 rounded-xl flex items-center justify-center shadow-lg"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="w-5 h-5 text-[#94A3B8]" />
      </button>

      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {children}
      <BottomNav />
    </div>
  );
}

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  const isSuperAdmin = (profile?.role === 'superadmin' || profile?.user_type === 'superadmin') && 
                      user?.email === 'fahruhernansakti@gmail.com';
  
  if (!isSuperAdmin) {
    return <Navigate to={getVerticalBeranda(profile?.tenants?.business_vertical)} replace />;
  }

  return children;
}

function App() {
  const { loading } = useAuth();

  return (
    <BrowserRouter>
      <ScrollToTop />
      
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen key="loading-screen" />}
      </AnimatePresence>

      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite" element={<AcceptInvite />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/tentang-kami" element={<AboutUs />} />
        <Route path="/fitur" element={<FiturPage />} />
        <Route path="/harga" element={<HargaPage />} />
        <Route path="/check-email" element={<CheckEmail />} />

        <Route path="/onboarding" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <OnboardingFlow />
            </ErrorBoundary>
          </ProtectedRoute>
        } />

        {/* Broker routes - Base Redirect */}
        <Route path="/broker" element={<RoleRedirector />} />
        <Route path="/broker/beranda" element={<RoleRedirector />} />

        {/* Dynamic Broker Routing */}
        <Route path="/broker/:brokerType" element={<BrokerLayout />}>
          <Route path="beranda"    element={<BrokerPageRouter page="beranda" />} />
          <Route path="transaksi"  element={<BrokerPageRouter page="transaksi" />} />
          <Route path="kandang"    element={<BrokerPageRouter page="kandang" />} />
          <Route path="pengiriman" element={<BrokerPageRouter page="pengiriman" />} />
          <Route path="rpa"        element={<BrokerPageRouter page="rpa" />} />
          <Route path="rpa/:id"    element={<BrokerPageRouter page="rpa-detail" />} />
          <Route path="cash-flow"  element={<BrokerPageRouter page="cash-flow" />} />
          <Route path="cashflow"   element={<Navigate to="../cash-flow" replace />} />
          <Route path="armada"     element={<BrokerPageRouter page="armada" />} />
          <Route path="simulator"  element={<BrokerPageRouter page="simulator" />} />
          <Route path="tim"        element={<BrokerPageRouter page="tim" />} />
          <Route path="akun"       element={<BrokerPageRouter page="akun" />} />
          
          {/* Sembako Exclusive Routes mapped through router */}
          <Route path="pos"        element={<BrokerPageRouter page="pos" />} />
          <Route path="penjualan"  element={<BrokerPageRouter page="penjualan" />} />
          <Route path="gudang"     element={<BrokerPageRouter page="gudang" />} />
          <Route path="produk"     element={<BrokerPageRouter page="produk" />} />
          <Route path="inventori"  element={<BrokerPageRouter page="inventori" />} />
          <Route path="karyawan"   element={<BrokerPageRouter page="karyawan" />} />
          <Route path="pegawai"    element={<Navigate to="../karyawan" replace />} />
          <Route path="laporan"    element={<BrokerPageRouter page="laporan" />} />
        </Route>

        <Route path="/broker/:brokerType/sopir" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['sopir']}>
              <BrokerPageRouter page="sopir" />
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* Egg Broker Vertical */}
        {/* Egg Broker Vertical (Legacy redirects to new /egg paths) */}
        <Route path="/broker/egg_broker/beranda" element={<Navigate to="/egg/beranda" replace />} />
        <Route path="/broker/egg_broker/inventori" element={<Navigate to="/egg/inventori" replace />} />
        <Route path="/broker/egg_broker/pos" element={<Navigate to="/egg/pos" replace />} />
        <Route path="/broker/egg_broker/suppliers" element={<Navigate to="/egg/suppliers" replace />} />
        <Route path="/broker/egg_broker/customers" element={<Navigate to="/egg/customers" replace />} />
        <Route path="/broker/egg_broker/transaksi" element={<Navigate to="/egg/transaksi" replace />} />

        {/* New Egg Broker Vertical Routes */}
        <Route path="/egg/beranda" element={
          <ProtectedRoute requiredType="broker" requiredVertical="egg_broker">
            <RoleGuard allowedRoles={['owner', 'staff', 'view_only']}>
              <BrokerLayout><EggBeranda /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/egg/inventori" element={
          <ProtectedRoute requiredType="broker" requiredVertical="egg_broker">
            <RoleGuard allowedRoles={['owner', 'staff']}>
              <BrokerLayout><EggInventori /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/egg/pos" element={
          <ProtectedRoute requiredType="broker" requiredVertical="egg_broker">
            <RoleGuard allowedRoles={['owner', 'staff']}>
              <BrokerLayout><EggPOS /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/egg/suppliers" element={
          <ProtectedRoute requiredType="broker" requiredVertical="egg_broker">
            <RoleGuard allowedRoles={['owner', 'staff']}>
              <BrokerLayout><EggSuppliers /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/egg/customers" element={
          <ProtectedRoute requiredType="broker" requiredVertical="egg_broker">
            <RoleGuard allowedRoles={['owner', 'staff']}>
              <BrokerLayout><EggCustomers /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/egg/transaksi" element={
          <ProtectedRoute requiredType="broker" requiredVertical="egg_broker">
            <RoleGuard allowedRoles={['owner', 'staff', 'view_only']}>
              <BrokerLayout><EggTransaksi /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* Legacy fallback for staff */}
        <Route path="/broker/staff" element={<Navigate to="/broker/beranda" replace />} />

        {/* Peternak routes */}
        <Route path="/peternak" element={<Navigate to="/peternak/beranda" replace />} />
        <Route path="/peternak/beranda" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakBeranda /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/siklus" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakSiklus /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/input" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakInputHarian /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/anak-kandang" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakAnakKandang /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/laporan" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakLaporanSiklus /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/laporan/:cycleId" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakLaporanSiklus /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/pakan" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakPakan /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/akun" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><Akun /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Peternak per-farm routes (Level 2) */}
        <Route path="/peternak/kandang/:farmId" element={<Navigate to="beranda" replace />} />
        <Route path="/peternak/kandang/:farmId/beranda" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakFarmBeranda /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/kandang/:farmId/siklus" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakSiklus /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/kandang/:farmId/input" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakInputHarian /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/kandang/:farmId/pakan" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakPakan /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/kandang/:farmId/laporan" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <DashboardLayout><PeternakLaporanSiklus /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* RPA routes */}
        <Route path="/rpa-buyer" element={<Navigate to="/rpa-buyer/beranda" replace />} />
        <Route path="/rpa-buyer/beranda" element={
          <ProtectedRoute requiredType="rpa" requiredVertical="rpa">
            <DashboardLayout><RPABeranda /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa-buyer/order" element={
          <ProtectedRoute requiredType="rpa">
            <DashboardLayout><RPAOrder /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa-buyer/hutang" element={
          <ProtectedRoute requiredType="rpa">
            <DashboardLayout><RPAHutang /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa-buyer/distribusi" element={
          <ProtectedRoute requiredType="rpa">
            <DashboardLayout><RPADistribusi /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa-buyer/distribusi/:customerId" element={
          <ProtectedRoute requiredType="rpa">
            <DashboardLayout><RPADistribusiDetail /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa-buyer/laporan" element={
          <ProtectedRoute requiredType="rpa">
            <DashboardLayout><RPALaporanMargin /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa-buyer/akun" element={
          <ProtectedRoute requiredType="rpa">
            <DashboardLayout><RPAAkun /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Market — accessible all roles */}
        <Route path="/market" element={
          <ProtectedRoute>
            <DashboardLayout><Market /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Shared routes */}
        <Route path="/harga-pasar" element={
          <ProtectedRoute>
            <DashboardLayout><HargaPasar /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Root Redirector */}
        <Route path="/home" element={<RoleRedirector />} />

        {/* Legacy Redirects */}
        <Route path="/dashboard" element={<RoleRedirector />} />
        <Route path="/beranda" element={<RoleRedirector />} />
        <Route path="/akun" element={<RoleRedirector />} />
        <Route path="/transaksi" element={<RoleRedirector />} />
        <Route path="/rpa-dashboard" element={<RoleRedirector />} />

        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout><AdminBeranda /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminLayout><AdminUsers /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/subscriptions" element={
          <AdminRoute>
            <AdminLayout><AdminSubscriptions /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/pricing" element={
          <AdminRoute>
            <AdminLayout><AdminPricing /></AdminLayout>
          </AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
