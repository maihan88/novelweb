import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { User, Bookmark } from '../types';
import { userService, AuthResponse } from '../services/userService';

export interface AuthenticatedUser extends AuthResponse {}

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

  useEffect(() => {
    const syncUser = async () => {
      if (currentUser?.token) {
        try {
          const freshUser = await userService.getProfile();
          setCurrentUser((prev) => {
             if (!prev) return null;
             return { ...prev, ...freshUser } as AuthenticatedUser;
          });
        } catch (error) {
          console.error("Lỗi đồng bộ phiên đăng nhập:", error);
          logout();
        }
      }
    };
    
    syncUser();
  }, [currentUser?.token]);

  const login = async (username: string, pass: string): Promise<{ success: boolean, message: string }> => {
    try {
      const userData = await userService.login(username, pass);
      if (userData && userData.token) {
        setCurrentUser(userData);
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
      const response = await userService.register(username, pass);
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