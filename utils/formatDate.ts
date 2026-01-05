// src/utils/formatDate.ts

export const formatTimeAgo = (dateString: string | Date): string => {
  if (!dateString) return 'Chưa cập nhật';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Xử lý các mốc thời gian nhỏ
  if (diffInSeconds < 60) {
    return 'Vừa xong';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  // Nếu nhỏ hơn 30 ngày -> hiển thị số ngày
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  }

  // Nếu lớn hơn 30 ngày -> hiển thị ngày tháng năm đầy đủ
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};