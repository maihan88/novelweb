// src/utils/formatDate.ts

export const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'Chưa cập nhật';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Xử lý trường hợp thời gian tương lai (do lệch đồng hồ máy khách/server)
  if (diffInSeconds < 0) return 'Vừa xong';

  // Dưới 1 phút
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

  // Kiểm tra "Hôm qua" theo ngày lịch
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    // Tùy chọn: Thêm giờ phút nếu muốn (VD: Hôm qua lúc 14:30)
    // return `Hôm qua lúc ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return 'Hôm qua';
  }

  // Các ngày cũ hơn: DD/MM/YYYY
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};
