
import React from 'react';
import { useStories } from '../contexts/StoryContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import { Link } from 'react-router-dom';
import { HeartIcon, BookOpenIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

const ProfilePage: React.FC = () => {
  const { stories } = useStories();
  const { favorites, bookmarks } = useUserPreferences();

  const favoriteStories = stories.filter(story => favorites.includes(story.id));
  const readingStories = Object.keys(bookmarks)
    .map(storyId => {
      const story = stories.find(s => s.id === storyId);
      if (!story) return null;

      const chapterId = bookmarks[storyId];
      const allChapters = story.volumes.flatMap(v => v.chapters);
      const chapterIndex = allChapters.findIndex(c => c.id === chapterId);
      
      if (chapterIndex === -1) return null;

      const progress = allChapters.length > 0 ? Math.round(((chapterIndex + 1) / allChapters.length) * 100) : 0;
      return {
        ...story,
        continueChapterId: chapterId,
        progress,
      };
    })
    .filter(Boolean)
    // @ts-ignore
    .sort((a,b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());

  return (
    <div className="animate-fade-in space-y-12">
      <div>
        <h1 className="text-4xl font-bold font-serif text-slate-900 dark:text-white">
          Hồ sơ của bạn
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Quản lý truyện đang đọc và danh sách yêu thích của bạn.
        </p>
      </div>

      {/* Currently Reading Section */}
      <section>
        <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <BookOpenIcon className="h-6 w-6 text-cyan-500"/>
            Truyện đang đọc
        </h2>
        {readingStories.length > 0 ? (
          <div className="space-y-4">
            {readingStories.map(story => story && (
              <div key={story.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img src={story.coverImage} alt={story.title} className="w-20 h-28 object-cover rounded-md flex-shrink-0" />
                <div className="flex-grow w-full">
                  <h3 className="font-bold text-lg">{story.title}</h3>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 my-2">
                    <div className="bg-cyan-600 h-2.5 rounded-full" style={{ width: `${story.progress}%` }}></div>
                  </div>
                  <p className="text-sm text-slate-500">Đã đọc {story.progress}%</p>
                </div>
                <Link
                  to={`/story/${story.id}/chapter/${story.continueChapterId}`}
                  className="flex-shrink-0 w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <span>Đọc tiếp</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg">Bạn chưa bắt đầu đọc truyện nào.</p>
        )}
      </section>

      {/* Favorites Section */}
      <section>
        <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <HeartIcon className="h-6 w-6 text-red-500"/>
            Truyện Yêu Thích
        </h2>
        {favoriteStories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
            {favoriteStories.map(story => (
              <div key={story.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-200 group">
                <Link to={`/story/${story.id}`}>
                    <div className="aspect-[2/3] overflow-hidden">
                      <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    </div>
                    <div className="p-3">
                        <h3 className="font-bold truncate text-base">{story.title}</h3>
                        <p className="text-sm text-slate-500 truncate">{story.author}</p>
                    </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <p className="text-slate-500">Bạn chưa có truyện yêu thích nào.</p>
            <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline">Khám phá truyện mới</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;