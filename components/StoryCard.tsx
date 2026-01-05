import React from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types'; 
import { ClockIcon } from '@heroicons/react/24/outline'; 
import { formatDate } from '../utils/formatDate'; // Import utility đã sửa

interface StoryCardProps {
  story: Story;
}

const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  
  const latestChapter = story.latestChapter;

  return (
    <Link to={`/story/${story.id}`} className="group animate-fade-in relative h-full flex flex-col">
      {/* Container ảnh bìa */}
      <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-lg group-hover:shadow-orange-400/30 dark:group-hover:shadow-amber-500/20 aspect-[2/3] transition-all duration-300 ease-in-out transform group-hover:-translate-y-1 group-hover:scale-[1.02]">
        <img
            src={story.coverImage}
            alt={`Bìa truyện ${story.title}`}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-300"></div>
        
        {story.isHot && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md z-10 animate-pulse">
            HOT
          </div>
        )}
        
        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 backdrop-blur-sm">
             {story.status}
        </div>
        
        <div className="absolute bottom-0 left-0 p-2 w-full z-10">
            <h3 className="font-bold text-sm text-white drop-shadow-md leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
                {story.title}
            </h3>
        </div>
      </div>

       {/* Thông tin chương mới nhất */}
      <div className="mt-2 px-1">
        {latestChapter ? (
          <div title={latestChapter.title} className="flex items-center gap-2 text-xs transition-colors">
             {/* Icon Đồng Hồ */}
             <ClockIcon className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-amber-400"/>
             
             {/* Tên Chương */}
             <p className="truncate font-medium flex-1 text-slate-700 dark:text-gray-300 group-hover:text-orange-700 dark:group-hover:text-amber-300">
                {latestChapter.title}
             </p>
             
             {/* Ngày tháng: Sử dụng lastUpdatedAt của Story theo yêu cầu */}
             <span className="text-[10px] font-medium flex-shrink-0 px-1.5 py-0.5 rounded
                              text-slate-500 bg-slate-100 
                              dark:text-gray-200 dark:bg-gray-700 whitespace-nowrap">
                 {/* Ưu tiên hiển thị thời gian cập nhật của truyện */}
                 {formatDate(story.lastUpdatedAt)}
             </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs italic mt-1 text-slate-400 dark:text-gray-500">
            <ClockIcon className="h-3.5 w-3.5"/>
            <span>Chưa có chương</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default StoryCard;
