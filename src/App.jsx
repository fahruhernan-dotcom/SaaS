import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './lib/hooks/useAuth';
import LandingPage from './pages/LandingPage';
import AuthPlaceholder from './pages/AuthPlaceholder';

// Dashboard pages
import Beranda from './dashboard/pages/Beranda';
import Transaksi from './dashboard/pages/Transaksi';
import RPA from './dashboard/pages/RPA';
import RPADetail from './dashboard/pages/RPADetail';
import Kandang from './dashboard/pages/Kandang';
import Simulator from './dashboard/pages/Simulator';
import Akun from './dashboard/pages/Akun';
import OnboardingFlow from './dashboard/pages/OnboardingFlow';
import StokVirtual from './dashboard/pages/StokVirtual';
import Orders from './dashboard/pages/Orders';
import Pengiriman from './dashboard/pages/Pengiriman';
import LossReport from './dashboard/pages/LossReport';
import CashFlow from './dashboard/pages/CashFlow';
import Forecast from './dashboard/pages/Forecast';
import HargaPasar from './dashboard/pages/HargaPasar';

// Components
import BottomNav from './dashboard/components/BottomNav';
import LoadingSpinner from './dashboard/components/LoadingSpinner';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage={true} />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function DashboardLayout({ children }) {
  return (
    <div style={{ 
      background: '#06090F', 
      minHeight: '100vh', 
      maxWidth: '480px',
      margin: '0 auto', 
      position: 'relative', 
      paddingBottom: '80px',
      boxShadow: '0 0 100px rgba(0,0,0,0.5)'
    }}>
      {children}
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPlaceholder type="login" />} />
        <Route path="/register" element={<AuthPlaceholder type="register" />} />

        {/* Protected Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout><Beranda /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/transaksi" element={
          <ProtectedRoute>
            <DashboardLayout><Transaksi /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa" element={
          <ProtectedRoute>
            <DashboardLayout><RPA /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/rpa/:id" element={
          <ProtectedRoute>
            <DashboardLayout><RPADetail /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/kandang" element={
          <ProtectedRoute>
            <DashboardLayout><Kandang /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/simulator" element={
          <ProtectedRoute>
            <DashboardLayout><Simulator /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/akun" element={
          <ProtectedRoute>
            <DashboardLayout><Akun /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingFlow />
          </ProtectedRoute>
        } />
        <Route path="/stok" element={
          <ProtectedRoute>
            <DashboardLayout><StokVirtual /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <DashboardLayout><Orders /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/pengiriman" element={
          <ProtectedRoute>
            <DashboardLayout><Pengiriman /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/loss" element={
          <ProtectedRoute>
            <DashboardLayout><LossReport /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/cashflow" element={
          <ProtectedRoute>
            <DashboardLayout><CashFlow /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/forecast" element={
          <ProtectedRoute>
            <DashboardLayout><Forecast /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/harga-pasar" element={
          <ProtectedRoute>
            <DashboardLayout><HargaPasar /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
