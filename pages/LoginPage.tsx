import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { ArrowLeftIcon, BookOpenIcon, KeyIcon } from '@heroicons/react/24/solid';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  try {
    await auth.login(username, password);
    navigate(from, { replace: true });
  } catch (err: any) {
    setError(err.message || 'Tên đăng nhập hoặc mật khẩu không đúng.');
  }
};

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 animate-fade-in">
      <div className="w-full max-w-4xl relative">
        <Link to="/" className="absolute -top-12 left-0 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <ArrowLeftIcon className="h-4 w-4" />
            Về trang chủ
        </Link>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
            {/* Visual side */}
            <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                 <BookOpenIcon className="h-20 w-20 text-indigo-200" />
                 <h1 className="mt-6 text-3xl font-bold font-serif">Chào mừng trở lại!</h1>
                 <p className="mt-2 text-indigo-200">Đăng nhập để tiếp tục cuộc phiêu lưu của bạn trong thế giới truyện chữ.</p>
            </div>
            {/* Form side */}
            <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-serif mb-6">
                Đăng nhập
              </h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="user"
                    />
                  </div>
                  <div>
                    <label htmlFor="password-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
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