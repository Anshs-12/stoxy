import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AuthGate } from './components/layout/AuthGate';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/pages/Dashboard';
import { StockDetails } from './components/pages/StockDetails';
import { NSEIndexDetail } from './components/pages/IndexDetail';
import { StockSearch } from './components/pages/StockSearch';
import { StockScreener } from './components/pages/StockScreener';
import { Watchlist } from './components/pages/Watchlist';
import { Portfolio } from './components/pages/Portfolio';
import { Login } from './components/pages/Login';

import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <div className="flex flex-col h-screen bg-base dark:bg-base relative text-primary dark:text-primary">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8">
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