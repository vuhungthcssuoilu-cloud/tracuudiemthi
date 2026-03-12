
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Captcha } from './Captcha';
import { SearchParams, SystemConfig } from '../types';
import { getSystemConfig } from '../services/dataService';

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
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Key để buộc Captcha component mount lại (làm mới mã)
  const [captchaKey, setCaptchaKey] = useState(0);
  const prevLoadingRef = useRef(isLoading);

  // Tự động làm mới Captcha khi quá trình tra cứu kết thúc (isLoading: true -> false)
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      setCaptchaKey(prev => prev + 1);
      setCaptchaInput(''); // Xóa mã cũ đã nhập
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

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
      // Nếu sai mã xác nhận cục bộ, cũng nên đổi mã mới cho bảo mật
      setCaptchaKey(prev => prev + 1);
      setCaptchaInput('');
      return;
    }
    
    onSearch(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const displayError = localError || externalError;

  // Lấy danh sách các trường cần hiển thị
  const visibleFields = (Object.keys(config.fields) as Array<keyof typeof config.fields>)
    .filter(key => config.fields[key].visible);

  return (
    <div className="bg-[#f2f2f2] border border-[#d3d3d3] rounded-sm p-8 md:p-16 w-full max-w-4xl shadow-none animate-fade-in font-sans">
      <div className="w-full max-w-2xl mx-auto">
        {/* Hướng dẫn tiêu đề */}
        <div className="text-center mb-10">
          <p className="text-[#333] text-[18px] font-normal italic mb-2">
            Thí sinh nhập các thông tin và mã xác nhận vào các ô dưới đây
          </p>
          {config.exam.releaseDate && (
            <p 
              className="text-[16px] font-bold uppercase"
              style={{ color: config.exam.headerBackgroundColor }}
            >
              Ngày công bố kết quả: {config.exam.releaseDate}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Render các trường dựa trên config */}
          {visibleFields.map((key) => {
            const field = config.fields[key];
            return (
              <div key={key} className="flex flex-col md:flex-row md:items-center">
                <label className="md:w-44 text-[17px] font-bold text-[#333] mb-1 md:mb-0">
                  {field.label}
                </label>
                <div className="flex-grow">
                  <input
                    type="text"
                    name={key}
                    value={formData[key as keyof SearchParams] || ''}
                    onChange={handleInputChange}
                    className="w-full md:w-[400px] border border-[#ccc] rounded-sm px-3 py-1.5 text-slate-800 font-normal bg-white transition-all text-[17px] shadow-sm"
                    autoComplete="off"
                    placeholder={field.required ? "(Bắt buộc)" : ""}
                  />
                </div>
              </div>
            );
          })}

          {/* Hàng: Mã xác nhận */}
          {config.security.enableCaptcha && (
            <div className="flex flex-col md:flex-row md:items-center">
              <label className="md:w-44 text-[17px] font-bold text-[#333] mb-1 md:mb-0">
                Mã xác nhận
              </label>
              <div className="flex-grow flex items-center gap-2">
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  className="w-28 border border-[#ccc] rounded-sm px-3 py-1.5 text-center font-bold bg-white transition-all text-xl shadow-sm"
                  style={{ color: config.exam.headerBackgroundColor }}
                  maxLength={5}
                  autoComplete="off"
                />
                <Captcha key={captchaKey} onRefresh={setCaptchaCode} />
              </div>
            </div>
          )}

          {/* Nút bấm Tra cứu */}
          <div className="flex flex-col items-center pt-4">
            <div className="w-full flex md:pl-44">
              <button
                type="submit"
                disabled={isLoading}
                className={`min-w-[130px] px-10 py-2.5 rounded-sm text-white font-bold text-[18px] transition-all shadow-sm active:transform active:scale-95
                  ${isLoading 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'hover:brightness-90'}`}
                style={{ 
                  backgroundColor: !isLoading ? config.exam.headerBackgroundColor : undefined,
                  color: config.exam.headerTextColor 
                }}
              >
                {isLoading ? "..." : "Tra cứu"}
              </button>
            </div>

            {/* Thông báo đang xử lý */}
            {isLoading && (
              <div className="w-full md:pl-44 mt-3">
                <p 
                  className="text-[17px] font-normal text-left italic animate-pulse"
                  style={{ color: config.exam.headerBackgroundColor }}
                >
                  Hệ thống đang tra cứu kết quả thi vui lòng chờ...
                </p>
              </div>
            )}

            {/* Thông báo lỗi đỏ dưới button */}
            {!isLoading && displayError && (
              <div className="w-full md:pl-44 mt-3">
                <p className="text-[#f00] text-[17px] font-normal text-left italic">
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
