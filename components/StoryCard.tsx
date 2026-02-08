import React from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types'; 
import { ClockIcon } from '@heroicons/react/24/outline'; 
import { formatDate } from '../utils/formatDate'; 

interface StoryCardProps {
  story: Story;
}

const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  
  const latestChapter = story.latestChapter;

  return (
    <Link to={`/story/${story.id}`} className="group animate-fade-in relative h-full flex flex-col">
      {/* Container ảnh bìa */}
      <div className="relative overflow-hidden rounded-lg shadow-md border border-sukem-border/50 
                      group-hover:shadow-lg group-hover:shadow-sukem-accent/30 
                      aspect-[2/3] transition-all duration-300 ease-in-out transform group-hover:-translate-y-1 group-hover:scale-[1.02]">
        <img
            src={story.coverImage}
            alt={`Bìa truyện ${story.title}`}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-300"></div>
        
        {story.isHot && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md z-10 animate-pulse">
            HOT
          </div>
        )}
        
        <div className="absolute top-2 left-2 bg-sukem-card/90 text-sukem-text text-[10px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 backdrop-blur-sm border border-sukem-border">
              {story.status}
        </div>
        
        <div className="absolute bottom-0 left-0 p-2 w-full z-10">
            <h3 className="font-bold text-sm text-white drop-shadow-md leading-snug line-clamp-2 group-hover:text-sukem-accent transition-colors">
                {story.title}
            </h3>
        </div>
      </div>

       {/* Thông tin chương mới nhất */}
      <div className="mt-2 px-1">
        {latestChapter ? (
          <div title={latestChapter.title} className="flex items-center gap-2 text-xs transition-colors">
             {/* Icon Đồng Hồ */}
             <ClockIcon className="h-3.5 w-3.5 flex-shrink-0 text-sukem-text-muted group-hover:text-sukem-primary"/>
             
             {/* Tên Chương */}
             <p className="truncate font-medium flex-1 text-sukem-text group-hover:text-sukem-accent">
                {latestChapter.title}
             </p>
             
             {/* Ngày tháng */}
             <span className="text-[10px] font-medium flex-shrink-0 px-1.5 py-0.5 rounded
                              text-sukem-text-muted bg-sukem-bg border border-sukem-border whitespace-nowrap">
                 {formatDate(story.lastUpdatedAt)}
             </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs italic mt-1 text-sukem-text-muted">
            <ClockIcon className="h-3.5 w-3.5"/>
            <span>Chưa có chương</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default StoryCard;