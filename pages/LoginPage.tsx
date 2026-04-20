import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

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
      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-sukem-text-muted hover:text-sukem-primary transition-colors group mb-8">
          <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Về trang chủ
        </Link>

        <div className="bg-sukem-card rounded-2xl shadow-xl border border-sukem-border p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-sukem-text font-serif">Đăng nhập</h2>

          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-sm text-red-600">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" /> {error}
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
              className="w-full py-3.5 rounded-xl font-bold text-white bg-sukem-primary hover:brightness-110 hover:shadow-lg hover:shadow-sukem-primary/25 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-sukem-text-muted">
            Chưa có tài khoản? <Link to="/register" className="font-bold text-sukem-primary hover:text-sukem-accent transition-colors">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;