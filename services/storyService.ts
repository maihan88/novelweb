import api from './api';
import { Story, Chapter, Volume, StoriesResponse, StoryFilterParams } from '../types';

// Interface cho Dashboard (Dùng cho AdminDashboardPage)
export interface DashboardData {
    stats: {
        totalStories: number;
        totalUsers: number;
        totalChapters: number;
        totalViews: number;
    };
    stories: (Story & { chapterCount: number; totalViews: number })[];
}

// --- Story Operations ---

export const getAllStories = async (): Promise<Story[]> => {
    const response = await api.get('/stories?limit=1000');
    return response.data.stories;
};

// Hàm mới cho Dashboard (Đừng quên hàm này!)
export const getDashboardStats = async (): Promise<DashboardData> => {
    const response = await api.get('/stories/admin/stats');
    return response.data;
};

export const getStoriesList = async (params: StoryFilterParams): Promise<StoriesResponse> => {
    const { page = 1, limit = 12, sort = 'updated', status, keyword } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    queryParams.append('sort', sort);
    if (status) queryParams.append('status', status);
    if (keyword) queryParams.append('keyword', keyword);

    const response = await api.get(`/stories?${queryParams.toString()}`);
    return response.data;
};

export const getStoryById = async (id: string): Promise<Story> => {
    const response = await api.get(`/stories/${id}`);
    return response.data;
};

export const getChapterContent = async (storyId: string, chapterId: string): Promise<Chapter> => {
    const response = await api.get(`/stories/${storyId}/chapters/${chapterId}`);
    return response.data;
};

export const createStory = async (storyData: Partial<Story>): Promise<Story> => {
    const response = await api.post('/stories', storyData);
    return response.data;
};

export const updateStory = async (id: string, storyData: Partial<Story>): Promise<Story> => {
    const response = await api.put(`/stories/${id}`, storyData);
    return response.data;
};

export const deleteStory = async (id: string): Promise<void> => {
    await api.delete(`/stories/${id}`);
};

export const getBannerStories = async (): Promise<Story[]> => {
    const response = await api.get('/stories/banner/list');
    return response.data;
};

export const updateStoryBannerConfig = async (id: string, data: { isInBanner?: boolean; bannerPriority?: number }): Promise<Story> => {
    const response = await api.put(`/stories/${id}/banner`, data);
    return response.data;
};

export const rateStory = async (storyId: string, rating: number): Promise<Story> => {
    const response = await api.post(`/stories/${storyId}/rating`, { rating });
    return response.data; 
};

// --- Volume Operations ---

export const addVolume = async (storyId: string, volumeData: { title: string }): Promise<Volume> => {
    const response = await api.post(`/stories/${storyId}/volumes`, volumeData);
    return response.data;
};

export const updateVolume = async (storyId: string, volumeId: string, volumeData: { title: string }): Promise<Volume> => {
    const response = await api.put(`/stories/${storyId}/volumes/${volumeId}`, volumeData);
    return response.data;
};

export const deleteVolume = async (storyId: string, volumeId: string): Promise<void> => {
    await api.delete(`/stories/${storyId}/volumes/${volumeId}`);
};

export const reorderVolumes = async (storyId: string, orderedVolumeIds: string[]): Promise<Volume[]> => {
    const response = await api.put(`/stories/${storyId}/volumes/reorder`, { orderedVolumeIds });
    return response.data;
};

// --- Chapter Operations ---

export const addChapter = async (storyId: string, volumeId: string, chapterData: Partial<Chapter>): Promise<Chapter> => {
    const response = await api.post(`/stories/${storyId}/volumes/${volumeId}/chapters`, chapterData);
    return response.data;
};

export const updateChapter = async (storyId: string, volumeId: string, chapterId: string, chapterData: Partial<Chapter>): Promise<Chapter> => {
    const response = await api.put(`/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}`, chapterData);
    return response.data;
};

export const deleteChapter = async (storyId: string, volumeId: string, chapterId: string): Promise<void> => {
    await api.delete(`/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}`);
};

export const reorderChapters = async (storyId: string, volumeId: string, orderedChapterIds: string[]): Promise<Chapter[]> => {
    const response = await api.put(`/stories/${storyId}/volumes/${volumeId}/chapters/reorder`, { orderedChapterIds });
    return response.data;
};

export const incrementChapterView = async (storyId: string, chapterId: string): Promise<void> => {
    await api.post(`/stories/${storyId}/chapters/${chapterId}/view`);
};

// --- QUAN TRỌNG: Export Object gom nhóm (Để hỗ trợ AdminDashboard & HeroBanner) ---
export const storyService = {
    getAllStories,
    getDashboardStats,
    getStoriesList,
    getStoryById,
    getChapterContent,
    createStory,
    updateStory,
    deleteStory,
    getBannerStories,
    updateStoryBannerConfig,
    rateStory,
    addVolume,
    updateVolume,
    deleteVolume,
    reorderVolumes,
    addChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    incrementChapterView
};