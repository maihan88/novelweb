import React from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';
import { ClockIcon, EyeIcon, StarIcon } from '@heroicons/react/24/solid';
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
  const avgRating = ratingsCount > 0 
    ? (rating / ratingsCount).toFixed(1) 
    : '0.0';

  return (
    <Link 
      to={`/story/${story.id}`} 
      className="group relative flex flex-col h-full bg-sukem-card rounded-xl overflow-hidden border border-sukem-border transition-all duration-300 ease-in-out md:hover:-translate-y-1.5 md:hover:shadow-xl md:hover:shadow-sukem-primary/20 md:hover:border-sukem-primary/50"
    >
      {/* --- PHẦN 1: ẢNH BÌA & BADGES --- */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={story.coverImage}
          alt={`Bìa truyện ${story.title}`}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        
        {/* Lớp Overlay Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none opacity-100 transition-opacity duration-300"></div>

        {/* Tên truyện trên cover */}
        <div className="absolute inset-x-0 bottom-0 p-3 pt-6 pointer-events-none">
          <h3 className="font-bold text-white text-base leading-snug line-clamp-2 hover:drop-shadow-lg shadow-black" title={story.title}>
            {story.title}
          </h3>
        </div>

        {/* Badge: Status (Góc phải trên) */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md border border-white/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300
          ${story.status === 'Hoàn thành' ? 'bg-green-500/90 text-white' : 'bg-sukem-accent/90 text-white'}`}
        >
          {story.status}
        </div>

        {/* Badge View & Rating (Góc trái trên) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-1.5 py-0.5 rounded shadow-sm">
            <EyeIcon className="w-3.5 h-3.5 opacity-90" />
            <span>{formatNumber(views)}</span> 
          </div>
          <div className="flex items-center gap-1 w-fit bg-black/60 backdrop-blur-md text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm">
            <span>{avgRating}</span>
            <StarIcon className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* --- PHẦN 2 & 3: NỘI DUNG CHÍNH (Phần chữ bên dưới) --- */}
      <div className="flex flex-col flex-1 p-3">
        {latestChapter?.volumeName && (
          <div className="text-sm font-semibold text-sukem-primary mb-1 line-clamp-1" title={latestChapter.volumeName}>
            {latestChapter.volumeName}
          </div>
        )}
        
        <div className="flex-grow"></div>
        
        <div className="flex items-center gap-2 text-xs w-full overflow-x-auto md:justify-between md:overflow-visible [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex items-center gap-1 text-sukem-text group-hover:text-sukem-accent transition-colors whitespace-nowrap flex-shrink-0 md:flex-shrink md:truncate md:pr-2">
                <span className="font-medium">{latestChapter ? latestChapter.title : 'Đang cập nhật'}</span>
            </div>
            {latestChapter && (
            <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-sukem-text-muted bg-sukem-bg/50 px-1.5 py-0.5 rounded border border-sukem-border/50 whitespace-nowrap">
                <span>{formatDate(story.lastUpdatedAt)}</span>
            </div>
            )}
        </div>
      </div>
    </Link>
  );
};

export default StoryCard;