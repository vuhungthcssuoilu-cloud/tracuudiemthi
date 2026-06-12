
import React from 'react';
import { X, Printer, Award, MapPin } from 'lucide-react';
import { SearchResult, SystemConfig } from '../types';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: SearchResult[] | null;
  config: SystemConfig | null;
}

export const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, results, config }) => {
  if (!isOpen || !results || results.length === 0 || !config) return null;

  const studentInfo = results[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-2 sm:pt-4 md:pt-6 px-2 sm:px-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in font-sans overflow-y-auto">
      <div 
        className="bg-[#fdfdfd] w-full max-w-2xl rounded-md shadow-2xl flex flex-col mb-4 max-h-[none] scale-[0.98] sm:scale-95 md:scale-90 origin-top border-4 sm:border-8 border-[#004e9a] relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Nút đóng góc trên cùng */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-400 hover:text-red-600 transition-colors z-10 p-1 no-print"
        >
          <X size={24} />
        </button>

        {/* Khung viền nghệ thuật bên trong */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-5 md:p-6 border-[1px] border-[#004e9a]/40 m-1 sm:m-1.5 relative bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] font-serif">
          
          {/* Tiêu đề chính */}
          <div className="text-center mb-3 sm:mb-4 pt-1">
            <div className="flex justify-center mb-2">
              <Award size={36} className="text-[#004e9a] opacity-25 absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[3] pointer-events-none" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 uppercase tracking-normal mb-1">
              KẾT QUẢ
            </h1>
            <p className="text-[12px] sm:text-[14px] md:text-[15px] font-bold text-[#004e9a] uppercase">
              {config.exam.name} - {config.exam.schoolYear}
            </p>
          </div>

          {/* Nội dung thông tin thí sinh */}
          <div className="space-y-1.5 sm:space-y-2 mb-4 text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="min-w-[120px] text-slate-600">Họ và tên thí sinh:</span>
              <span className="font-bold uppercase text-slate-900 border-b border-dotted border-slate-400 flex-grow">
                {studentInfo.ho_ten}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div className="flex items-baseline gap-2">
                <span className="min-w-[120px] sm:min-w-[120px] text-slate-600">Ngày sinh:</span>
                <span className="font-bold text-slate-800 border-b border-dotted border-slate-400 flex-grow">
                  {studentInfo.ngay_sinh || '---'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="min-w-[80px] text-slate-600">Giới tính:</span>
                <span className="font-bold text-slate-800 border-b border-dotted border-slate-400 flex-grow">
                  {studentInfo.gioi_tinh || '---'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div className="flex items-baseline gap-2">
                <span className="min-w-[120px] sm:min-w-[120px] text-slate-600">Số báo danh:</span>
                <span className="font-bold text-[#004e9a] border-b border-dotted border-slate-400 flex-grow">
                  {studentInfo.so_bao_danh}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="min-w-[80px] text-slate-600">Số CCCD:</span>
                <span className="font-bold text-slate-800 border-b border-dotted border-slate-400 flex-grow">
                  {studentInfo.cccd || '---'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="min-w-[120px] text-slate-600">Đơn vị / Trường:</span>
              <span className="font-bold text-slate-700 border-b border-dotted border-slate-400 flex-grow text-ellipsis overflow-hidden whitespace-nowrap">
                {studentInfo.truong}
              </span>
            </div>
          </div>

          {/* Bảng điểm */}
          <div className="mb-4">
            <h3 className="font-bold text-[13px] sm:text-[14px] uppercase mb-1.5 text-slate-800">
              KẾT QUẢ DIỂM THI
            </h3>
            <div className="border-[1.5px] border-slate-800 rounded-sm overflow-hidden bg-white">
              <table className="w-full text-left border-collapse min-w-0">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800">
                    <th className="border-r border-slate-800 px-2 py-1.5 text-center font-bold uppercase text-[11px] sm:text-[13px] w-12 sm:w-16">STT</th>
                    <th className="border-r border-slate-800 px-3 py-1.5 sm:px-4 font-bold uppercase text-[11px] sm:text-[13px]">Môn thi / Nội dung</th>
                    <th className="px-3 py-1.5 text-center font-bold uppercase text-[11px] sm:text-[13px] w-24 sm:w-32">Điểm số</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-slate-800 last:border-b-0 hover:bg-slate-50 transition-colors">
                      <td className="border-r border-slate-800 px-2 py-1.5 text-center font-bold text-[12px] sm:text-[14px]">{index + 1}</td>
                      <td className="border-r border-slate-800 px-3 py-1.5 sm:px-4 font-bold uppercase text-[12px] sm:text-[14px]">{item.mon_thi}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className="text-base sm:text-lg font-black text-[#d32f2f] block">
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

        {/* Thanh tác vụ */}
        <div className="bg-slate-100 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 no-print border-t border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
             <span className="flex items-center gap-1 font-bold">
               <MapPin size={12} /> {config.exam.orgUnit}
             </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[#004e9a] border border-[#004e9a] px-3.5 py-1.5 rounded-sm font-bold uppercase text-[11px] hover:bg-blue-50 transition-colors"
            >
              <Printer size={13} />
              In kết quả
            </button>
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-1.5 bg-[#004e9a] text-white rounded-sm font-bold uppercase text-[11px] hover:bg-[#003d7a] transition-all shadow-md"
            >
              Xác nhận & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
