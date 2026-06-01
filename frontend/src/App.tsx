import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AuthGate } from './components/layout/AuthGate';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MarketTicker } from './components/layout/MarketTicker';
import { ThemeProvider } from './context/ThemeContext';

const Dashboard = lazy(() => import('./components/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const StockDetails = lazy(() => import('./components/pages/StockDetails').then(m => ({ default: m.StockDetails })));
const NSEIndexDetail = lazy(() => import('./components/pages/IndexDetail').then(m => ({ default: m.NSEIndexDetail })));
const StockSearch = lazy(() => import('./components/pages/StockSearch').then(m => ({ default: m.StockSearch })));
const StockScreener = lazy(() => import('./components/pages/StockScreener').then(m => ({ default: m.StockScreener })));
const Watchlist = lazy(() => import('./components/pages/Watchlist').then(m => ({ default: m.Watchlist })));
const Portfolio = lazy(() => import('./components/pages/Portfolio').then(m => ({ default: m.Portfolio })));
const Login = lazy(() => import('./components/pages/Login').then(m => ({ default: m.Login })));

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <div className="flex flex-col h-screen bg-base relative text-primary">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <MarketTicker />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8">
              <Suspense fallback={
                <div className="flex items-center justify-center h-64 text-muted">
                  <div className="h-8 w-8 border-2 border-positive/30 border-t-positive rounded-full animate-spin" />
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/stocks/:symbol" element={<StockDetails />} />
                  <Route path="/index/:symbol" element={<NSEIndexDetail />} />
                  <Route path="/search" element={<StockSearch />} />
                  <Route path="/screener" element={<StockScreener />} />
                  <Route path="/login" element={<Login />} />
                  
                  {/* Protected Routes */}
                  <Route path="/watchlist" element={
                    <AuthGate><Watchlist /></AuthGate>
                  } />
                  <Route path="/portfolio" element={
                    <AuthGate><Portfolio /></AuthGate>
                  } />
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;