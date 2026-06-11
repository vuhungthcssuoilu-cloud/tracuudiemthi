
import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { LookupForm } from '../components/LookupForm';
import { ResultModal } from '../components/ResultModal';
import { SearchParams, SearchResult, SystemConfig } from '../types';
import { searchScores, getSystemConfig } from '../services/dataService';
import { AlertTriangle } from 'lucide-react';

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
    
    try {
      const data = await searchScores(params);
      if (data && data.length > 0) {
        setResults(data);
        setHasSearched(true);
        setIsModalOpen(true);
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

  return (
    <PublicLayout>
      {!config ? (
         /* Loading Spinner bên trong Layout */
         <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
             <div className="w-12 h-12 border-4 border-gray-200 border-t-[#337ab7] rounded-full animate-spin"></div>
             <p className="mt-4 text-gray-500 font-sans font-medium">Đang kết nối hệ thống...</p>
         </div>
      ) : (
        <>
            {config.exam.isOpen ? (
                <LookupForm onSearch={handleSearch} isLoading={isLoading} error={searchError} />
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

            <ResultModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                results={results}
                config={config}
            />
        </>
      )}
    </PublicLayout>
  );
};
