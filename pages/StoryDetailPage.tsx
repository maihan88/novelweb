
import React, { useEffect, useCallback } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useStories } from '../contexts/StoryContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import StarRating from '../components/StarRating.tsx';
import { HeartIcon as HeartSolid, PencilIcon, BookOpenIcon, EyeIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';

const StoryDetailPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { getStory, incrementView, rateStory } = useStories();
  const { isFavorite, toggleFavorite, getBookmark, getUserRating, addRating } = useUserPreferences();
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (storyId) {
      incrementView(storyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  const story = storyId ? getStory(storyId) : undefined;
  const bookmarkedChapterId = storyId ? getBookmark(storyId) : undefined;
  const userRating = storyId ? getUserRating(storyId) : undefined;
  
  const handleRating = useCallback((newRating: number) => {
    if (!storyId || !currentUser) {
      alert("Bạn phải đăng nhập để đánh giá.");
      return;
    }
    const previousRating = getUserRating(storyId);
    rateStory(storyId, newRating, previousRating);
    addRating(storyId, newRating);
  }, [storyId, rateStory, addRating, getUserRating, currentUser]);
  
  if (!storyId) {
    return <Navigate to="/" replace />;
  }

  if (!story) {
    return <div className="text-center py-20"><LoadingSpinner /></div>;
  }
  
  const handleFavoriteClick = () => {
    toggleFavorite(story.id);
  };

  const statusColor = story.status === 'Hoàn thành' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
  const isFavorited = isFavorite(story.id);
  
  const firstChapterId = story.volumes[0]?.chapters[0]?.id;
  const continueReadingId = bookmarkedChapterId || firstChapterId;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden">
        {/* Responsive Layout Container */}
        <div className="flex flex-col md:flex-row gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
          
          {/* Left Side: Cover Image & Actions */}
          <div className="w-full md:w-1/3 flex-shrink-0">
            <img className="h-auto w-full rounded-lg shadow-lg aspect-[2/3] object-cover" src={story.coverImage} alt={`Bìa truyện ${story.title}`} />
            <div className="mt-6 flex flex-col sm:flex-row md:flex-col gap-3">
              {continueReadingId && (
                <Link 
                  to={`/story/${story.id}/chapter/${continueReadingId}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-105"
                >
                  <BookOpenIcon className="h-5 w-5"/>
                  <span>{bookmarkedChapterId ? 'Đọc tiếp' : 'Đọc từ đầu'}</span>
                </Link>
              )}
               <button 
                onClick={handleFavoriteClick} 
                className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md font-semibold text-sm transition-colors ${isFavorited ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
               >
                {isFavorited ? <HeartSolid className="h-5 w-5"/> : <HeartOutline className="h-5 w-5"/>}
                 {isFavorited ? 'Đã yêu thích' : 'Yêu thích'}
               </button>
            </div>
          </div>
          
          {/* Right Side: Story Details */}
          <div className="w-full md:w-2/3">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor} inline-block mb-2`}>
                  {story.status}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 dark:text-white">{story.title}</h1>
                 {story.alias && <p className="mt-1 text-md text-slate-500 dark:text-slate-400 italic">{story.alias}</p>}
                <p className="mt-2 text-md text-slate-600 dark:text-slate-400">Tác giả: {story.author}</p>
              </div>
              {currentUser?.role === 'admin' && (
                <button onClick={() => navigate(`/admin/story/edit/${story.id}`)} className="flex-shrink-0 ml-4 p-2 rounded-md font-semibold text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
                  <PencilIcon className="h-4 w-4" /> <span className="hidden sm:inline">Chỉnh sửa</span>
                </button>
               )}
            </div>
             <div className="mt-4">
                <StarRating 
                    rating={story.rating}
                    count={story.ratingsCount}
                    userRating={userRating}
                    onRate={handleRating}
                />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {story.tags.map(tag => (
                <span key={tag} className="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold mb-2 font-serif">Mô tả</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{story.description}</p>
            </div>
          </div>
        </div>

        {/* Chapter List (Full Width) */}
        <div className="p-4 sm:p-6 md:p-8 pt-0 md:pt-4">
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold mb-4 font-serif">Danh sách chương</h2>
            <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-2">
              {story.volumes.length > 0 ? story.volumes.map(volume => (
                <div key={volume.id}>
                  <h3 className="text-lg font-semibold font-serif text-slate-800 dark:text-slate-200 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-t-md sticky top-0">{volume.title}</h3>
                  <div className="space-y-2 border border-t-0 border-slate-100 dark:border-slate-700/50 rounded-b-md p-2">
                      {volume.chapters.map(chapter => (
                      <Link
                          key={chapter.id}
                          to={`/story/${story.id}/chapter/${chapter.id}`}
                          className={`block p-4 rounded-md transition-colors duration-200 ${bookmarkedChapterId === chapter.id ? 'bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-700' : 'bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                          <div className="flex justify-between items-center gap-4">
                            <span className="flex-grow text-slate-800 dark:text-slate-200">{chapter.title}</span>
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <EyeIcon className="h-4 w-4"/>
                                    {chapter.views.toLocaleString('vi-VN')}
                                </span>
                                {bookmarkedChapterId === chapter.id && (
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-full">Đang đọc</span>
                                )}
                            </div>
                          </div>
                      </Link>
                      ))}
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 dark:text-slate-400">Chưa có chương nào được đăng.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetailPage;