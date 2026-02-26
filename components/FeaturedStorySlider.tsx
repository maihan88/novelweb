import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  TagIcon, 
  UserIcon, 
  BookOpenIcon 
} from '@heroicons/react/24/outline';
interface SliderStory extends Story {
  chapterCount?: number;
}

interface Props {
  stories: SliderStory[];
}

const FeaturedStorySlider: React.FC<Props> = ({ stories }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveredRef = useRef<boolean>(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const page = Math.round(scrollLeft / clientWidth);
      setCurrentIndex(page);
      const pages = Math.ceil(scrollWidth / clientWidth);
      setTotalPages(pages);
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    
    autoPlayTimerRef.current = setInterval(() => {
      if (!isHoveredRef.current && scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const newScrollLeft = Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 1 ? 0 : scrollLeft + clientWidth;
        scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
        setTimeout(checkScroll, 350);
      }
    }, 4000);
  }, [checkScroll]);

  useEffect(() => {
    checkScroll();
    const timeoutId = setTimeout(checkScroll, 500);
    window.addEventListener('resize', checkScroll);
    return () => {
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timeoutId);
    };
  }, [stories, checkScroll]);

  useEffect(() => {
    if (totalPages > 1) {
      startAutoPlay();
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [totalPages, startAutoPlay]);

  const handleUserInteraction = () => {
    startAutoPlay();
  };

  const scroll = (direction: 'left' | 'right') => {
    handleUserInteraction();
    
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      let newScrollLeft = 0;

      if (direction === 'left') {
        newScrollLeft = scrollLeft <= 0 ? scrollWidth - clientWidth : scrollLeft - clientWidth;
      } else {
        newScrollLeft = Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 1 ? 0 : scrollLeft + clientWidth;
      }

      scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
      setTimeout(checkScroll, 350); 
    }
  };

  const scrollToPage = (pageIndex: number) => {
    handleUserInteraction();
    
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      scrollRef.current.scrollTo({ left: pageIndex * clientWidth, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  if (!stories || stories.length === 0) return null;

  return (
    <div 
      className="relative group flex flex-col gap-4"
      onMouseEnter={() => { isHoveredRef.current = true; }} 
      onMouseLeave={() => { isHoveredRef.current = false; }}
    >
      <div className="relative">
          <button 
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-sukem-card border border-sukem-border rounded-full shadow-lg text-sukem-text hover:text-sukem-primary transition-all hidden md:block"
            aria-label="Truyện trước"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>

          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {stories.map((story) => (
              <div 
                key={story.id} 
                className="flex-shrink-0 w-full md:w-[calc(50%-0.5rem)] snap-start bg-sukem-card rounded-2xl border border-sukem-border shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row overflow-hidden min-h-[14rem]"
              >
                {/* Ảnh bìa */}
                <div className="w-full sm:w-1/3 h-48 sm:h-auto flex-shrink-0 overflow-hidden relative select-none">
                    <img 
                      src={story.coverImage} 
                      alt={story.title} 
                      className="w-full h-full object-cover select-none"
                    />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:hidden pointer-events-none"></div>
                </div>

                {/* Thông tin */}
                <div className="p-4 flex flex-col flex-1 min-w-0">
                  <div>
                    <Link to={`/story/${story.id}`}>
                      <h3 className="text-xl font-bold text-sukem-text font-serif hover:text-sukem-primary transition-colors line-clamp-2 select-none">
                        {story.title}
                      </h3>
                    </Link>

                    {/* Tác giả & Số chương */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-sukem-text-muted select-none">
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-3.5 w-3.5" />
                        <span className="font-medium line-clamp-1">{story.author || 'Đang cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpenIcon className="h-3.5 w-3.5" />
                        <span>{story.chapterCount || 0} chương</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-start gap-2 mt-3 flex-wrap select-none cursor-default">
                      <TagIcon className="h-4 w-4 text-sukem-text-muted mt-0.5 flex-shrink-0" />
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {story.tags && story.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-bold px-2 py-0.5 bg-sukem-bg text-sukem-text-muted border border-sukem-border/50 rounded-md whitespace-nowrap">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mô tả ngắn */}
                  <div 
                    className="text-sm text-sukem-text mt-4 line-clamp-5 leading-relaxed text-justify opacity-80 select-none cursor-default " 
                    dangerouslySetInnerHTML={{ __html: story.description }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-sukem-card border border-sukem-border rounded-full shadow-lg text-sukem-text hover:text-sukem-primary transition-all hidden md:block"
            aria-label="Truyện tiếp theo"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToPage(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-sukem-primary w-6' 
                  : 'bg-sukem-border hover:bg-sukem-primary/50 w-2'
              }`}
              aria-label={`Đi tới trang ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedStorySlider;