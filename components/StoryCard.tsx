import React from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';
import { 
  ClockIcon, 
  EyeIcon, 
  StarIcon
} from '@heroicons/react/24/solid';
import { formatDate } from '../utils/formatDate';
import { formatNumber } from '../utils/formatNumber';

interface StoryCardProps {
  story: Story;
}

const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const latestChapter = story.latestChapter;
  
  const views = Number(story.totalViews) || 0;
  const rating = Number(story.rating) || 0;
  const ratingsCount = Number(story.ratingsCount) || 0;

  // Tính toán rating trung bình
  const avgRating = ratingsCount > 0 
    ? (rating / ratingsCount).toFixed(1) 
    : '0.0';

  return (
    <Link 
      to={`/story/${story.id}`} 
      className="group relative flex flex-col h-full bg-sukem-card rounded-xl overflow-hidden border border-sukem-border 
                 transition-all duration-300 ease-in-out 
                 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-sukem-primary/20 hover:border-sukem-primary/50"
    >
      {/* --- PHẦN 1: ẢNH BÌA & BADGES --- */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={story.coverImage}
          alt={`Bìa truyện ${story.title}`}
          className="w-full h-full object-cover "
          loading="lazy"
        />
        
        {/* Gradient tối nhẹ ở đáy để làm nổi bật text trắng */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none"></div>

        {/* Badge: HOT (Góc trái trên) */}
        {story.isHot && (
          <div className="absolute top-0 left-0">
             <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg shadow-md animate-pulse">
               HOT
             </div>
          </div>
        )}

        {/* Badge: Status (Góc phải trên) */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md border border-white/20
          ${story.status === 'Hoàn thành' 
            ? 'bg-green-500/90 text-white' 
            : 'bg-sukem-accent/90 text-white'}`}
        >
          {story.status}
        </div>

        {/* --- MỚI: Badge View (Góc trái dưới) --- */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-md">
          <EyeIcon className="w-3.5 h-3.5 opacity-90" />
          <span>{formatNumber(views)}</span> 
        </div>

        {/* Badge: Rating (Góc phải dưới) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-yellow-400 text-xs font-bold drop-shadow-md">
          <span>{avgRating}</span>
          <StarIcon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* --- PHẦN 2: NỘI DUNG CHÍNH --- */}
      <div className="flex flex-col flex-1 p-3">
        {/* Tiêu đề */}
        <h3 
          className="font-bold text-sukem-text text-base leading-snug line-clamp-2 mb-2
                     group-hover:text-sukem-primary transition-colors duration-200 min-h-[2.5rem]"
          title={story.title}
        >
          {story.title}
        </h3>

        <div className="flex-grow"></div>

        {/* --- PHẦN 3: THÔNG TIN PHỤ (Chương & Thời gian) --- */}
        <div className="pt-2 border-t border-sukem-border/50">
          <div className="flex justify-between items-center text-xs">
             {/* Tên chương */}
             <div className="flex items-center gap-1 text-sukem-text group-hover:text-sukem-accent transition-colors truncate pr-2">
                <span className="truncate font-medium">
                  {latestChapter ? latestChapter.title : 'Đang cập nhật'}
                </span>
             </div>
             
             {/* Thời gian update */}
             {latestChapter && (
                <div className="flex items-center gap-1 text-[10px] text-sukem-text-muted bg-sukem-bg/50 px-1.5 py-0.5 rounded border border-sukem-border/50 whitespace-nowrap">
                   <span>{formatDate(story.lastUpdatedAt)}</span>
                </div>
             )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StoryCard;