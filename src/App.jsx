import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './lib/hooks/useAuth';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import LoadingScreen from './components/LoadingScreen';

// Dashboard pages
import BrokerBeranda from './dashboard/broker/Beranda';
import PeternakBeranda from './dashboard/peternak/Beranda';
import RPABeranda from './dashboard/rpa/Beranda';

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
import Invite from './pages/Invite';

// Egg Broker Vertical
import EggBeranda from './dashboard/egg/Beranda';
import EggInventori from './dashboard/egg/Inventori';
import EggPOS from './dashboard/egg/POS';
import EggTransaksi from './dashboard/egg/Transaksi';
import EggSuppliers from './dashboard/egg/Suppliers';
import EggCustomers from './dashboard/egg/Customers';

import AcceptInvite from './pages/AcceptInvite';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutUs from './pages/AboutUs';
import OnboardingFlow from './dashboard/pages/OnboardingFlow';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './dashboard/components/BottomNav';

import ComingSoon from './dashboard/components/ComingSoon';
import BrokerLayout from './dashboard/layouts/BrokerLayout';
import DesktopSidebarLayout from './dashboard/layouts/DesktopSidebarLayout';
import { useMediaQuery } from './lib/hooks/useMediaQuery';

// Admin
import AdminLayout from './dashboard/admin/AdminLayout';
import AdminBeranda from './dashboard/admin/AdminBeranda';
import AdminUsers from './dashboard/admin/AdminUsers';
import AdminSubscriptions from './dashboard/admin/AdminSubscriptions';
import AdminPricing from './dashboard/admin/AdminPricing';

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

  if (profile && !profile.onboarded && !['/broker/tim', '/onboarding'].includes(location.pathname) && profile.role === 'owner') {
    return <Navigate to="/broker/tim" replace />;
  }

  // Role guard (only check if business model is selected)
  if (profile?.business_model_selected && requiredType && profile.user_type !== requiredType) {
    const role = profile.user_type === 'rpa' ? 'rpa-buyer' : profile.user_type;
    return <Navigate to={`/${role}/beranda`} replace />;
  }

  // Vertical guard
  if (requiredVertical && tenant?.business_vertical && tenant.business_vertical !== requiredVertical) {
    // Redirect to the correct vertical dashboard if mismatched
    const path = tenant.business_vertical === 'egg_broker' ? '/egg/beranda' : `/broker/${tenant.business_vertical}/beranda`;
    return <Navigate to={path} replace />;
  }

  return children;
}

function RoleGuard({ allowedRoles, children }) {
  const { profile, tenant, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  // Superadmin bypass
  if (profile?.role === 'superadmin') return children;
  
  if (!profile || !allowedRoles.includes(profile.role)) {
    // If mismatch, go to the vertical-aware beranda
    const vertical = tenant?.business_vertical || 'poultry_broker'
    const path = vertical === 'egg_broker' ? '/egg/beranda' : `/broker/${vertical}/beranda`;
    return <Navigate to={path} replace />;
  }

  return children;
}

function RoleRedirector() {
  const { user, profile, tenant, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  
  // Superadmin can navigate freely, no auto-redirects
  if (profile?.role === 'superadmin') return null;

  if (!profile) return <Navigate to="/login" replace />;
  
  if (profile.role === 'sopir') return <Navigate to="/broker/sopir" replace />;
  
  const isSuperAdmin = (profile.role === 'superadmin' || profile.user_type === 'superadmin') && 
                      user?.email === 'fahruhernansakti@gmail.com';

  // Superadmin → /admin
  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  const role = profile.user_type === 'rpa' ? 'rpa-buyer' : profile.user_type;
  
  // If broker, point to the vertical-specific beranda
  if (profile.user_type === 'broker') {
    const vertical = tenant?.business_vertical || 'poultry_broker'
    const path = vertical === 'egg_broker' ? '/egg/beranda' : `/broker/${vertical}/beranda`;
    return <Navigate to={path} replace />;
  }
  
  return <Navigate to={`/${role}/beranda`} replace />;
}

function DashboardLayout({ children }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) {
    return <DesktopSidebarLayout>{children}</DesktopSidebarLayout>;
  }

  return (
    <div className="bg-background min-h-screen max-w-[480px] mx-auto relative pb-[80px] shadow-2xl overflow-x-hidden">
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
    const vertical = profile?.tenants?.business_vertical || 'poultry_broker'
    const path = vertical === 'egg_broker' ? '/egg/beranda' : `/broker/${vertical}/beranda`;
    return <Navigate to={path} replace />;
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

        <Route path="/onboarding" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <OnboardingFlow />
            </ErrorBoundary>
          </ProtectedRoute>
        } />

        {/* Broker routes - Base Redirect */}
        <Route path="/broker" element={<RoleRedirector />} />
        
        {/* Poultry Broker Vertical */}
        <Route path="/broker/poultry_broker/beranda" element={
          <ProtectedRoute requiredType="broker" requiredVertical="poultry_broker">
            <RoleGuard allowedRoles={['owner', 'staff', 'view_only']}>
              <BrokerLayout><BrokerBeranda /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        {/* Legacy fallback for poultry */}
        <Route path="/broker/beranda" element={<RoleRedirector />} />
        
        <Route path="/broker/transaksi" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['owner', 'staff', 'view_only']}>
              <BrokerLayout><Transaksi /></BrokerLayout>
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

        <Route path="/broker/tim" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['owner']}>
              <BrokerLayout><Tim /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/broker/rpa" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['owner', 'staff']}>
              <BrokerLayout><RPA /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/broker/rpa/:id" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['owner', 'staff']}>
              <BrokerLayout>
                <ErrorBoundary>
                  <RPADetail />
                </ErrorBoundary>
              </BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/broker/kandang" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['owner', 'staff']}>
              <BrokerLayout><Kandang /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/broker/pengiriman" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['owner', 'staff']}>
              <BrokerLayout><Pengiriman /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/broker/cashflow" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['owner']}>
              <BrokerLayout><CashFlow /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/broker/armada" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['owner']}>
              <BrokerLayout><Armada /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/broker/simulator" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['owner']}>
              <BrokerLayout><Simulator /></BrokerLayout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/broker/akun" element={
          <ProtectedRoute requiredType="broker">
            <BrokerLayout><Akun /></BrokerLayout>
          </ProtectedRoute>
        } />
        <Route path="/broker/sopir" element={
          <ProtectedRoute requiredType="broker">
            <RoleGuard allowedRoles={['sopir']}>
              <SopirDashboard />
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/broker/staff" element={<Navigate to="/broker/beranda" replace />} />

        {/* Peternak routes */}
        <Route path="/peternak" element={<Navigate to="/peternak/beranda" replace />} />
        <Route path="/peternak/beranda" element={
          <ProtectedRoute requiredType="peternak">
            <DashboardLayout><PeternakBeranda /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/siklus" element={
          <ProtectedRoute requiredType="peternak">
            <DashboardLayout><ComingSoon title="Siklus Pemeliharaan" icon="🔄" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/input" element={
          <ProtectedRoute requiredType="peternak">
            <DashboardLayout><ComingSoon title="Input Harian" icon="📋" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/pakan" element={
          <ProtectedRoute requiredType="peternak">
            <DashboardLayout><ComingSoon title="Stok & Pakan" icon="📦" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/peternak/akun" element={
          <ProtectedRoute requiredType="peternak">
            <DashboardLayout><Akun /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* RPA routes */}
        <Route path="/rpa-buyer" element={<Navigate to="/rpa-buyer/beranda" replace />} />
        <Route path="/rpa-buyer/beranda" element={
          <ProtectedRoute requiredType="rpa">
            <DashboardLayout><RPABeranda /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa-buyer/order" element={
          <ProtectedRoute requiredType="rpa">
            <DashboardLayout><ComingSoon title="Order ke Broker" icon="🛒" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa-buyer/hutang" element={
          <ProtectedRoute requiredType="rpa">
            <DashboardLayout><ComingSoon title="Hutang Saya" icon="💳" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa-buyer/akun" element={
          <ProtectedRoute requiredType="rpa">
            <DashboardLayout><Akun /></DashboardLayout>
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
