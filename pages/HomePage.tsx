

import React, { useState, useMemo } from 'react';
import { useStories } from '../contexts/StoryContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import StoryCard from '../components/StoryCard.tsx';
import HeroBanner from '../components/HeroBanner.tsx';
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/solid';

type FilterType = 'all' | 'favorites';

const HomePage: React.FC = () => {
  const { stories } = useStories();
  const { favorites } = useUserPreferences();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Đang dịch' | 'Hoàn thành'>('all');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const bannerStories = useMemo(() => stories.filter(s => s.isInBanner), [stories]);
  const hotStories = useMemo(() => stories.filter(s => s.isHot), [stories]);
  
  const newlyUpdatedStories = useMemo(() => {
    return [...stories]
      .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())
      .slice(0, 12);
  }, [stories]);

  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) || story.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
      const matchesFavorites = activeFilter !== 'favorites' || favorites.includes(story.id);
      return matchesSearch && matchesStatus && matchesFavorites;
    });
  }, [stories, searchTerm, statusFilter, activeFilter, favorites]);

  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8";

  return (
    <div className="animate-fade-in space-y-12">
      {/* Hero Section */}
      <HeroBanner stories={bannerStories} />

      {hotStories.length > 0 && (
        <section>
           <h2 className="text-3xl font-bold mb-6 font-serif text-slate-900 dark:text-white">Truyện Hot 🔥</h2>
           <div className={gridClasses}>
              {hotStories.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
        </section>
      )}

      {newlyUpdatedStories.length > 0 && (
        <section>
           <h2 className="text-3xl font-bold mb-6 font-serif text-slate-900 dark:text-white">Mới Cập Nhật</h2>
           <div className={gridClasses}>
              {newlyUpdatedStories.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
        </section>
      )}

      <section>
        <h2 className="text-3xl font-bold mb-6 font-serif text-slate-900 dark:text-white">Tất Cả Truyện</h2>
        <div className="mb-8 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg shadow-sm sticky top-[65px] backdrop-blur-sm z-30 border dark:border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Tìm theo tên truyện, tác giả..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-grow p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              aria-label="Tìm kiếm truyện"
            />
             <button onClick={() => setIsFilterOpen(prev => !prev)} className="sm:w-auto w-full flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              {isFilterOpen ? <XMarkIcon className="h-5 w-5"/> : <AdjustmentsHorizontalIcon className="h-5 w-5"/>}
              <span>Bộ lọc</span>
            </button>
          </div>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? 'max-h-48' : 'max-h-0'}`}>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="w-full sm:w-1/2 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  aria-label="Lọc theo trạng thái"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Đang dịch">Đang dịch</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                </select>
                <div className="w-full sm:w-1/2 flex items-center space-x-2 bg-slate-200 dark:bg-slate-700 p-1 rounded-full">
                    <button onClick={() => setActiveFilter('all')} className={`w-1/2 text-center px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${activeFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Tất cả</button>
                    <button onClick={() => setActiveFilter('favorites')} className={`w-1/2 text-center px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${activeFilter === 'favorites' ? 'bg-indigo-600 text-white shadow' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Yêu thích</button>
                </div>
            </div>
           </div>
        </div>

        {filteredStories.length > 0 ? (
          <div className={gridClasses}>
            {filteredStories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500 dark:text-slate-400">Không tìm thấy truyện nào phù hợp.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;