import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.tsx';
import { User, Bookmark } from '../types';
import api from '../services/api.ts';

// Định nghĩa lại interface để bao gồm cả token và sở thích
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
  const [currentUser, setCurrentUser] = useLocalStorage<AuthenticatedUser | null>('currentUser', null);

  // --- BẮT ĐẦU SỬA ĐỔI QUAN TRỌNG ---
  // Effect này sẽ chạy một lần khi App được tải
  useEffect(() => {
    const syncUser = async () => {
      // Nếu có người dùng trong localStorage (tức là đã đăng nhập từ trước)
      if (currentUser?.token) {
        try {
          // Tự động gọi API để lấy thông tin profile mới nhất
          const response = await api.get('/users/profile');
          const freshUser = response.data;

          // Tạo lại đối tượng user hoàn chỉnh với token cũ và dữ liệu mới
          const updatedUser = {
            ...currentUser, // Giữ lại token
            ...freshUser,   // Cập nhật các thông tin khác (favorites, bookmarks, etc.)
          };
          
          // Cập nhật lại state và localStorage
          setCurrentUser(updatedUser);

        } catch (error) {
          console.error("Phiên đăng nhập hết hạn hoặc lỗi đồng bộ. Tự động đăng xuất.", error);
          // Nếu có lỗi (thường là token hết hạn), tự động đăng xuất
          logout();
        }
      }
    };
    
    syncUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần duy nhất khi component mount
  // --- KẾT THÚC SỬA ĐỔI QUAN TRỌNG ---


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
