// src/utils/formatDate.ts

export const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'Chưa cập nhật';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Xử lý trường hợp thời gian tương lai (do lệch đồng hồ) hoặc vừa xong
  if (diffInSeconds < 60) {
    return 'Vừa xong';
  }

  // Dưới 1 giờ
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  }

  // Dưới 24 giờ
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  }

  // Dưới 30 ngày (tính là ngày)
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }

  // Dưới 12 tháng (tính là tháng)
  // 30 ngày * 24h * 60m * 60s * 12 tháng ~ 31104000 giây
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} tháng trước`;
  }

  // Trên 1 năm: Hiển thị ngày cụ thể
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};