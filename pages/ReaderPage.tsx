
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ReaderPreferences } from '../types';
import { useStories } from '../contexts/StoryContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import ReaderControls from '../components/ReaderControls.tsx';
import CommentSection from '../components/CommentSection.tsx';

const ReaderPage: React.FC = () => {
  const { storyId, chapterId } = useParams<{ storyId: string, chapterId: string }>();
  const { getStory, incrementChapterView } = useStories();
  const { updateBookmark } = useUserPreferences();
  
  const [preferences, setPreferences] = useState<ReaderPreferences>({
    fontSize: 18,
    fontFamily: 'font-serif',
    lineHeight: 1.7,
  });

  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const scrollInterval = useRef<number | null>(null);

  const story = storyId ? getStory(storyId) : undefined;

  const { chapter, prevChapter, nextChapter } = useMemo(() => {
    if (!story || !chapterId) {
        return { chapter: undefined, prevChapter: null, nextChapter: null };
    }
    const allChapters = story.volumes.flatMap(v => v.chapters);
    const currentChapterIndex = allChapters.findIndex(c => c.id === chapterId);
    
    if (currentChapterIndex === -1) {
        return { chapter: undefined, prevChapter: null, nextChapter: null };
    }

    const chapter = allChapters[currentChapterIndex];
    const prevChapter = currentChapterIndex > 0 ? allChapters[currentChapterIndex - 1] : null;
    const nextChapter = currentChapterIndex < allChapters.length - 1 ? allChapters[currentChapterIndex + 1] : null;

    return { chapter, prevChapter, nextChapter };
  }, [story, chapterId]);
  

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
    setIsAutoScrolling(false);
  };
  
  const startAutoScroll = () => {
    setIsAutoScrolling(true);
    scrollInterval.current = window.setInterval(() => {
      if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight) {
        stopAutoScroll(); // Stop at the bottom
      } else {
        window.scrollBy(0, 1);
      }
    }, 50); // Adjust scroll speed here
  };
  
  const toggleAutoScroll = () => {
    if(isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (storyId && chapterId) {
      updateBookmark(storyId, chapterId);
      incrementChapterView(storyId, chapterId);
    }
    // Cleanup scroll on component unmount or chapter change
    return () => stopAutoScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, chapterId]);

  if (!story || !chapter) {
    return <Navigate to="/" replace />;
  }

  const contentStyle = {
    fontSize: `${preferences.fontSize}px`,
    lineHeight: preferences.lineHeight,
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-full">
      <div className="max-w-3xl mx-auto animate-fade-in px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <Link to={`/story/${story.id}`} className="text-cyan-600 dark:text-cyan-400 hover:underline">{story.title}</Link>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif mt-2 text-slate-900 dark:text-white">{chapter.title}</h1>
        </div>
        
        <div 
          className={`prose prose-lg dark:prose-invert max-w-none transition-all duration-300 ${preferences.fontFamily}`} 
          style={contentStyle}
          dangerouslySetInnerHTML={{ __html: chapter.content }}
        />

        <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-300 dark:border-slate-700">
          {prevChapter ? (
            <Link to={`/story/${story.id}/chapter/${prevChapter.id}`} className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              &larr; Chương trước
            </Link>
          ) : <div className="w-36"/>}
          {nextChapter ? (
            <Link to={`/story/${story.id}/chapter/${nextChapter.id}`} className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Chương tiếp &rarr;
            </Link>
          ) : <div className="w-36"/>}
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