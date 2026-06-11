
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getSystemConfig, DEFAULT_CONFIG } from '../../services/dataService';
import { SystemConfig } from '../../types';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Khởi tạo ngay với DEFAULT_CONFIG để hiển thị Header/Footer lập tức
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    // Load config thật từ DB, nếu có thì cập nhật lại
    getSystemConfig().then(setConfig);
  }, []);

  const orgName = config?.exam.orgUnit || 'ỦY BAN NHÂN DÂN XÃ XA DUNG, TỈNH ĐIỆN BIÊN';
  const examName = config?.exam.name || 'TRA CỨU ĐIỂM THI CHỌN HỌC SINH GIỎI';
  const schoolYear = config?.exam.schoolYear || 'Năm học 2025 - 2026';
  const logoUrl = config?.exam.logoUrl;
  const headerTextColor = config?.exam.headerTextColor || '#FFFF00';

  // Footer data
  const footerLine1 = config?.footer?.line1 || orgName;
  const footerLine2 = config?.footer?.line2 || 'Hệ thống tra cứu điểm thi trực tuyến';
  const footerLine3 = config?.footer?.line3 || '';

  return (
    <div className={`flex flex-col min-h-screen bg-[#f0f4f8] font-sans`}>
      {/* Header Banner - Thiết kế chính xác theo hình gốc, tối ưu mobile */}
      <header className="bg-[#004e9a] py-3 sm:py-5 shadow-md border-b border-[#003c77] shrink-0">
        <div className="container mx-auto px-2 xs:px-4 max-w-6xl flex flex-col items-center justify-center select-none">
          <h2 className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-[#edf2f7] text-center opacity-90 leading-tight">
            {orgName}
          </h2>
          <h1 className="text-[14px] sm:text-[18px] md:text-2xl font-black uppercase mt-1 leading-snug tracking-normal text-white text-center px-1">
            {examName}
          </h1>
          <div className="mt-1 text-center">
            <span className="inline-block bg-[#d32f2f] text-white font-black text-[10px] sm:text-xs md:text-sm px-3 py-0.5 rounded-[3px] uppercase tracking-wider shadow-sm">
              {schoolYear}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-3 py-2 sm:py-6 md:py-12">
        <div className="w-full max-w-md md:max-w-xl flex flex-col items-center justify-center">
          {children}
        </div>
      </main>

      {/* Footer */}
      {isHomePage ? (
        <footer className="pt-2 pb-4 text-center shrink-0 no-print bg-transparent select-none">
          <div className="container mx-auto px-4 relative flex flex-col items-center justify-center gap-0.5">
            <p className="text-gray-500 text-[12px] md:text-[14px] font-medium leading-tight">
              {footerLine1}
            </p>
            {footerLine2 && (
               <p className="text-gray-400 text-[11px] md:text-[13px] font-normal leading-tight">
                  {footerLine2}
               </p>
            )}
            
            <div className="absolute right-4 bottom-0 opacity-10 hover:opacity-50 transition-opacity">
              <Link to="/admin/login" className="text-gray-500 text-[9px] uppercase font-bold tracking-widest px-2">Login</Link>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="bg-[#004e9a] py-4 text-center border-t border-[#003c77] shrink-0 no-print">
          <div className="container mx-auto px-4 relative">
            <p className="text-white text-[14px] font-bold uppercase mb-1">
              {footerLine1}
            </p>
            {footerLine2 && (
               <p className="text-white text-[13px] font-normal mb-1">
                  {footerLine2}
               </p>
            )}
            {footerLine3 && (
               <p className="text-white text-[13px] font-normal">
                  {footerLine3}
               </p>
            )}
            
            <div className="absolute right-4 bottom-1/2 translate-y-1/2 opacity-20 hover:opacity-60 transition-opacity">
              <Link to="/admin/login" className="text-white text-[9px] uppercase font-bold tracking-widest px-2">Login</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
