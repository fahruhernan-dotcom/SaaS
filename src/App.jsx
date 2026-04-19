import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, createRoutesFromElements } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider, useAuth } from './lib/hooks/useAuth';
import { NotificationsProvider, useNotificationGenerator } from './lib/hooks/useNotifications.jsx';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CheckEmail from './pages/CheckEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LoadingScreen from './components/LoadingScreen';

// Components (always synchronous — used in layout shell & initial load)
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './dashboard/_shared/components/BottomNav';
import AppSidebar from './dashboard/_shared/components/AppSidebar';
import DesktopSidebarLayout from './dashboard/_shared/layouts/DesktopSidebarLayout';
import { useMediaQuery } from './lib/hooks/useMediaQuery';
import { Menu } from 'lucide-react';

// Public pages — kept static for SSG pre-rendering
import HargaPasarPublic from '@/pages/HargaPasarPublic';
import AcceptInvite from './pages/AcceptInvite';
import AuthCallback from './pages/AuthCallback';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutUs from './pages/AboutUs';
import FiturPage from './pages/FiturPage';
import HargaPage from './pages/HargaPage';
import FAQPage from './pages/FAQPage';
import MarketPublic from './pages/MarketPublic';
import HubungiKami from './pages/HubungiKami';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import NotFound from './pages/NotFound';

// Auth-protected dashboard pages — lazy loaded (not SSG, client-only)
const PeternakLayout       = lazy(() => import('./dashboard/_shared/layouts/PeternakLayout'))
const BrokerLayout         = lazy(() => import('./dashboard/_shared/layouts/BrokerLayout'))
const RumahPotongLayout    = lazy(() => import('./dashboard/_shared/layouts/RumahPotongLayout'))
const PeternakPageRouter   = lazy(() => import('./dashboard/peternak/PeternakRouter').then(m => ({ default: m.PeternakPageRouter })))
const BrokerPageRouter     = lazy(() => import('./dashboard/broker/_shared/BrokerRouter').then(m => ({ default: m.BrokerPageRouter })))
const RPPageRouter         = lazy(() => import('./dashboard/rumah_potong/RPPageRouter').then(m => ({ default: m.RPPageRouter })))
const HargaPasar           = lazy(() => import('./dashboard/_shared/pages/HargaPasar'))
const MarketPriceDashboard = lazy(() => import('./dashboard/_shared/pages/MarketPriceDashboard'))
const Market               = lazy(() => import('./dashboard/_shared/pages/Market'))
const OnboardingFlow       = lazy(() => import('./dashboard/_shared/pages/OnboardingFlow'))
const UpgradePlan          = lazy(() => import('./dashboard/_shared/pages/UpgradePlan'))
const AddonPortal          = lazy(() => import('./dashboard/_shared/pages/AddonPortal'))

// Admin — lazy loaded (superadmin only)
const AdminLayout       = lazy(() => import('./dashboard/admin/AdminLayout'))
const AdminBeranda      = lazy(() => import('./dashboard/admin/AdminBeranda'))
const AdminUsers        = lazy(() => import('./dashboard/admin/AdminUsers'))
const AdminSubscriptions= lazy(() => import('./dashboard/admin/AdminSubscriptions'))
const AdminPricing      = lazy(() => import('./dashboard/admin/AdminPricing'))
const AdminActivity     = lazy(() => import('./dashboard/admin/AdminActivity'))

import { getXBasePath, resolveBusinessVertical, BUSINESS_MODELS } from './lib/businessModel'

// ── Vertical-aware beranda path ───────────────────────────────────────────────
function getVerticalBeranda(tenant, profile) {
  const base = getXBasePath(tenant, profile)
  return `${base}/beranda`
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

// Detect Supabase auth tokens in URL hash (from email confirmation/reset links)
// and redirect to /auth/callback for proper handling
const AuthHashRedirect = () => {
  const location = useLocation();
  
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    
    // Supabase email confirmation/reset redirects with hash params like:
    // /#access_token=xxx&refresh_token=xxx&type=signup
    // /#access_token=xxx&type=recovery
    // Detect auth tokens OR auth errors in hash
    const hasAuthToken = hash.includes('access_token=') || hash.includes('type=recovery') || hash.includes('type=signup');
    const hasAuthError = hash.includes('error=') || hash.includes('error_code=');
    
    if ((hasAuthToken || hasAuthError) && location.pathname !== '/auth/callback') {
      // Move the hash to /auth/callback so AuthCallback component handles it
      window.location.replace('/auth/callback' + hash);
    }
  }, [location]);
  
  return null;
};

function ProtectedRoute({ children, requiredType, requiredVertical }) {
  const { user, profile, tenant, isSuperadmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (isSuperadmin) return children;

  if (profile && !profile.onboarded && location.pathname !== '/onboarding' && profile.role === 'owner') {
    return <Navigate to="/onboarding" replace />;
  }

  // Unified Vertical Resolver
  const currentVertical = resolveBusinessVertical(profile, tenant)
  const currentModel = BUSINESS_MODELS[currentVertical]
  const normalize = (p) => p?.replace(/\/$/, '') || '';

  // 1. VERTICAL OVERRIDE: If the user is on a route matching their business category, ALLOW IT
  // This prevents 'broker' users with 'peternak' businesses from being looped out
  if (requiredVertical && currentModel?.category === requiredVertical) {
    return children;
  }

  // 2. ROLE TYPE GUARD: Only redirect if they are explicitly on the wrong major route type
  if (profile?.business_model_selected && requiredType && profile.user_type !== requiredType) {
    const target = getVerticalBeranda(tenant, profile);
    if (normalize(target) !== normalize(location.pathname)) {
      return <Navigate to={target} replace />;
    }
  }

  // 3. VERTICAL GUARD: Final check for specific vertical mismatch within the same category
  if (requiredVertical && currentModel && currentModel.category !== requiredVertical) {
    const target = getVerticalBeranda(tenant, profile);
    if (normalize(target) !== normalize(location.pathname)) {
      return <Navigate to={target} replace />;
    }
  }

  return children;
}

function RoleGuard({ allowedRoles, children }) {
  const { profile, tenant, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <LoadingScreen />;

  if (!profile || !allowedRoles.includes(profile.role)) {
    const target = getVerticalBeranda(tenant, profile);
    const normalize = (p) => p?.replace(/\/$/, '') || '';
    
    if (normalize(target) === normalize(location.pathname)) return null;
    return <Navigate to={target} replace />;
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
  
  const targetPath = getVerticalBeranda(tenant, profile);
  console.log('[DEBUG] RoleRedirector:', { 
    from: location.pathname, 
    to: targetPath,
    profileOnboarded: profile?.onboarded
  })
  
  // Emergency brake: don't redirect if we are already there (normalized)
  const normalize = (p) => p?.replace(/\/$/, '') || '';
  if (normalize(targetPath) === normalize(location.pathname)) {
    console.log('[DEBUG] RoleRedirector EMERGENCY BRAKE TRIGGERED')
    return null;
  }

  return <Navigate to={targetPath} replace />;
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
  const { user, isSuperadmin, profile, tenant, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  if (!isSuperadmin) {
    return <Navigate to={getVerticalBeranda(tenant, profile)} replace />;
  }

  return children;
}

function AppContentLayout() {
  const { loading } = useAuth();

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen key="loading-screen" />}
      </AnimatePresence>
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

function RootLayout() {
  return (
    <HelmetProvider>
      <Helmet>
        <link rel="icon" type="image/png" href="/logo.png?v=2" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
        <link rel="shortcut icon" href="/logo.png?v=2" />
      </Helmet>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <NotificationsProvider>
              <ScrollToTop />
              <AuthHashRedirect />
              <AppContentLayout />
            </NotificationsProvider>
          </TooltipProvider>
          <Toaster
            theme="dark"
            position="top-center"
            richColors
            expand={false}
            duration={3000}
            toastOptions={{
              style: {
                background: '#111C24',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#F1F5F9',
                fontFamily: 'DM Sans',
                fontSize: '14px',
                borderRadius: '12px',
                padding: '14px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              },
              classNames: {
                success: 'border-emerald-500/20',
                error: 'border-red-500/20',
              }
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

const AdminComingSoon = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
      <span className="text-3xl">🚧</span>
    </div>
    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Segera Hadir</h2>
    <p className="text-[#4B6478] font-bold text-sm tracking-wider uppercase">Menu ini sedang dalam tahap pengembangan.</p>
  </div>
);

export const routes = createRoutesFromElements(
  <Route>
    {/* SPA Fallback route to avoid SSG pollution on Dashboard */}
    <Route path="/_spa_fallback" element={null} />

    <Route element={<RootLayout />}>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/invite" element={<AcceptInvite />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/tentang-kami" element={<AboutUs />} />
    <Route path="/hubungi-kami" element={<HubungiKami />} />
    <Route path="/blog" element={<BlogPage />} />
    <Route path="/blog/:slug" element={<BlogPostPage />} />
    <Route path="/fitur" element={<FiturPage />} />
    <Route path="/harga" element={<HargaPage />} />
    <Route path="/market" element={<MarketPublic />} />
    <Route path="/harga-pasar/:province?" element={<HargaPasarPublic />} />
    <Route path="/faq" element={<FAQPage />} />
    <Route path="/check-email" element={<CheckEmail />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/upgrade" element={
      <ProtectedRoute>
        <UpgradePlan />
      </ProtectedRoute>
    } />

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
      <Route path="daily_task"    element={<PeternakPageRouter page="daily_task" />} />
      <Route path="task_settings" element={<PeternakPageRouter page="task_settings" />} />
      <Route path="task_assign"   element={<PeternakPageRouter page="task_assign" />} />
      <Route path="beranda"          element={<PeternakPageRouter page="beranda" />} />
      <Route path="siklus"           element={<PeternakPageRouter page="siklus" />} />
      <Route path="vaksinasi"        element={<PeternakPageRouter page="vaksinasi" />} />
      <Route path="anak-kandang"     element={<PeternakPageRouter page="anak-kandang" />} />
      <Route path="input-harian"     element={<PeternakPageRouter page="input-harian" />} />
      <Route path="input"            element={<Navigate to="../input-harian" replace />} />
      <Route path="pakan"            element={<PeternakPageRouter page="stok-pakan" />} />
      <Route path="stok-pakan"       element={<Navigate to="../pakan" replace />} />
      <Route path="laporan"          element={<PeternakPageRouter page="laporan" />} />
      <Route path="laporan/:cycleId" element={<PeternakPageRouter page="laporan" />} />
      <Route path="akun"             element={<PeternakPageRouter page="akun" />} />
      <Route path="tim"              element={<PeternakPageRouter page="tim" />} />
      <Route path="harga-pasar"      element={<PeternakPageRouter page="harga-pasar" />} />
      <Route path="kandang-view"     element={<PeternakPageRouter page="kandang-view" />} />
      <Route path="batch"      element={<PeternakPageRouter page="batch" />} />
      <Route path="ternak"     element={<PeternakPageRouter page="ternak" />} />
      <Route path="kesehatan"  element={<PeternakPageRouter page="kesehatan" />} />
      <Route path="reproduksi" element={<PeternakPageRouter page="reproduksi" />} />


      {/* Per-farm routes (Level 2) */}
      <Route path="kandang/:farmId"           element={<Navigate to="beranda" replace />} />
      <Route path="kandang/:farmId/beranda"   element={<PeternakPageRouter page="farm-beranda" />} />
      <Route path="kandang/:farmId/siklus"    element={<PeternakPageRouter page="siklus" />} />
      <Route path="kandang/:farmId/input"     element={<PeternakPageRouter page="input-harian" />} />
      <Route path="kandang/:farmId/laporan"   element={<PeternakPageRouter page="laporan" />} />
      <Route path="kandang/:farmId/pakan"     element={<PeternakPageRouter page="stok-pakan" />} />
      <Route path="kandang/:farmId/vaksinasi" element={<Navigate to="../../vaksinasi" replace />} />
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
    <Route path="/dashboard/harga-pasar" element={
      <ProtectedRoute>
        <DashboardLayout><MarketPriceDashboard /></DashboardLayout>
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
        <AdminLayout />
      </AdminRoute>
    }>
      <Route index element={<AdminBeranda />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="subscriptions" element={<AdminSubscriptions />} />
      <Route path="pricing" element={<AdminPricing />} />
      <Route path="activity" element={<AdminActivity />} />
      <Route path="settings" element={<AdminComingSoon />} />
      <Route path="info" element={<AdminComingSoon />} />
      <Route path="help" element={<AdminComingSoon />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<NotFound />} />
  </Route>
  </Route>
);

export default function App() {
  // Keeping App export as a fallback just in case some other tools import it directly over the components directly inside it.
  return <RootLayout />;
}
