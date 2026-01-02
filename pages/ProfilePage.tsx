import React, { useState } from 'react';
import { useStories } from '../contexts/StoryContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
    HeartIcon, 
    BookOpenIcon, 
    ArrowRightIcon, 
    UserCircleIcon,
    ClockIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/solid';
import StoryCard from '../components/StoryCard.tsx';

// --- CONFIG ---
const INITIAL_READING_LIMIT = 4; // Đã đổi thành 4 theo yêu cầu
const INITIAL_FAVORITE_LIMIT = 6;

// --- UTILS ---
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

  // --- STATE ---
  const [isReadingExpanded, setIsReadingExpanded] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const safeStories = Array.isArray(stories) ? stories : [];
  
  // Logic lấy dữ liệu
  const favoriteStories = safeStories.filter(story => favorites.includes(story.id));

  const readingStories = Object.entries(bookmarks)
    .map(([storyId, bookmark]) => {
      const story = safeStories.find(s => s.id === storyId);
      if (!story || !bookmark || !bookmark.chapterId) return null;

      const lastReadChapter = story.volumes
        .flatMap(v => v.chapters)
        .find(c => c.id === bookmark.chapterId);

      return {
        ...story,
        continueChapterId: bookmark.chapterId,
        lastReadChapterTitle: lastReadChapter?.title || 'Chương đã đọc',
        progress: bookmark.progress,
        lastReadDate: bookmark.lastRead,
      };
    })
    .filter((story): story is NonNullable<typeof story> => story !== null)
    .sort((a, b) => new Date(b.lastReadDate).getTime() - new Date(a.lastReadDate).getTime());

  // --- LOGIC SLICE ---
  const visibleReadingStories = isReadingExpanded 
      ? readingStories 
      : readingStories.slice(0, INITIAL_READING_LIMIT);

  const visibleFavoriteStories = isFavoritesExpanded 
      ? favoriteStories 
      : favoriteStories.slice(0, INITIAL_FAVORITE_LIMIT);

  // --- SUB-COMPONENT: Reading Card (Mobile Refined) ---
  const ReadingStoryCard: React.FC<typeof readingStories[0]> = (story) => (
      <div className="group relative bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-700 flex gap-3 sm:gap-4 overflow-hidden">
        
        {/* Ảnh bìa: Mobile nhỏ gọn (w-20), PC to hơn (sm:w-24) */}
        <Link to={`/story/${story.id}`} className="relative flex-shrink-0 w-20 h-28 sm:w-24 sm:h-36 rounded-lg overflow-hidden shadow-inner">
            <img 
                src={story.coverImage} 
                alt={story.title} 
                className="w-full h-full object-cover" 
            />
        </Link>

        {/* Nội dung bên phải */}
        <div className="flex-grow flex flex-col justify-between py-0.5">
            <div>
                <Link to={`/story/${story.id}`}>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] sm:text-lg leading-tight line-clamp-1 mb-1">
                        {story.title}
                    </h3>
                </Link>
                <p className="text-xs text-slate-500 mb-2 line-clamp-1">{story.author}</p>
                
                {/* Progress Bar Compact */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-md p-1.5 sm:p-2">
                    <div className="flex justify-between items-center text-[10px] sm:text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[100px] sm:max-w-[150px]">
                            {story.lastReadChapterTitle}
                        </span>
                        <span className="text-orange-600 dark:text-orange-400 font-bold">{Math.round(story.progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1">
                        <div 
                            className="bg-orange-500 h-1 rounded-full" 
                            style={{ width: `${story.progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Actions: Mobile tối giản */}
            <div className="flex items-end justify-between mt-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {formatDate(story.lastReadDate)}
                </span>
                <Link
                  to={`/story/${story.id}/chapter/${story.continueChapterId}`}
                  className="flex items-center gap-1 text-[11px] sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-sm"
                >
                  Đọc tiếp <ArrowRightIcon className="h-3 w-3" />
                </Link>
            </div>
        </div>
      </div>
  );

  return (
    <div className="animate-fade-in pb-20 max-w-5xl mx-auto">
      
      {/* --- HEADER PROFILE --- */}
      <div className="relative mb-8 sm:mb-12 mt-4 sm:mt-8 px-4">
          {/* Background Blur Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full sm:w-3/4 h-32 bg-orange-200/30 dark:bg-orange-900/20 blur-[50px] rounded-full -z-10"></div>
          
          <div className="text-center">
              <div className="relative inline-block">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto rounded-full bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 p-1 shadow-lg border border-slate-200 dark:border-slate-700">
                       <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                            <UserCircleIcon className="w-full h-full text-slate-400" />
                       </div>
                  </div>
              </div>

              <h1 className="mt-3 text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {currentUser.username}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">Thành viên tích cực</p>

              {/* Stats Pills - Mobile: Smaller padding/text */}
              <div className="flex justify-center gap-3 mt-4 sm:mt-6">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                      <BookOpenIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500"/>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">{readingStories.length} <span className="text-slate-400 font-normal">Đang đọc</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                      <HeartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500"/>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">{favoriteStories.length} <span className="text-slate-400 font-normal">Yêu thích</span></span>
                  </div>
              </div>
          </div>
      </div>

      <div className="space-y-8 sm:space-y-12 px-4 sm:px-6">
          
        {/* --- SECTION: TRUYỆN ĐANG ĐỌC --- */}
        <section>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
                    <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        <BookOpenIcon className="h-4 w-4 sm:h-5 sm:w-5"/>
                    </span>
                    Đọc tiếp
                </h2>
                
                {readingStories.length > INITIAL_READING_LIMIT && (
                    <button 
                        onClick={() => setIsReadingExpanded(!isReadingExpanded)}
                        className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-500 hover:text-orange-600 transition-colors bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"
                    >
                        {isReadingExpanded ? 'Thu gọn' : 'Xem thêm'}
                        {isReadingExpanded ? <ChevronUpIcon className="h-3 w-3 sm:h-4 sm:w-4"/> : <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4"/>}
                    </button>
                )}
            </div>

            {readingStories.length > 0 ? (
                // Mobile: 1 cột (để hiển thị card ngang rõ ràng). PC: 2 cột (giữ nguyên)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {visibleReadingStories.map(story => (
                        <ReadingStoryCard key={story.id} {...story} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <BookOpenIcon className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-slate-500 text-sm font-medium">Bạn chưa đọc truyện nào gần đây.</p>
                </div>
            )}
        </section>

        {/* --- SECTION: TRUYỆN YÊU THÍCH --- */}
        <section>
             <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
                    <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                        <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5"/>
                    </span>
                    Yêu thích
                </h2>

                 {favoriteStories.length > INITIAL_FAVORITE_LIMIT && (
                    <button 
                        onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
                        className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-500 hover:text-rose-600 transition-colors bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"
                    >
                        {isFavoritesExpanded ? 'Thu gọn' : 'Xem thêm'}
                        {isFavoritesExpanded ? <ChevronUpIcon className="h-3 w-3 sm:h-4 sm:w-4"/> : <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4"/>}
                    </button>
                )}
            </div>
            
            {favoriteStories.length > 0 ? (
                // Mobile: 2 Cột (chuẩn truyện tranh/chữ). PC: Giữ nguyên nhiều cột
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 sm:gap-y-8">
                    {visibleFavoriteStories.map(story => (
                        <StoryCard key={story.id} story={story} />
                    ))}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <HeartIcon className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-slate-500 text-sm font-medium">Chưa có truyện yêu thích.</p>
                    <Link to="/" className="mt-2 text-xs font-bold text-orange-500 hover:underline">
                        Khám phá ngay
                    </Link>
                </div>
            )}
        </section>

      </div>
    </div>
  );
};

export default ProfilePage;
