
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.tsx';
import { Story, Chapter, Volume } from '../types.ts';
import { MOCK_STORIES } from '../data/stories.ts';

interface StoryContextType {
  stories: Story[];
  getStory: (id: string) => Story | undefined;
  addStory: (storyData: Omit<Story, 'id'|'volumes'|'views'|'createdAt'|'lastUpdatedAt'|'rating'|'ratingsCount'>) => Story;
  updateStory: (storyId: string, storyData: Partial<Omit<Story, 'id' | 'volumes'>>) => void;
  deleteStory: (storyId: string) => void;
  incrementView: (storyId: string) => void;
  rateStory: (storyId: string, newRating: number, previousRating?: number) => void;
  
  // Volume Management
  addVolume: (storyId: string, volumeTitle: string) => void;
  updateVolume: (storyId: string, volumeId: string, newTitle: string) => void;
  deleteVolume: (storyId: string, volumeId: string) => void;

  // Chapter Management
  incrementChapterView: (storyId: string, chapterId: string) => void;
  addChapterToVolume: (storyId: string, volumeId: string, chapterData: Omit<Chapter, 'id' | 'createdAt' | 'views'>) => void;
  updateChapterInVolume: (storyId: string, volumeId: string, updatedChapterData: Omit<Chapter, 'createdAt'| 'views'>) => void;
  deleteChapterFromVolume: (storyId: string, volumeId: string, chapterId: string) => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stories, setStories] = useLocalStorage<Story[]>('stories', MOCK_STORIES);

  const getStory = useCallback((id: string) => stories.find(s => s.id === id), [stories]);

  const incrementView = useCallback((storyId: string) => {
    setStories(prevStories => prevStories.map(s => (s.id === storyId ? { ...s, views: (s.views || 0) + 1 } : s)));
  }, [setStories]);

  const addStory = useCallback((storyData: Omit<Story, 'id'|'volumes'|'views'|'createdAt'|'lastUpdatedAt'|'rating'|'ratingsCount'>): Story => {
    const now = new Date().toISOString();
    const newStory: Story = {
      ...storyData,
      id: storyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now()}`,
      views: 0,
      rating: 0,
      ratingsCount: 0,
      volumes: [],
      createdAt: now,
      lastUpdatedAt: now,
    };
    setStories(prevStories => [newStory, ...prevStories]);
    return newStory;
  }, [setStories]);
  
  const updateStory = useCallback((storyId: string, storyData: Partial<Omit<Story, 'id' | 'volumes'>>) => {
      setStories(prevStories => prevStories.map(s => s.id === storyId ? {...s, ...storyData, id: s.id, lastUpdatedAt: new Date().toISOString()} : s));
  }, [setStories]);
  
  const deleteStory = useCallback((storyId: string) => {
      setStories(prevStories => prevStories.filter(s => s.id !== storyId));
  }, [setStories]);
  
  const updateStoryWithTimestamp = useCallback((storyId: string, updateFn: (story: Story) => Story) => {
      setStories(prevStories => prevStories.map(s => {
          if (s.id === storyId) {
              const updatedStory = updateFn(s);
              return { ...updatedStory, lastUpdatedAt: new Date().toISOString() };
          }
          return s;
      }));
  }, [setStories]);

  const rateStory = useCallback((storyId: string, newRating: number, previousRating?: number) => {
    setStories(prevStories => prevStories.map(s => {
        if (s.id === storyId) {
            const isNewVote = previousRating === undefined;
            const currentTotalRating = s.rating * s.ratingsCount;
            const newRatingsCount = isNewVote ? s.ratingsCount + 1 : s.ratingsCount;
            const newTotalRating = isNewVote ? currentTotalRating + newRating : currentTotalRating - previousRating + newRating;
            const newAverageRating = newRatingsCount > 0 ? newTotalRating / newRatingsCount : 0;

            return {
                ...s,
                rating: newAverageRating,
                ratingsCount: newRatingsCount
            };
        }
        return s;
    }));
  }, [setStories]);
  
  const incrementChapterView = useCallback((storyId: string, chapterId: string) => {
    setStories(prevStories => prevStories.map(s => {
      if (s.id === storyId) {
        return {
          ...s,
          volumes: s.volumes.map(v => ({
            ...v,
            chapters: v.chapters.map(c => c.id === chapterId ? {...c, views: (c.views || 0) + 1} : c)
          }))
        };
      }
      return s;
    }));
  }, [setStories]);

  const addVolume = useCallback((storyId: string, volumeTitle: string) => {
    const newVolume: Volume = {
        id: `vol-${Date.now()}`,
        title: volumeTitle,
        chapters: []
    };
    updateStoryWithTimestamp(storyId, story => ({
        ...story,
        volumes: [...story.volumes, newVolume]
    }));
  }, [updateStoryWithTimestamp]);

  const updateVolume = useCallback((storyId: string, volumeId: string, newTitle: string) => {
    updateStoryWithTimestamp(storyId, story => ({
        ...story,
        volumes: story.volumes.map(v => v.id === volumeId ? {...v, title: newTitle} : v)
    }));
  }, [updateStoryWithTimestamp]);

  const deleteVolume = useCallback((storyId: string, volumeId: string) => {
    updateStoryWithTimestamp(storyId, story => ({
        ...story,
        volumes: story.volumes.filter(v => v.id !== volumeId)
    }));
  }, [updateStoryWithTimestamp]);

  const addChapterToVolume = useCallback((storyId: string, volumeId: string, chapterData: Omit<Chapter, 'id' | 'createdAt' | 'views'>) => {
      const newChapter: Chapter = {
          ...chapterData,
          id: `chapter-${Date.now()}`,
          createdAt: new Date().toISOString(),
          views: 0
      };
      updateStoryWithTimestamp(storyId, story => ({
          ...story,
          volumes: story.volumes.map(v => {
              if (v.id === volumeId) {
                  return {...v, chapters: [...v.chapters, newChapter]};
              }
              return v;
          })
      }));
  }, [updateStoryWithTimestamp]);
  
  const updateChapterInVolume = useCallback((storyId: string, volumeId: string, updatedChapterData: Omit<Chapter, 'createdAt' | 'views'>) => {
    updateStoryWithTimestamp(storyId, story => ({
        ...story,
        volumes: story.volumes.map(v => {
            if (v.id === volumeId) {
                return {
                    ...v, 
                    chapters: v.chapters.map(c => c.id === updatedChapterData.id ? {...c, ...updatedChapterData, views: c.views} : c)
                };
            }
            return v;
        })
    }));
  }, [updateStoryWithTimestamp]);

  const deleteChapterFromVolume = useCallback((storyId: string, volumeId: string, chapterId: string) => {
    updateStoryWithTimestamp(storyId, story => ({
        ...story,
        volumes: story.volumes.map(v => {
            if (v.id === volumeId) {
                return {...v, chapters: v.chapters.filter(c => c.id !== chapterId)};
            }
            return v;
        })
    }));
  }, [updateStoryWithTimestamp]);

  const value = { stories, getStory, addStory, updateStory, deleteStory, incrementView, rateStory, incrementChapterView, addVolume, updateVolume, deleteVolume, addChapterToVolume, updateChapterInVolume, deleteChapterFromVolume };

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