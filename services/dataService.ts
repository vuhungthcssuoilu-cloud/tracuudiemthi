
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { SearchParams, SearchResult, SystemConfig } from '../types';

// ID cố định cho bản ghi cấu hình trong bảng 'cau_hinh'
const CONFIG_ID = 'global_settings';

export const DEFAULT_CONFIG: SystemConfig = {
  exam: {
    name: 'TRA CỨU ĐIỂM THI CHỌN HỌC SINH GIỎI',
    schoolYear: 'Năm học 2025 - 2026',
    orgUnit: 'ỦY BAN NHÂN DÂN XÃ XA DUNG, TỈNH ĐIỆN BIÊN',
    subUnit: 'HỘI ĐỒNG KHẢO THÍ',
    orgLevel: 'CẤP XÃ',
    isOpen: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/National_Emblem_of_Vietnam.svg/2048px-National_Emblem_of_Vietnam.svg.png',
    faviconUrl: null,
    headerTextColor: '#FFFF00'
  },
  footer: {
    line1: 'ỦY BAN NHÂN DÂN XÃ XA DUNG, TỈNH ĐIỆN BIÊN',
    line2: 'Hệ thống tra cứu điểm thi trực tuyến',
    line3: 'Hỗ trợ kỹ thuật: hotro@viettel.vn'
  },
  fields: {
    ho_ten: { visible: false, required: false, label: 'Họ và tên thí sinh' },
    so_bao_danh: { visible: true, required: true, label: 'Số báo danh' },
    ngay_sinh: { visible: false, required: false, label: 'Ngày sinh (dd/mm/yyyy)' },
    cccd: { visible: false, required: false, label: 'Số CCCD (12 số)' },
    truong: { visible: false, required: false, label: 'Trường học' }
  },
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
    fileName: "Mau_Nhap_Diem_Thi.xlsx",
    lastUpdated: null,
    requiredHeaders: ['HO_TEN', 'SO_BAO_DANH', 'NGAY_SINH', 'GIOI_TINH', 'CCCD', 'TRUONG', 'MON_THI', 'DIEM']
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
  const dobInput = params.ngay_sinh?.trim();

  try {
    let query = supabase.from('hoc_sinh').select('id, ho_ten, so_bao_danh, cccd, truong, ngay_sinh, gioi_tinh');
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

    if (config.fields.ngay_sinh?.visible && dobInput) {
       query = query.eq('ngay_sinh', dobInput);
       hasCondition = true;
    }

    if (!hasCondition) return [];

    const { data: students, error: studentError } = await query;
    if (studentError || !students || students.length === 0) return [];

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
      truong: student.truong,
      ngay_sinh: student.ngay_sinh,
      gioi_tinh: student.gioi_tinh
    }));
  } catch (err) {
    console.error("Lỗi tra cứu:", err);
    return [];
  }
};

const formatDateInput = (input: any): string => {
  if (!input) return '';
  if (typeof input === 'number') {
     const date = new Date(Math.round((input - 25569) * 86400 * 1000));
     const d = date.getDate().toString().padStart(2, '0');
     const m = (date.getMonth() + 1).toString().padStart(2, '0');
     const y = date.getFullYear();
     return `${d}/${m}/${y}`;
  }
  let str = input.toString().trim();
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = str.split('-');
      return `${d}/${m}/${y}`;
  }
  return str;
};

export const uploadExcelData = async (data: any[]): Promise<{ success: number; errors: string[] }> => {
  let successCount = 0;
  const errorLog: string[] = [];
  
  // Cache để kiểm tra trùng lặp trong nội bộ file đang upload
  const fileSbdSet = new Set<string>();
  const fileCccdSet = new Set<string>();

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
        else if (['ngaysinh', 'ngayde', 'dob', 'birthdate'].includes(cleanKey)) normalized.NGAY_SINH = row[key];
        else if (['gioitinh', 'phai', 'gender', 'sex'].includes(cleanKey)) normalized.GIOI_TINH = row[key];
    });
    const keys = ['HO_TEN', 'SO_BAO_DANH', 'CCCD', 'TRUONG', 'MON_THI', 'DIEM', 'NGAY_SINH', 'GIOI_TINH'];
    keys.forEach(k => {
        if (!normalized[k] && row[k]) normalized[k] = row[k];
    });
    return normalized;
  };

  for (const rawRow of data) {
    const row = normalizeRow(rawRow);
    if (!row.SO_BAO_DANH) continue;

    const sbd = row.SO_BAO_DANH.toString().trim().toUpperCase();
    const cccd = row.CCCD?.toString().trim();
    const hoTen = row.HO_TEN?.toString().trim().toUpperCase() || 'KHÔNG TÊN';

    // 1. Kiểm tra trùng lặp ngay trong file Excel
    if (fileSbdSet.has(sbd)) {
        errorLog.push(`Dòng trùng SBD: ${sbd} (Học sinh: ${hoTen}) bị lặp lại trong file.`);
        continue;
    }
    fileSbdSet.add(sbd);
    if (cccd) {
        if (fileCccdSet.has(cccd)) {
            errorLog.push(`Dòng trùng CCCD: ${cccd} (Học sinh: ${hoTen}) bị lặp lại trong file.`);
            continue;
        }
        fileCccdSet.add(cccd);
    }

    try {
      const ngaySinh = formatDateInput(row.NGAY_SINH);
      const gioiTinh = row.GIOI_TINH ? row.GIOI_TINH.toString().trim() : '';

      // 2. Kiểm tra trùng lặp với Database
      const { data: existingStudentBySBD } = await supabase
        .from('hoc_sinh')
        .select('id, ho_ten, cccd, so_bao_danh, ngay_sinh, gioi_tinh')
        .eq('so_bao_danh', sbd)
        .maybeSingle();

      let studentId: string | undefined;

      if (existingStudentBySBD) {
          // Nếu trùng SBD nhưng khác tên -> Báo lỗi xung đột dữ liệu
          if (existingStudentBySBD.ho_ten !== hoTen) {
              errorLog.push(`Xung đột SBD ${sbd}: Trong DB là '${existingStudentBySBD.ho_ten}', trong file là '${hoTen}'`);
              continue;
          }

          studentId = existingStudentBySBD.id;
          const updateData: any = {};
          if (!existingStudentBySBD.cccd && cccd) updateData.cccd = cccd;
          if (row.TRUONG) updateData.truong = row.TRUONG.toString().trim().toUpperCase();
          if (!existingStudentBySBD.ngay_sinh && ngaySinh) updateData.ngay_sinh = ngaySinh;
          if (!existingStudentBySBD.gioi_tinh && gioiTinh) updateData.gioi_tinh = gioiTinh;

          if (Object.keys(updateData).length > 0) {
              await supabase.from('hoc_sinh').update(updateData).eq('id', studentId);
          }
      } else {
        // Kiểm tra trùng CCCD với người khác trong DB
        if (cccd) {
            const { data: existingByCCCD } = await supabase.from('hoc_sinh').select('ho_ten, so_bao_danh').eq('cccd', cccd).maybeSingle();
            if (existingByCCCD) {
                errorLog.push(`Trùng CCCD ${cccd}: Đã thuộc về HS ${existingByCCCD.ho_ten} (SBD: ${existingByCCCD.so_bao_danh})`);
                continue;
            }
        }

        const { data: newStudent, error: createError } = await supabase.from('hoc_sinh').insert({
            ho_ten: hoTen,
            so_bao_danh: sbd,
            cccd: cccd,
            truong: row.TRUONG?.toString().trim().toUpperCase(),
            ngay_sinh: ngaySinh,
            gioi_tinh: gioiTinh
          }).select('id').single();
          
        if (createError) throw createError;
        studentId = newStudent.id;
      }

      let score = row.DIEM;
      if (typeof score === 'string') score = parseFloat(score.replace(',', '.'));
      
      if (row.MON_THI && studentId) {
          const subject = row.MON_THI.toString().trim().toUpperCase();
          const { data: existingResult } = await supabase.from('ket_qua')
              .select('id')
              .eq('hoc_sinh_id', studentId)
              .eq('mon_thi', subject)
              .maybeSingle();
              
          if (existingResult) {
              await supabase.from('ket_qua').update({ diem: Number(score) || 0 }).eq('id', existingResult.id);
          } else {
              await supabase.from('ket_qua').insert({
                  hoc_sinh_id: studentId,
                  mon_thi: subject,
                  diem: Number(score) || 0
                });
          }
      }
      successCount++;
    } catch (err: any) {
      errorLog.push(`SBD ${sbd}: ${err.message}`);
    }
  }

  // Đồng bộ lại danh sách môn thi vào cấu hình
  try {
      const { data: allResults } = await supabase.from('ket_qua').select('mon_thi');
      if (allResults && allResults.length > 0) {
          const distinctSubjects = Array.from(new Set(allResults.map(r => r.mon_thi?.trim().toUpperCase()))).filter(Boolean) as string[];
          distinctSubjects.sort();
          const currentConfig = await getSystemConfig();
          currentConfig.subjects = distinctSubjects;
          await saveSystemConfig(currentConfig);
      }
  } catch (syncError) {}

  return { success: successCount, errors: errorLog };
};

export const createStudentResult = async (data: SearchResult): Promise<{ success: boolean; message?: string }> => {
    try {
        const sbd = data.so_bao_danh.trim().toUpperCase();
        const cccd = data.cccd?.trim();
        const hoTen = data.ho_ten.trim().toUpperCase();
        const ngaySinh = data.ngay_sinh?.trim();
        const gioiTinh = data.gioi_tinh?.trim();

        const { data: existingStudent } = await supabase.from('hoc_sinh').select('id, ho_ten, cccd').eq('so_bao_danh', sbd).maybeSingle();
        if (existingStudent && existingStudent.ho_ten !== hoTen) {
            return { success: false, message: `SBD ${sbd} đã tồn tại với tên '${existingStudent.ho_ten}'.` };
        }

        let studentId = existingStudent?.id;
        if (!studentId) {
             const { data: newStudent, error: createError } = await supabase.from('hoc_sinh').insert({
                ho_ten: hoTen,
                so_bao_danh: sbd,
                cccd: cccd,
                truong: data.truong?.toUpperCase(),
                ngay_sinh: ngaySinh,
                gioi_tinh: gioiTinh
            }).select('id').single();
            if (createError) return { success: false, message: createError.message };
            studentId = newStudent.id;
        } else {
             await supabase.from('hoc_sinh').update({ 
                 cccd: cccd, 
                 truong: data.truong?.toUpperCase(),
                 ngay_sinh: ngaySinh,
                 gioi_tinh: gioiTinh
             }).eq('id', studentId);
        }

        const { data: existingResult } = await supabase.from('ket_qua')
            .select('id')
            .eq('hoc_sinh_id', studentId)
            .eq('mon_thi', data.mon_thi.toUpperCase())
            .maybeSingle();

        if (existingResult) {
            await supabase.from('ket_qua').update({ diem: data.diem }).eq('id', existingResult.id);
        } else {
            await supabase.from('ket_qua').insert({
                hoc_sinh_id: studentId,
                mon_thi: data.mon_thi.toUpperCase(),
                diem: data.diem
            });
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

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
    let query = supabase.from('ket_qua').select('*, hoc_sinh!inner(ho_ten, so_bao_danh, cccd, truong, ngay_sinh, gioi_tinh)', { count: 'exact' });
    
    if (search) {
        // Tìm kiếm linh hoạt: Hoặc trùng Họ tên, hoặc trùng Số báo danh
        query = query.or(`ho_ten.ilike.%${search}%,so_bao_danh.ilike.%${search}%`, { foreignTable: 'hoc_sinh' });
    }
    
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    
    if (error) throw error;
    const formattedData = (data || []).map((item: any) => {
        const hs = item.hoc_sinh;
        return {
            ...item,
            ho_ten: hs?.ho_ten || '(Không tên)',
            so_bao_danh: hs?.so_bao_danh || '---',
            cccd: hs?.cccd || '',
            truong: hs?.truong || '',
            ngay_sinh: hs?.ngay_sinh || '',
            gioi_tinh: hs?.gioi_tinh || ''
        };
    });
    return { data: formattedData, total: count || 0 };
  } catch (err) {
      console.error("Admin Fetch Error:", err);
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
             truong: data.truong,
             ngay_sinh: data.ngay_sinh,
             gioi_tinh: data.gioi_tinh
         }).eq('id', data.hoc_sinh_id);
    }
    return !error;
  } catch { return false; }
};

export const deleteAllData = async (): Promise<boolean> => {
  try {
    await supabase.from('ket_qua').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabase.from('hoc_sinh').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (!error) {
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
