// src/pages/admin/StoryEditPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext.tsx';
import { Story, Volume, Chapter } from '../../types.ts';
import { 
    PlusIcon, TrashIcon, PencilIcon, ArrowPathIcon, 
    ArrowUpIcon, ArrowDownIcon 
} from '@heroicons/react/24/solid';
import { uploadImage } from '../../services/uploadService.ts';

const StoryEditPage: React.FC = () => {
    const { storyId } = useParams<{ storyId: string }>();
    const navigate = useNavigate();
    
    // Lấy thêm `stories` từ context để theo dõi thay đổi
    const { 
        stories, getStoryById, addStory, updateStory, addVolume, deleteVolume, 
        updateVolume, deleteChapterFromVolume, reorderVolumesInStory, reorderChaptersInVolume 
    } = useStories();

    // State cục bộ của trang
    const [storyData, setStoryData] = useState<Partial<Story>>({});
    const [tagsInput, setTagsInput] = useState('');
    const [aliasInput, setAliasInput] = useState('');
    const [isNewStory, setIsNewStory] = useState(false);
    const [newVolumeTitle, setNewVolumeTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Effect để tải dữ liệu truyện lần đầu
    useEffect(() => {
        if (storyId) {
            setIsNewStory(false);
            getStoryById(storyId)
                .then(existingStory => {
                    if (existingStory) {
                        setStoryData(existingStory);
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
                title: '', author: '', alias: [], description: '', coverImage: '',
                tags: [], status: 'Đang dịch', isHot: false, isInBanner: false, volumes: []
            });
            setTagsInput('');
            setAliasInput('');
            setLoading(false);
        }
    }, [storyId, getStoryById, navigate]);

    // === PHẦN SỬA LỖI QUAN TRỌNG ===
    // Effect này sẽ lắng nghe sự thay đổi từ `stories` (state toàn cục)
    // và cập nhật `storyData` (state cục bộ) của trang này.
    useEffect(() => {
        const updatedStoryFromContext = stories.find(s => s.id === storyId);
        if (updatedStoryFromContext) {
            // So sánh đơn giản để tránh re-render không cần thiết
            // Chỉ cập nhật nếu dữ liệu từ context khác với dữ liệu đang hiển thị
             if (JSON.stringify(updatedStoryFromContext.volumes) !== JSON.stringify(storyData.volumes)) {
                setStoryData(prev => ({...prev, volumes: updatedStoryFromContext.volumes}));
            }
        }
    }, [stories, storyId]); // <--- ĐÃ SỬA: Bỏ `storyData` ra khỏi dependency array
    // === KẾT THÚC PHẦN SỬA LỖI ===

    const handleStoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setStoryData(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
    };

    const handleStringToArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'tags' | 'alias') => {
        const value = e.target.value;
        (field === 'tags' ? setTagsInput : setAliasInput)(value);
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
            // Loại bỏ volumes và các field không cần thiết khỏi dữ liệu gửi đi
            const { volumes, views, createdAt, lastUpdatedAt, rating, ratingsCount, ...updateData } = storyData;
            await updateStory(storyId, updateData);
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
        }
    }, [storyId, deleteChapterFromVolume]);

    const handleAddVolume = async (e: React.FormEvent) => {
        e.preventDefault();
        if (storyId && newVolumeTitle.trim()) {
            await addVolume(storyId, newVolumeTitle.trim());
            setNewVolumeTitle('');
        }
    }

    const handleVolumeDelete = useCallback(async (volumeId: string) => {
        if(storyId && window.confirm("Bạn có chắc muốn xóa tập này và tất cả các chương bên trong?")) {
            await deleteVolume(storyId, volumeId);
        }
    }, [storyId, deleteVolume]);

    const handleVolumeTitleChange = async (volumeId: string) => {
        const currentVolume = storyData.volumes?.find(v => v.id === volumeId);
        const newTitle = prompt("Nhập tên tập mới:", currentVolume?.title || '');
        if (storyId && newTitle !== null && newTitle.trim() !== '') {
            await updateVolume(storyId, volumeId, newTitle.trim());
        }
    }

    const handleMove = async (
        direction: 'up' | 'down',
        type: 'volume' | 'chapter',
        ids: { volumeId?: string; chapterId?: string }
    ) => {
        if (!storyId || !storyData.volumes) return;

        if (type === 'volume' && ids.volumeId) {
            const { volumeId } = ids;
            const volumes = storyData.volumes;
            const index = volumes.findIndex(v => v.id === volumeId);
            if ((direction === 'up' && index > 0) || (direction === 'down' && index < volumes.length - 1)) {
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                const newVolumes = [...volumes];
                [newVolumes[index], newVolumes[newIndex]] = [newVolumes[newIndex], newVolumes[index]];
                await reorderVolumesInStory(storyId, newVolumes.map(v => v.id));
            }
        } else if (type === 'chapter' && ids.volumeId && ids.chapterId) {
            const { volumeId, chapterId } = ids;
            const volume = storyData.volumes.find(v => v.id === volumeId);
            if (!volume) return;

            const chapters = volume.chapters;
            const index = chapters.findIndex(c => c.id === chapterId);
            if ((direction === 'up' && index > 0) || (direction === 'down' && index < chapters.length - 1)) {
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                const newChapters = [...chapters];
                [newChapters[index], newChapters[newIndex]] = [newChapters[newIndex], newChapters[index]];
                await reorderChaptersInVolume(storyId, volumeId, newChapters.map(c => c.id));
            }
        }
    };

    const inputStyles = "w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 transition";

    if (loading) return <div className="text-center p-10"><ArrowPathIcon className="h-8 w-8 animate-spin mx-auto" /></div>;
    
    const MoveButton: React.FC<{
        direction: 'up' | 'down';
        disabled: boolean;
        onClick: () => void;
        ariaLabel: string;
    }> = ({ direction, disabled, onClick, ariaLabel }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
            {direction === 'up' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
        </button>
    );

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
                                <select name="status" value={storyData.status} onChange={handleStoryChange} className={inputStyles + " flex-grow"}>
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
                        <input type="text" value={newVolumeTitle} onChange={(e) => setNewVolumeTitle(e.target.value)} placeholder="Tên tập mới (ví dụ: Tập 1)" className={inputStyles} required />
                        <button type="submit" className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 text-sm transition-colors"><PlusIcon className="h-4 w-4"/> Thêm Tập</button>
                    </form>
                    <div className="space-y-6">
                        {storyData.volumes?.map((vol, volIndex) => (
                            <div key={vol.id} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                                <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-900/50 rounded-t-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <MoveButton direction="up" disabled={volIndex === 0} onClick={() => handleMove('up', 'volume', { volumeId: vol.id })} ariaLabel={`Di chuyển tập ${vol.title} lên trên`} />
                                            <MoveButton direction="down" disabled={volIndex === (storyData.volumes?.length ?? 0) - 1} onClick={() => handleMove('down', 'volume', { volumeId: vol.id })} ariaLabel={`Di chuyển tập ${vol.title} xuống dưới`} />
                                        </div>
                                        <span className="font-bold text-lg">{vol.title}</span>
                                    </div>
                                    <div className="space-x-1">
                                        <Link to={`/admin/story/${storyId}/volume/${vol.id}/chapter/new`} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 text-xs transition-colors"><PlusIcon className="h-3 w-3"/> Thêm chương</Link>
                                        <button aria-label={`Sửa tên tập ${vol.title}`} onClick={() => handleVolumeTitleChange(vol.id)} className="p-2 rounded-md text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"><PencilIcon className="h-4 w-4"/></button>
                                        <button aria-label={`Xóa tập ${vol.title}`} onClick={() => handleVolumeDelete(vol.id)} className="p-2 rounded-md text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"><TrashIcon className="h-4 w-4"/></button>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3">
                                    {vol.chapters.map((chap, chapIndex) => (
                                        <div key={chap.id} className="flex justify-between items-center p-2 pl-3 bg-slate-50 dark:bg-slate-700/50 rounded-md group">
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoveButton direction="up" disabled={chapIndex === 0} onClick={() => handleMove('up', 'chapter', { volumeId: vol.id, chapterId: chap.id })} ariaLabel={`Di chuyển chương ${chap.title} lên trên`} />
                                                    <MoveButton direction="down" disabled={chapIndex === vol.chapters.length - 1} onClick={() => handleMove('down', 'chapter', { volumeId: vol.id, chapterId: chap.id })} ariaLabel={`Di chuyển chương ${chap.title} xuống dưới`} />
                                                </div>
                                                <span className="font-medium">{chap.title}</span>
                                            </div>
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
