
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { SearchParams, SearchResult, SystemConfig } from '../types';

// ID cố định cho bản ghi cấu hình trong bảng 'cau_hinh'
const CONFIG_ID = 'global_settings';

const DEFAULT_CONFIG: SystemConfig = {
  exam: {
    name: 'TRA CỨU ĐIỂM THI CHỌN HỌC SINH GIỎI LỚP 12',
    schoolYear: 'Năm học 2025 - 2026',
    orgUnit: 'Sở Giáo dục và Đào tạo Ninh Bình',
    subUnit: 'HỘI ĐỒNG KHẢO THÍ',
    orgLevel: 'CẤP TỈNH',
    isOpen: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/National_Emblem_of_Vietnam.svg/2048px-National_Emblem_of_Vietnam.svg.png',
    faviconUrl: null,
    headerTextColor: '#FFFF00'
  },
  footer: {
    line1: 'Sở Giáo dục và Đào tạo Ninh Bình',
    line2: 'Địa chỉ: Số 74, đường Nguyễn Du, phường Vân Giang, thành phố Ninh Bình',
    line3: 'Điện thoại: 02293.871.053'
  },
  fields: {
    ho_ten: { visible: false, required: false, label: 'Họ và tên thí sinh' },
    so_bao_danh: { visible: true, required: true, label: 'Số báo danh' },
    cccd: { visible: false, required: false, label: 'Số CCCD (12 số)' },
    truong: { visible: false, required: false, label: 'Trường học' }
  },
  // Mặc định danh sách rỗng, sẽ được điền tự động từ file Excel
  subjects: [], 
  results: {
    showScore: true,
    showRank: false
  },
  security: {
    enableCaptcha: true,
    requireConfirmation: false,
    confirmationText: '',
    maxLookupsPerMinute: 10
  },
  template: {
    fileUrl: null,
    fileName: null,
    lastUpdated: null,
    requiredHeaders: ['HO_TEN', 'SO_BAO_DANH', 'CCCD', 'TRUONG', 'MON_THI', 'DIEM']
  }
};

export const getSystemConfig = async (): Promise<SystemConfig> => {
  try {
    const { data, error } = await supabase
      .from('cau_hinh')
      .select('data')
      .eq('id', CONFIG_ID)
      .maybeSingle();

    if (error) throw error;
    // Merge nested objects carefully to ensure footer config exists even if DB data is old
    const dbConfig = data?.data || {};
    return { 
        ...DEFAULT_CONFIG, 
        ...dbConfig,
        footer: { ...DEFAULT_CONFIG.footer, ...(dbConfig.footer || {}) },
        exam: { ...DEFAULT_CONFIG.exam, ...(dbConfig.exam || {}) },
        fields: { ...DEFAULT_CONFIG.fields, ...(dbConfig.fields || {}) },
        security: { ...DEFAULT_CONFIG.security, ...(dbConfig.security || {}) },
        template: { ...DEFAULT_CONFIG.template, ...(dbConfig.template || {}) }
    };
  } catch (err) {
    return DEFAULT_CONFIG;
  }
};

export const saveSystemConfig = async (config: SystemConfig): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cau_hinh')
      .upsert({ 
        id: CONFIG_ID, 
        data: config, 
        updated_at: new Date().toISOString() 
      });
    return !error;
  } catch {
    return false;
  }
};

export const searchScores = async (params: SearchParams): Promise<SearchResult[]> => {
  const config = await getSystemConfig();
  const nameInput = params.ho_ten?.trim().toUpperCase();
  const sbdInput = params.so_bao_danh?.trim().toUpperCase();
  const cccdInput = params.cccd?.trim();

  try {
    let query = supabase.from('hoc_sinh').select('id, ho_ten, so_bao_danh, cccd, truong');
    let hasCondition = false;

    if (config.fields.so_bao_danh.visible && sbdInput) {
      query = query.eq('so_bao_danh', sbdInput);
      hasCondition = true;
    }

    if (config.fields.ho_ten.visible && nameInput) {
      query = query.eq('ho_ten', nameInput);
      hasCondition = true;
    }
    
    if (config.fields.cccd.visible && cccdInput) {
      query = query.eq('cccd', cccdInput);
      hasCondition = true;
    }

    if (!hasCondition) return [];

    const { data: students, error: studentError } = await query;
    if (studentError || !students || students.length === 0) return [];

    // Lấy thông tin thí sinh đầu tiên khớp với điều kiện tra cứu
    const student = students[0];

    const { data: results, error: resultError } = await supabase
      .from('ket_qua')
      .select('*')
      .eq('hoc_sinh_id', student.id);

    if (resultError) throw resultError;

    return (results || []).map(r => ({
      ...r,
      ho_ten: student.ho_ten,
      so_bao_danh: student.so_bao_danh,
      cccd: student.cccd,
      truong: student.truong
    }));
  } catch (err) {
    console.error("Lỗi tra cứu:", err);
    return [];
  }
};

export const uploadExcelData = async (data: any[]): Promise<{ success: number; errors: string[] }> => {
  let successCount = 0;
  const errorLog: string[] = [];
  
  // Helper: Chuẩn hóa tên cột
  const normalizeRow = (row: any) => {
    const normalized: any = {};
    Object.keys(row).forEach(key => {
        const lowerKey = key.toString().toLowerCase().trim();
        const cleanKey = lowerKey.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
        
        if (['hoten', 'hovaten', 'name', 'thisinh'].includes(cleanKey)) normalized.HO_TEN = row[key];
        else if (['sbd', 'sobaodanh', 'sobd'].includes(cleanKey)) normalized.SO_BAO_DANH = row[key];
        else if (['cccd', 'cmnd', 'socccd'].includes(cleanKey)) normalized.CCCD = row[key];
        else if (['truong', 'donvi', 'truonghoc'].includes(cleanKey)) normalized.TRUONG = row[key];
        else if (['monthi', 'mon', 'subject'].includes(cleanKey)) normalized.MON_THI = row[key];
        else if (['diem', 'diemso', 'ketqua', 'score'].includes(cleanKey)) normalized.DIEM = row[key];
    });
    // Fallback
    if (!normalized.HO_TEN && row.HO_TEN) normalized.HO_TEN = row.HO_TEN;
    if (!normalized.SO_BAO_DANH && row.SO_BAO_DANH) normalized.SO_BAO_DANH = row.SO_BAO_DANH;
    if (!normalized.CCCD && row.CCCD) normalized.CCCD = row.CCCD;
    if (!normalized.TRUONG && row.TRUONG) normalized.TRUONG = row.TRUONG;
    if (!normalized.MON_THI && row.MON_THI) normalized.MON_THI = row.MON_THI;
    if (!normalized.DIEM && row.DIEM) normalized.DIEM = row.DIEM;
    
    return normalized;
  };

  for (const rawRow of data) {
    const row = normalizeRow(rawRow);

    if (!row.SO_BAO_DANH) continue; 

    try {
      const sbd = row.SO_BAO_DANH.toString().trim().toUpperCase();
      
      // 1. Tìm hoặc tạo học sinh
      const { data: existingStudent } = await supabase
        .from('hoc_sinh')
        .select('id')
        .eq('so_bao_danh', sbd)
        .maybeSingle();

      let studentId = existingStudent?.id;

      if (!existingStudent) {
        const { data: newStudent, error: createError } = await supabase.from('hoc_sinh').insert({
            ho_ten: row.HO_TEN?.toString().trim().toUpperCase(),
            so_bao_danh: sbd,
            cccd: row.CCCD?.toString().trim(),
            truong: row.TRUONG?.toString().trim().toUpperCase()
          }).select('id').single();
          
        if (createError) throw createError;
        studentId = newStudent.id;
      }

      // 2. Thêm kết quả thi
      let score = row.DIEM;
      if (typeof score === 'string') {
          score = parseFloat(score.replace(',', '.'));
      }
      
      if (row.MON_THI) {
          const subject = row.MON_THI.toString().trim().toUpperCase();
          const { error: resultError } = await supabase.from('ket_qua').insert({
              hoc_sinh_id: studentId,
              mon_thi: subject,
              diem: Number(score) || 0
            });
          if (resultError) throw resultError;
      }

      successCount++;
    } catch (err: any) {
      errorLog.push(`SBD ${row.SO_BAO_DANH || '?'}: ${err.message}`);
    }
  }

  // --- ĐỒNG BỘ DANH SÁCH MÔN THI TỪ DATABASE ---
  // Sau khi import xong, query toàn bộ cột mon_thi từ bảng ket_qua để lấy danh sách duy nhất
  // Điều này đảm bảo danh sách môn luôn chính xác với dữ liệu thực tế đang có
  try {
      const { data: allResults } = await supabase.from('ket_qua').select('mon_thi');
      
      if (allResults && allResults.length > 0) {
          // Lọc trùng và sắp xếp
          const distinctSubjects = Array.from(new Set(allResults.map(r => r.mon_thi?.trim().toUpperCase()))).filter(Boolean) as string[];
          distinctSubjects.sort();

          // Cập nhật vào cấu hình
          const currentConfig = await getSystemConfig();
          currentConfig.subjects = distinctSubjects;
          await saveSystemConfig(currentConfig);
      }
  } catch (syncError) {
      console.error("Lỗi đồng bộ danh sách môn thi:", syncError);
  }

  return { success: successCount, errors: errorLog };
};

export const getDashboardStats = async () => {
  try {
    const { count: s } = await supabase.from('hoc_sinh').select('*', { count: 'exact', head: true });
    const { count: r } = await supabase.from('ket_qua').select('*', { count: 'exact', head: true });
    return { studentCount: s || 0, resultCount: r || 0 };
  } catch {
    return { studentCount: 0, resultCount: 0 };
  }
};

export const getAdminResults = async (page: number = 1, pageSize: number = 20, search: string = ''): Promise<{ data: SearchResult[], total: number }> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  try {
    let query = supabase.from('ket_qua').select('*, hoc_sinh(ho_ten, so_bao_danh, cccd, truong)', { count: 'exact' });
    
    if (search) {
        query = supabase.from('ket_qua').select('*, hoc_sinh!inner(ho_ten, so_bao_danh, cccd, truong)', { count: 'exact' })
          .ilike('hoc_sinh.ho_ten', `%${search}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
        console.error("Supabase Error in getAdminResults:", error);
        throw error;
    }
    
    const formattedData = (data || []).map((item: any) => {
        const hs = Array.isArray(item.hoc_sinh) ? item.hoc_sinh[0] : item.hoc_sinh;
        return {
            ...item,
            ho_ten: hs?.ho_ten || '(Không tên)',
            so_bao_danh: hs?.so_bao_danh || '---',
            cccd: hs?.cccd || '',
            truong: hs?.truong || ''
        };
    });

    return { 
      data: formattedData,
      total: count || 0 
    };
  } catch (err) {
      console.error("Exception in getAdminResults:", err);
      return { data: [], total: 0 }; 
  }
};

export const deleteResult = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('ket_qua').delete().eq('id', id);
    return !error;
  } catch { return false; }
};

export const updateResult = async (id: string, data: Partial<SearchResult>): Promise<boolean> => {
  try {
    const { error } = await supabase.from('ket_qua').update({ mon_thi: data.mon_thi, diem: data.diem }).eq('id', id);
    if (!error && data.hoc_sinh_id) {
         await supabase.from('hoc_sinh').update({
             ho_ten: data.ho_ten,
             so_bao_danh: data.so_bao_danh,
             cccd: data.cccd,
             truong: data.truong
         }).eq('id', data.hoc_sinh_id);
    }
    return !error;
  } catch { return false; }
};

export const deleteAllData = async (): Promise<boolean> => {
  try {
    // Xóa kết quả trước (do FK)
    await supabase.from('ket_qua').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // Sau đó xóa học sinh
    const { error } = await supabase.from('hoc_sinh').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (!error) {
        // Reset danh sách môn thi về rỗng
        const config = await getSystemConfig();
        config.subjects = [];
        await saveSystemConfig(config);
    }
    return !error;
  } catch { return false; }
};

export const getAllResultsForExport = async (): Promise<SearchResult[]> => {
  const res = await getAdminResults(1, 10000);
  return res.data;
};

export const uploadTemplateFile = async (file: File, headers: string[]) => { return ""; }
