
import { createClient } from '@supabase/supabase-js';

// URL dự án Supabase chính thức của bạn
const supabaseUrl = 'https://xmqswvutbyncnzuohxwy.supabase.co';

/**
 * THÀNH CÔNG: Đây là mã Anon Key chính xác (JWT).
 * Kết nối tới dự án 'vuhungthcssuoilu-cloud' đã được thiết lập.
 */
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtcXN3dnV0YnluY256dW9oeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODk2NDYsImV4cCI6MjA4NjA2NTY0Nn0.PWab25F4WcDUNpHFYstl-Gng_OEIgyEXzcOiexVHfWg'; 

/**
 * Kiểm tra xem cấu hình có hợp lệ không
 */
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && 
         !!supabaseAnonKey && 
         supabaseAnonKey.startsWith('eyJ');
};

/**
 * Kiểm tra xem có đang dùng nhầm khóa Stripe (sb_...) không
 */
export const isUsingWrongKeyType = () => {
    return supabaseAnonKey.startsWith('sb_');
};

// Khởi tạo Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
