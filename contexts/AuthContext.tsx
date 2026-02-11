// file: contexts/AuthContext.tsx

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { User, Bookmark } from '../types';
import api from '../services/api'; 

// Định nghĩa lại interface User có chứa preferences
interface AuthenticatedUser extends User {
  token: string;
  favorites: string[];
  bookmarks: Record<string, Bookmark>;
  ratedStories: Record<string, number>;
}

interface AuthContextType {
  currentUser: AuthenticatedUser | null;
  login: (username: string, pass: string) => Promise<{ success: boolean, message: string }>;
  register: (username: string, pass: string) => Promise<{ success: boolean, message: string }>;
  logout: () => void;
  updateUserPreferencesState: (prefs: Partial<Omit<AuthenticatedUser, 'token' | '_id' | 'id' | 'username' | 'role'>>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Lấy user từ localStorage (có thể dữ liệu cũ)
  const [currentUser, setCurrentUser] = useLocalStorage<AuthenticatedUser | null>('currentUser', null);

  // --- LOGIC ĐỒNG BỘ: Chạy 1 lần khi load web ---
  useEffect(() => {
    const syncUser = async () => {
      if (currentUser?.token) {
        try {
          const response = await api.get('/users/profile');
          const freshUser = response.data;

          setCurrentUser((prev) => {
             if (!prev) return null;
             return {
                 ...prev,
                 ...freshUser,
             };
          });

        } catch (error) {
          console.error("Lỗi đồng bộ phiên đăng nhập:", error);
          logout();
        }
      }
    };
    
    syncUser();
  }, []);

  const login = async (username: string, pass: string): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await api.post('/users/login', { username, password: pass });
      if (response.data && response.data.token) {
        // Lưu user vào state & localStorage
        setCurrentUser(response.data);
        return { success: true, message: 'Đăng nhập thành công!' };
      }
      return { success: false, message: 'Dữ liệu trả về không hợp lệ.' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng.';
      return { success: false, message };
    }
  };

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

  const logout = () => {
    setCurrentUser(null);
    // Có thể cần clear thêm localStorage thủ công nếu hook không tự handle hết
    localStorage.removeItem('currentUser'); 
  };

  const updateUserPreferencesState = (prefs: Partial<Omit<AuthenticatedUser, 'token' | '_id' | 'id' | 'username' | 'role'>>) => {
      setCurrentUser(prevUser => {
          if (!prevUser) return null;
          return { ...prevUser, ...prefs };
      });
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, updateUserPreferencesState }}>
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