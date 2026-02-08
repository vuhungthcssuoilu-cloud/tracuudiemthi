import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // MOCK LOGIN for demo purposes if Supabase is not connected
    if (!isSupabaseConfigured()) {
        setTimeout(() => {
            if (email === 'admin' && password === 'admin123') {
                localStorage.setItem('sb-mock-token', 'valid');
                navigate('/admin/dashboard');
            } else {
                setError('Tài khoản hoặc mật khẩu không đúng (Demo: admin/admin123)');
                setLoading(false);
            }
        }, 800);
        return;
    }

    try {
      // Login with Supabase Auth
      // Note: We use Email/Password auth as the standard "Admin Table" replacement
      const { error } = await supabase.auth.signInWithPassword({
        email: email, // Treating username as email for Supabase Auth requirement
        password: password,
      });

      if (error) throw error;
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gov-bg flex items-center justify-center px-4 font-sans">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
            <div className="bg-gov-blue w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gov-blue uppercase">Đăng Nhập Quản Trị</h2>
            <p className="text-gray-500 text-sm mt-2">Hệ thống quản lý dữ liệu thi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Tên Đăng Nhập / Email</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Mật Khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gov-blue text-white py-3 rounded font-bold uppercase hover:bg-blue-800 transition-colors shadow-md"
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-600 hover:text-gov-blue underline">Quay về trang tra cứu</a>
        </div>
      </div>
    </div>
  );
};