
-- 1. Bảng cấu hình hệ thống
CREATE TABLE IF NOT EXISTS public.cau_hinh (
    id text NOT NULL PRIMARY KEY,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    data jsonb
);

-- 2. Bảng học sinh
CREATE TABLE IF NOT EXISTS public.hoc_sinh (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ho_ten text,
    so_bao_danh text,
    cccd text,
    truong text,
    CONSTRAINT hoc_sinh_so_bao_danh_key UNIQUE (so_bao_danh)
);

-- 3. Bảng kết quả thi
CREATE TABLE IF NOT EXISTS public.ket_qua (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    hoc_sinh_id uuid REFERENCES public.hoc_sinh(id) ON DELETE CASCADE,
    mon_thi text,
    diem double precision
);

-- 4. Bật Row Level Security (RLS)
ALTER TABLE public.cau_hinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoc_sinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ket_qua ENABLE ROW LEVEL SECURITY;

-- 5. Thiết lập Policies (Quyền truy cập)

-- Bảng CAU_HINH
-- Cho phép mọi người (kể cả chưa đăng nhập) xem cấu hình để hiển thị giao diện
CREATE POLICY "Public read config" ON public.cau_hinh FOR SELECT TO anon, authenticated USING (true);
-- Chỉ admin (đã đăng nhập) mới được sửa cấu hình
CREATE POLICY "Admin update config" ON public.cau_hinh FOR ALL TO authenticated USING (true);

-- Bảng HOC_SINH
-- Cho phép tra cứu (Select) công khai
CREATE POLICY "Public read students" ON public.hoc_sinh FOR SELECT TO anon, authenticated USING (true);
-- Chỉ admin mới được Thêm/Sửa/Xóa
CREATE POLICY "Admin manage students" ON public.hoc_sinh FOR ALL TO authenticated USING (true);

-- Bảng KET_QUA
-- Cho phép tra cứu (Select) công khai
CREATE POLICY "Public read results" ON public.ket_qua FOR SELECT TO anon, authenticated USING (true);
-- Chỉ admin mới được Thêm/Sửa/Xóa
CREATE POLICY "Admin manage results" ON public.ket_qua FOR ALL TO authenticated USING (true);

-- 6. Dữ liệu mẫu cho cấu hình (nếu chưa có)
INSERT INTO public.cau_hinh (id, data)
VALUES ('global_settings', '{
  "exam": {
    "name": "TRA CỨU ĐIỂM THI CHỌN HỌC SINH GIỎI LỚP 12",
    "isOpen": true,
    "logoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/National_Emblem_of_Vietnam.svg/2048px-National_Emblem_of_Vietnam.svg.png",
    "orgUnit": "Sở Giáo dục và Đào tạo Ninh Bình",
    "subUnit": "HỘI ĐỒNG KHẢO THÍ",
    "schoolYear": "Năm học 2025 - 2026",
    "headerTextColor": "#FFFF00"
  },
  "fields": {
    "cccd": { "label": "Số CCCD (12 số)", "visible": false, "required": false },
    "ho_ten": { "label": "Họ và tên thí sinh", "visible": false, "required": false },
    "truong": { "label": "Trường học", "visible": false, "required": false },
    "so_bao_danh": { "label": "Số báo danh", "visible": true, "required": true }
  },
  "results": {
    "showRank": false,
    "showScore": true
  },
  "subjects": [
    "TOÁN", "NGỮ VĂN", "TIẾNG ANH", "VẬT LÝ", "HÓA HỌC", "SINH HỌC", "LỊCH SỬ", "ĐỊA LÝ", "GDCD"
  ],
  "security": {
    "enableCaptcha": true
  },
  "template": {
    "fileUrl": null,
    "fileName": null,
    "lastUpdated": null,
    "requiredHeaders": ["HO_TEN", "SO_BAO_DANH", "CCCD", "TRUONG", "MON_THI", "DIEM"]
  }
}'::jsonb)
ON CONFLICT (id) DO NOTHING;
