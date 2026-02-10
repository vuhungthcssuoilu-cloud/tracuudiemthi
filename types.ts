
export interface HocSinh {
  id?: string;
  ho_ten: string;
  so_bao_danh: string;
  cccd: string;
  truong: string;
  ngay_sinh: string; // Mới
  gioi_tinh: string; // Mới
  cap_hoc: string;
}

export interface KetQua {
  id?: string;
  hoc_sinh_id: string;
  mon_thi: string;
  diem: number;
  // Joined fields for display
  hoc_sinh?: HocSinh;
}

export interface SearchParams {
  ho_ten: string;
  so_bao_danh: string;
  cccd: string;
  ngay_sinh?: string; // Tùy chọn để search
}

export interface SearchResult extends KetQua {
  ho_ten: string;
  truong: string;
  so_bao_danh: string;
  cccd: string;
  ngay_sinh: string; // Mới
  gioi_tinh: string; // Mới
}

// Mock data type for Excel import
export interface ExcelRow {
  HO_TEN: string;
  SO_BAO_DANH: string;
  NGAY_SINH: string; // Mới
  GIOI_TINH: string; // Mới
  CCCD: string;
  TRUONG: string;
  CAP_HOC: string;
  MON_THI: string;
  DIEM: number;
}

export interface FieldConfig {
  visible: boolean;
  required: boolean;
  label: string;
}

export interface TemplateConfig {
  fileUrl: string | null;
  fileName: string | null;
  lastUpdated: string | null;
  requiredHeaders: string[];
}

export interface FooterConfig {
    line1: string;
    line2: string;
    line3: string;
}

export interface SystemConfig {
  exam: {
    name: string;
    schoolYear: string;
    orgUnit: string;
    subUnit: string;
    orgLevel: string;
    isOpen: boolean;
    logoUrl: string | null;
    faviconUrl: string | null;
    headerTextColor: string;
  };
  footer: FooterConfig;
  fields: {
    ho_ten: FieldConfig;
    so_bao_danh: FieldConfig;
    cccd: FieldConfig;
    truong: FieldConfig;
    ngay_sinh: FieldConfig; // Mới
  };
  subjects: string[];
  results: {
    showScore: boolean;
    showRank: boolean;
  };
  security: {
    enableCaptcha: boolean;
    requireConfirmation: boolean;
    confirmationText: string;
    maxLookupsPerMinute: number;
  };
  template: TemplateConfig;
}
