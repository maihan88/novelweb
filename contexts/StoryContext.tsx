
import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { Story, Chapter, Volume } from '../types.ts';
import * as storyService from '../services/storyService.ts';
import { MOCK_STORIES } from '../data/stories.ts';

interface StoryContextType {
  stories: Story[];
  loading: boolean;
  error: string | null;
  getStoryById: (id: string) => Promise<Story | undefined>;
  addStory: (storyData: Omit<Story, 'id' | '_id' | 'volumes' | 'views' | 'createdAt' | 'lastUpdatedAt' | 'rating' | 'ratingsCount'>) => Promise<Story>;
  updateStory: (storyId: string, storyData: Partial<Omit<Story, 'id' | '_id' | 'volumes'>>) => Promise<Story>;
  deleteStory: (storyId: string) => Promise<void>;
  incrementView: (storyId: string) => Promise<void>;
  addRatingToStory: (storyId: string, rating: number) => Promise<void>;
  
  // Volume Management
  addVolume: (storyId: string, volumeTitle: string) => Promise<Volume>;
  updateVolume: (storyId: string, volumeId: string, newTitle: string) => Promise<Volume>;
  deleteVolume: (storyId: string, volumeId: string) => Promise<void>;

  // Chapter Management
  incrementChapterView: (storyId: string, chapterId: string) => Promise<void>;
  addChapterToVolume: (storyId: string, volumeId: string, chapterData: Omit<Chapter, 'id' | '_id' | 'createdAt' | 'views'>) => Promise<Chapter>;
  updateChapterInVolume: (storyId: string, volumeId: string, updatedChapterData: Omit<Chapter, 'createdAt'| 'views' | '_id'>) => Promise<Chapter>;
  deleteChapterFromVolume: (storyId: string, volumeId: string, chapterId: string) => Promise<void>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

const useMockData = true; // Set to false to use real API calls

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storyService.getAllStories();
      setStories(data);
    } catch (err: any) {
      console.warn("API call failed, falling back to mock data.", err.message);
      setError("Không thể kết nối tới máy chủ, đang sử dụng dữ liệu mẫu.");
      setStories(MOCK_STORIES);
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
        setStories(prev => {
            const exists = prev.some(s => s.id === id);
            if (exists) {
                return prev.map(s => s.id === id ? story : s);
            }
            return [...prev, story];
        });
        return story;
    } catch(err) {
        console.warn(`API call failed for getStoryById(${id}), falling back to mock data.`, err);
        const mockStory = MOCK_STORIES.find(s => s.id === id);
        if (mockStory) {
             setStories(prev => {
                const exists = prev.some(s => s.id === id);
                if (!exists) return [...prev, mockStory];
                return prev;
            });
        }
        return mockStory;
    }
  }, []);

  const incrementView = useCallback(async (storyId: string) => {
    try {
        await storyService.incrementView(storyId);
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, views: s.views + 1 } : s));
    } catch(err) {
        console.warn(`API call failed for incrementView(${storyId}), faking update.`, err);
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, views: s.views + 1 } : s));
    }
  }, []);
  
    const addRatingToStory = useCallback(async (storyId: string, rating: number) => {
    // In a real app, this would also be an API call.
    // For now, we just update the local state to show the change.
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
          console.warn(`API call failed for incrementChapterView(${chapterId}), faking update.`, err);
           setStories(prev => prev.map(s => s.id === storyId ? {
               ...s,
               volumes: s.volumes.map(v => ({
                   ...v,
                   chapters: v.chapters.map(c => c.id === chapterId ? {...c, views: c.views + 1} : c)
               }))
           } : s));
      }
  }, []);

  const addVolume = useCallback(async (storyId: string, volumeTitle: string) => {
    const newVolume = await storyService.addVolume(storyId, { title: volumeTitle });
    fetchStories();
    return newVolume;
  }, [fetchStories]);

  const updateVolume = useCallback(async (storyId: string, volumeId: string, newTitle: string) => {
    const updatedVolume = await storyService.updateVolume(storyId, volumeId, { title: newTitle });
    fetchStories();
    return updatedVolume;
  }, [fetchStories]);

  const deleteVolume = useCallback(async (storyId: string, volumeId: string) => {
    await storyService.deleteVolume(storyId, volumeId);
    fetchStories();
  }, [fetchStories]);

  const addChapterToVolume = useCallback(async (storyId: string, volumeId: string, chapterData: Omit<Chapter, 'id' | '_id' | 'createdAt' | 'views'>) => {
      const newChapter = await storyService.addChapter(storyId, volumeId, chapterData);
      fetchStories();
      return newChapter;
  }, [fetchStories]);
  
  const updateChapterInVolume = useCallback(async (storyId: string, volumeId: string, updatedChapterData: Omit<Chapter, 'createdAt' | 'views' | '_id'>) => {
    const updatedChapter = await storyService.updateChapter(storyId, volumeId, updatedChapterData.id, updatedChapterData);
    fetchStories();
    return updatedChapter;
  }, [fetchStories]);

  const deleteChapterFromVolume = useCallback(async (storyId: string, volumeId: string, chapterId: string) => {
    await storyService.deleteChapter(storyId, volumeId, chapterId);
    fetchStories();
  }, [fetchStories]);


  const value = { 
    stories, 
    loading, 
    error,
    getStoryById, 
    addStory, 
    updateStory, 
    deleteStory, 
    incrementView,
    addRatingToStory,
    incrementChapterView,
    addVolume, 
    updateVolume, 
    deleteVolume, 
    addChapterToVolume, 
    updateChapterInVolume, 
    deleteChapterFromVolume 
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
