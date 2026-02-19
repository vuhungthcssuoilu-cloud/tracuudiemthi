
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Settings, ToggleLeft, ToggleRight, Building2, Image as ImageIcon, Upload, ShieldCheck, Palette, Info, BookOpen, LayoutTemplate } from 'lucide-react';
import { isSupabaseConfigured } from '../supabaseClient';
import { getSystemConfig, saveSystemConfig } from '../services/dataService';
import { SystemConfig } from '../types';

export const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadConfig();
  }, []);

  const checkAuth = async () => {
    if (!isSupabaseConfigured()) {
        if (!localStorage.getItem('sb-mock-token')) navigate('/admin/login');
        return;
    }
  };

  const loadConfig = async () => {
    const data = await getSystemConfig();
    setConfig(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    setSaveMessage(null);
    const success = await saveSystemConfig(config);
    setIsSaving(false);
    
    if (success) {
      setSaveMessage('Đã lưu cấu hình thành công!');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage('Lỗi khi lưu cấu hình.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file || !config) return;

    if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh.');
        return;
    }

    if (file.size > 500 * 1024) {
        alert('Dung lượng ảnh quá lớn (tối đa 500KB).');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'logo') {
            setConfig({ ...config, exam: { ...config.exam, logoUrl: base64String } });
        } else {
            setConfig({ ...config, exam: { ...config.exam, faviconUrl: base64String } });
        }
    };
    reader.readAsDataURL(file);
  };

  const updateExam = (key: keyof SystemConfig['exam'], value: any) => {
    if (!config) return;
    setConfig({ ...config, exam: { ...config.exam, [key]: value } });
  };

  const updateField = (field: keyof SystemConfig['fields'], key: 'visible' | 'required', value: boolean) => {
    if (!config) return;
    setConfig({ 
      ...config, 
      fields: { 
        ...config.fields, 
        [field]: { ...config.fields[field], [key]: value } 
      } 
    });
  };

  const updateSecurity = (key: keyof SystemConfig['security'], value: any) => {
    if (!config) return;
    setConfig({ ...config, security: { ...config.security, [key]: value } });
  };

  const updateFooter = (key: keyof SystemConfig['footer'], value: string) => {
    if (!config) return;
    // Ensure footer object exists if it's undefined
    const currentFooter = config.footer || { line1: '', line2: '', line3: '', backgroundColor: '#337ab7' };
    setConfig({ ...config, footer: { ...currentFooter, [key]: value } });
  };

  if (!config) return <div className="p-10 text-center">Đang tải cấu hình...</div>;

  const textColorPresets = [
    { name: 'Trắng', hex: '#FFFFFF' },
    { name: 'Vàng', hex: '#FFFF00' },
    { name: 'Đen', hex: '#000000' },
  ];

  const bgColorPresets = [
    { name: 'Xanh dương (Gốc)', hex: '#337ab7' },
    { name: 'Xanh đậm', hex: '#1a4f75' },
    { name: 'Đỏ đô', hex: '#d32f2f' },
    { name: 'Xanh lá', hex: '#2e7d32' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20 overflow-y-auto">
      <header className="bg-white shadow border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate('/admin/dashboard')} className="text-gray-500 hover:text-[#337ab7] transition-colors p-1 rounded-full hover:bg-gray-100">
                <ArrowLeft size={24} />
             </button>
             <h1 className="text-xl font-bold text-gray-800 uppercase flex items-center gap-2">
                <Settings size={24} className="text-[#337ab7]" />
                Cấu Hình Hệ Thống
             </h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#337ab7] text-white px-6 py-2.5 rounded font-bold uppercase hover:bg-[#286090] transition-all shadow-md active:transform active:scale-95"
          >
            <Save size={18} />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </header>

      {saveMessage && (
        <div className="fixed top-24 right-6 z-[60] animate-bounce">
            <div className={`px-6 py-3 rounded shadow-xl text-white font-bold flex items-center gap-2 ${saveMessage.includes('Lỗi') ? 'bg-red-600' : 'bg-green-600'}`}>
                {saveMessage.includes('Lỗi') ? <Info size={20} /> : <ShieldCheck size={20} />}
                {saveMessage}
            </div>
        </div>
      )}

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* 1. Thông tin cơ bản & Nhận diện */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <Building2 className="text-[#337ab7]" size={20} />
                <h3 className="text-lg font-bold text-[#337ab7] uppercase text-[15px]">1. Thông Tin Cơ Quan & Nhận Diện</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Tên Cơ Quan Chủ Quản</label>
                        <input type="text" value={config.exam.orgUnit} onChange={(e) => updateExam('orgUnit', e.target.value.toUpperCase())} className="w-full border p-3 rounded font-bold text-[#337ab7] uppercase focus:ring-2 focus:ring-[#337ab7]/20 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Tên Kỳ Thi</label>
                        <input type="text" value={config.exam.name} onChange={(e) => updateExam('name', e.target.value.toUpperCase())} className="w-full border p-3 rounded text-gray-800 font-bold uppercase focus:ring-2 focus:ring-[#337ab7]/20 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Năm Học / Giai Đoạn</label>
                        <input type="text" value={config.exam.schoolYear} onChange={(e) => updateExam('schoolYear', e.target.value)} className="w-full border p-3 rounded text-gray-600 font-bold focus:ring-2 focus:ring-[#337ab7]/20 outline-none" />
                    </div>
                    
                    {/* Cấu hình màu sắc Header */}
                    <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Màu chữ */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase flex items-center gap-2 text-[13px]">
                                <Palette size={18} className="text-[#337ab7]" />
                                Màu chữ tiêu đề
                            </label>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded border border-gray-200">
                                    <input 
                                        type="color" 
                                        value={config.exam.headerTextColor} 
                                        onChange={(e) => updateExam('headerTextColor', e.target.value)}
                                        className="h-8 w-10 rounded border border-gray-300 cursor-pointer p-0.5"
                                    />
                                    <input 
                                        type="text" 
                                        value={config.exam.headerTextColor} 
                                        onChange={(e) => updateExam('headerTextColor', e.target.value.toUpperCase())}
                                        className="w-20 border-none bg-transparent p-1 font-mono font-bold uppercase text-xs focus:ring-0"
                                        placeholder="#FFFFFF"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {textColorPresets.map(preset => (
                                        <button
                                            key={preset.hex}
                                            onClick={() => updateExam('headerTextColor', preset.hex)}
                                            className="w-6 h-6 rounded-full border border-gray-300 shadow-sm transition-transform hover:scale-110"
                                            style={{ backgroundColor: preset.hex }}
                                            title={preset.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Màu nền */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase flex items-center gap-2 text-[13px]">
                                <Palette size={18} className="text-[#337ab7]" />
                                Màu nền Header
                            </label>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded border border-gray-200">
                                    <input 
                                        type="color" 
                                        value={config.exam.headerBackgroundColor || '#337ab7'} 
                                        onChange={(e) => updateExam('headerBackgroundColor', e.target.value)}
                                        className="h-8 w-10 rounded border border-gray-300 cursor-pointer p-0.5"
                                    />
                                    <input 
                                        type="text" 
                                        value={config.exam.headerBackgroundColor || '#337ab7'} 
                                        onChange={(e) => updateExam('headerBackgroundColor', e.target.value.toUpperCase())}
                                        className="w-20 border-none bg-transparent p-1 font-mono font-bold uppercase text-xs focus:ring-0"
                                        placeholder="#337AB7"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {bgColorPresets.map(preset => (
                                        <button
                                            key={preset.hex}
                                            onClick={() => updateExam('headerBackgroundColor', preset.hex)}
                                            className="w-6 h-6 rounded-full border border-gray-300 shadow-sm transition-transform hover:scale-110"
                                            style={{ backgroundColor: preset.hex }}
                                            title={preset.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Logo Hiển Thị</span>
                        <div className="w-32 h-32 bg-white border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative group shadow-inner">
                            {config.exam.logoUrl ? (
                                <img src={config.exam.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                            ) : (
                                <ImageIcon size={40} className="text-gray-300" />
                            )}
                            <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Upload size={20} />
                                <span className="text-[10px] mt-1 font-bold">Tải ảnh mới</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                            </label>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Icon Trình Duyệt</span>
                        <div className="w-32 h-32 bg-white border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative group shadow-inner">
                            {config.exam.faviconUrl ? (
                                <img src={config.exam.faviconUrl} alt="Favicon" className="w-12 h-12" />
                            ) : (
                                <ImageIcon size={40} className="text-gray-300" />
                            )}
                            <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Upload size={20} />
                                <span className="text-[10px] mt-1 font-bold">Tải ảnh mới</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'favicon')} />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 2. Form Tra Cứu */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-[#337ab7] uppercase text-[15px]">2. Trường dữ liệu Tra Cứu</h3>
                </div>
                <div className="p-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-gray-400">
                                <th className="text-left py-2 uppercase text-[10px] font-black tracking-widest">Trường dữ liệu</th>
                                <th className="text-center py-2 uppercase text-[10px] font-black tracking-widest">Hiển thị</th>
                                <th className="text-center py-2 uppercase text-[10px] font-black tracking-widest">Bắt buộc</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(Object.keys(config.fields) as Array<keyof SystemConfig['fields']>).map((key) => (
                                <tr key={key} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 font-bold text-gray-700">{config.fields[key].label}</td>
                                    <td className="text-center">
                                        <button onClick={() => updateField(key, 'visible', !config.fields[key].visible)} className="transition-transform active:scale-90">
                                            {config.fields[key].visible ? <ToggleRight size={28} className="text-green-600 mx-auto" /> : <ToggleLeft size={28} className="text-gray-300 mx-auto" />}
                                        </button>
                                    </td>
                                    <td className="text-center">
                                        <button onClick={() => updateField(key, 'required', !config.fields[key].required)} disabled={!config.fields[key].visible} className={`transition-transform active:scale-90 ${!config.fields[key].visible ? 'opacity-20 grayscale' : ''}`}>
                                            {config.fields[key].required ? <ToggleRight size={28} className="text-red-600 mx-auto" /> : <ToggleLeft size={28} className="text-gray-300 mx-auto" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

             {/* 3. Môn Thi Đã Nhận Diện (Read-only) */}
             <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                    <BookOpen className="text-[#337ab7]" size={20} />
                    <h3 className="text-lg font-bold text-[#337ab7] uppercase text-[15px]">3. Môn Thi Hiện Có</h3>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-500 italic mb-4">Danh sách này được hệ thống tự động cập nhật từ dữ liệu file Excel đã tải lên.</p>
                    
                    {config.subjects && config.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {config.subjects.map((subject, index) => (
                                <span key={index} className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm font-bold border border-blue-100">
                                    {subject}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200">
                            Chưa có dữ liệu môn thi
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Bảo Mật & Trạng Thái */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                    <ShieldCheck className="text-[#337ab7]" size={20} />
                    <h3 className="text-lg font-bold text-[#337ab7] uppercase text-[15px]">4. Bảo Mật & Trạng Thái</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                            <span className="font-bold text-sm text-gray-800 block uppercase">Yêu cầu CAPTCHA</span>
                            <span className="text-[11px] text-gray-500 font-medium italic">Chống tra cứu tự động</span>
                        </div>
                        <button onClick={() => updateSecurity('enableCaptcha', !config.security.enableCaptcha)}>
                            {config.security.enableCaptcha ? <ToggleRight size={36} className="text-green-600" /> : <ToggleLeft size={36} className="text-gray-300" />}
                        </button>
                    </div>

                    <div className="p-4 bg-blue-600 text-white rounded-lg shadow-lg flex justify-between items-center transition-all hover:bg-blue-700">
                        <div>
                            <span className="font-black uppercase tracking-widest text-sm block">Cổng Tra Cứu</span>
                            <span className="text-[10px] text-blue-100 font-bold uppercase">{config.exam.isOpen ? 'Đang MỞ' : 'Đang ĐÓNG'}</span>
                        </div>
                        <button onClick={() => updateExam('isOpen', !config.exam.isOpen)} className="bg-white/10 p-1 rounded-full">
                            {config.exam.isOpen ? <ToggleRight size={44} className="text-white" /> : <ToggleLeft size={44} className="text-white/40" />}
                        </button>
                    </div>

                    <div className="mt-4 p-4 border border-dashed border-gray-200 rounded-lg">
                        <div className="flex items-start gap-2 text-gray-400">
                           <Info size={16} className="shrink-0 mt-0.5" />
                           <p className="text-[11px] leading-relaxed italic">
                             * Mọi thay đổi về cấu hình sẽ có hiệu lực ngay lập tức sau khi nhấn nút <b>Lưu thay đổi</b>.
                           </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        {/* 5. Thông Tin Chân Trang (Footer) */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <LayoutTemplate className="text-[#337ab7]" size={20} />
                <h3 className="text-lg font-bold text-[#337ab7] uppercase text-[15px]">5. Thông Tin Chân Trang (Footer)</h3>
            </div>
            <div className="p-6 space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Dòng 1 (Tên đơn vị - Mặc định)</label>
                    <input type="text" value={config.footer?.line1 || ''} onChange={(e) => updateFooter('line1', e.target.value)} className="w-full border p-3 rounded font-bold text-gray-700 focus:ring-2 focus:ring-[#337ab7]/20 outline-none" placeholder={config.exam.orgUnit} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Dòng 2 (Địa chỉ, thông tin khác...)</label>
                    <input type="text" value={config.footer?.line2 || ''} onChange={(e) => updateFooter('line2', e.target.value)} className="w-full border p-3 rounded text-gray-700 focus:ring-2 focus:ring-[#337ab7]/20 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Dòng 3 (Liên hệ, email...)</label>
                    <input type="text" value={config.footer?.line3 || ''} onChange={(e) => updateFooter('line3', e.target.value)} className="w-full border p-3 rounded text-gray-700 focus:ring-2 focus:ring-[#337ab7]/20 outline-none" />
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase flex items-center gap-2 text-[13px]">
                        <Palette size={18} className="text-[#337ab7]" />
                        Màu nền Footer
                    </label>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded border border-gray-200">
                            <input 
                                type="color" 
                                value={config.footer?.backgroundColor || '#337ab7'} 
                                onChange={(e) => updateFooter('backgroundColor', e.target.value)}
                                className="h-8 w-10 rounded border border-gray-300 cursor-pointer p-0.5"
                            />
                            <input 
                                type="text" 
                                value={config.footer?.backgroundColor || '#337ab7'} 
                                onChange={(e) => updateFooter('backgroundColor', e.target.value.toUpperCase())}
                                className="w-20 border-none bg-transparent p-1 font-mono font-bold uppercase text-xs focus:ring-0"
                                placeholder="#337AB7"
                            />
                        </div>
                        <div className="flex gap-2">
                            {bgColorPresets.map(preset => (
                                <button
                                    key={preset.hex}
                                    onClick={() => updateFooter('backgroundColor', preset.hex)}
                                    className="w-6 h-6 rounded-full border border-gray-300 shadow-sm transition-transform hover:scale-110"
                                    style={{ backgroundColor: preset.hex }}
                                    title={preset.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>

      </main>
    </div>
  );
};
