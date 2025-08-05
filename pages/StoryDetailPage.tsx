import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useStories } from '../contexts/StoryContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import StarRating from '../components/StarRating.tsx';
import { Story } from '../types.ts';
import { PencilIcon, BookOpenIcon, EyeIcon, HeartIcon } from '@heroicons/react/24/solid';

const StoryDetailPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { getStoryById, incrementView, addRatingToStory } = useStories();
  const { currentUser } = useAuth();
  // Lấy đầy đủ các hàm cần thiết từ context
  const { isFavorite, toggleFavorite, getUserRating, addRating, bookmarks, removeBookmark } = useUserPreferences();
  
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State cho chức năng tìm kiếm
  const [chapterSearchTerm, setChapterSearchTerm] = useState('');
  
  const isUserFavorite = storyId ? isFavorite(storyId) : false;
  const userRating = storyId ? getUserRating(storyId) : undefined;
  // Lấy bookmark hiện tại cho truyện này
  const currentBookmark = storyId ? bookmarks[storyId] : null;

  const fetchStory = useCallback(async () => {
    if (!storyId) return;
    setLoading(true);
    setError('');
    try {
      const fetchedStory = await getStoryById(storyId);
      if (fetchedStory) {
        setStory(fetchedStory);
        incrementView(storyId);
      } else {
        setError('Không tìm thấy truyện này.');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải truyện.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [storyId, getStoryById, incrementView]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);
  
  const handleRating = async (rating: number) => {
    if (!currentUser || !storyId) {
        alert("Bạn cần đăng nhập để đánh giá.");
        return;
    }
    if (userRating !== undefined) {
        alert("Bạn đã đánh giá truyện này rồi.");
        return;
    }
    await addRatingToStory(storyId, rating);
    addRating(storyId, rating);
  };

  const firstChapter = story?.volumes[0]?.chapters[0];

   // Hàm này bây giờ chỉ dành cho nút "Đọc từ đầu" (khi đang đọc dở)
  const handleReadFromBeginning = () => {
    if (storyId) {
      removeBookmark(storyId);
    }
    if (firstChapter) {
      navigate(`/story/${story.id}/chapter/${firstChapter.id}`);
    }
  };

  // Logic lọc chương dựa trên từ khóa tìm kiếm
  const filteredVolumes = useMemo(() => {
    if (!story) return [];
    if (!chapterSearchTerm) {
        return story.volumes;
    }
    return story.volumes.map(volume => ({
        ...volume,
        chapters: volume.chapters.filter(chapter => 
            chapter.title.toLowerCase().includes(chapterSearchTerm.toLowerCase())
        )
    })).filter(volume => volume.chapters.length > 0);
  }, [story, chapterSearchTerm]);

  if (!storyId) return <Navigate to="/" replace />;
  if (loading) return <div className="text-center py-20"><LoadingSpinner /></div>;
  if (error || !story) return <div className="text-center py-20 text-red-500">{error || 'Không thể tải thông tin truyện.'}</div>;

  const statusColor = story.status === 'Hoàn thành' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
  
  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* --- THÊM LIÊN KẾT VỀ TRANG CHỦ --- */}
      <div className="mb-4 md:block hidden">
        <Link to="/" className="text-cyan-600 dark:text-cyan-400 hover:underline text-sm font-medium">
            &larr; Về trang chủ
        </Link>
      </div>
      {/* --- KẾT THÚC --- */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
          
          <div className="w-full md:w-1/3 flex-shrink-0">
            <img className="h-auto w-full rounded-lg shadow-lg aspect-[2/3] object-cover" src={story.coverImage} alt={`Bìa truyện ${story.title}`} />
            <div className="mt-6 flex flex-col gap-3">
{/* --- LOGIC NÚT ĐỌC MỚI --- */}
              {currentBookmark ? (
                // Nếu đang đọc dở, hiện cả hai nút
                <>
                  <Link 
                    to={`/story/${story.id}/chapter/${currentBookmark.chapterId}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-105"
                  >
                    <BookOpenIcon className="h-5 w-5"/>
                    <span>Đọc tiếp</span>
                  </Link>
                  <button 
                    onClick={handleReadFromBeginning}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 transition"
                  >
                    <BookOpenIcon className="h-5 w-5"/>
                    <span>Đọc từ đầu</span>
                  </button>
                </>
              ) : ( // Nếu chưa đọc
                firstChapter ? (
                // và có chương, chỉ hiện nút "Đọc từ đầu"
                <Link 
                  to={`/story/${story.id}/chapter/${firstChapter.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-105"
                >
                  <BookOpenIcon className="h-5 w-5"/>
                  <span>Đọc từ đầu</span>
                </Link>
              ) : (
                // Nếu chưa có chương nào, hiện thông báo
                <div className="text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-md">Truyện chưa có chương.</div>
              ))}
              {/* --- KẾT THÚC SỬA --- */}

               {currentUser && (
                <button 
                  onClick={() => toggleFavorite(storyId)}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 font-bold rounded-lg shadow-md transition-all duration-300 ${isUserFavorite ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-red-100 dark:hover:bg-red-900/50'}`}
                >
                  <HeartIcon className="h-5 w-5"/>
                  <span>{isUserFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-2/3">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor} inline-block mb-2`}>
                  {story.status}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 dark:text-white">{story.title}</h1>
                 {story.alias && story.alias.length > 0 && <p className="mt-1 text-md text-slate-500 dark:text-slate-400 italic">{Array.isArray(story.alias) ? story.alias.join(' · ') : story.alias}</p>}
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

        <div className="p-4 sm:p-6 md:p-8 pt-0 md:pt-4">
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            {/* --- THÊM Ô TÌM KIẾM --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold font-serif whitespace-nowrap">Danh sách chương</h2>
                <input
                    type="text"
                    placeholder="Tìm chương..."
                    value={chapterSearchTerm}
                    onChange={e => setChapterSearchTerm(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            {/* --- KẾT THÚC --- */}
            <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-2">
              {/* SỬ DỤNG filteredVolumes ĐỂ RENDER */}
              {filteredVolumes.length > 0 ? filteredVolumes.map(volume => (
                <div key={volume.id}>
                  <h3 className="text-lg font-semibold font-serif text-slate-800 dark:text-slate-200 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-t-md sticky top-0">{volume.title}</h3>
                  <div className="space-y-2 border border-t-0 border-slate-100 dark:border-slate-700/50 rounded-b-md p-2">
                      {volume.chapters.map(chapter => (
                      <Link
                          key={chapter.id}
                          to={`/story/${story.id}/chapter/${chapter.id}`}
                          className='block p-4 rounded-md transition-colors duration-200 bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-700'
                      >
                          <div className="flex justify-between items-center gap-4">
                            <span className="flex-grow text-slate-800 dark:text-slate-200">{chapter.title}</span>
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <EyeIcon className="h-4 w-4"/>
                                    {chapter.views.toLocaleString('vi-VN')}
                                </span>
                            </div>
                          </div>
                      </Link>
                      ))}
                      {volume.chapters.length === 0 && <p className="text-sm p-4 text-center text-slate-500">Không tìm thấy chương nào khớp.</p>}
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