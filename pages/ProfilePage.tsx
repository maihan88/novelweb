import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        toast.error("Mật khẩu mới không khớp.");
        return;
    }
    if (newPassword.length < 6) {
        toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
        return;
    }
    setIsSubmitting(true);
    try {
        const response = await fetch('http://localhost:3001/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        toast.success(data.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

    } catch (error: any) {
        toast.error(error.message || "Đã có lỗi xảy ra.");
    } finally {
        setIsSubmitting(false);
    }
  }

  if (!user) return <div>Đang tải...</div>;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Trang cá nhân</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="mb-4"><span className="font-semibold">Tên người dùng:</span> {user.username}</p>
        <p className="mb-6"><span className="font-semibold">Vai trò:</span> {user.role}</p>

        <h2 className="text-2xl font-bold mb-4 border-t pt-6">Đổi mật khẩu</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Mật khẩu hiện tại</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700" required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Mật khẩu mới</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700" required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Xác nhận mật khẩu mới</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700" required />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400">
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
