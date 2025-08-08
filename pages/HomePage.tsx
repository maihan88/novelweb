import React, { useState, useMemo } from 'react';
import { useStories } from '../contexts/StoryContext.tsx';
import StoryCard from '../components/StoryCard.tsx';
import HeroBanner from '../components/HeroBanner.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/solid';

const HomePage: React.FC = () => {
  const { stories, loading, error } = useStories();
  const [statusFilter, setStatusFilter] = useState<'all' | 'Đang dịch' | 'Hoàn thành'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Ensure stories is always an array
  const safeStories = Array.isArray(stories) ? stories : [];

  const bannerStories = useMemo(() => safeStories.filter(s => s.isInBanner), [safeStories]);
  const hotStories = useMemo(() => safeStories.filter(s => s.isHot), [safeStories]);
  
  const newlyUpdatedStories = useMemo(() => {
    return [...safeStories]
      .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())
      .slice(0, 12);
  }, [safeStories]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        <p>Đã xảy ra lỗi khi tải dữ liệu.</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8";

  return (
    <div className="animate-fade-in space-y-12">
      {/* Hero Section */}
      <HeroBanner stories={bannerStories} />

      {hotStories.length > 0 && (
        <section>
           <h2 className="text-2xl font-bold mb-6 font-serif text-orange-950 dark:text-amber-50">Đề xuất </h2>
           <div className={gridClasses}>
              {hotStories.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
        </section>
      )}

      {newlyUpdatedStories.length > 0 && (
        <section>
           <h2 className="text-2xl font-bold mb-6 font-serif text-orange-950 dark:text-amber-50">Mới cập nhật</h2>
           <div className={gridClasses}>
              {newlyUpdatedStories.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;