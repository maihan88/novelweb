import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { Story, Chapter, Volume } from '../types.ts';
import * as storyService from '../services/storyService.ts';

interface StoryContextType {
  stories: Story[];
  loading: boolean;
  error: string | null;
  getStoryById: (id: string) => Promise<Story | undefined>;
  addStory: (storyData: Omit<Story, 'id' | '_id' | 'volumes' | 'views' | 'createdAt' | 'lastUpdatedAt' | 'rating' | 'ratingsCount'>) => Promise<Story>;
  updateStory: (storyId: string, storyData: Partial<Omit<Story, 'id' | '_id' | 'volumes'>>) => Promise<Story>;
  deleteStory: (storyId: string) => Promise<void>;
  addRatingToStory: (storyId: string, rating: number) => Promise<void>;
  
  // Volume Management
  addVolume: (storyId: string, volumeTitle: string) => Promise<Volume>;
  updateVolume: (storyId: string, volumeId: string, newTitle: string) => Promise<Volume>;
  deleteVolume: (storyId: string, volumeId: string) => Promise<void>;
  reorderVolumesInStory: (storyId: string, orderedVolumeIds: string[]) => Promise<void>; // <--- Thêm mới

  // Chapter Management
  incrementChapterView: (storyId: string, chapterId: string) => Promise<void>;
  addChapterToVolume: (storyId: string, volumeId: string, chapterData: Omit<Chapter, 'id' | '_id' | 'createdAt' | 'views'>) => Promise<Chapter>;
  updateChapterInVolume: (storyId: string, volumeId: string, updatedChapterData: Omit<Chapter, 'createdAt'| 'views' | '_id'>) => Promise<Chapter>;
  deleteChapterFromVolume: (storyId: string, volumeId: string, chapterId: string) => Promise<void>;
  reorderChaptersInVolume: (storyId: string, volumeId: string, orderedChapterIds: string[]) => Promise<void>; // <--- Thêm mới
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stories, setStories] = useState<Story[]>([]); // Khởi tạo với mảng rỗng
  const [loading, setLoading] = useState<boolean>(true); // Bắt đầu với loading = true
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storyService.getAllStories();
      setStories(data);
    } catch (err: any) {
      setError("Không thể tải danh sách truyện. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const getStoryById = useCallback(async (id: string): Promise<Story | undefined> => {
    try {
        const story = await storyService.getStoryById(id);
        // Cập nhật lại danh sách truyện nếu truyện đó chưa có trong state
        setStories(prev => {
            const exists = prev.some(s => s.id === id);
            if (exists) {
                return prev.map(s => s.id === id ? story : s);
            }
            return [...prev, story];
        });
        return story;
    } catch(err) {
        console.error(`Lỗi khi lấy truyện có id ${id}:`, err);
        setError(`Không thể tải chi tiết truyện.`);
        return undefined;
    }
  }, []);
  
  const addRatingToStory = useCallback(async (storyId: string, rating: number) => {
    setStories(prevStories => prevStories.map(story => {
      if (story.id === storyId) {
        const newRatingsCount = story.ratingsCount + 1;
        const newTotalRating = story.rating * story.ratingsCount + rating;
        const newAverageRating = newTotalRating / newRatingsCount;
        return { 
          ...story, 
          ratingsCount: newRatingsCount, 
          rating: newAverageRating 
        };
      }
      return story;
    }));
  }, []);
  
  const addStory = useCallback(async (storyData: Omit<Story, 'id' | '_id' | 'volumes'|'views'|'createdAt'|'lastUpdatedAt'|'rating'|'ratingsCount'>): Promise<Story> => {
    const newStory = await storyService.createStory(storyData);
    setStories(prev => [newStory, ...prev]);
    return newStory;
  }, []);
  
  const updateStory = useCallback(async (storyId: string, storyData: Partial<Omit<Story, 'id' | '_id' | 'volumes'>>): Promise<Story> => {
      const updatedStory = await storyService.updateStory(storyId, storyData);
      setStories(prev => prev.map(s => s.id === storyId ? updatedStory : s));
      return updatedStory;
  }, []);
  
  const deleteStory = useCallback(async (storyId: string) => {
      await storyService.deleteStory(storyId);
      setStories(prev => prev.filter(s => s.id !== storyId));
  }, []);

  const incrementChapterView = useCallback(async (storyId: string, chapterId: string) => {
      try {
          await storyService.incrementChapterView(storyId, chapterId);
           setStories(prev => prev.map(s => s.id === storyId ? {
               ...s,
               volumes: s.volumes.map(v => ({
                   ...v,
                   chapters: v.chapters.map(c => c.id === chapterId ? {...c, views: c.views + 1} : c)
               }))
           } : s));
      } catch (err) {
          console.warn(`API call failed for incrementChapterView(${chapterId})`, err);
      }
  }, []);

  // Các hàm quản lý Volume và Chapter không cần thay đổi
  const addVolume = useCallback(async (storyId: string, volumeTitle: string) => {
    const newVolume = await storyService.addVolume(storyId, { title: volumeTitle });
    await fetchStories(); // Tải lại để đảm bảo dữ liệu đồng bộ
    return newVolume;
  }, [fetchStories]);

  const updateVolume = useCallback(async (storyId: string, volumeId: string, newTitle: string) => {
    const updatedVolume = await storyService.updateVolume(storyId, volumeId, { title: newTitle });
    await fetchStories();
    return updatedVolume;
  }, [fetchStories]);

  const deleteVolume = useCallback(async (storyId: string, volumeId: string) => {
    await storyService.deleteVolume(storyId, volumeId);
    await fetchStories();
  }, [fetchStories]);

    const reorderVolumesInStory = useCallback(async (storyId: string, orderedVolumeIds: string[]) => {
      // Cập nhật state ngay lập tức để UI mượt
      setStories(prev => prev.map(s => {
          if (s.id === storyId) {
              const reorderedVolumes = orderedVolumeIds.map(id => s.volumes.find(v => v.id === id)).filter((v): v is Volume => !!v);
              return { ...s, volumes: reorderedVolumes };
          }
          return s;
      }));
      // Gọi API để lưu thay đổi
      try {
          await storyService.reorderVolumes(storyId, orderedVolumeIds);
      } catch (err) {
          console.error("Lỗi sắp xếp tập, khôi phục lại trạng thái cũ.", err);
          fetchStories(); // Tải lại để đảm bảo đồng bộ nếu có lỗi
      }
  }, [fetchStories]);

  const addChapterToVolume = useCallback(async (storyId: string, volumeId: string, chapterData: Omit<Chapter, 'id' | '_id' | 'createdAt' | 'views'>) => {
      const newChapter = await storyService.addChapter(storyId, volumeId, chapterData);
      await fetchStories();
      return newChapter;
  }, [fetchStories]);
  
  const updateChapterInVolume = useCallback(async (storyId: string, volumeId: string, updatedChapterData: Omit<Chapter, 'createdAt' | 'views' | '_id'>) => {
    const updatedChapter = await storyService.updateChapter(storyId, volumeId, updatedChapterData.id, updatedChapterData);
    await fetchStories();
    return updatedChapter;
  }, [fetchStories]);

  const deleteChapterFromVolume = useCallback(async (storyId: string, volumeId: string, chapterId: string) => {
    await storyService.deleteChapter(storyId, volumeId, chapterId);
    await fetchStories();
  }, [fetchStories]);

    const reorderChaptersInVolume = useCallback(async (storyId: string, volumeId: string, orderedChapterIds: string[]) => {
      // Cập nhật state
      setStories(prev => prev.map(s => {
          if (s.id === storyId) {
              return {
                  ...s,
                  volumes: s.volumes.map(v => {
                      if (v.id === volumeId) {
                          const reorderedChapters = orderedChapterIds.map(id => v.chapters.find(c => c.id === id)).filter((c): c is Chapter => !!c);
                          return { ...v, chapters: reorderedChapters };
                      }
                      return v;
                  })
              };
          }
          return s;
      }));
      // Gọi API
      try {
          await storyService.reorderChapters(storyId, volumeId, orderedChapterIds);
      } catch (err) {
          console.error("Lỗi sắp xếp chương, khôi phục lại trạng thái cũ.", err);
          fetchStories();
      }
  }, [fetchStories]);

  const value = { 
    stories, 
    loading, 
    error,
    getStoryById, 
    addStory, 
    updateStory, 
    deleteStory, 
    addRatingToStory,
    incrementChapterView,
    addVolume, 
    updateVolume, 
    deleteVolume, 
    addChapterToVolume, 
    updateChapterInVolume, 
    deleteChapterFromVolume,
    reorderVolumesInStory,
    reorderChaptersInVolume,
  };

  return (
    <StoryContext.Provider value={value}>
        {children}
    </StoryContext.Provider>
  );
};

export const useStories = () => {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoryProvider');
  }
  return context;
};
