import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Story, Chapter, ReaderPreferences, ReaderTheme } from '../types';
import { useStories } from '../contexts/StoryContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import * as storyService from '../services/storyService';
import { userService } from '../services/userService';
import ReaderControls from '../components/ReaderControls';
import CommentSection from '../components/CommentSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon, SunIcon, MoonIcon, ListBulletIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAudioReader, preprocessHtmlForAudio, AudioHighlightColor } from '../hooks/useAudioReader';

// --- ReadingProgressBar ---
const ReadingProgressBar: React.FC<{ progress: number }> = React.memo(({ progress }) => {
    return (
        <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-[60] pointer-events-none">
            <div
                className="h-1 bg-sukem-primary origin-left shadow-[0_0_10px_var(--color-sukem-primary)]"
                style={{ transform: `scaleX(${progress / 100})`, transition: 'transform 150ms ease-out', willChange: 'transform' }}
            />
        </div>
    );
});
ReadingProgressBar.displayName = 'ReadingProgressBar';

// --- FloatingNavBar ---
const FloatingNavBar: React.FC<{ story: Story; currentChapterId: string; prevChapter?: Chapter | null; nextChapter?: Chapter | null; isVisible: boolean; }> = ({ story, currentChapterId, prevChapter, nextChapter, isVisible }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value) navigate(`/story/${story.id}/chapter/${e.target.value}`);
    };

    const btnBaseClass = "p-2 rounded-full transition-all duration-200 flex items-center justify-center";
    const btnActive = "hover:bg-sukem-primary hover:text-white text-sukem-text active:scale-95";
    const btnDisabled = "opacity-30 cursor-not-allowed text-sukem-text-muted";

    return (
        <div className={`fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-500 ease-spring ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'}`}>
            <div className="pointer-events-auto flex items-center gap-1 sm:gap-3 px-3 py-2 bg-sukem-card/90 backdrop-blur-xl border border-sukem-border shadow-2xl rounded-full max-w-[95vw] sm:max-w-3xl transform transition-all">
                <Link to={`/story/${story.id}`} className={`${btnBaseClass} ${btnActive}`} title="Về trang truyện"><HomeIcon className="h-5 w-5" /></Link>
                <div className="w-px h-5 bg-sukem-border mx-1"></div>
                <Link to={prevChapter ? `/story/${story.id}/chapter/${prevChapter.id}` : '#'} className={`${btnBaseClass} ${prevChapter ? btnActive : btnDisabled}`} aria-disabled={!prevChapter}><ArrowLeftIcon className="h-5 w-5" /></Link>

                <div className="relative group max-w-[140px] sm:max-w-[200px]">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none"><ListBulletIcon className="h-4 w-4 text-sukem-text-muted" /></div>
                    <select value={currentChapterId} onChange={handleChapterSelect} className="w-full pl-8 pr-4 py-1.5 bg-transparent text-sm font-medium text-sukem-text border-none focus:ring-0 cursor-pointer appearance-none truncate text-center hover:text-sukem-primary transition-colors">
                        {story.volumes.map(volume => (
                            <optgroup label={volume.title} key={volume.id} className="bg-sukem-card text-sukem-text font-bold">
                                {volume.chapters.map(chap => (<option key={chap.id} value={chap.id} className="font-normal">{chap.title}</option>))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <Link to={nextChapter ? `/story/${story.id}/chapter/${nextChapter.id}` : '#'} className={`${btnBaseClass} ${nextChapter ? btnActive : btnDisabled}`} aria-disabled={!nextChapter}><ArrowRightIcon className="h-5 w-5" /></Link>
                <div className="w-px h-5 bg-sukem-border mx-1"></div>
                <button onClick={toggleTheme} className={`${btnBaseClass} ${theme === 'dark' ? 'text-amber-400 hover:bg-slate-700' : 'text-sukem-primary hover:bg-sukem-bg'}`}>
                    {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};

// --- THEME SETTINGS ---
const themeSpecificStyles: Record<ReaderTheme, { container: string; title: string; breadcrumb: string; breadcrumbActive: string; content: string; border: string; button: string; buttonHover: string; selectBg: string; selectBorder: string; }> = {
    ivory_classic: { container: 'bg-[#F8F4EC]', title: 'text-[#3A2F2A]', breadcrumb: 'text-[#3A2F2A]/70 hover:text-[#3A2F2A]', breadcrumbActive: 'text-[#3A2F2A]', content: 'text-[#3A2F2A]', border: 'border-[#3A2F2A]/10', button: 'border-[#3A2F2A]/20 text-[#3A2F2A] bg-transparent', buttonHover: 'hover:bg-[#3A2F2A]/5 hover:border-[#3A2F2A]/40', selectBg: 'bg-[#F8F4EC]', selectBorder: 'border-[#3A2F2A]/20' },
    soft_mint: { container: 'bg-[#EAF7F2]', title: 'text-[#263636]', breadcrumb: 'text-[#263636]/70 hover:text-[#263636]', breadcrumbActive: 'text-[#263636]', content: 'text-[#263636]', border: 'border-[#263636]/10', button: 'border-[#263636]/20 text-[#263636] bg-transparent', buttonHover: 'hover:bg-[#263636]/5 hover:border-[#263636]/40', selectBg: 'bg-[#EAF7F2]', selectBorder: 'border-[#263636]/20' },
    peach_dust: { container: 'bg-[#FFF1E6]', title: 'text-[#4A3F3A]', breadcrumb: 'text-[#4A3F3A]/70 hover:text-[#4A3F3A]', breadcrumbActive: 'text-[#4A3F3A]', content: 'text-[#4A3F3A]', border: 'border-[#4A3F3A]/10', button: 'border-[#4A3F3A]/20 text-[#4A3F3A] bg-transparent', buttonHover: 'hover:bg-[#4A3F3A]/5 hover:border-[#4A3F3A]/40', selectBg: 'bg-[#FFF1E6]', selectBorder: 'border-[#4A3F3A]/20' },
    light_lavender: { container: 'bg-[#F3F0FA]', title: 'text-[#2E2A3B]', breadcrumb: 'text-[#2E2A3B]/70 hover:text-[#2E2A3B]', breadcrumbActive: 'text-[#2E2A3B]', content: 'text-[#2E2A3B]', border: 'border-[#2E2A3B]/10', button: 'border-[#2E2A3B]/20 text-[#2E2A3B] bg-transparent', buttonHover: 'hover:bg-[#2E2A3B]/5 hover:border-[#2E2A3B]/40', selectBg: 'bg-[#F3F0FA]', selectBorder: 'border-[#2E2A3B]/20' },
    deep_blue_night: { container: 'bg-[#0F172A]', title: 'text-[#E2E8F0]', breadcrumb: 'text-[#E2E8F0]/70 hover:text-[#E2E8F0]', breadcrumbActive: 'text-[#E2E8F0]', content: 'text-[#E2E8F0]', border: 'border-[#E2E8F0]/10', button: 'border-[#E2E8F0]/20 text-[#E2E8F0] bg-transparent', buttonHover: 'hover:bg-[#E2E8F0]/5 hover:border-[#E2E8F0]/40', selectBg: 'bg-[#0F172A]', selectBorder: 'border-[#E2E8F0]/20' },
    forest_dark: { container: 'bg-[#0F1F1C]', title: 'text-[#F1EDE2]', breadcrumb: 'text-[#F1EDE2]/70 hover:text-[#F1EDE2]', breadcrumbActive: 'text-[#F1EDE2]', content: 'text-[#F1EDE2]', border: 'border-[#F1EDE2]/10', button: 'border-[#F1EDE2]/20 text-[#F1EDE2] bg-transparent', buttonHover: 'hover:bg-[#F1EDE2]/5 hover:border-[#F1EDE2]/40', selectBg: 'bg-[#0F1F1C]', selectBorder: 'border-[#F1EDE2]/20' },
};

const marginSettings: Record<number, { padding: string; maxWidth: string }> = {
    0: { padding: 'px-2 sm:px-4', maxWidth: 'max-w-none' },
    5: { padding: 'px-4 sm:px-6', maxWidth: 'max-w-5xl' },
    10: { padding: 'px-5 sm:px-8', maxWidth: 'max-w-4xl' },
    15: { padding: 'px-6 sm:px-12', maxWidth: 'max-w-3xl' },
    20: { padding: 'px-8 sm:px-16', maxWidth: 'max-w-2xl' }
};

const ReaderPage: React.FC = () => {
    const { storyId, chapterId } = useParams<{ storyId: string, chapterId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { getStoryById, incrementChapterView } = useStories();
    const { bookmarks, updateBookmark } = useUserPreferences();
    const { currentUser } = useAuth();

    const [story, setStory] = useState<Story | null>(null);
    const [currentChapterWithContent, setCurrentChapterWithContent] = useState<Chapter | null>(null);
    const [loadingStory, setLoadingStory] = useState(true);
    const [loadingChapter, setLoadingChapter] = useState(false);

    const [preferences, setPreferences] = useLocalStorage<ReaderPreferences>('readerPreferences', {
        fontSize: 18, fontFamily: 'font-reader-lora', lineHeight: 1.7, margin: 10, theme: 'ivory_classic', textAlign: 'text-justify'
    });

    const [scrollPercent, setScrollPercent] = useState(0);
    const progressRef = useRef(0);
    const viewIncrementedRef = useRef(false);
    const readerContentRef = useRef<HTMLDivElement>(null);
    const [isFloatingNavVisible, setIsFloatingNavVisible] = useState(false);
    const lastTap = useRef(0);

    // ✅ FIX BUG #1: Dùng ref để track trạng thái auto-play, tránh race condition với location.state
    // Lý do: Nếu dùng location.state, khi navigate() được gọi để clear state bên trong effect,
    // nó sẽ kích hoạt effect chạy lại và cleanup function sẽ hủy timer trước khi audio.start được gọi.
    const autoPlayNextRef = useRef(false);

    const updateBookmarkRef = useRef(updateBookmark);
    const currentUserRef = useRef(currentUser);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentTitlesRef = useRef<{ chapter: string; volume: string }>({ chapter: '', volume: '' });

    useEffect(() => { updateBookmarkRef.current = updateBookmark; });
    useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

    const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);

    // --- Navigation: prev/next chapter ---
    const { prevChapter, nextChapter } = useMemo(() => {
        if (!story || !chapterId) return { prevChapter: null, nextChapter: null };
        const allChapters = story.volumes.flatMap(v => v.chapters);
        const index = allChapters.findIndex(c => c.id === chapterId);
        if (index === -1) return { prevChapter: null, nextChapter: null };
        return { prevChapter: index > 0 ? allChapters[index - 1] : null, nextChapter: index < allChapters.length - 1 ? allChapters[index + 1] : null };
    }, [story, chapterId]);

    const nextChapterRef = useRef(nextChapter);
    useEffect(() => { nextChapterRef.current = nextChapter; }, [nextChapter]);

    // --- Cleaned content ---
    const cleanedContent = useMemo(() => {
        if (!currentChapterWithContent?.content) return '';
        return currentChapterWithContent.content.replace(/line-height:[^;"]*;/g, '');
    }, [currentChapterWithContent?.content]);

    // --- Is Raw chapter? ---
    const isRawChapter = useMemo(() => Boolean(currentChapterWithContent?.isRaw), [currentChapterWithContent]);

    // --- Audio: pre-process HTML to inject spans (done once per chapter, in memo) ---
    const audioHtml = useMemo(() => {
        if (!currentChapterWithContent || isRawChapter) {
            return { titleSentences: [], contentSentences: [], wrappedHtml: cleanedContent, totalSentences: 0 };
        }
        return preprocessHtmlForAudio(currentChapterWithContent.title, cleanedContent);
    }, [currentChapterWithContent, isRawChapter, cleanedContent]);

    // --- Audio voice state ---
    const [audioVoiceURI, setAudioVoiceURI] = useState('');

    // ✅ FIX BUG #1: handleAudioChapterEnd không còn truyền state vào navigate
    // Thay vào đó, set ref trước khi navigate để báo hiệu cần auto-play ở trang mới
    const handleAudioChapterEnd = useCallback(() => {
        const next = nextChapterRef.current;
        if (next && storyId) {
            // Đánh dấu cần auto-play trước khi navigate, tránh mất state do React batching
            autoPlayNextRef.current = true;
            navigate(`/story/${storyId}/chapter/${next.id}`);
        }
    }, [navigate, storyId]);

    // --- Audio reader hook ---
    const audio = useAudioReader({
        titleSentences: audioHtml.titleSentences,
        contentSentences: audioHtml.contentSentences,
        voiceURI: audioVoiceURI,
        onChapterEnd: handleAudioChapterEnd,
    });

    // Dừng audio khi chuyển chương
    useEffect(() => {
        audio.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chapterId]);

    // ✅ FIX BUG #1: Effect auto-play được viết lại hoàn toàn
    // - Không còn phụ thuộc vào location.state (tránh race condition)
    // - Sử dụng autoPlayNextRef để track intent
    // - navigate() để clear state KHÔNG còn ở đây nữa → không gây re-run effect
    useEffect(() => {
        // Chỉ chạy nếu có yêu cầu auto-play từ chương trước
        if (!autoPlayNextRef.current) return;

        // Chờ content và audio sentences load xong mới play
        if (!currentChapterWithContent || audioHtml.totalSentences === 0 || isRawChapter) return;

        // Reset ref ngay lập tức để tránh play nhiều lần nếu effect re-run
        autoPlayNextRef.current = false;

        // Delay 800ms để đảm bảo DOM đã được update với data-aidx spans
        const timer = setTimeout(() => {
            audio.start(0);
        }, 800);

        return () => clearTimeout(timer);
    }, [currentChapterWithContent, audioHtml.totalSentences, isRawChapter, audio.start]);

    // 1. Fetch Story
    useEffect(() => {
        if (!storyId) return;
        if (!story || story.id !== storyId) {
            setLoadingStory(true);
            getStoryById(storyId).then(fetchedStory => {
                setStory(fetchedStory || null);
                setLoadingStory(false);
            }).catch(() => setLoadingStory(false));
        }
    }, [storyId, story, getStoryById]);

    // 2. Fetch Content
    useEffect(() => {
        const loadContent = async () => {
            if (!storyId || !chapterId) return;
            setLoadingChapter(true);
            setCurrentChapterWithContent(null);
            try {
                const fullChapter = await storyService.getChapterContent(storyId, chapterId);
                setCurrentChapterWithContent(fullChapter);
            } catch (error) { console.error("Failed to load content", error); }
            finally { setLoadingChapter(false); }
        };
        loadContent();
    }, [storyId, chapterId]);

    useEffect(() => {
        if (story && currentChapterWithContent && currentChapterWithContent.id === chapterId) {
            let vTitle = '';
            const vol = story.volumes.find(v => v.chapters.some(c => c.id === chapterId));
            if (vol) vTitle = vol.title;
            currentTitlesRef.current = { chapter: currentChapterWithContent.title, volume: vTitle };
        }
    }, [story, currentChapterWithContent, chapterId]);

    // 3. Scroll Restoration & View Increment
    useEffect(() => {
        if (!currentChapterWithContent) return;
        viewIncrementedRef.current = false;

        const savedBookmark = storyId ? bookmarks[storyId] : null;

        if (savedBookmark && savedBookmark.chapterId === chapterId) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (readerContentRef.current) {
                        const contentTop = readerContentRef.current.offsetTop;
                        const contentHeight = readerContentRef.current.scrollHeight;
                        const viewportHeight = window.innerHeight;

                        if (contentHeight > viewportHeight) {
                            const maxScrollInContent = contentHeight - viewportHeight;
                            const targetScrollInContent = (maxScrollInContent * savedBookmark.progress) / 100;
                            const targetScrollPosition = contentTop + targetScrollInContent;
                            window.scrollTo({ top: targetScrollPosition, behavior: 'auto' });
                            progressRef.current = savedBookmark.progress;
                            setScrollPercent(savedBookmark.progress);
                        }
                    }
                }, 150);
            });
        } else {
            window.scrollTo(0, 0);
            progressRef.current = 0;
            setScrollPercent(0);
        }
    }, [storyId, chapterId, currentChapterWithContent]);

    // 4. Scroll Listener & Sync Logic
    useEffect(() => {
        if (!story || !storyId || !chapterId) return;

        const preventAction = (e: Event) => e.preventDefault();
        const contentEl = readerContentRef.current;
        if (contentEl) {
            contentEl.addEventListener('contextmenu', preventAction);
            contentEl.addEventListener('copy', preventAction);
        }

        const debouncedSave = (newProgress: number) => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = setTimeout(async () => {
                const finalProgress = Math.round(newProgress >= 99 ? 100 : newProgress);
                const { chapter: cTitle, volume: vTitle } = currentTitlesRef.current;
                updateBookmarkRef.current(storyId, chapterId, finalProgress, cTitle, vTitle);
                if (currentUserRef.current) {
                    try { await userService.syncReadingProgress(storyId, chapterId, finalProgress, cTitle, vTitle); }
                    catch (err) { console.error('Lỗi sync:', err); }
                }
            }, 1000);
        };

        const handleScroll = () => {
            const contentElement = readerContentRef.current;
            if (!contentElement) return;

            const contentTop = contentElement.offsetTop;
            const contentHeight = contentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const currentScrollTop = window.pageYOffset;

            let percentage = 0;
            if (contentHeight <= viewportHeight) {
                percentage = 100;
            } else {
                const scrollStartInContent = Math.max(0, currentScrollTop - contentTop);
                const maxScrollInContent = contentHeight - viewportHeight;
                percentage = maxScrollInContent > 0 ? Math.min(100, (scrollStartInContent / maxScrollInContent) * 100) : 100;
            }

            if (percentage >= 50 && !viewIncrementedRef.current && !isAdmin) {
                incrementChapterView(storyId, chapterId);
                viewIncrementedRef.current = true;
            }

            if (Math.abs(percentage - progressRef.current) > 1) {
                progressRef.current = percentage;
                setScrollPercent(percentage);
                debouncedSave(percentage);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (contentEl) {
                contentEl.removeEventListener('contextmenu', preventAction);
                contentEl.removeEventListener('copy', preventAction);
            }
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            if (storyId && chapterId) {
                const finalProgress = Math.round(progressRef.current >= 99 ? 100 : progressRef.current);
                const { chapter: cTitle, volume: vTitle } = currentTitlesRef.current;
                updateBookmarkRef.current(storyId, chapterId, finalProgress, cTitle, vTitle);
                if (currentUserRef.current) {
                    userService.syncReadingProgress(storyId, chapterId, finalProgress, cTitle, vTitle).catch(console.error);
                }
            }
        };
    }, [story, storyId, chapterId, isAdmin, incrementChapterView, currentChapterWithContent]);

    const handleTapZoneClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (window.getSelection()?.toString() || (event.target as HTMLElement).closest('a, button, select, [data-control-button]')) return;
        const now = Date.now();
        if (now - lastTap.current < 400) setIsFloatingNavVisible(p => !p);
        lastTap.current = now;
    };

    const contentStyle = useMemo(() => ({ fontSize: `${preferences.fontSize}px`, lineHeight: preferences.lineHeight }), [preferences.fontSize, preferences.lineHeight]);
    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => { if (e.target.value) navigate(`/story/${storyId}/chapter/${e.target.value}`); };

    if (loadingStory || (loadingChapter && !currentChapterWithContent)) return <div className="flex justify-center items-center h-screen bg-sukem-bg"><LoadingSpinner /></div>;
    if (!story || !currentChapterWithContent) return <div className="flex justify-center items-center h-screen bg-sukem-bg text-sukem-primary">Không tìm thấy truyện hoặc chương.</div>;

    const themeStyle = themeSpecificStyles[preferences.theme] || themeSpecificStyles.ivory_classic;
    const currentMarginSetting = marginSettings[preferences.margin] || marginSettings[10];
    const pageClasses = `min-h-full transition-colors duration-300 ${themeStyle.container}`;
    const contentContainerClasses = `mx-auto animate-fade-in py-20 min-h-screen ${currentMarginSetting.padding} ${currentMarginSetting.maxWidth}`;

    return (
        <div className={pageClasses}>
            <ReadingProgressBar progress={scrollPercent} />
            <FloatingNavBar story={story} currentChapterId={chapterId!} prevChapter={prevChapter} nextChapter={nextChapter} isVisible={isFloatingNavVisible} />

            <div onClick={handleTapZoneClick} className={contentContainerClasses}>
                <div className="text-center mb-12">
                    <nav className="flex justify-center items-center gap-2 text-sm sm:text-base font-medium mb-3">
                        <Link to={`/story/${story.id}`} className={`transition-colors ${themeStyle.breadcrumb}`}>{story.title}</Link>
                    </nav>
                    <h1
                        data-reader-title
                        className={`text-3xl sm:text-4xl md:text-5xl font-bold font-serif leading-tight px-2 ${themeStyle.title}`}
                    >
                        {currentChapterWithContent.title}
                    </h1>
                </div>

                <div
                    ref={readerContentRef}
                    className={`max-w-none transition-all duration-300 ${preferences.fontFamily} ${preferences.textAlign} chapter-content prevent-copy ${themeStyle.content}`}
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: isRawChapter ? cleanedContent : audioHtml.wrappedHtml }}
                />

                <div className={`mt-16 pt-10 border-t ${themeStyle.border}`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                        {prevChapter ? (
                            <Link to={`/story/${story.id}/chapter/${prevChapter.id}`} className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow active:scale-95 ${themeStyle.button} ${themeStyle.buttonHover}`}>
                                <ArrowLeftIcon className="h-5 w-5" /> <span>Chương trước</span>
                            </Link>
                        ) : (
                            <div className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-lg font-medium opacity-50 cursor-not-allowed ${themeStyle.button}`}><ArrowLeftIcon className="h-5 w-5" /> <span>Chương trước</span></div>
                        )}
                        <div className="flex-grow sm:flex-grow-0 sm:min-w-[250px]">
                            <select value={chapterId} onChange={handleChapterSelect} className={`w-full px-4 py-3 border rounded-lg transition appearance-none text-center cursor-pointer font-medium focus:ring-2 focus:ring-opacity-50 focus:ring-sukem-accent focus:outline-none ${themeStyle.selectBg} ${themeStyle.selectBorder} ${themeStyle.content}`}>
                                {story.volumes.map(volume => (
                                    <optgroup label={volume.title} key={volume.id} className={themeStyle.selectBg}>
                                        {volume.chapters.map(chap => (<option key={chap.id} value={chap.id} className="font-normal py-1">{chap.title}</option>))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        {nextChapter ? (
                            <Link to={`/story/${story.id}/chapter/${nextChapter.id}`} className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow active:scale-95 ${themeStyle.button} ${themeStyle.buttonHover}`}>
                                <span>Chương tiếp</span> <ArrowRightIcon className="h-5 w-5" />
                            </Link>
                        ) : (
                            <div className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-lg font-medium opacity-50 cursor-not-allowed ${themeStyle.button}`}><span>Chương tiếp</span> <ArrowRightIcon className="h-5 w-5" /></div>
                        )}
                    </div>
                </div>
                {storyId && chapterId && <CommentSection storyId={storyId} chapterId={chapterId} />}
            </div>

            <ReaderControls
                preferences={preferences}
                setPreferences={setPreferences}
                audioIsPlaying={audio.isPlaying}
                audioIsPaused={audio.isPaused}
                audioRate={audio.rate}
                audioPitch={audio.pitch}
                audioHighlightColor={audio.highlightColor}
                audioVoiceURI={audioVoiceURI}
                onAudioPlay={() => {
                    if (!isRawChapter) audio.start(0);
                }}
                onAudioPause={audio.pause}
                onAudioResume={audio.resume}
                onAudioStop={audio.stop}
                onAudioRateChange={audio.setRate}
                onAudioPitchChange={audio.setPitch}
                onAudioHighlightColorChange={audio.setHighlightColor}
                onAudioVoiceChange={setAudioVoiceURI}
            />
        </div>
    );
};

export default ReaderPage;