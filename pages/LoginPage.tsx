import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { ArrowLeftIcon, BookOpenIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid'; // Thêm icon thông báo

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await auth.login(username, password);

    if (result.success) {
      // Không cần thông báo thành công ở đây, chuyển hướng là đủ
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  // --- CẢI TIẾN GIAO DIỆN ---
  return (
    // Center layout, thêm padding
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-stone-900 dark:to-slate-900 p-4 animate-fade-in relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 dark:bg-orange-900/20 rounded-full blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 dark:bg-amber-900/20 rounded-full blur-3xl opacity-30 animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="w-full max-w-5xl relative z-10">
        {/* Nút về trang chủ */}
        <Link
            to="/"
            className="absolute -top-12 left-0 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-amber-400 transition-all duration-200 group"
        >
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Về trang chủ
        </Link>
        {/* Card chính */}
        <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-stone-700 backdrop-blur-sm">
            {/* Phần hình ảnh/chào mừng */}
            <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              ></div>
              <div className="relative z-10">
                 <div className="mb-6 transform transition-transform duration-300 hover:scale-110">
                   <BookOpenIcon className="h-20 w-20 sm:h-24 sm:w-24 text-orange-100 drop-shadow-2xl mx-auto" />
                 </div>
                 <h1 className="mt-5 text-3xl sm:text-4xl font-bold font-serif mb-3">Chào mừng trở lại!</h1>
                 <p className="mt-2 text-orange-50 text-sm sm:text-base max-w-xs leading-relaxed">Đăng nhập để tiếp tục cuộc phiêu lưu của bạn trong thế giới truyện chữ.</p>
              </div>
            </div>
            {/* Phần form */}
            <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white/50 dark:bg-stone-800/50 backdrop-blur-sm">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-serif mb-8 text-center md:text-left">
                Đăng nhập
              </h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                 {/* Thông báo lỗi (Alert style) */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-lg flex items-start gap-3 text-sm text-red-700 dark:text-red-300 animate-fade-in shadow-sm">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5"/>
                        <span className="flex-1">{error}</span>
                    </div>
                )}
                {/* Input fields */}
                <div className="space-y-5">
                  <div>
                    <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-stone-300 mb-2">
                      Tên đăng nhập
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 border-2 border-slate-300 dark:border-stone-600 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-stone-500 bg-white dark:bg-stone-700/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:border-orange-500 sm:text-sm transition-all duration-200 hover:border-slate-400 dark:hover:border-stone-500"
                      placeholder="Nhập tên đăng nhập"
                    />
                  </div>
                  <div>
                    <label htmlFor="password-input" className="block text-sm font-semibold text-slate-700 dark:text-stone-300 mb-2">
                      Mật khẩu
                    </label>
                    <input
                      id="password-input"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 border-2 border-slate-300 dark:border-stone-600 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-stone-500 bg-white dark:bg-stone-700/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:border-orange-500 sm:text-sm transition-all duration-200 hover:border-slate-400 dark:hover:border-stone-500"
                      placeholder="Mật khẩu của bạn"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 mt-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-stone-800 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]" 
                  >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang xử lý...
                        </>
                    ) : 'Đăng nhập'}
                  </button>
                </div>
              </form>
              {/* Link đăng ký */}
              <p className="mt-8 text-center text-sm text-slate-600 dark:text-stone-400">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="font-semibold text-orange-600 hover:text-orange-700 dark:text-amber-400 dark:hover:text-amber-300 underline underline-offset-2 transition-colors">
                    Đăng ký ngay
                  </Link>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
