
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Captcha } from './Captcha';
import { SearchParams, SystemConfig } from '../types';
import { getSystemConfig } from '../services/dataService';

interface LookupFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  error?: string | null;
}

export const LookupForm: React.FC<LookupFormProps> = ({ onSearch, isLoading, error: externalError }) => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [formData, setFormData] = useState<SearchParams>({
    ho_ten: '',
    so_bao_danh: '',
    cccd: ''
  });
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    getSystemConfig().then(setConfig);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!config) return;

    // Kiểm tra các trường bắt buộc dựa trên cấu hình
    const fieldKeys = Object.keys(config.fields) as Array<keyof typeof config.fields>;
    for (const key of fieldKeys) {
      const field = config.fields[key];
      if (field.visible && field.required) {
        const val = (formData[key as keyof SearchParams] || '').trim();
        if (!val) {
          setLocalError(`Vui lòng nhập ${field.label}`);
          return;
        }
      }
    }

    if (config.security.enableCaptcha && captchaInput.toUpperCase() !== captchaCode) {
      setLocalError('Mã xác nhận không hợp lệ');
      return;
    }
    
    onSearch(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!config) return null;

  const displayError = localError || externalError;

  // Lấy danh sách các trường cần hiển thị
  const visibleFields = (Object.keys(config.fields) as Array<keyof typeof config.fields>)
    .filter(key => config.fields[key].visible);

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 md:p-10 w-full max-w-xl shadow-lg animate-fade-in font-sans">
      <div className="w-full">
        {/* Tiêu đề khung nhập thông tin */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-[#004e9a] mb-3">Nhập thông tin tra cứu</h3>
          <div className="h-[1px] bg-gray-200 w-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Render các trường dựa trên config theo dạng khối dọc dọc */}
          {visibleFields.map((key) => {
            const field = config.fields[key];
            return (
              <div key={key} className="flex flex-col">
                <label className="text-[14px] font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name={key}
                  value={formData[key as keyof SearchParams] || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-gray-800 font-medium bg-white transition-all outline-none focus:border-[#004e9a] focus:ring-1 focus:ring-[#004e9a] text-[15px] shadow-sm placeholder-gray-400"
                  autoComplete="off"
                  placeholder={
                    key === 'cccd' ? "Nhập số CCCD (12 chữ số)" : 
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
              <label className="text-[14px] font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                Mã xác nhận <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  className="flex-grow border border-gray-300 rounded-md px-3.5 py-2.5 text-center font-bold text-[#004e9a] bg-white transition-all outline-none focus:border-[#004e9a] focus:ring-1 focus:ring-[#004e9a] text-lg shadow-sm"
                  maxLength={5}
                  placeholder="Nhập mã xác nhận"
                  autoComplete="off"
                />
                <div className="shrink-0 flex items-center">
                  <Captcha onRefresh={setCaptchaCode} />
                </div>
              </div>
            </div>
          )}

          {/* Nút bấm Tra cứu */}
          <div className="pt-2 flex flex-col">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-6 rounded-md text-white font-bold text-[16px] transition-all shadow-md active:transform active:scale-[0.99]
                ${isLoading 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-[#004e9a] hover:bg-[#003d7a]'}`}
            >
              {isLoading ? "Đang xử lý..." : "Tra cứu điểm"}
            </button>

            {/* Thông báo lỗi đỏ dưới button */}
            {displayError && (
              <div className="w-full mt-3 text-center">
                <p className="text-[#f00] text-[15px] font-medium italic">
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