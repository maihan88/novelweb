import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStories } from '../contexts/StoryContext.tsx';
import StoryCard from '../components/StoryCard.tsx';
// Xóa import LoadingSpinner nếu không dùng hoặc dùng component style mới
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchPage: React.FC = () => {
  const { stories, loading } = useStories();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const filteredStories = useMemo(() => {
    if (!query) {
      return [];
    }
    const safeStories = Array.isArray(stories) ? stories : [];
    const lowerCaseQuery = query.toLowerCase();
    
    return safeStories.filter(story =>
      story.title.toLowerCase().includes(lowerCaseQuery) ||
      story.author.toLowerCase().includes(lowerCaseQuery) ||
      (Array.isArray(story.alias) && story.alias.some(a => a.toLowerCase().includes(lowerCaseQuery)))
    );
  }, [stories, query]);

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto text-sukem-text">
      <section>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 font-serif text-sukem-text border-b border-sukem-border pb-4">
          Kết quả tìm kiếm cho: <span className="text-sukem-primary">"{query}"</span>
          <span className="ml-2 text-base font-normal text-sukem-text-muted">({filteredStories.length} truyện)</span>
        </h1>
        
        {loading ? (
            // Spinner dùng màu sukem-primary và sukem-bg
            <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-t-sukem-primary border-sukem-border rounded-full animate-spin"></div>
            </div>
        ) : filteredStories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {filteredStories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          // Card "Không tìm thấy" dùng theme sukem
          <div className="text-center py-16 px-6 bg-sukem-card rounded-lg shadow-sm border border-sukem-border">
             <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-sukem-border mb-4" />
            <p className="text-lg font-semibold text-sukem-text mb-2">
                Không tìm thấy kết quả
            </p>
            <p className="text-sukem-text-muted max-w-md mx-auto">
                Rất tiếc, không có truyện nào phù hợp với từ khóa "<span className="font-semibold text-sukem-primary">{query}</span>". Vui lòng thử tìm kiếm với từ khóa khác.
            </p>
             <Link to="/" className="mt-6 inline-block text-sm font-medium text-sukem-accent hover:underline">
                Quay lại trang chủ
             </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default SearchPage;