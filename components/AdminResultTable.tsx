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
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-center w-12">STT</th>
              <th className="px-4 py-3">Họ và Tên</th>
              <th className="px-4 py-3">SBD</th>
              <th className="px-4 py-3 hidden md:table-cell">CCCD</th>
              <th className="px-4 py-3 hidden md:table-cell">Trường</th>
              <th className="px-4 py-3">Môn Thi</th>
              <th className="px-4 py-3 text-center">Điểm</th>
              <th className="px-4 py-3 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, index) => (
              <tr key={row.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-3 text-center font-medium text-gray-500">
                  {(page - 1) * pageSize + index + 1}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800 uppercase">{row.ho_ten}</td>
                <td className="px-4 py-3 font-mono text-blue-600">{row.so_bao_danh}</td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">{row.cccd}</td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">{row.truong}</td>
                <td className="px-4 py-3 text-gray-800">{row.mon_thi}</td>
                <td className="px-4 py-3 text-center font-bold text-gov-blue">{row.diem}</td>
                <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => onEdit(row)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors" 
                          title="Sửa kết quả"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(row.id!)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors" 
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
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-500">
            Hiển thị {data.length} / {total} kết quả
        </span>
        <div className="flex gap-1">
            <button 
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
            >
                <ChevronLeft size={20} />
            </button>
            <span className="px-3 py-1 bg-white border rounded text-sm font-medium">
                Trang {page} / {totalPages || 1}
            </span>
            <button 
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};