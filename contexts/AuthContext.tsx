import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { User } from '../types';
import api from '../services/api.ts';

// Định nghĩa kiểu dữ liệu cho người dùng có token
interface AuthenticatedUser extends User {
  token: string;
}

interface AuthContextType {
  currentUser: AuthenticatedUser | null;
  login: (username: string, pass: string) => Promise<{ success: boolean, message: string }>;
  register: (username: string, pass: string) => Promise<{ success: boolean, message: string }>;
  logout: () => void;
  // Bỏ hàm updateCurrentUser
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useLocalStorage<AuthenticatedUser | null>('currentUser', null);

  // Hàm đăng nhập bằng cách gọi API
  const login = async (username: string, pass: string): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await api.post('/users/login', { username, password: pass });
      if (response.data && response.data.token) {
        setCurrentUser(response.data);
        return { success: true, message: 'Đăng nhập thành công!' };
      }
      return { success: false, message: 'Dữ liệu trả về không hợp lệ.' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng.';
      return { success: false, message };
    }
  };

  // Hàm đăng ký bằng cách gọi API
  const register = async (username: string, pass: string): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await api.post('/users/register', { username, password: pass });
      if (response.status === 201) {
        return { success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' };
      }
      return { success: false, message: 'Đăng ký thất bại.' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.';
      return { success: false, message };
    }
  }

  // Hàm đăng xuất
  const logout = () => {
    setCurrentUser(null);
  };

    const updateCurrentUser = (userData: Partial<AuthenticatedUser>) => {
    setCurrentUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};