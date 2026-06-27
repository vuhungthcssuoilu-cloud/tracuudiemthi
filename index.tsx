import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Xử lý chuyển hướng cho URL/admin khi dùng HashRouter
if (window.location.pathname.startsWith('/admin')) {
  const hashPath = window.location.pathname; // Ví dụ: /admin/login
  window.location.replace('/#' + hashPath);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);