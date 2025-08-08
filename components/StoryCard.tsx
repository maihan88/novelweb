import React from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';

interface StoryCardProps {
  story: Story;
}

const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const lastVolume = story.volumes?.[story.volumes.length - 1];
  const lastChapter = lastVolume?.chapters?.[lastVolume.chapters.length - 1];
  
  return (
    <Link to={`/story/${story.id}`} className="block group animate-fade-in">
      <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-orange-500/20 dark:hover:shadow-orange-400/20 hover:-translate-y-1 transition-all duration-300 aspect-[2/3]">
        <img src={story.coverImage} alt={`Bìa truyện ${story.title}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
         {story.isHot && (
          <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10 shadow">HOT</div>
        )}
        <div className="absolute bottom-0 left-0 p-2 w-full">
            <h3 className="font-bold text-sm text-white drop-shadow-lg leading-tight truncate">
                {story.title}
            </h3>
        </div>
      </div>
      <div className="mt-2">
        {lastChapter ? (
          <p className="text-sm text-slate-700 dark:text-stone-300 group-hover:text-orange-900 dark:group-hover:text-amber-100 transition-colors truncate font-medium" title={lastChapter.title}>
            {lastChapter.title}
          </p>
        ) : (
          <p className="text-sm text-slate-500 italic">Chưa có chương</p>
        )}
      </div>
    </Link>
  );
};

export default StoryCard;
