import React from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';
import { ClockIcon } from '@heroicons/react/24/outline'; // Icon cho chương mới nhất

// === BỔ SUNG INTERFACE ===
interface StoryCardProps {
  story: Story;
}
// === KẾT THÚC BỔ SUNG ===

const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const lastVolume = story.volumes?.[story.volumes.length - 1];
  const lastChapter = lastVolume?.chapters?.[lastVolume.chapters.length - 1];

  // Helper định dạng ngày (có thể tách ra utils nếu dùng nhiều)
  const formatDate = (isoString: string | undefined) => {
     if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 1) return "Hôm nay";
        if (diffDays === 1) return "Hôm qua";
        if (diffDays <= 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '';
    }
  };

  return (
    // Thẻ Link bao ngoài cùng, group để dùng group-hover
    <Link to={`/story/${story.id}`} className="block group animate-fade-in relative">
      {/* Container ảnh bìa */}
      <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-lg group-hover:shadow-orange-400/30 dark:group-hover:shadow-amber-500/20 aspect-[2/3] transition-all duration-300 ease-in-out transform group-hover:-translate-y-1 group-hover:scale-[1.02]">
        <img
            src={story.coverImage}
            alt={`Bìa truyện ${story.title}`}
            // Hiệu ứng phóng to ảnh khi hover
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy" // Thêm lazy loading
        />
        {/* Lớp phủ gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-100 group-hover:opacity-80 transition-opacity duration-300"></div>
         {/* Tag HOT */}
         {story.isHot && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md z-10 animate-pulse">HOT</div>
        )}
         {/* Trạng thái (hiển thị khi hover) */}
         <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 backdrop-blur-sm">
             {story.status}
         </div>
        {/* Tiêu đề truyện (luôn hiển thị) */}
        <div className="absolute bottom-0 left-0 p-2 w-full z-10">
            <h3 className="font-semibold text-sm text-white drop-shadow leading-tight line-clamp-2 group-hover:text-amber-100 transition-colors">
                {story.title}
            </h3>
        </div>
      </div>

       {/* Thông tin chương mới nhất (hiển thị dưới thẻ) */}
      <div className="mt-2 px-1">
        {lastChapter ? (
          // Tooltip để hiện tên đầy đủ khi hover vào dòng text này
          <div title={lastChapter.title} className="flex items-center gap-1 text-xs text-slate-600 dark:text-stone-400 group-hover:text-orange-700 dark:group-hover:text-amber-300 transition-colors">
             <ClockIcon className="h-3.5 w-3.5 flex-shrink-0"/>
             <p className="truncate font-medium">{lastChapter.title}</p>
             {/* Hiển thị thời gian cập nhật */}
             <span className="ml-auto text-slate-400 dark:text-stone-500 flex-shrink-0 text-[11px]">
                 {formatDate(lastChapter.createdAt)}
             </span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-stone-500 italic mt-1">Chưa có chương</p>
        )}
      </div>
    </Link>
  );
};

export default StoryCard;
