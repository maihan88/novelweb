// services/userService.ts
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
