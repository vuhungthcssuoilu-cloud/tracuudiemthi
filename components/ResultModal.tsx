
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="bg-[#fdfdfd] w-full max-w-3xl rounded-sm shadow-2xl flex flex-col max-h-[95vh] border-[12px] border-[#337ab7]/10 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Nút đóng góc trên cùng */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-400 hover:text-red-600 transition-colors z-10 p-1 no-print"
        >
          <X size={28} />
        </button>

        {/* Khung viền nghệ thuật bên trong */}
        <div className="flex-grow overflow-y-auto p-4 md:p-10 border-[1px] border-[#337ab7]/30 m-2 relative bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]">
          
          {/* Tiêu đề chính */}
          <div className="text-center mb-10 pt-4">
            <div className="flex justify-center mb-4">
              <Award size={48} className="text-[#337ab7] opacity-20 absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[4] pointer-events-none" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-normal mb-2">
              KẾT QUẢ
            </h1>
            <p className="text-[16px] md:text-[18px] font-bold text-[#337ab7] uppercase">
              {config.exam.name} - {config.exam.schoolYear}
            </p>
          </div>

          {/* Nội dung thông tin thí sinh */}
          <div className="space-y-4 mb-8 text-[16px] md:text-[18px] leading-relaxed">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="min-w-[140px]">Họ và tên thí sinh:</span>
              <span className="font-bold uppercase text-slate-900 border-b border-dotted border-slate-400 flex-grow">
                {studentInfo.ho_ten}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-baseline gap-2">
                <span className="min-w-[140px]">Số báo danh:</span>
                <span className="font-bold text-[#337ab7] border-b border-dotted border-slate-400 flex-grow">
                  {studentInfo.so_bao_danh}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="min-w-[100px]">Số CCCD:</span>
                <span className="font-bold text-slate-800 border-b border-dotted border-slate-400 flex-grow">
                  {studentInfo.cccd || '---'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="min-w-[140px]">Đơn vị / Trường:</span>
              <span className="font-bold text-slate-700 border-b border-dotted border-slate-400 flex-grow">
                {studentInfo.truong}
              </span>
            </div>
          </div>

          {/* Bảng điểm */}
          <div className="mb-10">
            <h3 className="font-bold text-[16px] uppercase mb-3 text-slate-800">
              KẾT QUẢ
            </h3>
            <div className="border-[1.5px] border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800">
                    <th className="border-r border-slate-800 px-4 py-2 text-center w-16 font-bold uppercase text-[14px]">STT</th>
                    <th className="border-r border-slate-800 px-4 py-2 font-bold uppercase text-[14px]">Môn thi / Nội dung</th>
                    <th className="px-4 py-2 text-center font-bold uppercase text-[14px]">Điểm số</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-slate-800 last:border-b-0">
                      <td className="border-r border-slate-800 px-4 py-3 text-center font-bold">{index + 1}</td>
                      <td className="border-r border-slate-800 px-4 py-3 font-bold uppercase">{item.mon_thi}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-2xl font-black text-[#d32f2f]">
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
        <div className="bg-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 no-print border-t border-slate-200">
          <div className="flex items-center gap-4 text-slate-500 text-[13px]">
             <span className="flex items-center gap-1 font-bold">
               <MapPin size={14} /> {config.exam.orgUnit}
             </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-[#337ab7] border border-[#337ab7] px-6 py-2 rounded-sm font-bold uppercase text-[13px] hover:bg-blue-50 transition-colors"
            >
              <Printer size={16} />
              In kết quả
            </button>
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-2 bg-[#337ab7] text-white rounded-sm font-bold uppercase text-[13px] hover:bg-[#286090] transition-all shadow-md"
            >
              Xác nhận & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
