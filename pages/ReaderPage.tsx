import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { Story, Chapter, ReaderPreferences } from '../types';
import { useStories } from '../contexts/StoryContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import ReaderControls from '../components/ReaderControls.tsx';
import CommentSection from '../components/CommentSection.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

// Component thanh tiến trình
const ReadingProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 z-50">
    <div 
      className="h-1 bg-indigo-600 transition-all duration-100 ease-linear" 
      style={{ width: `${progress}%` }}
    />
  </div>
);

const ReaderPage: React.FC = () => {
    const { storyId, chapterId } = useParams<{ storyId: string, chapterId: string }>();
    const navigate = useNavigate();
    const { getStoryById, incrementChapterView } = useStories();
    const { bookmarks, updateBookmark } = useUserPreferences();
    
    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scrollPercent, setScrollPercent] = useState(0);
    const lastSavedProgress = useRef(0);
    const [preferences, setPreferences] = useState<ReaderPreferences>({
        fontSize: 18,
        fontFamily: 'font-serif',
        lineHeight: 1.7,
    });
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const scrollInterval = useRef<number | null>(null);
    const progressRef = useRef(0); 
    const viewIncrementedRef = useRef(false);
    
    const handleScroll = useCallback(() => {
        const element = document.documentElement;
        const totalHeight = element.scrollHeight - element.clientHeight;
        if (totalHeight > 0) {
            const percentage = (element.scrollTop / totalHeight) * 100;
            setScrollPercent(percentage);
        } else {
            setScrollPercent(100);
        }
    }, []);

    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newChapterId = e.target.value;
            if (newChapterId) {
                navigate(`/story/${storyId}/chapter/${newChapterId}`);
            }
    };

    useEffect(() => {
        const fetchStoryData = async () => {
            if (storyId) {
                setLoading(true);
                const fetchedStory = await getStoryById(storyId);
                setStory(fetchedStory || null);
                setLoading(false);
            }
        };
        fetchStoryData();
    }, [storyId, getStoryById]);

    useEffect(() => {
      viewIncrementedRef.current = false;
      const savedBookmark = storyId ? bookmarks[storyId] : null;

      if (savedBookmark && savedBookmark.chapterId === chapterId) {
        setTimeout(() => {
          const element = document.documentElement;
          const totalHeight = element.scrollHeight - element.clientHeight;
          if (totalHeight > 0) {
            window.scrollTo(0, (totalHeight * savedBookmark.progress) / 100);
          }
        }, 150);
      } else {
        // Khi vào chương mới hoặc bấm "Đọc từ đầu", luôn bắt đầu từ trên cùng.
        window.scrollTo(0, 0);
      }
    }, [storyId, chapterId]);

    useEffect(() => {
      const handleScroll = () => {
        const element = document.documentElement;
        const totalHeight = element.scrollHeight - element.clientHeight;
        const percentage = totalHeight > 0 ? (element.scrollTop / totalHeight) * 100 : 100;
        setScrollPercent(percentage);
        progressRef.current = percentage;
      };

      if (story && chapterId && !viewIncrementedRef.current) {
          incrementChapterView(storyId!, chapterId);
          viewIncrementedRef.current = true;
      }
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();

      return () => {
          window.removeEventListener('scroll', handleScroll);
          if (storyId && chapterId) {
            const finalProgress = progressRef.current >= 98 ? 100 : progressRef.current;
            // BỎ điều kiện `currentProgress > lastSavedProgress.current`
            // Luôn lưu lại tiến độ cuối cùng khi rời trang.
            updateBookmark(storyId, chapterId, finalProgress);
          }
      };
    }, [story, storyId, chapterId, updateBookmark, incrementChapterView]);

    const { chapter, prevChapter, nextChapter } = useMemo(() => {
        if (!story || !chapterId) return { chapter: undefined, prevChapter: null, nextChapter: null };
        const allChapters = story.volumes.flatMap((v) => v.chapters);
        const currentChapterIndex = allChapters.findIndex((c) => c.id === chapterId);
        if (currentChapterIndex === -1) return { chapter: undefined, prevChapter: null, nextChapter: null };
        const currentChapter: Chapter | undefined = allChapters[currentChapterIndex];
        const prev: Chapter | null = currentChapterIndex > 0 ? allChapters[currentChapterIndex - 1] : null;
        const next: Chapter | null = currentChapterIndex < allChapters.length - 1 ? allChapters[currentChapterIndex + 1] : null;
        return { chapter: currentChapter, prevChapter: prev, nextChapter: next };
    }, [story, chapterId]);

    const stopAutoScroll = () => {
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
        setIsAutoScrolling(false);
    };
  
    const toggleAutoScroll = () => {
        if(isAutoScrolling) stopAutoScroll();
        else {
            setIsAutoScrolling(true);
            scrollInterval.current = window.setInterval(() => {
                if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 50) stopAutoScroll();
                else window.scrollBy(0, 1);
            }, 50);
        }
    };

    useEffect(() => {
        if (story && chapter && storyId && chapterId && !viewIncrementedRef.current) {
            incrementChapterView(storyId, chapterId);
            viewIncrementedRef.current = true;
        }
        window.addEventListener('scroll', handleScroll);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            stopAutoScroll();
            const currentProgress = scrollPercent > 98 ? 100 : scrollPercent;
            if (storyId && chapterId && currentProgress > lastSavedProgress.current) {
              updateBookmark(storyId, chapterId, currentProgress);
            }
        };
    }, [story, chapter, storyId, chapterId, incrementChapterView, updateBookmark, handleScroll, scrollPercent]);
    
    if (loading) return <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-950"><LoadingSpinner /></div>;
    if (error) return <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-950 text-red-500">{error}</div>;
    if (!story || !chapter) return <Navigate to="/" replace />;

    const contentStyle = { fontSize: `${preferences.fontSize}px`, lineHeight: preferences.lineHeight };

    const navButtonBaseClasses = "flex items-center justify-center gap-2 px-4 py-2 border rounded-md transition-colors duration-200";
    const navButtonEnabledClasses = "border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800";
    const navButtonDisabledClasses = "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed";


    return (
        <div className="bg-white dark:bg-slate-950 min-h-full">
            <ReadingProgressBar progress={scrollPercent} />
            <div className="max-w-3xl mx-auto animate-fade-in px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8 pt-4">
                    <Link to={`/story/${story.id}`} className="text-cyan-600 dark:text-cyan-400 hover:underline">{story.title}</Link>
                    <h1 className="text-3xl sm:text-4xl font-bold font-serif mt-2 text-slate-900 dark:text-white">{chapter.title}</h1>
                </div>
                <div 
                    className={`prose prose-lg dark:prose-invert max-w-none transition-all duration-300 ${preferences.fontFamily}`} 
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                />
                {/* --- GIAO DIỆN CHUYỂN CHƯƠNG RESPONSIVE --- */}
        <div className="mt-12 pt-6 border-t border-slate-300 dark:border-slate-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            {/* Nút Chương Trước */}
            {prevChapter ? (
              <Link to={`/story/${story.id}/chapter/${prevChapter.id}`} className={`${navButtonBaseClasses} ${navButtonEnabledClasses}`}>
                <ArrowLeftIcon className="h-4 w-4" /> 
                <span>Chương trước</span>
              </Link>
            ) : (
              <div className={`${navButtonBaseClasses} ${navButtonDisabledClasses}`}>
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Chương trước</span>
              </div>
            )}

            {/* Dropdown chọn chương */}
            <select
              value={chapterId}
              onChange={handleChapterSelect}
              className="w-full sm:w-auto flex-grow px-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 transition"
              aria-label="Chọn chương"
            >
              {story.volumes.map(volume => (
                <optgroup label={volume.title} key={volume.id}>
                  {volume.chapters.map(chap => (
                    <option key={chap.id} value={chap.id}>
                      {chap.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            
            {/* Nút Chương Tiếp */}
            {nextChapter ? (
              <Link to={`/story/${story.id}/chapter/${nextChapter.id}`} className={`${navButtonBaseClasses} ${navButtonEnabledClasses}`}>
                <span>Chương tiếp</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : (
              <div className={`${navButtonBaseClasses} ${navButtonDisabledClasses}`}>
                <span>Chương tiếp</span>
                <ArrowRightIcon className="h-4 w-4" />
              </div>
            )}
          </div>
                </div>
                {storyId && chapterId && <CommentSection storyId={storyId} chapterId={chapterId} />}
                <ReaderControls 
                    preferences={preferences} 
                    setPreferences={setPreferences}
                    isAutoScrolling={isAutoScrolling}
                    toggleAutoScroll={toggleAutoScroll}
                />
            </div>
        </div>
    );
};

export default ReaderPage;