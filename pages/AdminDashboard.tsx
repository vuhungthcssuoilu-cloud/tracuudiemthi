
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Upload, LogOut, FileSpreadsheet, Users, Award, AlertCircle, CheckCircle, Settings, Download, Search, X, Save, Trash2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { uploadExcelData, getDashboardStats, getSystemConfig, getAdminResults, deleteResult, updateResult, deleteAllData, getAllResultsForExport } from '../services/dataService';
import { ExcelRow, SystemConfig, SearchResult } from '../types';
import { AdminResultTable } from '../components/AdminResultTable';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  // Dashboard Stats
  const [stats, setStats] = useState({ studentCount: 0, resultCount: 0 });
  
  // Data Table State
  const [tableData, setTableData] = useState<SearchResult[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTableLoading, setIsTableLoading] = useState(false);

  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success?: number; error?: string; details?: string[] } | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SearchResult | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    checkAuth();
    loadConfig();
    loadStats();
    loadTableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload table when page or search changes
  useEffect(() => {
    loadTableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  const checkAuth = async () => {
    if (!isSupabaseConfigured()) {
        if (!localStorage.getItem('sb-mock-token')) navigate('/admin/login');
        return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate('/admin/login');
  };

  const loadStats = async () => {
    const data = await getDashboardStats();
    setStats(data);
  };

  const loadTableData = async () => {
      setIsTableLoading(true);
      const res = await getAdminResults(page, 10, searchTerm);
      setTableData(res.data);
      setTotalRecords(res.total);
      setIsTableLoading(false);
  };
  
  const loadConfig = async () => {
      const data = await getSystemConfig();
      setConfig(data);
  }

  const handleLogout = async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut();
    else localStorage.removeItem('sb-mock-token');
    navigate('/admin/login');
  };

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      setPage(1); // Reset to page 1 on new search
      loadTableData();
  };

  const handleDownloadTemplate = () => {
    if (config?.template.fileUrl && !config.template.fileUrl.includes('example.com') && !config.template.fileUrl.includes('mock')) {
        window.open(config.template.fileUrl, '_blank');
        return;
    }

    const headers = config?.template.requiredHeaders && config.template.requiredHeaders.length > 0
        ? config.template.requiredHeaders
        : ['HO_TEN', 'SO_BAO_DANH', 'CCCD', 'TRUONG', 'CAP_HOC', 'MON_THI', 'DIEM'];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wscols = headers.map(h => ({ wch: h.length + 5 }));
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Lieu");
    XLSX.writeFile(wb, config?.template.fileName || "File_Mau_Nhap_Diem.xlsx");
  };

  const handleExportData = async () => {
      if (totalRecords === 0) {
          alert('Không có dữ liệu để xuất file.');
          return;
      }
      
      const allData = await getAllResultsForExport();
      const exportData = allData.map(item => ({
          'Họ và Tên': item.ho_ten,
          'Số Báo Danh': item.so_bao_danh,
          'CCCD': item.cccd,
          'Trường': item.truong,
          'Môn Thi': item.mon_thi,
          'Điểm Số': item.diem
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Ket_Qua_Thi");
      XLSX.writeFile(wb, `Danh_Sach_Ket_Qua_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
  };

  const handleClearAll = async () => {
      if (window.confirm('CẢNH BÁO NGUY HIỂM!\n\nBạn có chắc chắn muốn XÓA TOÀN BỘ danh sách học sinh và kết quả thi?\nThao tác này KHÔNG THỂ HOÀN TÁC.')) {
          const confirmCode = prompt('Nhập chữ "DELETE" để xác nhận việc xóa toàn bộ dữ liệu:');
          if (confirmCode === 'DELETE') {
              const success = await deleteAllData();
              if (success) {
                  alert('Đã xóa sạch toàn bộ dữ liệu hệ thống.');
                  loadStats();
                  setPage(1);
                  loadTableData();
              } else {
                  alert('Có lỗi xảy ra khi thực hiện xóa dữ liệu.');
              }
          } else {
              alert('Mã xác nhận không đúng. Thao tác đã bị hủy.');
          }
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<ExcelRow>(ws);
        
        const result = await uploadExcelData(data);
        
        if (result.errors.length > 0) {
             setUploadStatus({ 
                success: result.success,
                error: `Đã nhập ${result.success} dòng. Có ${result.errors.length} lỗi xảy ra.`,
                details: result.errors
             });
        } else {
            setUploadStatus({ success: result.success });
        }
        
        // Refresh Everything
        await loadStats(); 
        setPage(1);
        await loadTableData();

      } catch (error: any) {
        setUploadStatus({ error: error.message || 'Lỗi đọc file Excel' });
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // --- DELETE & EDIT LOGIC ---

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa kết quả này? Thao tác này không thể hoàn tác.')) {
      const success = await deleteResult(id);
      if (success) {
        alert('Đã xóa kết quả thành công.');
        loadTableData();
        loadStats();
      } else {
        alert('Có lỗi xảy ra khi xóa dữ liệu.');
      }
    }
  };

  const handleEdit = (item: SearchResult) => {
    setEditingItem({ ...item });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsUpdating(true);
    const success = await updateResult(editingItem.id!, editingItem);
    setIsUpdating(false);

    if (success) {
      setEditingItem(null);
      loadTableData();
      alert('Cập nhật thành công!');
    } else {
      alert('Có lỗi xảy ra khi cập nhật.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20 overflow-y-auto">
      <header className="bg-white shadow border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-gov-blue p-1.5 rounded text-white">
                <Award size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 uppercase">Hệ Thống Quản Trị Điểm Thi</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium transition-colors"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        
        {/* Navigation to Settings */}
        <div className="mb-8">
            <div className="bg-gradient-to-r from-gov-blue to-blue-800 rounded-lg shadow-lg p-6 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold uppercase mb-1">Cấu Hình Hệ Thống</h2>
                    <p className="text-blue-100">Quản lý kỳ thi, môn thi, hiển thị, bảo mật và file mẫu.</p>
                </div>
                <button 
                    onClick={() => navigate('/admin/settings')}
                    className="bg-white text-gov-blue px-6 py-3 rounded font-bold uppercase hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                    <Settings size={20} />
                    Thiết Lập Ngay
                </button>
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center gap-4">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
              <Users size={32} />
            </div>
            <div>
              <p className="text-gray-500 text-sm uppercase font-semibold">Tổng Số Học Sinh</p>
              <p className="text-3xl font-bold text-gray-800">{stats.studentCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center gap-4">
             <div className="p-4 bg-green-100 text-green-600 rounded-full">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <p className="text-gray-500 text-sm uppercase font-semibold">Kết Quả Đã Nhập</p>
              <p className="text-3xl font-bold text-gray-800">{stats.resultCount}</p>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-10">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 uppercase flex items-center gap-2">
              <Upload size={20} />
              Nhập Dữ Liệu Từ Excel
            </h2>
            
            <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-sm bg-white border border-gray-300 text-gov-blue px-3 py-1.5 rounded hover:bg-blue-50 transition-colors font-medium"
                title="Tải file mẫu định dạng .xlsx"
            >
                <Download size={16} />
                Tải File Mẫu
            </button>
          </div>
          
          <div className="p-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors relative">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <FileSpreadsheet size={48} className="text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                    {isUploading ? 'Đang xử lý...' : 'Kéo thả file Excel hoặc nhấn để chọn'}
                </p>
                <p className="text-sm text-gray-500">Hỗ trợ định dạng .xlsx, .xls</p>
              </div>
            </div>

            {uploadStatus && (
                <div className={`mt-6 p-4 rounded border ${uploadStatus.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    {uploadStatus.error ? (
                        <div>
                             <h4 className="font-bold text-red-700 flex items-center gap-2">
                                <AlertCircle size={20} />
                                {uploadStatus.error}
                             </h4>
                             {uploadStatus.details && (
                                <ul className="mt-2 list-disc list-inside text-sm text-red-600 max-h-40 overflow-y-auto">
                                    {uploadStatus.details.map((msg, idx) => (
                                        <li key={idx}>{msg}</li>
                                    ))}
                                </ul>
                             )}
                        </div>
                    ) : (
                        <h4 className="font-bold text-green-700 flex items-center gap-2">
                            <CheckCircle size={20} />
                            Nhập dữ liệu thành công! Đã thêm {uploadStatus.success} bản ghi.
                        </h4>
                    )}
                </div>
            )}
          </div>
        </div>

        {/* Data Management Section */}
        <div className="mb-6 space-y-4">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center gap-2">
                    <FileSpreadsheet size={24} className="text-gov-blue" />
                    Danh Sách Kết Quả Thi
                 </h2>
                 <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <input 
                        type="text" 
                        placeholder="Tìm theo Tên hoặc Số Báo Danh..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                 </form>
             </div>

             {/* Bulk Actions Bar */}
             <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                 <div className="flex items-center gap-2 text-sm text-gray-500 font-medium italic">
                     <AlertCircle size={16} />
                     Thao tác hàng loạt trên toàn bộ dữ liệu hiện có
                 </div>
                 <div className="flex items-center gap-3">
                     <button 
                        onClick={handleExportData}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-bold uppercase hover:bg-green-700 transition-colors shadow-sm"
                        title="Tải về toàn bộ danh sách hiện có dưới dạng file Excel"
                     >
                         <Download size={16} />
                         Tải danh sách học sinh
                     </button>
                     <button 
                        onClick={handleClearAll}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded text-sm font-bold uppercase hover:bg-red-700 transition-colors shadow-sm"
                        title="XÓA TOÀN BỘ dữ liệu khỏi hệ thống"
                     >
                         <Trash2 size={16} />
                         Xóa toàn bộ danh sách
                     </button>
                 </div>
             </div>
        </div>

        <AdminResultTable 
            data={tableData} 
            total={totalRecords}
            page={page}
            pageSize={10}
            isLoading={isTableLoading}
            onPageChange={setPage}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />

      </main>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden animate-scale-up">
              <div className="bg-gov-blue text-white px-6 py-4 flex justify-between items-center">
                  <h3 className="font-bold uppercase tracking-wide">Chỉnh sửa kết quả thi</h3>
                  <button onClick={() => setEditingItem(null)} className="hover:bg-white/10 p-1 rounded">
                      <X size={24} />
                  </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ và tên</label>
                          <input 
                            type="text" 
                            value={editingItem.ho_ten} 
                            onChange={(e) => setEditingItem({...editingItem, ho_ten: e.target.value.toUpperCase()})}
                            className="w-full border rounded px-3 py-2 uppercase"
                            required
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số báo danh</label>
                          <input 
                            type="text" 
                            value={editingItem.so_bao_danh} 
                            onChange={(e) => setEditingItem({...editingItem, so_bao_danh: e.target.value.toUpperCase()})}
                            className="w-full border rounded px-3 py-2 uppercase font-mono"
                            required
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số CCCD</label>
                          <input 
                            type="text" 
                            value={editingItem.cccd} 
                            maxLength={12}
                            onChange={(e) => setEditingItem({...editingItem, cccd: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                          />
                      </div>
                      <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trường học</label>
                          <input 
                            type="text" 
                            value={editingItem.truong} 
                            onChange={(e) => setEditingItem({...editingItem, truong: e.target.value.toUpperCase()})}
                            className="w-full border rounded px-3 py-2 uppercase"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Môn thi</label>
                          <select 
                            value={editingItem.mon_thi} 
                            onChange={(e) => setEditingItem({...editingItem, mon_thi: e.target.value})}
                            className="w-full border rounded px-3 py-2 uppercase"
                          >
                             {config?.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Điểm thi</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={editingItem.diem} 
                            onChange={(e) => setEditingItem({...editingItem, diem: parseFloat(e.target.value)})}
                            className="w-full border rounded px-3 py-2 font-bold text-gov-blue text-lg"
                            required
                          />
                      </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setEditingItem(null)}
                        className="flex-1 bg-gray-100 text-gray-600 py-3 rounded font-bold uppercase hover:bg-gray-200 transition-colors"
                      >
                        Hủy bỏ
                      </button>
                      <button 
                        type="submit" 
                        disabled={isUpdating}
                        className="flex-1 bg-gov-blue text-white py-3 rounded font-bold uppercase hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save size={18} />
                        {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                  </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};