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

import { PeternakPageRouter } from './dashboard/peternak/PeternakRouter';
import PeternakLayout from './dashboard/_shared/layouts/PeternakLayout';


import AppSidebar from './dashboard/_shared/components/AppSidebar';
import { Menu } from 'lucide-react';

// Dashboard pages
import HargaPasar from './dashboard/_shared/pages/HargaPasar';
import { BrokerPageRouter } from './dashboard/broker/_shared/BrokerRouter';
import { RPPageRouter } from './dashboard/rumah_potong/RPPageRouter';
import RumahPotongLayout from './dashboard/_shared/layouts/RumahPotongLayout';


// Egg Broker Vertical
import AcceptInvite from './pages/AcceptInvite'
import AuthCallback from './pages/AuthCallback';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutUs from './pages/AboutUs';
import FiturPage from './pages/FiturPage';
import HargaPage from './pages/HargaPage';
import OnboardingFlow from './dashboard/_shared/pages/OnboardingFlow';
import Market from './dashboard/_shared/pages/Market';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './dashboard/_shared/components/BottomNav';

import BrokerLayout from './dashboard/_shared/layouts/BrokerLayout';
import DesktopSidebarLayout from './dashboard/_shared/layouts/DesktopSidebarLayout';
import { useMediaQuery } from './lib/hooks/useMediaQuery';

// Admin
import AdminLayout from './dashboard/admin/AdminLayout';
import AdminBeranda from './dashboard/admin/AdminBeranda';
import AdminUsers from './dashboard/admin/AdminUsers';
import AdminSubscriptions from './dashboard/admin/AdminSubscriptions';
import AdminPricing from './dashboard/admin/AdminPricing';
import AdminActivity from './dashboard/admin/AdminActivity';

// ── Vertical-aware beranda path ───────────────────────────────────────────────
function getVerticalBeranda(vertical, subType) {
  if (vertical === 'rumah_potong') {
    const rpType = subType?.startsWith('rpa') ? 'rpa' : 'rph'
    return `/rumah_potong/${rpType}/beranda`
  }
  if (vertical === 'peternak') {
    return `/peternak/${subType || 'peternak_broiler'}/beranda`
  }
  // All broker types use subType as param
  return `/broker/${subType || 'broker_ayam'}/beranda`
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
    const role = profile.user_type === 'rumah_potong' ? 'rpa-buyer' : profile.user_type;
    return <Navigate to={`/${role}/beranda`} replace />;
  }

  // Vertical guard
  if (requiredVertical && tenant?.business_vertical && tenant.business_vertical !== requiredVertical) {
    return <Navigate to={getVerticalBeranda(tenant.business_vertical, tenant.sub_type)} replace />;
  }

  return children;
}

function RoleGuard({ allowedRoles, children }) {
  const { profile, tenant, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  // Superadmin bypass
  if (profile?.role === 'superadmin') return children;
  
  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to={getVerticalBeranda(tenant?.business_vertical, tenant?.sub_type)} replace />;
  }

  return children;
}

function RoleRedirector() {
  const { user, profile, tenant, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  
  // Superadmin redirects to /admin only if not explicitly on a business path
  if (profile?.role === 'superadmin' && (location.pathname === '/' || location.pathname === '/home' || location.pathname === '/dashboard')) {
    return <Navigate to="/admin" replace />;
  }

  if (!profile) return <Navigate to="/login" replace />;
  
  if (profile.role === 'sopir') {
    const subType = tenant?.sub_type || 'broker_ayam'
    return <Navigate to={`/broker/${subType}/sopir`} replace />;
  }
  
  const role = profile.user_type === 'rumah_potong' ? 'rumah_potong' : profile.user_type;
  
  // If broker/rumah_potong, point to the vertical-specific beranda
  if (profile.user_type === 'broker' || profile.user_type === 'rumah_potong') {
    return <Navigate to={getVerticalBeranda(tenant?.business_vertical, tenant?.sub_type)} replace />;
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
  const { user, isSuperadmin, tenant, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  if (!isSuperadmin) {
    return <Navigate to={getVerticalBeranda(tenant?.business_vertical, tenant?.sub_type)} replace />;
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
        <Route path="/auth/callback" element={<AuthCallback />} />

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
          <Route path="penjualan"      element={<BrokerPageRouter page="penjualan" />} />
          <Route path="toko-supplier" element={<BrokerPageRouter page="toko-supplier" />} />
          <Route path="toko-supplier/:type/:id" element={<BrokerPageRouter page="toko-supplier-detail" />} />
          <Route path="pengiriman"    element={<BrokerPageRouter page="pengiriman" />} />
          <Route path="gudang"        element={<BrokerPageRouter page="gudang" />} />
          <Route path="produk"     element={<BrokerPageRouter page="produk" />} />
          <Route path="inventori"  element={<BrokerPageRouter page="inventori" />} />
          <Route path="karyawan"   element={<BrokerPageRouter page="karyawan" />} />
          <Route path="pegawai"    element={<Navigate to="../karyawan" replace />} />
          <Route path="laporan"    element={<BrokerPageRouter page="laporan" />} />

          {/* New Egg Broker Specific Sub-routes */}
          <Route path="suppliers"  element={<BrokerPageRouter page="suppliers" />} />
          <Route path="customers"  element={<BrokerPageRouter page="customers" />} />
        </Route>

        <Route path="/broker/:brokerType/sopir" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['sopir']}>
              <BrokerPageRouter page="sopir" />
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* Legacy fallback for staff */}
        <Route path="/broker/staff" element={<Navigate to="/broker/beranda" replace />} />

        {/* Peternak routes */}
        <Route path="/peternak" element={<RoleRedirector />} />
        <Route path="/peternak/:peternakType" element={
          <ProtectedRoute requiredType="peternak" requiredVertical="peternak">
            <PeternakLayout />
          </ProtectedRoute>
        }>
          <Route path="beranda"       element={<PeternakPageRouter page="beranda" />} />
          <Route path="siklus"        element={<PeternakPageRouter page="siklus" />} />
          <Route path="input-harian"  element={<PeternakPageRouter page="input-harian" />} />
          <Route path="input"         element={<Navigate to="../input-harian" replace />} />
          <Route path="pakan"         element={<PeternakPageRouter page="stok-pakan" />} />
          <Route path="stok-pakan"    element={<Navigate to="../pakan" replace />} />
          <Route path="laporan"       element={<PeternakPageRouter page="laporan" />} />
          <Route path="laporan/:cycleId" element={<PeternakPageRouter page="laporan" />} />
          <Route path="akun"          element={<PeternakPageRouter page="akun" />} />
          <Route path="tim"           element={<PeternakPageRouter page="tim" />} />
          <Route path="harga-pasar"   element={<PeternakPageRouter page="harga-pasar" />} />
          
          {/* Per-farm routes (Level 2) */}
          <Route path="kandang/:farmId" element={<Navigate to="beranda" replace />} />
          <Route path="kandang/:farmId/beranda" element={<PeternakPageRouter page="farm-beranda" />} />
          <Route path="kandang/:farmId/siklus"  element={<PeternakPageRouter page="siklus" />} />
          <Route path="kandang/:farmId/input"   element={<PeternakPageRouter page="input-harian" />} />
          <Route path="kandang/:farmId/laporan" element={<PeternakPageRouter page="laporan" />} />
        </Route>

        <Route path="/rpa-buyer" element={<Navigate to="/rumah_potong/rpa/beranda" replace />} />
        
        {/* Rumah Potong (RPA/RPH) routes */}
        <Route path="/rumah_potong/:rpType" element={
          <ProtectedRoute requiredType="rumah_potong" requiredVertical="rumah_potong">
            <RumahPotongLayout />
          </ProtectedRoute>
        }>
          <Route path="beranda"    element={<RPPageRouter page="beranda" />} />
          <Route path="order"      element={<RPPageRouter page="order" />} />
          <Route path="hutang"     element={<RPPageRouter page="hutang" />} />
          <Route path="distribusi" element={<RPPageRouter page="distribusi" />} />
          <Route path="distribusi/:customerId" element={<RPPageRouter page="distribusi-detail" />} />
          <Route path="laporan"    element={<RPPageRouter page="laporan" />} />
          <Route path="akun"       element={<RPPageRouter page="akun" />} />
        </Route>

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
        <Route path="/admin/activity" element={
          <AdminRoute>
            <AdminLayout><AdminActivity /></AdminLayout>
          </AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
