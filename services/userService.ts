import api from './api';
import { Bookmark } from '../types';

interface UserPreferences {
    favorites: string[];
    bookmarks: Record<string, Bookmark>;
    ratedStories: Record<string, number>;
}

export const updateUserPreferences = async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const response = await api.put('/users/preferences', preferences);
    return response.data;
};

export const syncReadingProgress = async (
    storyId: string, 
    chapterId: string, 
    progress: number,
    chapterTitle?: string, // Thêm
    volumeTitle?: string   // Thêm
) => {
    const response = await api.put('/users/progress', { 
        storyId, 
        chapterId, 
        progress,
        chapterTitle, // Gửi đi
        volumeTitle   // Gửi đi
    });
    return response.data;
};