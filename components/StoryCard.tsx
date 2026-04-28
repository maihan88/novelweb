import React from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';
import { formatDate } from '../utils/formatDate';

interface StoryCardProps {
  story: Story;
}

const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const latestChapter = story.latestChapter;

  return (
    <Link
      to={`/story/${story.id}`}
      className="group relative flex flex-col h-full bg-sukem-card rounded-xl overflow-hidden border border-sukem-border"
    >
      {/* --- PHẦN 1: ẢNH BÌA --- */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={story.coverImage}
          alt={`Bìa truyện ${story.title}`}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />

        {/* Lớp Overlay Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>

        {/* Tên truyện trên cover */}
        <div className="absolute inset-x-0 bottom-0 p-3 pt-6 pointer-events-none">
          <h3 className="font-bold text-white text-sm sm:text-base leading-snug sm:line-clamp-2" title={story.title}>
            {story.title}
          </h3>
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
          <div className="flex items-center gap-1 text-sukem-text whitespace-nowrap flex-shrink-0 md:flex-shrink md:truncate md:pr-2">
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