import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Upload,
  LogOut,
  FileSpreadsheet,
  Users,
  Award,
  AlertCircle,
  CheckCircle,
  Settings,
  Download,
  Search,
  X,
  Save,
  Trash2,
  Plus,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../supabaseClient";
import {
  uploadExcelData,
  getDashboardStats,
  getSystemConfig,
  getAdminResults,
  deleteResult,
  updateResult,
  deleteAllData,
  getAllResultsForExport,
  createStudentResult,
} from "../services/dataService";
import { ExcelRow, SystemConfig, SearchResult } from "../types";
import { AdminResultTable } from "../components/AdminResultTable";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  // Dashboard Stats
  const [stats, setStats] = useState({ studentCount: 0, resultCount: 0 });

  // Data Table State
  const [tableData, setTableData] = useState<SearchResult[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [localSearchInput, setLocalSearchInput] = useState("");
  const [isTableLoading, setIsTableLoading] = useState(false);

  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success?: number;
    error?: string;
    details?: string[];
  } | null>(null);

  // Edit/Create Modal State
  const [editingItem, setEditingItem] = useState<SearchResult | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState<Partial<SearchResult>>({
    ho_ten: "",
    so_bao_danh: "",
    cccd: "",
    truong: "",
    mon_thi: "",
    diem: 0,
    ngay_sinh: "",
    gioi_tinh: "",
  });

  useEffect(() => {
    checkAuth();
    loadConfig();
    loadStats();
    loadTableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search input to prevent rapid API calls while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setSearchTerm(localSearchInput);
    }, 450); // 450ms is ideal for typing speed

    return () => clearTimeout(handler);
  }, [localSearchInput]);

  // Reload table when page or search changes
  useEffect(() => {
    loadTableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  const checkAuth = async () => {
    if (!isSupabaseConfigured()) {
      if (!localStorage.getItem("sb-mock-token")) navigate("/admin/login");
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) navigate("/admin/login");
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
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut();
    else localStorage.removeItem("sb-mock-token");
    navigate("/admin/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 on new search
    setSearchTerm(localSearchInput);
  };

  const handleDownloadTemplate = () => {
    // Nếu admin đã tải lên một file mẫu riêng thì ưu tiên dùng file đó
    if (
      config?.template.fileUrl &&
      !config.template.fileUrl.includes("example.com") &&
      !config.template.fileUrl.includes("mock")
    ) {
      window.open(config.template.fileUrl, "_blank");
      return;
    }

    // Header chuẩn cho file mẫu
    const headers = [
      "HO_TEN",
      "SO_BAO_DANH",
      "NGAY_SINH",
      "GIOI_TINH",
      "CCCD",
      "TRUONG",
      "MON_THI",
      "DIEM",
    ];

    // Dòng dữ liệu mẫu để thí sinh/quản trị biết định dạng (Đặc biệt là Ngày sinh dd/mm/yyyy)
    const sampleRow = [
      "NGUYEN VAN A",
      "SBD001",
      "30/01/2005",
      "NAM",
      "035095001234",
      "THPT CHUYEN NINH BINH",
      "TOAN",
      "18.5",
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

    // Cấu hình độ rộng cột
    const wscols = headers.map((h) => ({ wch: h.length + 12 }));
    ws["!cols"] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Lieu");
    XLSX.writeFile(wb, config?.template.fileName || "Mau_Nhap_Diem_Thi.xlsx");
  };

  const handleExportData = async () => {
    if (totalRecords === 0) {
      alert("Không có dữ liệu để xuất file.");
      return;
    }

    const allData = await getAllResultsForExport();
    const exportData = allData.map((item) => ({
      "Họ và Tên": item.ho_ten,
      "Số Báo Danh": item.so_bao_danh,
      "Ngày Sinh": item.ngay_sinh,
      "Giới Tính": item.gioi_tinh,
      CCCD: item.cccd,
      Trường: item.truong,
      "Môn Thi": item.mon_thi,
      "Điểm Số": item.diem,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Ket_Qua_Thi");
    XLSX.writeFile(
      wb,
      `Danh_Sach_Ket_Qua_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xlsx`,
    );
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        "CẢNH BÁO NGUY HIỂM!\n\nBạn có chắc chắn muốn XÓA TOÀN BỘ danh sách học sinh và kết quả thi?\nThao tác này KHÔNG THỂ HOÀN TÁC.",
      )
    ) {
      const confirmCode = prompt(
        'Nhập chữ "DELETE" để xác nhận việc xóa toàn bộ dữ liệu:',
      );
      if (confirmCode === "DELETE") {
        const success = await deleteAllData();
        if (success) {
          alert("Đã xóa sạch toàn bộ dữ liệu hệ thống.");
          loadStats();
          setPage(1);
          loadTableData();
          loadConfig(); // Reload config to clear subjects
        } else {
          alert("Có lỗi xảy ra khi thực hiện xóa dữ liệu.");
        }
      } else {
        alert("Mã xác nhận không đúng. Thao tác đã bị hủy.");
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
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: "array" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        const data = XLSX.utils.sheet_to_json<any>(ws);
        const result = await uploadExcelData(data);

        if (result.errors.length > 0) {
          setUploadStatus({
            success: result.success,
            error: `Đã nhập ${result.success} dòng. Có ${result.errors.length} cảnh báo/lỗi.`,
            details: result.errors,
          });
        } else {
          setUploadStatus({ success: result.success });
        }

        await loadStats();
        setPage(1);
        await loadTableData();
        await loadConfig();
      } catch (error: any) {
        console.error("Upload Error:", error);
        setUploadStatus({ error: error.message || "Lỗi đọc file Excel" });
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const isValidDateFormat = (dateString: string) => {
    if (!dateString) return true;
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/;
    return regex.test(dateString.trim());
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa kết quả này? Thao tác này không thể hoàn tác.",
      )
    ) {
      const success = await deleteResult(id);
      if (success) {
        alert("Đã xóa kết quả thành công.");
        loadTableData();
        loadStats();
      } else {
        alert("Có lỗi xảy ra khi xóa dữ liệu.");
      }
    }
  };

  const handleEdit = (item: SearchResult) => {
    setEditingItem({ ...item });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const cccdStr = editingItem.cccd?.trim() || "";
    if (!cccdStr || cccdStr.length !== 12 || !/^\d{12}$/.test(cccdStr)) {
      alert("Số Căn cước công dân (CCCD) phải đủ 12 chữ số.");
      return;
    }

    if (editingItem.ngay_sinh && !isValidDateFormat(editingItem.ngay_sinh)) {
      alert(
        "Ngày sinh không hợp lệ. Vui lòng nhập đúng định dạng dd/mm/yyyy (Ví dụ: 30/01/2005)",
      );
      return;
    }

    setIsUpdating(true);
    const success = await updateResult(editingItem.id!, editingItem);
    setIsUpdating(false);

    if (success) {
      setEditingItem(null);
      loadTableData();
      alert("Cập nhật thành công!");
    } else {
      alert("Có lỗi xảy ra khi cập nhật.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.so_bao_danh || !newItem.ho_ten || !newItem.mon_thi) {
      alert("Vui lòng nhập đủ: Họ tên, Số báo danh, Môn thi");
      return;
    }

    const cccdStr = newItem.cccd?.trim() || "";
    if (!cccdStr || cccdStr.length !== 12 || !/^\d{12}$/.test(cccdStr)) {
      alert("Số Căn cước công dân (CCCD) phải đủ 12 chữ số.");
      return;
    }

    if (newItem.ngay_sinh && !isValidDateFormat(newItem.ngay_sinh)) {
      alert(
        "Ngày sinh không hợp lệ. Vui lòng nhập đúng định dạng dd/mm/yyyy (Ví dụ: 30/01/2005)",
      );
      return;
    }

    setIsUpdating(true);
    const result = await createStudentResult(newItem as SearchResult);
    setIsUpdating(false);

    if (result.success) {
      alert("Thêm mới thành công!");
      setIsCreating(false);
      setNewItem({
        ho_ten: "",
        so_bao_danh: "",
        cccd: "",
        truong: "",
        mon_thi: "",
        diem: 0,
        ngay_sinh: "",
        gioi_tinh: "",
      }); // Reset
      loadTableData();
      loadStats();
      loadConfig();
    } else {
      alert(`Lỗi: ${result.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 overflow-y-auto">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gov-blue p-2 rounded-lg text-white shadow-sm">
              <Award size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Hệ Thống Quản Trị
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md font-medium transition-all"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Settings Banner */}
        <div className="bg-gradient-to-r from-gov-blue to-indigo-800 rounded-xl shadow-md p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <Settings size={180} className="transform translate-x-12 -translate-y-12 animate-pulse-slow" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Settings size={24} className="text-blue-200"/>
              Cấu Hình Hệ Thống
            </h2>
            <p className="text-blue-100 max-w-xl">
              Tùy chỉnh thông tin kỳ thi, cài đặt nhận diện và các tùy chọn.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/settings")}
            className="relative z-10 bg-white text-indigo-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Settings size={18} />
            Thiết Lập Ngay
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users size={32} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
                Tổng Số Học Sinh
              </p>
              <p className="text-4xl font-bold text-slate-800 tracking-tight">
                {stats.studentCount}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
                Kết Quả Đã Nhập
              </p>
              <p className="text-4xl font-bold text-slate-800 tracking-tight">
                {stats.resultCount}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Upload size={20} className="text-gov-blue" />
              Nhập Dữ Liệu Từ Excel
            </h2>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 text-sm bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 hover:text-gov-blue transition-all font-medium shadow-sm"
              title="Tải file mẫu định dạng .xlsx đầy đủ các cột Ngày sinh, Giới tính"
            >
              <Download size={16} />
              Tải File Mẫu
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-xl p-10 text-center hover:bg-indigo-50/80 hover:border-indigo-300 transition-all relative group cursor-pointer">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className={`p-4 rounded-full mb-4 transition-transform group-hover:scale-110 ${isUploading ? 'bg-indigo-100 animate-pulse' : 'bg-indigo-100 text-indigo-600'}`}>
                  <FileSpreadsheet size={40} className={isUploading ? "text-indigo-400" : ""} />
                </div>
                <p className="text-lg font-semibold text-slate-700 mb-1">
                  {isUploading
                    ? "Đang xử lý..."
                    : "Kéo thả file Excel hoặc nhấn để chọn"}
                </p>
                <p className="text-sm text-slate-500">
                  Hỗ trợ định dạng .xlsx, .xls
                </p>
              </div>
            </div>

            {uploadStatus && (
              <div
                className={`mt-6 p-4 rounded-lg border flex items-start gap-3 ${uploadStatus.error ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}
              >
                <div className="mt-0.5">
                    {uploadStatus.error ? <AlertCircle size={20} className="text-red-600" /> : <CheckCircle size={20} className="text-emerald-600"/>}
                </div>
                <div>
                    {uploadStatus.error ? (
                    <div>
                        <h4 className="font-bold mb-1">
                        {uploadStatus.error}
                        </h4>
                        {uploadStatus.details && (
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1 opacity-90 max-h-40 overflow-y-auto">
                            {uploadStatus.details.map((msg, idx) => (
                            <li key={idx}>{msg}</li>
                            ))}
                        </ul>
                        )}
                    </div>
                    ) : (
                    <h4 className="font-bold">
                        Nhập dữ liệu thành công! Đã thêm {uploadStatus.success} bản ghi.
                    </h4>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Tools */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet size={24} className="text-gov-blue" />
              Danh Sách Kết Quả Thi
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                <input
                    type="text"
                    placeholder="Tìm theo Họ tên, SBD, CCCD..."
                    value={localSearchInput}
                    onChange={(e) => setLocalSearchInput(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-800 transition-all"
                />
                <Search
                    size={18}
                    className="absolute left-3 top-3 text-slate-400"
                />
                {localSearchInput && (
                    <button
                    type="button"
                    onClick={() => setLocalSearchInput("")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    >
                    <X size={16} />
                    </button>
                )}
                </form>

                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm flex-shrink-0"
                >
                    <Plus size={16} />
                    Thêm Mới
                </button>
                <button
                    onClick={handleExportData}
                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm flex-shrink-0"
                    title="Xuất danh sách ra file Excel"
                >
                    <Download size={16} />
                    Xuất Excel
                </button>
                <button
                    onClick={handleClearAll}
                    className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm flex-shrink-0"
                    title="Xóa toàn bộ dữ liệu"
                >
                    <Trash2 size={16} />
                    Xóa Tất Cả
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
        </div>
      </main>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg tracking-wide flex items-center gap-2">
                <Edit size={20} />
                Chỉnh Sửa Kết Quả Thi
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={editingItem.ho_ten || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        ho_ten: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Số báo danh
                  </label>
                  <input
                    type="text"
                    value={editingItem.so_bao_danh || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        so_bao_danh: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 uppercase font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    CCCD
                  </label>
                  <input
                    type="text"
                    value={editingItem.cccd || ""}
                    maxLength={12}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, cccd: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Ngày Sinh (dd/mm/yyyy)
                  </label>
                  <input
                    type="text"
                    value={editingItem.ngay_sinh || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        ngay_sinh: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    placeholder="01/01/2005"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Giới Tính
                  </label>
                  <input
                    type="text"
                    value={editingItem.gioi_tinh || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        gioi_tinh: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    placeholder="Nam/Nữ"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Trường học
                  </label>
                  <input
                    type="text"
                    value={editingItem.truong || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        truong: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Môn thi
                  </label>
                  <input
                    type="text"
                    value={editingItem.mon_thi || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        mon_thi: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Điểm thi
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.diem ?? ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        diem: parseFloat(e.target.value),
                      })
                    }
                    className="w-full border border-indigo-300 rounded-lg px-4 py-2.5 font-bold text-indigo-700 bg-indigo-50/50 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {isUpdating ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            <div className="bg-emerald-600 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg tracking-wide flex items-center gap-2">
                <Plus size={20} />
                Thêm Mới Kết Quả
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
              <div className="p-3 bg-emerald-50 text-emerald-800 text-sm rounded-lg border border-emerald-100 flex gap-2 items-start">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>
                  Nếu Số Báo Danh đã tồn tại, hệ thống sẽ thêm môn
                  thi mới cho thí sinh đó, nếu chưa có sẽ tạo thí sinh mới.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItem.ho_ten}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        ho_ten: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    required
                    placeholder="NGUYỄN VĂN A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Số báo danh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItem.so_bao_danh}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        so_bao_danh: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 uppercase font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    required
                    placeholder="SBD001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Căn cước công dân
                  </label>
                  <input
                    type="text"
                    value={newItem.cccd}
                    maxLength={12}
                    onChange={(e) =>
                      setNewItem({ ...newItem, cccd: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    placeholder="12 chữ số"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Ngày sinh (dd/mm/yyyy)
                  </label>
                  <input
                    type="text"
                    value={newItem.ngay_sinh}
                    onChange={(e) =>
                      setNewItem({ ...newItem, ngay_sinh: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    placeholder="01/01/2005"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Giới tính
                  </label>
                  <input
                    type="text"
                    value={newItem.gioi_tinh}
                    onChange={(e) =>
                      setNewItem({ ...newItem, gioi_tinh: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    placeholder="Nam"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Trường học
                  </label>
                  <input
                    type="text"
                    value={newItem.truong}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        truong: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    placeholder="THPT..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Môn thi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItem.mon_thi}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        mon_thi: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    required
                    placeholder="Ví dụ: TOÁN"
                    list="subject-list"
                  />
                  <datalist id="subject-list">
                    {(config?.subjects || []).map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Điểm thi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.diem}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        diem: parseFloat(e.target.value),
                      })
                    }
                    className="w-full border border-emerald-300 rounded-lg px-4 py-2.5 font-bold text-emerald-700 bg-emerald-50/50 text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {isUpdating ? "Đang thêm..." : "Thêm Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
