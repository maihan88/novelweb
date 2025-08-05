import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

interface UserRouteProps {
  children: React.ReactElement;
}

const UserRoute: React.FC<UserRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Nếu chưa đăng nhập, chuyển hướng về trang login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, cho phép truy cập
  return children;
};

export default UserRoute;