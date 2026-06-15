
import React from 'react';
import { SearchResult } from '../types';
import { ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';

interface AdminResultTableProps {
  data: SearchResult[];
  isLoading: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onEdit: (item: SearchResult) => void;
  onDelete: (id: string) => void;
}

export const AdminResultTable: React.FC<AdminResultTableProps> = ({ 
  data, 
  isLoading, 
  page, 
  total, 
  pageSize, 
  onPageChange,
  onEdit,
  onDelete
}) => {
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500 border rounded bg-gray-50">Chưa có dữ liệu nào. Hãy nhập file Excel.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-4 text-center w-12 tracking-wider">STT</th>
              <th className="px-4 py-4 tracking-wider">Họ và Tên</th>
              <th className="px-4 py-4 tracking-wider">SBD</th>
              <th className="px-4 py-4 hidden md:table-cell tracking-wider">Ngày Sinh</th>
              <th className="px-4 py-4 hidden md:table-cell tracking-wider">Giới Tính</th>
              <th className="px-4 py-4 hidden lg:table-cell tracking-wider">CCCD</th>
              <th className="px-4 py-4 hidden lg:table-cell tracking-wider">Trường</th>
              <th className="px-4 py-4 tracking-wider">Môn Thi</th>
              <th className="px-4 py-4 text-center tracking-wider">Điểm</th>
              <th className="px-4 py-4 text-center w-24 tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => (
              <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-4 py-3.5 text-center font-medium text-slate-400">
                  {(page - 1) * pageSize + index + 1}
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-800 uppercase">{row.ho_ten}</td>
                <td className="px-4 py-3.5 font-mono text-indigo-600">{row.so_bao_danh}</td>
                <td className="px-4 py-3.5 hidden md:table-cell text-slate-600">{row.ngay_sinh}</td>
                <td className="px-4 py-3.5 hidden md:table-cell text-slate-600">{row.gioi_tinh}</td>
                <td className="px-4 py-3.5 hidden lg:table-cell text-slate-600 font-mono text-xs">{row.cccd}</td>
                <td className="px-4 py-3.5 hidden lg:table-cell text-slate-600">{row.truong}</td>
                <td className="px-4 py-3.5 text-slate-800 font-medium">{row.mon_thi}</td>
                <td className="px-4 py-3.5 text-center font-bold text-indigo-700 bg-indigo-50/30 group-hover:bg-indigo-50/50 transition-colors">{row.diem}</td>
                <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(row)}
                          className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-md hover:bg-indigo-100 transition-colors" 
                          title="Sửa kết quả"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(row.id!)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors" 
                          title="Xóa kết quả"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-500">
            Hiển thị <span className="font-bold text-slate-700">{data.length}</span> trên tổng số <span className="font-bold text-slate-700">{total}</span> kết quả
        </span>
        <div className="flex items-center gap-1.5">
            <button 
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all shadow-sm"
            >
                <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-700">
                {page} / {totalPages || 1}
            </span>
            <button 
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all shadow-sm"
            >
                <ChevronRight size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};
