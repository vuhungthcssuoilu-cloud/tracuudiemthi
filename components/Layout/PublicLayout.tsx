
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
  const headerBgColor = config?.exam.headerBackgroundColor || '#337ab7';

  // Footer data
  const footerLine1 = config?.footer?.line1 || orgName;
  const footerLine2 = config?.footer?.line2 || 'Đơn vị thi công: CTY TNHH 1 thành viên Hoa Anh Hùng';
  const footerLine3 = config?.footer?.line3 || '';
  const footerBgColor = config?.footer?.backgroundColor || '#337ab7';

  return (
    <div className={`flex flex-col font-sans ${isHomePage ? 'h-screen overflow-hidden' : 'min-h-screen overflow-auto'}`}>
      {/* Header Banner - Sử dụng font-serif/sans đồng bộ */}
      <header 
        className="py-4 shadow-sm border-b border-[#2e6da4] shrink-0 transition-colors duration-300"
        style={{ backgroundColor: headerBgColor }}
      >
        <div className="container mx-auto px-4 flex items-center justify-center gap-6 max-w-6xl">
          <div className="flex-shrink-0">
            <img 
              src={logoUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/National_Emblem_of_Vietnam.svg/2048px-National_Emblem_of_Vietnam.svg.png"} 
              alt="Quốc huy" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain" 
            />
          </div>
          <div className="flex flex-col text-left select-none" style={{ color: headerTextColor }}>
            <h2 className="text-[14px] md:text-[20px] font-bold uppercase leading-tight">
              {orgName}
            </h2>
            <h1 className="text-[16px] md:text-[24px] font-bold uppercase mt-1 leading-tight tracking-normal">
              {examName}
            </h1>
            <p className="text-[16px] md:text-[24px] font-bold mt-1 leading-tight">
              {schoolYear}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-grow flex items-center justify-center bg-white relative ${isHomePage ? 'overflow-hidden' : 'overflow-visible py-10'}`}>
        <div className={`w-full flex flex-col items-center justify-center ${isHomePage ? 'h-full px-4' : 'container mx-auto px-4'}`}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="py-3 text-center border-t border-[#2e6da4] shrink-0 no-print transition-colors duration-300"
        style={{ backgroundColor: footerBgColor }}
      >
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
          
          <div className="absolute right-0 bottom-0 opacity-10 hover:opacity-50 transition-opacity">
            <Link to="/admin/login" className="text-white text-[9px] uppercase font-bold tracking-widest px-2">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
