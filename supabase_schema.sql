
-- 1. Đảm bảo bảng đã có các cột cần thiết (dùng ALTER TABLE để bổ sung nếu bảng đã tồn tại)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hoc_sinh' AND column_name='ngay_sinh') THEN
        ALTER TABLE public.hoc_sinh ADD COLUMN ngay_sinh text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hoc_sinh' AND column_name='gioi_tinh') THEN
        ALTER TABLE public.hoc_sinh ADD COLUMN gioi_tinh text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ket_qua' AND column_name='sort_order') THEN
        ALTER TABLE public.ket_qua ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
END $$;

-- 2. Tạo các bảng nếu chưa có (cho lần cài đặt đầu tiên)
CREATE TABLE IF NOT EXISTS public.cau_hinh (
    id text NOT NULL PRIMARY KEY,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    data jsonb
);

CREATE TABLE IF NOT EXISTS public.hoc_sinh (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ho_ten text,
    so_bao_danh text,
    cccd text,
    truong text,
    ngay_sinh text, 
    gioi_tinh text, 
    CONSTRAINT hoc_sinh_so_bao_danh_key UNIQUE (so_bao_danh)
);

CREATE TABLE IF NOT EXISTS public.ket_qua (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    hoc_sinh_id uuid REFERENCES public.hoc_sinh(id) ON DELETE CASCADE,
    mon_thi text,
    diem double precision,
    sort_order integer DEFAULT 0
);

-- 2.1 Tạo các Index để tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_hoc_sinh_ho_ten ON public.hoc_sinh (ho_ten);
CREATE INDEX IF NOT EXISTS idx_hoc_sinh_cccd ON public.hoc_sinh (cccd);
CREATE INDEX IF NOT EXISTS idx_hoc_sinh_ngay_sinh ON public.hoc_sinh (ngay_sinh);
CREATE INDEX IF NOT EXISTS idx_ket_qua_hoc_sinh_id ON public.ket_qua (hoc_sinh_id);
CREATE INDEX IF NOT EXISTS idx_ket_qua_sort_order ON public.ket_qua (sort_order);

-- 3. Bật RLS
ALTER TABLE public.cau_hinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoc_sinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ket_qua ENABLE ROW LEVEL SECURITY;

-- 4. Thiết lập Policies (Sử dụng DROP để chạy lại không lỗi)
DROP POLICY IF EXISTS "Public read config" ON public.cau_hinh;
CREATE POLICY "Public read config" ON public.cau_hinh FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin update config" ON public.cau_hinh;
CREATE POLICY "Admin update config" ON public.cau_hinh FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read students" ON public.hoc_sinh;
CREATE POLICY "Public read students" ON public.hoc_sinh FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage students" ON public.hoc_sinh;
CREATE POLICY "Admin manage students" ON public.hoc_sinh FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read results" ON public.ket_qua;
CREATE POLICY "Public read results" ON public.ket_qua FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage results" ON public.ket_qua;
CREATE POLICY "Admin manage results" ON public.ket_qua FOR ALL TO authenticated USING (true);

-- 5. Cấu hình mặc định cho file mẫu và các trường dữ liệu
INSERT INTO public.cau_hinh (id, data)
VALUES ('global_settings', '{
  "exam": {
    "name": "TRA CỨU ĐIỂM THI CHỌN HỌC SINH GIỎI",
    "isOpen": true,
    "logoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/National_Emblem_of_Vietnam.svg/2048px-National_Emblem_of_Vietnam.svg.png",
    "orgUnit": "ỦY BAN NHÂN DÂN XÃ XA DUNG",
    "schoolYear": "Năm học 2025 - 2026",
    "headerTextColor": "#FFFF00"
  },
  "fields": {
    "cccd": { "label": "Số CCCD (12 số)", "visible": false, "required": false },
    "ho_ten": { "label": "Họ và tên thí sinh", "visible": true, "required": true },
    "truong": { "label": "Trường học", "visible": true, "required": false },
    "ngay_sinh": { "label": "Ngày sinh (dd/mm/yyyy)", "visible": true, "required": true },
    "so_bao_danh": { "label": "Số báo danh", "visible": true, "required": true }
  },
  "template": {
    "fileName": "Mau_Nhap_Diem_Thi.xlsx",
    "requiredHeaders": ["HO_TEN", "SO_BAO_DANH", "NGAY_SINH", "GIOI_TINH", "CCCD", "TRUONG", "MON_THI", "DIEM"]
  }
}'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
