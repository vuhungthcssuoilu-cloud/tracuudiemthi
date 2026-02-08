
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
    headerTextColor: '#FFFF00' // Màu vàng rực rỡ khớp với hình mẫu
  },
  fields: {
    ho_ten: { visible: false, required: false, label: 'Họ và tên thí sinh' },
    so_bao_danh: { visible: true, required: true, label: 'Số báo danh' },
    cccd: { visible: false, required: false, label: 'Số CCCD (12 số)' },
    truong: { visible: false, required: false, label: 'Trường học' }
  },
  subjects: ['TOÁN', 'NGỮ VĂN', 'TIẾNG ANH', 'VẬT LÝ', 'HÓA HỌC', 'SINH HỌC', 'LỊCH SỬ', 'ĐỊA LÝ', 'GDCD'],
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
    return data ? { ...DEFAULT_CONFIG, ...data.data } : DEFAULT_CONFIG;
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
  for (const row of data) {
    try {
      const { data: existingStudent } = await supabase.from('hoc_sinh').select('id').eq('so_bao_danh', row.SO_BAO_DANH).maybeSingle();
      let studentId = existingStudent?.id;
      if (!existingStudent) {
        const { data: newStudent, error: createError } = await supabase.from('hoc_sinh').insert({
            ho_ten: row.HO_TEN?.toString().toUpperCase(),
            so_bao_danh: row.SO_BAO_DANH?.toString().toUpperCase(),
            cccd: row.CCCD?.toString(),
            truong: row.TRUONG?.toString().toUpperCase()
          }).select('id').single();
        if (createError) throw createError;
        studentId = newStudent.id;
      }
      const { error: resultError } = await supabase.from('ket_qua').insert({
          hoc_sinh_id: studentId,
          mon_thi: row.MON_THI?.toString().toUpperCase(),
          diem: parseFloat(row.DIEM) || 0
        });
      if (resultError) throw resultError;
      successCount++;
    } catch (err: any) {
      errorLog.push(`Dòng ${successCount + errorLog.length + 1}: ${err.message}`);
    }
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
    let query = supabase.from('ket_qua').select('*, hoc_sinh!inner(ho_ten, so_bao_danh, cccd, truong)', { count: 'exact' });
    if (search) query = query.ilike('hoc_sinh.ho_ten', `%${search}%`);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw error;
    return { 
      data: (data || []).map((item: any) => ({ ...item, ho_ten: item.hoc_sinh.ho_ten, so_bao_danh: item.hoc_sinh.so_bao_danh, cccd: item.hoc_sinh.cccd, truong: item.hoc_sinh.truong })),
      total: count || 0 
    };
  } catch { return { data: [], total: 0 }; }
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
    return !error;
  } catch { return false; }
};

export const deleteAllData = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('hoc_sinh').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return !error;
  } catch { return false; }
};

export const getAllResultsForExport = async (): Promise<SearchResult[]> => {
  const res = await getAdminResults(1, 10000);
  return res.data;
};

export const uploadTemplateFile = async (file: File, headers: string[]) => { return ""; }
