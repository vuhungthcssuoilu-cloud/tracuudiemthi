import React, { useEffect, useState } from 'react';
import { SearchResult, SystemConfig } from '../types';
import { CheckCircle2, XCircle, User, School, Award } from 'lucide-react';
import { getSystemConfig } from '../services/dataService';

interface ResultTableProps {
  results: SearchResult[] | null;
  hasSearched: boolean;
}

export const ResultTable: React.FC<ResultTableProps> = ({ results, hasSearched }) => {
  const [config, setConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    getSystemConfig().then(setConfig);
  }, []);

  if (!hasSearched) return null;

  if (results && results.length === 0) {
    return (
      <div className="mt-8 bg-white p-8 rounded-lg shadow-lg text-center border border-gray-200 animate-fade-in-up">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="text-red-600" size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2 uppercase">Không Tìm Thấy Kết Quả</h3>
        <p className="text-gray-600">
          Hệ thống không tìm thấy dữ liệu phù hợp với thông tin bạn cung cấp.<br/>
          Vui lòng kiểm tra lại <strong>Họ tên, Số báo danh</strong> và <strong>Số CCCD</strong>.
        </p>
      </div>
    );
  }

  // Assuming all results belong to the same student (Search logic ensures this)
  const studentInfo = results![0];

  return (
    <div className="mt-8 animate-fade-in-up">
      {/* 1. Student Info Card */}
      <div className="bg-white rounded-t-lg shadow-lg border-x border-t border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gov-blue to-blue-800 px-6 py-4 flex items-center justify-between text-white">
          <h3 className="font-bold text-lg uppercase flex items-center gap-2">
            <CheckCircle2 size={24} className="text-yellow-400" />
            Thông Tin Thí Sinh
          </h3>
          <span className="text-xs bg-white/20 px-2 py-1 rounded text-white font-mono">
            SBD: {studentInfo.so_bao_danh}
          </span>
        </div>
        
        <div className="p-6 bg-blue-50/50">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex items-start gap-3">
                 <User className="text-gray-400 mt-0.5" size={20} />
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Họ và tên</p>
                    <p className="text-xl font-bold text-gov-blue uppercase">{studentInfo.ho_ten}</p>
                 </div>
              </div>
              
              <div className="flex items-start gap-3">
                 <School className="text-gray-400 mt-0.5" size={20} />
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Đơn vị trường</p>
                    <p className="text-lg font-medium text-gray-800 uppercase">{studentInfo.truong}</p>
                 </div>
              </div>
              
              <div className="flex items-start gap-3">
                 <Award className="text-gray-400 mt-0.5" size={20} />
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Kỳ thi</p>
                    <p className="text-base font-medium text-gray-800 uppercase">{config?.exam.name}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 2. Results Table */}
      <div className="bg-white rounded-b-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-y border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 w-1/3">Môn Thi</th>
                {config?.results.showScore && (
                    <th scope="col" className="px-6 py-4 text-center">Điểm Thi</th>
                )}
                {config?.results.showRank && (
                    <th scope="col" className="px-6 py-4 text-center">Thứ Hạng</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5 font-bold text-gray-800 uppercase tracking-wide border-r border-gray-100">
                    {item.mon_thi}
                  </td>
                  
                  {config?.results.showScore && (
                    <td className="px-6 py-5 text-center">
                        <span className="inline-block bg-blue-50 text-gov-blue text-xl font-bold px-4 py-1 rounded border border-blue-100">
                            {item.diem}
                        </span>
                    </td>
                  )}

                  {config?.results.showRank && (
                     <td className="px-6 py-5 text-center text-gray-400 italic">--</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 italic">Kết quả này có giá trị tham khảo. Bản cứng chính thức được lưu tại Hội đồng thi.</p>
        </div>
      </div>
    </div>
  );
};