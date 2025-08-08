import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStories } from '../contexts/StoryContext.tsx';
import StoryCard from '../components/StoryCard.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';

const SearchPage: React.FC = () => {
  const { stories, loading } = useStories();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const filteredStories = useMemo(() => {
    if (!query) {
      return [];
    }
    const safeStories = Array.isArray(stories) ? stories : [];
    return safeStories.filter(story =>
      story.title.toLowerCase().includes(query.toLowerCase()) ||
      story.author.toLowerCase().includes(query.toLowerCase())
    );
  }, [stories, query]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-6 font-serif text-slate-900 dark:text-white">
          Kết quả tìm kiếm cho: <span className="text-orange-600">"{query}"</span>
        </h1>
        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {filteredStories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <p className="text-center py-16 text-slate-500 dark:text-slate-400">
            Không tìm thấy truyện nào phù hợp với từ khóa của bạn.
          </p>
        )}
      </section>
    </div>
  );
};

export default SearchPage;