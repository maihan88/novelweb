// maihan88/novelweb/novelweb-30378715fdd33fd98f7c1318544ef93eab22c598/contexts/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.tsx'; // Sửa lại đường dẫn nếu cần
import { User, Bookmark } from '../types';
import api from '../services/api.ts';

// Mở rộng interface để chứa cả dữ liệu sở thích
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
  // Hàm mới để cập nhật sở thích trong state
  updateUserPreferencesState: (prefs: {
    favorites?: string[];
    bookmarks?: Record<string, Bookmark>;
    ratedStories?: Record<string, number>;
  }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useLocalStorage<AuthenticatedUser | null>('currentUser', null);

  const login = async (username: string, pass: string): Promise<{ success: boolean, message: string }> => {
    try {
      // API giờ trả về đầy đủ thông tin user
      const response = await api.post('/users/login', { username, password: pass });
      if (response.data && response.data.token) {
        setCurrentUser(response.data); // Lưu toàn bộ object user vào state và localStorage
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
  };

  // Hàm này chỉ cập nhật state ở client, được gọi bởi UserPreferencesContext sau khi API thành công
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
