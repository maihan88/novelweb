import React from 'react';
import { useStories } from '../contexts/StoryContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { HeartIcon, BookOpenIcon, ArrowRightIcon, CalendarDaysIcon, UserCircleIcon } from '@heroicons/react/24/solid'; // Thêm CalendarDaysIcon, UserCircleIcon
import StoryCard from '../components/StoryCard.tsx'; // Giữ lại StoryCard

// Helper định dạng ngày (có thể tách ra utils)
const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const ProfilePage: React.FC = () => {
  const { stories } = useStories();
  const { favorites, bookmarks } = useUserPreferences();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const safeStories = Array.isArray(stories) ? stories : [];
  const favoriteStories = safeStories.filter(story => favorites.includes(story.id));

  const readingStories = Object.entries(bookmarks)
    .map(([storyId, bookmark]) => {
      const story = safeStories.find(s => s.id === storyId);
      if (!story || !bookmark || !bookmark.chapterId) return null;

      // Tìm chương cuối cùng đã đọc để lấy tên
      const lastReadChapter = story.volumes
        .flatMap(v => v.chapters)
        .find(c => c.id === bookmark.chapterId);

      // Tìm tổng số chương của truyện
      const totalChapters = story.volumes.reduce((acc, vol) => acc + vol.chapters.length, 0);

      return {
        ...story,
        continueChapterId: bookmark.chapterId,
        lastReadChapterTitle: lastReadChapter?.title || 'Chương đã đọc',
        progress: bookmark.progress,
        lastReadDate: bookmark.lastRead,
        totalChapters: totalChapters, // Thêm tổng số chương
      };
    })
    .filter((story): story is NonNullable<typeof story> => story !== null)
    .sort((a,b) => new Date(b.lastReadDate).getTime() - new Date(a.lastReadDate).getTime());

  // Component Card cho truyện đang đọc
  const ReadingStoryCard: React.FC<typeof readingStories[0]> = (story) => (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start gap-4 hover:shadow-lg transition-shadow duration-200">
        <Link to={`/story/${story.id}`} className="flex-shrink-0 block">
            <img src={story.coverImage} alt={story.title} className="w-24 h-36 object-cover rounded-md shadow-sm hover:opacity-90 transition-opacity" />
        </Link>
        <div className="flex-grow flex flex-col justify-between h-full w-full sm:w-auto">
            <div>
                 <Link to={`/story/${story.id}`}>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-amber-300 transition-colors line-clamp-1" title={story.title}>{story.title}</h3>
                 </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-1.5 line-clamp-1" title={story.author}>Tác giả: {story.author}</p>
                 <p className="text-sm text-orange-600 dark:text-amber-400 font-medium my-1 line-clamp-1" title={story.lastReadChapterTitle}>
                    Đang đọc: {story.lastReadChapterTitle}
                </p>
                {/* Thanh progress cải tiến */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 my-2">
                    <div className="bg-gradient-to-r from-orange-400 to-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${story.progress}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                     <span>Hoàn thành: {Math.round(story.progress)}%</span>
                     <span className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-3.5 w-3.5"/>
                        {formatDate(story.lastReadDate)}
                     </span>
                 </div>
            </div>
            <Link
              to={`/story/${story.id}/chapter/${story.continueChapterId}`}
              className="mt-3 w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold rounded-md transition-colors flex items-center justify-center gap-2 text-sm shadow hover:shadow-md"
            >
              <span>Đọc tiếp</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
        </div>
      </div>
  );

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header Hồ sơ */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-gradient-to-r from-orange-50 dark:from-slate-800 to-amber-50 dark:to-slate-800 p-6 rounded-xl shadow-md border border-orange-100 dark:border-slate-700">
         {/* Avatar Placeholder */}
          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center shadow-inner">
             <UserCircleIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white dark:text-slate-400 opacity-80" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Chào mừng trở lại,</p>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 dark:text-white mt-1">
              {currentUser.username}
            </h1>
            {/* Có thể thêm các thông tin khác như ngày tham gia */}
          </div>
      </div>

      {/* Section Truyện đang đọc */}
      <section>
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold font-serif flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <BookOpenIcon className="h-6 w-6 text-orange-500 dark:text-amber-500"/>
                Tiếp tục đọc
            </h2>
             {readingStories.length > 3 && ( // Chỉ hiển thị nút xem thêm nếu nhiều hơn 3
                 <Link to="#" className="text-sm font-medium text-orange-600 dark:text-amber-400 hover:underline">Xem tất cả</Link>
             )}
        </div>
        {readingStories.length > 0 ? (
          // Sử dụng grid layout cho truyện đang đọc
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {readingStories.slice(0, 4).map(story => ( // Giới hạn hiển thị ban đầu (ví dụ: 4)
              <ReadingStoryCard key={story.id} {...story} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
             <BookOpenIcon className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Bạn chưa có truyện nào đang đọc dở.</p>
            <Link to="/" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:underline">Khám phá truyện mới</Link>
          </div>
        )}
      </section>

      {/* Section Truyện Yêu Thích */}
      <section>
         <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold font-serif flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <HeartIcon className="h-6 w-6 text-red-500"/>
                Truyện Yêu Thích ({favoriteStories.length})
            </h2>
            {favoriteStories.length > 6 && ( // Chỉ hiển thị nút xem thêm nếu nhiều hơn 6
                 <Link to="#" className="text-sm font-medium text-orange-600 dark:text-amber-400 hover:underline">Xem tất cả</Link>
             )}
        </div>
        {favoriteStories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {favoriteStories.slice(0, 12).map(story => ( // Giới hạn hiển thị ban đầu (ví dụ: 12)
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
           <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
             <HeartIcon className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Danh sách yêu thích của bạn đang trống.</p>
             <Link to="/" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:underline">Thêm truyện vào danh sách</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
