
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Captcha } from './Captcha';
import { SearchParams, SystemConfig } from '../types';
import { getSystemConfig, getCachedConfig } from '../services/dataService';

interface LookupFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  error?: string | null;
  config: SystemConfig;
}

export const LookupForm: React.FC<LookupFormProps> = ({ onSearch, isLoading, error: externalError, config }) => {
  const [formData, setFormData] = useState<SearchParams>({
    ho_ten: '',
    so_bao_danh: '',
    cccd: ''
  });
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  // Tự động đổi mã xác nhận và xóa ô nhập khi phát hiện thông tin sai lệch từ máy chủ hoặc nhập sai
  useEffect(() => {
    if (externalError) {
      setCaptchaInput('');
      setCaptchaKey(prev => prev + 1);
    }
  }, [externalError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!config) return;

    // Kiểm tra các trường bắt buộc theo thứ tự hiển thị quy chuẩn: CCCD lên trước, SBD tiếp theo
    const fieldKeys: Array<keyof typeof config.fields> = ['cccd', 'so_bao_danh', 'ho_ten', 'ngay_sinh', 'truong'];
    for (const key of fieldKeys) {
      const field = config.fields[key];
      if (field && field.visible && field.required) {
        const val = (formData[key as keyof SearchParams] || '').trim();
        if (!val) {
          setLocalError(`Vui lòng nhập ${field.label}`);
          return;
        }
      }
    }

    if (config.security.enableCaptcha && captchaInput.toUpperCase() !== captchaCode) {
      setLocalError('Mã xác nhận không hợp lệ');
      setCaptchaInput('');
      setCaptchaKey(prev => prev + 1);
      return;
    }
    
    onSearch(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const displayError = localError || externalError;

  // Lấy danh sách các trường cần hiển thị và sắp xếp theo thứ tự quy chuẩn: CCCD lên trước, SBD tiếp theo
  const fieldOrder: Array<keyof typeof config.fields> = ['cccd', 'so_bao_danh', 'ho_ten', 'ngay_sinh', 'truong'];
  const visibleFields = fieldOrder.filter(key => config.fields[key] && config.fields[key].visible);

  return (
    <div className="bg-white rounded-lg p-5 sm:p-6 md:p-8 w-full max-w-md md:max-w-xl animate-fade-in font-sans shadow-[0_15px_45px_rgba(0,78,154,0.12)] border border-slate-100/80 border-t-[5px] border-t-[#004e9a]">
      <div className="w-full">
        {/* Tiêu đề khung nhập thông tin */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-[#004e9a] mb-2 sm:mb-3">Nhập thông tin tra cứu</h3>
          <div className="h-[1px] bg-gray-200 w-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Render các trường dựa trên config theo dạng khối dọc dọc */}
          {visibleFields.map((key) => {
            const field = config.fields[key];
            return (
              <div key={key} className="flex flex-col">
                <label className="text-[13px] sm:text-[14px] font-semibold text-gray-700 mb-1 sm:mb-1.5 flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name={key}
                  value={formData[key as keyof SearchParams] || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 sm:px-3.5 sm:py-2.5 text-gray-800 font-medium bg-white transition-all outline-none focus:border-[#004b93] focus:ring-1 focus:ring-[#004b93] text-[14px] sm:text-[15px] placeholder-gray-400"
                  autoComplete="off"
                  placeholder={
                    key === 'cccd' ? "Nhập căn cước công dân (CCCD)" : 
                    key === 'so_bao_danh' ? "Nhập số báo danh" : 
                    field.required ? `Nhập ${field.label.toLowerCase()}` : `Nhập ${field.label.toLowerCase()} (tùy chọn)`
                  }
                />
              </div>
            );
          })}

          {/* Hàng: Mã xác nhận */}
          {config.security.enableCaptcha && (
            <div className="flex flex-col">
              <label className="text-[13px] sm:text-[14px] font-semibold text-gray-700 mb-1 sm:mb-1.5 flex items-center gap-1">
                Mã xác nhận <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-row items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  className="flex-grow min-w-[100px] border border-gray-300 rounded-md px-3 py-2 sm:px-3.5 sm:py-2.5 text-center font-bold text-[#004b93] bg-white transition-all outline-none focus:border-[#004b93] focus:ring-1 focus:ring-[#004b93] text-[14px] sm:text-lg placeholder-gray-400"
                  maxLength={5}
                  placeholder="Nhập mã xác nhận"
                  autoComplete="off"
                />
                <div className="shrink-0 flex items-center bg-white rounded-md border border-gray-200 p-1">
                  <Captcha key={captchaKey} onRefresh={setCaptchaCode} />
                </div>
              </div>
            </div>
          )}

          {/* Nút bấm Tra cứu */}
          <div className="pt-2 flex flex-col">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 sm:py-3 px-6 rounded-md text-white font-bold text-[15px] sm:text-[16px] transition-all active:transform active:scale-[0.99]
                ${isLoading 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-[#004b93] hover:bg-[#003d7a]'}`}
            >
              {isLoading ? "Đang xử lý..." : "Tra cứu điểm"}
            </button>

            {/* Thông báo lỗi đỏ dưới button giống hình gốc */}
            {displayError && (
              <div className="w-full mt-3 text-center">
                <p className="text-[#d32f2f] text-[13px] sm:text-[14px] font-bold">
                  {displayError}
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
