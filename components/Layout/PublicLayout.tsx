
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

  useEffect(() => {
    if (isHomePage) {
      document.body.classList.add('no-scrollbar');
    } else {
      document.body.classList.remove('no-scrollbar');
    }
  }, [isHomePage]);

  const orgName = config?.exam.orgUnit || 'ỦY BAN NHÂN DÂN XÃ XA DUNG, TỈNH ĐIỆN BIÊN';
  const examName = config?.exam.name || 'TRA CỨU ĐIỂM THI CHỌN HỌC SINH GIỎI';
  const schoolYear = config?.exam.schoolYear || 'Năm học 2025 - 2026';
  const logoUrl = config?.exam.logoUrl;
  const headerTextColor = config?.exam.headerTextColor || '#FFFF00';

  // Footer data
  const footerLine1 = config?.footer?.line1 || 'Dữ liệu chính thức từ phòng Văn Hóa UBND xã Xa Dung';
  const footerLine2 = config?.footer?.line2 || 'Mọi thắc mắc về điểm thi xin liên hệ đơn vị tổ chức kỳ thi';
  const footerLine3 = config?.footer?.line3 || 'Application developed by: Vu Hung - Email: vuhung@db.edu.vn';

  return (
    <div className={`flex flex-col min-h-screen bg-[#f0f4f8] font-sans`}>
      {/* Header Banner - Thiết kế chính xác theo hình gốc, tối ưu mobile */}
      <header className="bg-[#004e9a] py-2.5 sm:py-4.5 shrink-0">
        <div className="container mx-auto px-2 xs:px-4 max-w-6xl flex flex-col items-center justify-center select-none">
          <h2 className="text-[10px] sm:text-xs md:text-sm font-medium uppercase tracking-wider text-[#edf2f7] text-center opacity-90 leading-tight">
            {orgName}
          </h2>
          <h1 className="text-[13px] sm:text-[17px] md:text-xl font-bold uppercase mt-1 leading-snug tracking-normal text-white text-center px-1">
            {examName}
          </h1>
          <div className="mt-1 text-center">
            <span className="inline-block bg-[#d32f2f] text-white font-medium text-[10px] sm:text-xs md:text-[11px] px-3 md:px-4 py-0.5 md:py-1 rounded-sm uppercase tracking-wider">
              {schoolYear}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-start px-3 py-4 sm:py-6 md:py-10">
        <div className="w-full max-w-md md:max-w-xl flex flex-col items-center justify-start">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#004e9a] py-4 sm:py-6 border-t border-[#003c77] shrink-0 no-print mt-auto text-center">
        <div className="container mx-auto px-4 relative flex flex-col items-center justify-center">
          <p className="text-white text-[13px] sm:text-[14px] font-bold uppercase mb-1.5 opacity-90 leading-tight">
            {footerLine1}
          </p>
          {footerLine2 && (
             <p className="text-white/80 text-[12px] sm:text-[13px] font-normal mb-1 leading-tight">
                {footerLine2}
             </p>
          )}
          {footerLine3 && (
             <p className="text-white/70 text-[11px] sm:text-[12px] font-normal mb-3 sm:mb-0 leading-tight">
                {footerLine3}
             </p>
          )}
          
          <div className="sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity mt-2 sm:mt-0">
            <Link to="/admin/login" className="text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 border border-white/20 rounded hover:bg-white/10 transition-colors">
              Đăng nhập
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
