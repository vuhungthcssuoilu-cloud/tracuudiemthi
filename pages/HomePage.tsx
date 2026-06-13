
import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { LookupForm } from '../components/LookupForm';
import { ResultModal } from '../components/ResultModal';
import { SearchParams, SearchResult, SystemConfig } from '../types';
import { searchScores, getSystemConfig } from '../services/dataService';
import { AlertTriangle, GraduationCap, Printer } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Khởi tạo null để biết khi nào đang load dữ liệu thật
  const [config, setConfig] = useState<SystemConfig | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    // Ẩn loader của index.html nếu React đã chạy
    const loader = document.querySelector('.initial-loader');
    if (loader) {
        (loader as HTMLElement).style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
    
    // Load config
    getSystemConfig().then(setConfig);
  }, []);

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setHasSearched(false);
    setSearchError(null);
    setResults(null);
    
    try {
      const data = await searchScores(params);
      if (data && data.length > 0) {
        setResults(data);
        setHasSearched(true);
        // Thay vì mở modal, hiển thị trực thăng trên trang
        setIsModalOpen(false); 
      } else {
        setSearchError('Thông tin tra cứu không chính xác hoặc không tồn tại.');
        setResults([]);
        setHasSearched(true);
      }
    } catch (error) {
      console.error("Lỗi tra cứu:", error);
      setSearchError('Hệ thống đang bận, vui lòng thử lại sau.');
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PublicLayout>
      {!config ? (
         /* Loading Spinner bên trong Layout */
         <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
             <div className="w-12 h-12 border-4 border-gray-200 border-t-[#337ab7] rounded-full animate-spin"></div>
             <p className="mt-4 text-gray-500 font-sans font-medium">Đang kết nối hệ thống...</p>
         </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full max-w-md md:max-w-xl mx-auto">
            {config.exam.isOpen ? (
                <>
                  <LookupForm onSearch={handleSearch} isLoading={isLoading} error={searchError} />
                  
                  {/* Kết quả hiển thị tại trang theo đúng cấu trúc hình gốc */}
                  {results && results.length > 0 && (
                    <div className="w-full max-w-md md:max-w-xl bg-white rounded-lg shadow-[0_15px_45px_rgba(0,78,154,0.12)] border border-slate-100/80 overflow-hidden animate-fade-in flex flex-col mx-auto">
                      {/* Tiêu đề góc: Màu giống hệt phần Header (#004e9a) */}
                      <div className="bg-[#004e9a] text-white p-3 sm:p-3.5 flex items-center gap-3 shrink-0 selection:bg-white/20">
                         {/* Biểu tượng mũ cử nhân chuẩn gốc */}
                         <div className="bg-white/10 p-1.5 rounded-full shrink-0">
                           <GraduationCap size={22} className="text-white shrink-0" />
                         </div>
                         <div className="flex flex-col">
                            <h3 className="text-[14px] sm:text-[16px] font-bold uppercase tracking-wide leading-tight">
                               {results[0].ho_ten}
                            </h3>
                            <p className="text-[11px] text-white/80 font-medium mt-0.5 font-mono">
                               SBD: {results[0].so_bao_danh}
                            </p>
                         </div>
                      </div>

                      {/* Thông tin chi tiết */}
                      <div className="p-3.5 sm:p-4 bg-white font-sans text-slate-700">
                         <div className="space-y-1.5 sm:space-y-2 mb-3 pb-2.5 border-b border-gray-100 text-[13px] sm:text-[13.5px]">
                            <div className="flex items-center">
                               <span className="w-24 text-gray-400 font-medium h-fit">Số báo danh</span>
                               <span className="font-bold text-slate-800 font-mono text-[13.5px]">{results[0].so_bao_danh}</span>
                            </div>
                            <div className="flex items-center">
                               <span className="w-24 text-gray-400 font-medium h-fit">Ngày sinh</span>
                               <span className="font-bold text-slate-800">{results[0].ngay_sinh || '---'}</span>
                            </div>
                            {results[0].gioi_tinh && (
                               <div className="flex items-center">
                                  <span className="w-24 text-gray-400 font-medium h-fit">Giới tính</span>
                                  <span className="font-bold text-slate-800">{results[0].gioi_tinh}</span>
                                </div>
                            )}
                            {results[0].truong && (
                               <div className="flex items-center">
                                  <span className="w-24 text-gray-400 font-medium h-fit">Trường học</span>
                                  <span className="font-bold text-slate-800 truncate" title={results[0].truong}>
                                     {results[0].truong}
                                  </span>
                               </div>
                            )}
                         </div>

                         {/* Tiêu đề mục điểm thi */}
                         <h4 className="text-[10px] font-bold text-gray-400 tracking-wider mb-2 uppercase">
                            ĐIỂM THI MÔN
                         </h4>

                         {/* Grid các ô điểm thi giống hệt thiết kế trong hình */}
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {results.map((item, index) => {
                               const isChuyen = item.mon_thi.toUpperCase().includes('CHUYÊN') || item.mon_thi.toUpperCase().includes('CHUYEN');
                               return (
                                  <div 
                                    key={item.id || index}
                                    className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-md border text-center transition-all hover:shadow-sm
                                      ${isChuyen 
                                        ? 'border-[#f1c40f] bg-[#fef9e7]/40 shadow-[0_1px_4px_rgba(241,196,15,0.08)]' 
                                        : 'border-slate-100 bg-slate-50/20'}`}
                                  >
                                     <span className={`text-[10px] sm:text-[10.5px] font-semibold leading-relaxed mb-0.5 truncate max-w-full
                                       ${isChuyen ? 'text-[#b7950b]' : 'text-gray-400'}`}
                                     >
                                        {item.mon_thi}
                                     </span>
                                     <span className={`text-[14px] sm:text-base md:text-lg font-extrabold font-mono tracking-tight
                                       ${isChuyen ? 'text-[#b7950b]' : 'text-[#004e9a]'}`}
                                     >
                                        {item.diem}
                                     </span>
                                  </div>
                               );
                            })}
                         </div>

                         {/* Nút hành động in tiện lợi (Màu đồng bộ Header) */}
                         <div className="mt-4 flex justify-end gap-2 no-print border-t border-slate-50 pt-3">
                            <button
                              onClick={handlePrint}
                              className="flex items-center justify-center gap-1.5 text-[#004e9a] border border-[#004e9a] px-3 py-1 rounded-sm font-bold uppercase text-[10px] hover:bg-blue-50 transition-colors"
                            >
                              <Printer size={12} />
                              In kết quả
                            </button>
                         </div>
                      </div>
                    </div>
                  )}
                </>
            ) : (
                <div className="bg-white border border-slate-100 rounded-lg p-16 text-center shadow-sm max-w-2xl mx-auto animate-fade-in">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} className="text-slate-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 uppercase mb-3">Cổng tra cứu hiện đang đóng</h3>
                <p className="text-slate-400 text-sm italic">
                    Hệ thống tra cứu điểm thi hiện chưa mở.
                </p>
                </div>
            )}
        </div>
      )}
    </PublicLayout>
  );
};
