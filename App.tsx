import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { SystemSettings } from './pages/SystemSettings';
import { getSystemConfig } from './services/dataService';

function App() {
  // Cập nhật Favicon động
  useEffect(() => {
    const updateFavicon = async () => {
      const config = await getSystemConfig();
      if (config?.exam.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = config.exam.faviconUrl;
      }
    };
    updateFavicon();
  }, []);

  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/settings" element={<SystemSettings />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;