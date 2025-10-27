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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-900 dark:to-stone-800 p-4 animate-fade-in">
      <div className="w-full max-w-4xl relative">
        {/* Nút về trang chủ */}
        <Link
            to="/"
            className="absolute -top-10 left-0 flex items-center gap-1.5 text-sm text-slate-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-amber-400 transition-colors group"
        >
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Về trang chủ
        </Link>
        {/* Card chính */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-stone-700">
            {/* Phần hình ảnh/chào mừng */}
            <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-gradient-to-br from-orange-400 to-amber-400 text-white rounded-l-2xl">
                 <BookOpenIcon className="h-16 w-16 sm:h-20 sm:w-20 text-orange-100 drop-shadow-lg" />
                 <h1 className="mt-5 text-3xl font-bold font-serif">Chào mừng trở lại!</h1>
                 <p className="mt-2 text-orange-50 text-sm sm:text-base max-w-xs">Đăng nhập để tiếp tục cuộc phiêu lưu của bạn trong thế giới truyện chữ.</p>
            </div>
            {/* Phần form */}
            <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-serif mb-6 text-center md:text-left">
                Đăng nhập
              </h2>
              <form className="space-y-5" onSubmit={handleSubmit}>
                 {/* Thông báo lỗi (Alert style) */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0"/>
                        <span>{error}</span>
                    </div>
                )}
                {/* Input fields */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-1.5">
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
                      className="appearance-none block w-full px-4 py-2.5 border border-slate-300 dark:border-stone-600 rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-stone-500 bg-white dark:bg-stone-700/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm transition duration-150" // Cập nhật style input
                      placeholder="Nhập tên đăng nhập"
                    />
                  </div>
                  <div>
                    <label htmlFor="password-input" className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-1.5">
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
                      className="appearance-none block w-full px-4 py-2.5 border border-slate-300 dark:border-stone-600 rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-stone-500 bg-white dark:bg-stone-700/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm transition duration-150" // Cập nhật style input
                      placeholder="Mật khẩu của bạn"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 mt-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-stone-800 transition-opacity duration-150 disabled:opacity-60 disabled:cursor-not-allowed" // Gradient button
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
              <p className="mt-6 text-center text-sm text-slate-600 dark:text-stone-400">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="font-medium text-orange-600 hover:text-orange-500 dark:text-amber-400 dark:hover:text-amber-300 underline underline-offset-2">
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
