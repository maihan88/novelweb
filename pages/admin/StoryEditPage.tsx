


import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext.tsx';
import { Story, Volume } from '../../types.ts';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/solid';

const StoryEditPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { stories, addStory, updateStory, addVolume, deleteVolume, updateVolume, deleteChapterFromVolume } = useStories();

  const [storyData, setStoryData] = useState<Partial<Story>>({});
  const [tagsInput, setTagsInput] = useState('');
  const [isNewStory, setIsNewStory] = useState(false);
  const [newVolumeTitle, setNewVolumeTitle] = useState('');

  useEffect(() => {
    if (storyId) {
      const existingStory = stories.find(s => s.id === storyId);
      if (existingStory) {
        setStoryData(existingStory);
        setTagsInput(existingStory.tags?.join(', ') || '');
        setIsNewStory(false);
      } else {
        navigate('/admin'); // Story not found
      }
    } else {
      setIsNewStory(true);
      setStoryData({
        title: '',
        author: '',
        alias: '',
        description: '',
        coverImage: '',
        tags: [],
        status: 'Đang dịch',
        isHot: false,
        isInBanner: false,
      });
      setTagsInput('');
    }
  }, [storyId, stories, navigate]);

  const handleStoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setStoryData(prev => ({ ...prev, [name]: checked }));
    } else {
        setStoryData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagsInput(value);
    setStoryData(prev => ({...prev, tags: value.split(',').map(t => t.trim()).filter(Boolean)}));
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoryData(prev => ({ ...prev, coverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyData.title || !storyData.author) {
        alert("Vui lòng điền tên truyện và tác giả.");
        return;
    }
    
    if (isNewStory) {
      if (!storyData.coverImage) {
        alert("Vui lòng tải lên ảnh bìa.");
        return;
      }
      const newStory = addStory(storyData as Omit<Story, 'id'|'volumes'|'views'|'createdAt'|'lastUpdatedAt'|'rating'|'ratingsCount'>);
      navigate(`/admin/story/edit/${newStory.id}`);
    } else if(storyId) {
      updateStory(storyId, storyData);
      alert('Đã cập nhật truyện thành công!');
    }
  };
    
  const handleChapterDelete = useCallback((volumeId: string, chapterId: string) => {
      if(storyId && window.confirm("Bạn có chắc muốn xóa chương này?")) {
          deleteChapterFromVolume(storyId, volumeId, chapterId);
      }
  }, [storyId, deleteChapterFromVolume]);

  const handleAddVolume = (e: React.FormEvent) => {
    e.preventDefault();
    if (storyId && newVolumeTitle.trim()) {
        addVolume(storyId, newVolumeTitle.trim());
        setNewVolumeTitle('');
    }
  }

  const handleVolumeDelete = useCallback((volumeId: string) => {
      if(storyId && window.confirm("Bạn có chắc muốn xóa tập này và tất cả các chương bên trong?")) {
          deleteVolume(storyId, volumeId);
      }
  }, [storyId, deleteVolume]);

  const handleVolumeTitleChange = (volumeId: string) => {
    const currentVolume = volumes.find(v => v.id === volumeId);
    const newTitle = prompt("Nhập tên tập mới:", currentVolume?.title || '');
    if (storyId && newTitle !== null && newTitle.trim() !== '') {
        updateVolume(storyId, volumeId, newTitle.trim());
    }
  }
  
  const inputStyles = "w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 transition";

  const storyForRender = !isNewStory && storyId ? stories.find(s => s.id === storyId) : undefined;
  const volumes = storyForRender?.volumes ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold font-serif">{isNewStory ? 'Thêm Truyện Mới' : `Chỉnh Sửa: ${storyData.title}`}</h1>

      {/* Story Details Form */}
      <form onSubmit={handleStorySubmit} className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg space-y-6">
        <h2 className="text-xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">Thông tin truyện</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ảnh bìa</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        {storyData.coverImage ? (
                             <img src={storyData.coverImage} alt="Preview" className="mx-auto h-32 w-auto object-contain rounded-md"/>
                        ) : (
                            <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                        <div className="flex text-sm text-slate-600 dark:text-slate-400">
                            <label htmlFor="coverImage" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:ring-offset-slate-800 focus-within:ring-indigo-500">
                                <span>Tải ảnh lên</span>
                                <input id="coverImage" name="coverImage" type="file" className="sr-only" onChange={handleCoverImageChange} accept="image/*" />
                            </label>
                            <p className="pl-1">hoặc kéo và thả</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                </div>
            </div>
            <div className="md:col-span-2 space-y-4">
                <input name="title" value={storyData.title || ''} onChange={handleStoryChange} placeholder="Tên truyện" required className={inputStyles} />
                <input name="author" value={storyData.author || ''} onChange={handleStoryChange} placeholder="Tác giả" required className={inputStyles} />
                <input name="alias" value={storyData.alias || ''} onChange={handleStoryChange} placeholder="Tên khác (bí danh, tên gốc,...)" className={inputStyles} />
                <input name="tags" value={tagsInput} onChange={handleTagsChange} placeholder="Tags (cách nhau bằng dấu phẩy)" className={inputStyles} />
                <div className="flex flex-col sm:flex-row gap-4">
                    <select name="status" value={storyData.status} onChange={handleStoryChange} className={inputStyles + " flex-grow"}>
                        <option value="Đang dịch">Đang dịch</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                    <div className="flex items-center gap-4 pt-2 sm:pt-0">
                      <div className="flex items-center space-x-2">
                          <input type="checkbox" id="isHot" name="isHot" checked={!!storyData.isHot} onChange={handleStoryChange} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                          <label htmlFor="isHot" className="text-sm text-slate-700 dark:text-slate-300">Đánh dấu "Hot"</label>
                      </div>
                       <div className="flex items-center space-x-2">
                          <input type="checkbox" id="isInBanner" name="isInBanner" checked={!!storyData.isInBanner} onChange={handleStoryChange} className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500" />
                          <label htmlFor="isInBanner" className="text-sm text-slate-700 dark:text-slate-300">Hiển thị trong banner</label>
                      </div>
                    </div>
                </div>
            </div>
        </div>
        <textarea name="description" value={storyData.description || ''} onChange={handleStoryChange} placeholder="Mô tả" rows={4} className={inputStyles}></textarea>
        <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-md hover:opacity-90 transition-opacity shadow">
            {isNewStory ? 'Lưu Truyện' : 'Cập nhật thông tin'}
        </button>
      </form>
      
      {/* Chapters Management */}
      {!isNewStory && storyId && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg space-y-4">
            <h2 className="text-xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">Quản lý Tập & Chương</h2>
            
            {/* Add Volume Form */}
            <form onSubmit={handleAddVolume} className="flex gap-2 mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <input
                    type="text"
                    value={newVolumeTitle}
                    onChange={(e) => setNewVolumeTitle(e.target.value)}
                    placeholder="Tên tập mới (ví dụ: Tập 1)"
                    className={inputStyles}
                    required
                />
                <button type="submit" className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 text-sm transition-colors">
                    <PlusIcon className="h-4 w-4"/> Thêm Tập
                </button>
            </form>

            {/* Volumes List */}
            <div className="space-y-6">
                {volumes.map((vol) => (
                    <div key={vol.id} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-900/50 rounded-t-lg">
                            <span className="font-bold text-lg">{vol.title}</span>
                            <div className="space-x-2">
                                <Link to={`/admin/story/${storyId}/volume/${vol.id}/chapter/new`} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 text-xs transition-colors">
                                    <PlusIcon className="h-3 w-3"/> Thêm chương
                                </Link>
                                <button onClick={() => handleVolumeTitleChange(vol.id)} className="p-1 rounded-full text-indigo-600 hover:bg-indigo-100 dark:hover:bg-slate-600"><PencilIcon className="h-5 w-5"/></button>
                                <button onClick={() => handleVolumeDelete(vol.id)} className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-slate-600"><TrashIcon className="h-5 w-5"/></button>
                            </div>
                        </div>

                        <div className="space-y-2 p-3">
                             {vol.chapters.map((chap, index) => (
                                <div key={chap.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                    <span className="font-medium">{chap.title}</span>
                                    <div className="space-x-2">
                                        <Link to={`/admin/story/${storyId}/volume/${vol.id}/chapter/edit/${chap.id}`} className="inline-block p-1 rounded-full text-indigo-600 hover:bg-indigo-100 dark:hover:bg-slate-600"><PencilIcon className="h-5 w-5"/></Link>
                                        <button onClick={() => handleChapterDelete(vol.id, chap.id)} className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-slate-600"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </div>
                            ))}
                            {vol.chapters.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-4">Chưa có chương nào trong tập này.</p>}
                        </div>
                    </div>
                ))}
                {volumes.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-4">Chưa có tập nào.</p>}
            </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditPage;