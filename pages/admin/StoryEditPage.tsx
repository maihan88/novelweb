import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext.tsx';
import { Story, Volume } from '../../types.ts';
import { PlusIcon, TrashIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { uploadImage } from '../../services/uploadService.ts';

const StoryEditPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { getStoryById, addStory, updateStory, addVolume, deleteVolume, updateVolume, deleteChapterFromVolume } = useStories();

  const [storyData, setStoryData] = useState<Partial<Story>>({});
  const [tagsInput, setTagsInput] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [isNewStory, setIsNewStory] = useState(false);
  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (storyId) {
      setIsNewStory(false);
      getStoryById(storyId)
        .then(existingStory => {
          if (existingStory) {
            setStoryData(existingStory);
            // .join() bây giờ sẽ hoạt động vì `tags` và `alias` là mảng
            setTagsInput(existingStory.tags?.join(', ') || '');
            setAliasInput(existingStory.alias?.join(', ') || '');
          } else {
            navigate('/admin');
          }
        })
        .catch(() => navigate('/admin'))
        .finally(() => setLoading(false));
    } else {
      setIsNewStory(true);
      setStoryData({
        title: '',
        author: '',
        alias: [], // Khởi tạo là mảng rỗng
        description: '',
        coverImage: '',
        tags: [], // Khởi tạo là mảng rỗng
        status: 'Đang dịch',
        isHot: false,
        isInBanner: false,
        volumes: []
      });
      setTagsInput('');
      setAliasInput('');
      setLoading(false);
    }
  }, [storyId, getStoryById, navigate]);

  const handleStoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setStoryData(prev => ({ ...prev, [name]: checked }));
    } else {
        setStoryData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStringToArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'tags' | 'alias') => {
    const value = e.target.value;
    if (field === 'tags') {
      setTagsInput(value);
    } else {
      setAliasInput(value);
    }
    setStoryData(prev => ({...prev, [field]: value.split(',').map(item => item.trim()).filter(Boolean)}));
  }

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await uploadImage(file);
        setStoryData(prev => ({ ...prev, coverImage: imageUrl }));
        alert('Tải ảnh bìa thành công!');
      } catch (error) {
        alert('Tải ảnh bìa thất bại. Vui lòng thử lại.');
        console.error(error);
      }
    }
  };

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyData.title || !storyData.author) {
        alert("Vui lòng điền tên truyện và tác giả.");
        return;
    }
    
    setIsSaving(true);
    setError('');
    try {
        if (isNewStory) {
            if (!storyData.coverImage) {
              alert("Vui lòng tải lên ảnh bìa.");
              setIsSaving(false);
              return;
            }
            const newStory = await addStory(storyData as Omit<Story, 'id'|'_id'|'volumes'|'views'|'createdAt'|'lastUpdatedAt'|'rating'|'ratingsCount'>);
            navigate(`/admin/story/edit/${newStory.id}`);
        } else if(storyId) {
            await updateStory(storyId, storyData);
            alert('Đã cập nhật truyện thành công!');
        }
    } catch(err) {
        setError('Lưu thất bại. Vui lòng thử lại.');
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };
    
  const handleChapterDelete = useCallback(async (volumeId: string, chapterId: string) => {
      if(storyId && window.confirm("Bạn có chắc muốn xóa chương này?")) {
          await deleteChapterFromVolume(storyId, volumeId, chapterId);
          setStoryData(prev => ({
              ...prev,
              volumes: prev.volumes?.map(v => v.id === volumeId ? {...v, chapters: v.chapters.filter(c => c.id !== chapterId)} : v)
          }));
      }
  }, [storyId, deleteChapterFromVolume]);

  const handleAddVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (storyId && newVolumeTitle.trim()) {
        const newVolume = await addVolume(storyId, newVolumeTitle.trim());
        setStoryData(prev => ({ ...prev, volumes: [...(prev.volumes || []), newVolume] }));
        setNewVolumeTitle('');
    }
  }

  const handleVolumeDelete = useCallback(async (volumeId: string) => {
      if(storyId && window.confirm("Bạn có chắc muốn xóa tập này và tất cả các chương bên trong?")) {
          await deleteVolume(storyId, volumeId);
          setStoryData(prev => ({...prev, volumes: prev.volumes?.filter(v => v.id !== volumeId)}));
      }
  }, [storyId, deleteVolume]);

  const handleVolumeTitleChange = async (volumeId: string) => {
    const currentVolume = storyData.volumes?.find(v => v.id === volumeId);
    const newTitle = prompt("Nhập tên tập mới:", currentVolume?.title || '');
    if (storyId && newTitle !== null && newTitle.trim() !== '') {
        const updatedVolume = await updateVolume(storyId, volumeId, newTitle.trim());
        setStoryData(prev => ({...prev, volumes: prev.volumes?.map(v => v.id === volumeId ? updatedVolume : v)}));
    }
  }
  
  const inputStyles = "w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 transition";

  if (loading) return <div className="text-center p-10"><ArrowPathIcon className="h-8 w-8 animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-4">
      <h1 className="text-3xl font-bold font-serif">{isNewStory ? 'Thêm Truyện Mới' : `Chỉnh Sửa: ${storyData.title}`}</h1>
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
                            <label htmlFor="coverImage" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:ring-offset-slate-800 focus-within:ring-orange-500">
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
                <input name="alias" value={aliasInput} onChange={(e) => handleStringToArrayChange(e, 'alias')} placeholder="Tên khác (cách nhau bằng dấu phẩy)" className={inputStyles} />
                <input name="tags" value={tagsInput} onChange={(e) => handleStringToArrayChange(e, 'tags')} placeholder="Tags (cách nhau bằng dấu phẩy)" className={inputStyles} />
                <div className="flex flex-col sm:flex-row gap-4">
                    <div>
                      <label htmlFor="story-status" className="sr-only">Trạng thái truyện</label>
                      <select id="story-status" name="status" value={storyData.status} onChange={handleStoryChange} className={inputStyles + " flex-grow"}>
                          <option value="Đang dịch">Đang dịch</option>
                          <option value="Hoàn thành">Hoàn thành</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4 pt-2 sm:pt-0">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isHot" name="isHot" checked={!!storyData.isHot} onChange={handleStoryChange} className="h-4 w-4 text-red-600 border-slate-300 rounded focus:ring-red-500" />
                        <label htmlFor="isHot" className="text-sm text-slate-700 dark:text-slate-300">Đánh dấu "Hot"</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isInBanner" name="isInBanner" checked={!!storyData.isInBanner} onChange={handleStoryChange} className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500" />
                        <label htmlFor="isInBanner" className="text-sm text-slate-700 dark:text-slate-300">Hiển thị banner</label>
                      </div>
                    </div>
                </div>
            </div>
        </div>
        <textarea name="description" value={storyData.description || ''} onChange={handleStoryChange} placeholder="Mô tả" rows={4} className={inputStyles}></textarea>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button type="submit" disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-md hover:opacity-90 transition-opacity shadow disabled:opacity-70 disabled:cursor-not-allowed">
            {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : (isNewStory ? 'Lưu Truyện' : 'Cập nhật thông tin')}
        </button>
      </form>
      
      {!isNewStory && storyId && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">Quản lý Tập & Chương</h2>
          
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

          <div className="space-y-6">
              {storyData.volumes?.map((vol) => (
                  <div key={vol.id} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-900/50 rounded-t-lg">
                          <span className="font-bold text-lg">{vol.title}</span>
                          <div className="space-x-1">
                              <Link to={`/admin/story/${storyId}/volume/${vol.id}/chapter/new`} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 text-xs transition-colors">
                                  <PlusIcon className="h-3 w-3"/> Thêm chương
                              </Link>
                               <button aria-label={`Sửa tên tập ${vol.title}`} onClick={() => handleVolumeTitleChange(vol.id)} className="p-2 rounded-md text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"><PencilIcon className="h-4 w-4"/></button>
                              <button aria-label={`Xóa tập ${vol.title}`} onClick={() => handleVolumeDelete(vol.id)} className="p-2 rounded-md text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"><TrashIcon className="h-4 w-4"/></button>
                      </div>
                  </div>
                      <div className="space-y-2 p-3">
                           {vol.chapters.map((chap) => (
                              <div key={chap.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                  <span className="font-medium">{chap.title}</span>
                                  <div className="space-x-2">
                                      <Link aria-label={`Sửa chương ${chap.title}`} to={`/admin/story/${storyId}/volume/${vol.id}/chapter/edit/${chap.id}`} className="inline-block p-1 rounded-full text-indigo-600 hover:bg-indigo-100 dark:hover:bg-slate-600"><PencilIcon className="h-5 w-5"/></Link>
                                      <button aria-label={`Xóa chương ${chap.title}`} onClick={() => handleChapterDelete(vol.id, chap.id)} className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-slate-600"><TrashIcon className="h-5 w-5"/></button>
                                  </div>
                              </div>
                           ))}
                           {vol.chapters.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-4">Chưa có chương nào trong tập này.</p>}
                      </div>
                  </div>
              ))}
              {(storyData.volumes?.length || 0) === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-4">Chưa có tập nào.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditPage;