// contexts/StoryContext.tsx

import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { Story, Chapter, Volume } from '../types.ts';
import { useAuth } from './AuthContext.tsx';

// --- (Cải thiện) Định nghĩa kiểu dữ liệu cho response từ API phân trang ---
interface PaginatedStoriesResponse {
  stories: Story[];
  currentPage: number;
  totalPages: number;
}

// --- Interface định nghĩa các hàm sẽ có trong context ---
interface StoryContextType {
  stories: Story[];
  loading: boolean;
  error: string | null;
  getStory: (id: string) => Story | undefined;
  
  // Story CRUD
  addStory: (storyData: Omit<Story, 'id' | 'volumes' | 'views' | 'createdAt' | 'lastUpdatedAt' | 'rating' | 'ratingsCount'>) => Promise<Story>;
  updateStory: (storyId: string, storyData: Partial<Omit<Story, 'id' | 'volumes'>>) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  
  // Volume CRUD
  addVolume: (storyId: string, volumeTitle: string) => Promise<void>;
  deleteVolume: (storyId: string, volumeId: string) => Promise<void>;

  // Chapter CRUD
  addChapterToVolume: (storyId: string, volumeId: string, chapterData: Omit<Chapter, 'id' | 'createdAt' | 'views'>) => Promise<void>;
  updateChapterInVolume: (storyId: string, volumeId: string, chapterId: string, chapterData: Partial<Chapter>) => Promise<void>;
  deleteChapterFromVolume: (storyId: string, volumeId: string, chapterId: string) => Promise<void>;
  
  // Các hàm tương tác khác
  incrementView: (storyId: string) => void;
  rateStory: (storyId: string, newRating: number, previousRating?: number) => void;
  incrementChapterView: (storyId: string, chapterId: string) => void;
}

export const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const API_BASE_URL = 'http://localhost:3001/api';

  // --- Fetch initial data ---
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/stories`);
        if (!response.ok) throw new Error('Failed to fetch stories');
        
        const result: PaginatedStoriesResponse = await response.json();
        setStories(result.stories);

        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  const getStory = useCallback((id: string) => stories.find(s => s.id === id), [stories]);

  // --- HÀM TẠO HEADERS CÓ TOKEN ---
  const getAuthHeaders = useCallback(() => {
    if (!token) return { 'Content-Type': 'application/json' };
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
  }, [token]);

  // --- Story CRUD Functions ---
  const addStory = useCallback(async (storyData) => {
    const response = await fetch(`${API_BASE_URL}/stories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(storyData),
    });
    if (!response.ok) throw new Error('Failed to add story');
    const newStoryFromServer: Story = await response.json();
    setStories(prev => [...prev, newStoryFromServer]);
    return newStoryFromServer;
  }, [getAuthHeaders]);

  const updateStory = useCallback(async (storyId, storyData) => {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(storyData),
    });
    if (!response.ok) throw new Error('Failed to update story');
    const updatedStory: Story = await response.json();
    setStories(prev => prev.map(s => s.id === storyId ? updatedStory : s));
  }, [getAuthHeaders]);

  const deleteStory = useCallback(async (storyId) => {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete story');
    setStories(prev => prev.filter(s => s.id !== storyId));
  }, [getAuthHeaders]);

  // --- Volume CRUD Functions ---
  const addVolume = useCallback(async (storyId, volumeTitle) => {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}/volumes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title: volumeTitle }),
    });
    if (!response.ok) throw new Error('Failed to add volume');
    const newVolume: Volume = await response.json();
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, volumes: [...s.volumes, newVolume] } : s));
  }, [getAuthHeaders]);

  const deleteVolume = useCallback(async (storyId, volumeId) => {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}/volumes/${volumeId}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete volume');
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, volumes: s.volumes.filter(v => v.id !== volumeId) } : s));
  }, [getAuthHeaders]);

  // --- Chapter CRUD Functions ---
  const addChapterToVolume = useCallback(async (storyId, volumeId, chapterData) => {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}/volumes/${volumeId}/chapters`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(chapterData),
    });
    if (!response.ok) throw new Error('Failed to add chapter');
    const newChapter: Chapter = await response.json();
    setStories(prev => prev.map(s => s.id === storyId ? {
        ...s,
        volumes: s.volumes.map(v => v.id === volumeId ? { ...v, chapters: [...v.chapters, newChapter] } : v)
    } : s));
  }, [getAuthHeaders]);

  const updateChapterInVolume = useCallback(async (storyId, volumeId, chapterId, chapterData) => {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(chapterData),
    });
    if (!response.ok) throw new Error('Failed to update chapter');
    const updatedChapter: Chapter = await response.json();
    setStories(prev => prev.map(s => s.id === storyId ? {
        ...s,
        volumes: s.volumes.map(v => v.id === volumeId ? {
            ...v,
            chapters: v.chapters.map(c => c.id === chapterId ? updatedChapter : c)
        } : v)
    } : s));
  }, [getAuthHeaders]);

  const deleteChapterFromVolume = useCallback(async (storyId, volumeId, chapterId) => {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete chapter');
    setStories(prev => prev.map(s => s.id === storyId ? {
        ...s,
        volumes: s.volumes.map(v => v.id === volumeId ? {
            ...v,
            chapters: v.chapters.filter(c => c.id !== chapterId)
        } : v)
    } : s));
  }, [getAuthHeaders]);

   const incrementView = useCallback(async (storyId: string) => {
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, views: (s.views || 0) + 1 } : s));
    try {
      await fetch(`${API_BASE_URL}/stories/${storyId}/view`, { method: 'POST' });
    } catch (err) {
      console.error("Failed to increment story view on server:", err);
      setStories(prev => prev.map(s => s.id === storyId ? { ...s, views: (s.views || 1) - 1 } : s));
    }
  }, []);
  
  const incrementChapterView = useCallback(async (storyId: string, chapterId: string) => {
    setStories(prev => prev.map(s => s.id === storyId ? {
      ...s,
      volumes: s.volumes.map(v => ({
        ...v,
        chapters: v.chapters.map(c => c.id === chapterId ? { ...c, views: (c.views || 0) + 1 } : c)
      }))
    } : s));
    try {
      await fetch(`${API_BASE_URL}/stories/${storyId}/chapters/${chapterId}/view`, { method: 'POST' });
    } catch (err) {
      console.error("Failed to increment chapter view on server:", err);
    }
  }, []);

  const rateStory = useCallback(async (storyId: string, newRating: number, previousRating?: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stories/${storyId}/rate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newRating, previousRating }),
      });
      if (!response.ok) throw new Error('Failed to rate story');
      const updatedRating: { rating: number, ratingsCount: number } = await response.json();
      setStories(prev => prev.map(s => s.id === storyId ? { ...s, ...updatedRating } : s));
    } catch (err: any) {
      setError(err.message);
      console.error(err);
      throw err;
    }
  }, [getAuthHeaders]);

  const value = {
    stories, loading, error, getStory,
    addStory, updateStory, deleteStory,
    addVolume, deleteVolume,
    addChapterToVolume, updateChapterInVolume, deleteChapterFromVolume,
    incrementView, rateStory, incrementChapterView
  };

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
};

export const useStories = () => {
  const context = useContext(StoryContext);
  if (context === undefined) throw new Error('useStories must be used within a StoryProvider');
  return context;
};