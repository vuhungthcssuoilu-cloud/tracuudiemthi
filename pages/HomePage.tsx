
import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { LookupForm } from '../components/LookupForm';
import { SearchParams, SearchResult, SystemConfig } from '../types';
import { searchScores, getSystemConfig, getCachedConfig, subscribeToConfig } from '../services/dataService';
import { AlertTriangle, Printer, Award, MapPin } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Khởi tạo ngay với config cached để hiển thị luôn
  const [config, setConfig] = useState<SystemConfig>(getCachedConfig());
  
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    // Đăng ký nhận cập nhật cấu hình tức thì
    const unsubscribe = subscribeToConfig(setConfig);
    
    // Kích hoạt nạp cấu hình mới nhất từ Supabase
    getSystemConfig();
    
    return unsubscribe;
  }, []);

  const handleSearch = async (params: SearchParams): Promise<boolean> => {
    setIsLoading(true);
    setHasSearched(false);
    setSearchError(null);
    
    try {
      const data = await searchScores(params);
      if (data && data.length > 0) {
        setResults(data);
        setHasSearched(true);
        return true;
      } else {
        setSearchError('Thông tin tra cứu không chính xác hoặc không tồn tại.');
        setResults([]);
        setHasSearched(true);
        return false;
      }
    } catch (error) {
      console.error("Lỗi tra cứu:", error);
      setSearchError('Hệ thống đang bận, vui lòng thử lại sau.');
      setResults([]);
      setHasSearched(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setResults(null);
    setHasSearched(false);
    setSearchError(null);
  };

  return (
    <PublicLayout>
        <div className="w-full flex flex-col items-center">
          {results && results.length > 0 ? (
            /* Hiển thị kết quả điểm chuyên nghiệp giống hệt certificate */
            <div className="w-full max-w-2xl bg-[#fdfdfd] rounded-md shadow-2xl flex flex-col mb-4 border-4 sm:border-8 border-[#004e9a] relative mx-auto overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] animate-fade-in">
              {/* Khung viền nghệ thuật bên trong - Chỉ bao bọc nội dung kết quả để đóng kín hoàn toàn và tách biệt khỏi thanh tác vụ */}
              <div className="border-[1.5px] border-[#004e9a] m-2 sm:m-3 p-4 sm:p-5 md:p-6 pb-5 font-serif rounded-sm bg-white/30 backdrop-blur-[0.5px]">
                {/* Tiêu đề chính */}
                <div className="text-center mb-4 sm:mb-6 pt-1">
                  <div className="flex justify-center mb-2">
                    <Award size={36} className="text-[#004e9a] opacity-[0.08] absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[4] pointer-events-none" />
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-wide mb-1 select-none">
                    KẾT QUẢ
                  </h1>
                  <p className="text-[12px] sm:text-[14px] md:text-[15px] font-black text-[#004e9a] uppercase px-2 leading-snug">
                    {config.exam.name}
                  </p>
                  <p className="text-[11px] sm:text-[12.5px] md:text-[13px] font-bold text-slate-700 uppercase px-1 mt-1 tracking-wider">
                    {config.exam.schoolYear}
                  </p>
                </div>

                {/* Nội dung thông tin thí sinh */}
                <div className="space-y-2 sm:space-y-3 mb-6 text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed select-text">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="min-w-[120px] text-slate-500 font-medium font-sans">Họ và tên thí sinh:</span>
                    <span className="font-extrabold uppercase text-[#004e9a] border-b border-dotted border-slate-300 flex-grow text-[14px] sm:text-[15px] md:text-[16px]">
                      {results[0].ho_ten}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6">
                    <div className="flex items-baseline gap-2">
                      <span className="min-w-[120px] sm:min-w-[120px] text-slate-500 font-medium font-sans">Ngày sinh:</span>
                      <span className="font-bold text-slate-800 border-b border-dotted border-slate-300 flex-grow">
                        {results[0].ngay_sinh || '---'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 col-span-1">
                      <span className="min-w-[80px] text-slate-500 font-medium font-sans">Giới tính:</span>
                      <span className="font-bold text-slate-800 border-b border-dotted border-slate-300 flex-grow">
                        {results[0].gioi_tinh || '---'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6">
                    <div className="flex items-baseline gap-2">
                      <span className="min-w-[120px] sm:min-w-[120px] text-slate-500 font-medium font-sans">Số báo danh:</span>
                      <span className="font-bold text-[#004e9a] border-b border-dotted border-slate-300 flex-grow font-mono text-[14px]">
                        {results[0].so_bao_danh}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 col-span-1">
                      <span className="min-w-[80px] text-slate-500 font-medium font-sans">Số CCCD:</span>
                      <span className="font-bold text-slate-800 border-b border-dotted border-slate-300 flex-grow font-mono text-[14px]">
                        {results[0].cccd || '---'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="min-w-[120px] text-slate-500 font-medium font-sans">Đơn vị / Trường:</span>
                    <span className="font-bold text-slate-700 border-b border-dotted border-slate-300 flex-grow text-ellipsis overflow-hidden" title={results[0].truong}>
                      {results[0].truong}
                    </span>
                  </div>
                </div>

                {/* Bảng điểm */}
                <div className="mb-2">
                  <h3 className="font-extrabold text-[12.5px] sm:text-[13px] uppercase mb-2 text-slate-800 tracking-wider">
                    KẾT QUẢ ĐIỂM THI
                  </h3>
                  <div className="border-[1.5px] border-slate-700 rounded-sm overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse min-w-0 font-sans">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-700 select-none">
                          <th className="border-r border-slate-700 px-2 py-2 sm:py-2.5 text-center font-extrabold uppercase text-[11px] sm:text-[12px] text-slate-700 w-12 sm:w-16">STT</th>
                          <th className="border-r border-slate-700 px-3 py-2 sm:py-2.5 sm:px-4 font-extrabold uppercase text-[11px] sm:text-[12px] text-slate-700">Môn thi / Nội dung</th>
                          <th className="px-3 py-2 sm:py-2.5 text-center font-extrabold uppercase text-[11px] sm:text-[12px] text-slate-700 w-24 sm:w-32">Điểm số</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((item, index) => (
                          <tr key={item.id || index} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                            <td className="border-r border-slate-700 px-2 py-2 sm:py-2.5 text-center font-bold text-[12.5px] sm:text-[13.5px] text-slate-600">{index + 1}</td>
                            <td className="border-r border-slate-700 px-3 py-2 sm:py-2.5 sm:px-4 font-bold uppercase text-[12.5px] sm:text-[13.5px] text-slate-800 leading-relaxed">{item.mon_thi}</td>
                            <td className="px-3 py-2 sm:py-2.5 text-center">
                              <span className="text-base sm:text-lg font-black text-[#d32f2f] block select-all">
                                {item.diem}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Thanh tác vụ bottom giống gốc - Nằm độc lập bên ngoài khung viền nhỏ */}
              <div className="bg-slate-50/95 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 no-print border-t border-slate-200/80 font-sans">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold select-none text-center sm:text-left leading-tight">
                  <MapPin size={12} className="text-[#004e9a] shrink-0" />
                  <span>{config.exam.orgUnit}</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button 
                    onClick={handlePrint}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[#004e9a] border-2 border-[#004e9a]/80 px-5 py-2.5 bg-white rounded-full font-extrabold uppercase text-[11px] tracking-wider hover:bg-blue-50/80 active:scale-[0.98] transition-all duration-150"
                  >
                    <Printer size={13} className="stroke-[2.5]" />
                    IN KẾT QUẢ
                  </button>
                  <button 
                    onClick={handleReset}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-[#d32f2f] hover:bg-[#b71c1c] active:scale-[0.98] text-white rounded-full font-extrabold uppercase text-[11px] tracking-wider transition-all duration-150 shadow-md shadow-red-900/10 hover:shadow-lg hover:shadow-red-900/15"
                  >
                    XÁC NHẬN & ĐÓNG
                  </button>
                </div>
              </div>
            </div>
          ) : config.exam.isOpen ? (
            <LookupForm onSearch={handleSearch} isLoading={isLoading} error={searchError} config={config} />
          ) : (
            <div className="bg-white border border-slate-100 rounded-lg p-16 text-center shadow-sm max-w-2xl mx-auto animate-fade-in w-full">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={32} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 uppercase mb-3 text-center">Cổng tra cứu hiện đang đóng</h3>
              <p className="text-slate-400 text-sm italic text-center">
                  Hệ thống tra cứu điểm thi hiện chưa mở.
              </p>
            </div>
          )}
        </div>
    </PublicLayout>
  );
};
