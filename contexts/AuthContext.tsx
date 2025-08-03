
import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, pass: string) => boolean;
  register: (username: string, pass: string) => { success: boolean, message: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize with a default admin user if none exist
const defaultUsers: User[] = [{
  _id: 'user-admin-0',
  id: 'user-admin-0',
  username: 'admin',
  password: 'password', // In a real app, this should be a hashed password.
  role: 'admin'
}];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('users', defaultUsers);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);

  // TODO: Replace with API call to POST /api/auth/login
  const login = (username: string, pass: string): boolean => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === pass);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  // TODO: Replace with API call to POST /api/auth/register
  const register = (username: string, pass: string): { success: boolean, message: string } => {
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, message: "Tên đăng nhập đã tồn tại." };
    }
    if (pass.length < 6) {
        return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự." };
    }

    const newId = `user-${Date.now()}`;
    const newUser: User = {
        _id: newId,
        id: newId,
        username,
        password: pass,
        role: 'user'
    };
    setUsers(prev => [...prev, newUser]);
    // Also log in the new user immediately
    // setCurrentUser(newUser); 
    return { success: true, message: "Đăng ký thành công!" };
  }

  const logout = () => {
    setCurrentUser(null);
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
