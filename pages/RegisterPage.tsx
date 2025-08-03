
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/react/24/solid';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    
    const result = auth.register(username, password);

    if (result.success) {
      setSuccess(result.message + ' Bạn sẽ được chuyển đến trang đăng nhập sau 2 giây.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-full w-full flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-4xl relative">
          <Link to="/" className="absolute -top-12 left-0 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              <ArrowLeftIcon className="h-4 w-4" />
              Về trang chủ
          </Link>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row-reverse overflow-hidden">
              {/* Visual side */}
              <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-gradient-to-br from-cyan-600 to-sky-600 text-white">
                  <UserPlusIcon className="h-20 w-20 text-cyan-200" />
                  <h1 className="mt-6 text-3xl font-bold font-serif">Gia nhập cộng đồng</h1>
                  <p className="mt-2 text-cyan-100">Tạo tài khoản để lưu truyện yêu thích, theo dõi tiến độ đọc và tham gia bình luận.</p>
              </div>
              {/* Form side */}
              <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-serif mb-6">
                  Tạo tài khoản
                </h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="username-register" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập</label>
                    <input
                      id="username-register"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                      placeholder="Tên bạn muốn dùng"
                    />
                  </div>
                  <div>
                    <label htmlFor="password-register" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
                    <input
                      id="password-register"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                      placeholder="Ít nhất 6 ký tự"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Xác nhận mật khẩu</label>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>
                  
                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                  {success && <p className="text-sm text-green-500 text-center">{success}</p>}

                  <div>
                    <button
                      type="submit"
                      disabled={!!success}
                      className="w-full flex justify-center mt-4 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-cyan-400 transition-colors"
                    >
                      Đăng ký
                    </button>
                  </div>
                </form>
                <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300">
                      Đăng nhập
                    </Link>
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default RegisterPage;
