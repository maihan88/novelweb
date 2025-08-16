import api from './api.ts';
import { Story, Chapter, Volume } from '../types.ts';

// Story operations
export const getAllStories = async (): Promise<Story[]> => {
    const response = await api.get('/stories');
    return response.data;
};

export const getStoryById = async (id: string): Promise<Story> => {
    const response = await api.get(`/stories/${id}`);
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

export const reorderVolumes = async (storyId: string, orderedVolumeIds: string[]): Promise<Volume[]> => {
    const response = await api.put(`/stories/${storyId}/volumes/reorder`, { orderedVolumeIds });
    return response.data;
};

// Volume operations
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

// Chapter operations
export const reorderChapters = async (storyId: string, volumeId: string, orderedChapterIds: string[]): Promise<Chapter[]> => {
    const response = await api.put(`/stories/${storyId}/volumes/${volumeId}/chapters/reorder`, { orderedChapterIds });
    return response.data;
};

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

export const incrementChapterView = async (storyId: string, chapterId: string): Promise<void> => {
    await api.post(`/stories/${storyId}/chapters/${chapterId}/view`);
};
