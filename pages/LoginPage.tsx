import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, BookOpenIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sukem-bg p-4 animate-fade-in relative overflow-hidden transition-colors duration-300">
      {/* Background Blobs (Màu Primary/Accent) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sukem-primary/20 rounded-full blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sukem-accent/20 rounded-full blur-3xl opacity-30 animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="w-full max-w-5xl relative z-10">
        <Link to="/" className="absolute -top-12 left-0 flex items-center gap-2 text-sm font-medium text-sukem-text-muted hover:text-sukem-primary transition-colors group">
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Về trang chủ
        </Link>
        
        <div className="bg-sukem-card rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden border border-sukem-border">
            {/* Banner Side */}
            <div className="w-full md:w-1/2 p-12 flex flex-col items-center justify-center text-center bg-gradient-to-br from-sukem-primary via-rose-400 to-sukem-accent text-white relative">
               <div className="relative z-10">
                  <div className="mb-6 transform transition-transform duration-300 hover:scale-110">
                    <BookOpenIcon className="h-24 w-24 text-white drop-shadow-md mx-auto" />
                  </div>
                  <h1 className="text-4xl font-bold font-serif mb-3">Sukem Novel</h1>
                  <p className="text-white/90 text-sm leading-relaxed max-w-xs mx-auto">Nơi những câu chuyện ngọt ngào bắt đầu.</p>
               </div>
            </div>

            {/* Form Side */}
            <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-sukem-card">
              <h2 className="text-3xl font-bold text-sukem-text font-serif mb-8 text-center md:text-left">Đăng nhập</h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-sm text-red-600">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0"/> {error}
                    </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-sukem-text mb-2">Tên đăng nhập</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 border border-sukem-border rounded-xl bg-sukem-bg text-sukem-text focus:ring-2 focus:ring-sukem-primary focus:border-transparent outline-none transition-all placeholder-sukem-text-muted/50"
                      placeholder="Nhập tên đăng nhập"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-sukem-text mb-2">Mật khẩu</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-sukem-border rounded-xl bg-sukem-bg text-sukem-text focus:ring-2 focus:ring-sukem-primary focus:border-transparent outline-none transition-all placeholder-sukem-text-muted/50"
                      placeholder="Mật khẩu của bạn"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-sukem-primary to-sukem-accent hover:shadow-lg hover:shadow-sukem-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
              </form>
              
              <p className="mt-8 text-center text-sm text-sukem-text-muted">
                  Chưa có tài khoản? <Link to="/register" className="font-bold text-sukem-primary hover:text-sukem-accent transition-colors">Đăng ký ngay</Link>
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;