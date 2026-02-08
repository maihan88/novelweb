import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext';
import { Story } from '../../types';
import {
    PlusIcon, TrashIcon, PencilIcon, ArrowPathIcon,
    ArrowUpIcon, ArrowDownIcon, PhotoIcon, ArrowUturnLeftIcon,
    ExclamationTriangleIcon, MagnifyingGlassIcon, CheckIcon, DocumentTextIcon
} from '@heroicons/react/24/solid';
import { uploadImage } from '../../services/uploadService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmationModal from '../../components/ConfirmationModal';

interface ConfirmDeleteState {
    isOpen: boolean;
    itemType: 'volume' | 'chapter' | null;
    itemId: string;
    itemTitle: string;
    volumeId?: string;
}

interface MoveButtonProps {
    direction: 'up' | 'down';
    disabled: boolean;
    onClick: () => void;
    ariaLabel: string;
}

const MoveButton: React.FC<MoveButtonProps> = ({ direction, disabled, onClick, ariaLabel }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className="p-1.5 sm:p-1 rounded-md text-sukem-text-muted hover:bg-sukem-bg hover:text-sukem-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
    >
        {direction === 'up' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
    </button>
);

const StoryEditPage: React.FC = () => {
    const { storyId } = useParams<{ storyId: string }>();
    const navigate = useNavigate();

    const {
        getStoryById, addStory, updateStory, addVolume, deleteVolume,
        updateVolume, deleteChapterFromVolume, reorderVolumesInStory, reorderChaptersInVolume
    } = useStories();

    const [storyData, setStoryData] = useState<Partial<Story>>({});
    const [tagsInput, setTagsInput] = useState('');
    const [aliasInput, setAliasInput] = useState('');
    const [isNewStory, setIsNewStory] = useState(false);
    const [newVolumeTitle, setNewVolumeTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const [adminChapterSearchTerm, setAdminChapterSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({ isOpen: false, itemType: null, itemId: '', itemTitle: '' });

    useEffect(() => {
        setLoading(true);
        setError('');
        if (storyId) {
            setIsNewStory(false);
            getStoryById(storyId)
                .then(existingStory => {
                    if (existingStory) {
                        setStoryData(existingStory);
                        setTagsInput(existingStory.tags?.join(', ') || '');
                        setAliasInput(existingStory.alias?.join(', ') || '');
                        setAdminChapterSearchTerm('');
                    } else {
                        setError('Không tìm thấy truyện.');
                        setTimeout(() => navigate('/admin'), 2000);
                    }
                })
                .catch(() => {
                    setError('Lỗi khi tải dữ liệu truyện.');
                    setTimeout(() => navigate('/admin'), 2000);
                })
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

    const handleStoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setStoryData(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
    };

    const handleStringToArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'tags' | 'alias') => {
        const value = e.target.value;
        (field === 'tags' ? setTagsInput : setAliasInput)(value);
        setStoryData(prev => ({ ...prev, [field]: value.split(',').map(item => item.trim()).filter(Boolean) }));
    };

    const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { setError('Ảnh bìa không được vượt quá 10MB.'); return; }
            if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) { setError('Chỉ chấp nhận ảnh định dạng JPG, PNG, GIF, WEBP.'); return; }

            setImageUploading(true);
            setError('');
            try {
                const imageUrl = await uploadImage(file);
                setStoryData(prev => ({ ...prev, coverImage: imageUrl }));
            } catch (error: any) {
                setError('Tải ảnh bìa thất bại: ' + (error.response?.data?.message || error.message));
            } finally {
                setImageUploading(false);
            }
        }
    };

    const handleStorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!storyData.title?.trim() || !storyData.author?.trim() || !storyData.coverImage?.trim()) {
            setError("Tên truyện, Tác giả và Ảnh bìa là bắt buộc.");
            window.scrollTo(0, 0);
            return;
        }
        const submitData = {
            title: storyData.title.trim(),
            author: storyData.author.trim(),
            description: storyData.description || '',
            coverImage: storyData.coverImage.trim(),
            tags: storyData.tags || [],
            alias: storyData.alias || [],
            status: storyData.status || 'Đang dịch',
            isHot: !!storyData.isHot,
            isInBanner: !!storyData.isInBanner
        };
        setIsSaving(true);
        try {
            if (isNewStory) {
                const newStory = await addStory(submitData);
                alert(`Đã thêm truyện "${newStory.title}" thành công!`);
                navigate(`/admin/story/edit/${newStory.id}`, { replace: true });
            } else if (storyId) {
                const updatedStory = await updateStory(storyId, submitData);
                alert(`Đã cập nhật truyện "${updatedStory.title}" thành công!`);
                setStoryData(updatedStory);
                setTagsInput(updatedStory.tags?.join(', ') || '');
                setAliasInput(updatedStory.alias?.join(', ') || '');
                if (updatedStory.id !== storyId) {
                    navigate(`/admin/story/edit/${updatedStory.id}`, { replace: true });
                }
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Lưu thất bại. Vui lòng thử lại.';
            setError(errorMessage);
            window.scrollTo(0, 0);
        } finally {
            setIsSaving(false);
        }
    };

    // ... (Keep openConfirmation, closeConfirmation, handleConfirmDelete logic as is)
    const openConfirmation = (type: 'volume' | 'chapter', id: string, title: string, volId?: string) => {
        setConfirmDelete({ isOpen: true, itemType: type, itemId: id, itemTitle: title, volumeId: volId });
    };
    const closeConfirmation = () => {
        setConfirmDelete({ isOpen: false, itemType: null, itemId: '', itemTitle: '' });
    };
    const handleConfirmDelete = async () => {
        if (!confirmDelete.itemType || !storyId) return;
        try {
            if (confirmDelete.itemType === 'volume') {
                await deleteVolume(storyId, confirmDelete.itemId);
                setStoryData(prev => ({ ...prev, volumes: prev.volumes?.filter(v => v.id !== confirmDelete.itemId) }));
            } else if (confirmDelete.itemType === 'chapter' && confirmDelete.volumeId) {
                await deleteChapterFromVolume(storyId, confirmDelete.volumeId, confirmDelete.itemId);
                setStoryData(prev => ({
                    ...prev,
                    volumes: prev.volumes?.map(v => {
                        if (v.id === confirmDelete.volumeId) {
                            return { ...v, chapters: v.chapters.filter(c => c.id !== confirmDelete.itemId) };
                        }
                        return v;
                    })
                }));
            }
        } catch (err) {
            alert(`Xóa ${confirmDelete.itemType === 'volume' ? 'tập' : 'chương'} thất bại.`);
        }
        closeConfirmation();
    };

    const handleChapterDelete = useCallback((volumeId: string, chapterId: string, chapterTitle: string) => {
        openConfirmation('chapter', chapterId, chapterTitle, volumeId);
    }, []);

    const handleAddVolume = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (storyId && newVolumeTitle.trim()) {
            try {
                const newVol = await addVolume(storyId, newVolumeTitle.trim());
                setNewVolumeTitle('');
                setStoryData(prev => ({ ...prev, volumes: [...(prev.volumes || []), { ...newVol, chapters: [] }] }));
            } catch (err) { alert('Thêm tập thất bại.'); }
        }
    }, [storyId, newVolumeTitle, addVolume]);

    const handleVolumeDelete = useCallback((volumeId: string, volumeTitle: string) => {
        openConfirmation('volume', volumeId, volumeTitle);
    }, []);

    const handleVolumeTitleChange = useCallback(async (volumeId: string) => {
        const currentVolume = storyData.volumes?.find(v => v.id === volumeId);
        const newTitle = prompt("Nhập tên tập mới:", currentVolume?.title || '');
        if (storyId && newTitle !== null && newTitle.trim() !== '' && newTitle.trim() !== currentVolume?.title) {
            try {
                await updateVolume(storyId, volumeId, newTitle.trim());
                setStoryData(prev => ({
                    ...prev,
                    volumes: prev.volumes?.map(v => v.id === volumeId ? { ...v, title: newTitle.trim() } : v)
                }));
            } catch (err) { alert('Đổi tên tập thất bại.'); }
        }
    }, [storyId, storyData.volumes, updateVolume]);

    const handleMove = useCallback(async (direction: 'up' | 'down', type: 'volume' | 'chapter', ids: { volumeId?: string; chapterId?: string }) => {
        if (!storyId || !storyData.volumes) return;
        try {
            if (type === 'volume' && ids.volumeId) {
                const index = storyData.volumes.findIndex(v => v.id === ids.volumeId);
                if ((direction === 'up' && index > 0) || (direction === 'down' && index < storyData.volumes.length - 1)) {
                    const newIndex = direction === 'up' ? index - 1 : index + 1;
                    const newVolumes = [...storyData.volumes];
                    [newVolumes[index], newVolumes[newIndex]] = [newVolumes[newIndex], newVolumes[index]];
                    setStoryData(prev => ({ ...prev, volumes: newVolumes }));
                    await reorderVolumesInStory(storyId, newVolumes.map(v => v.id));
                }
            } else if (type === 'chapter' && ids.volumeId && ids.chapterId) {
                const volumeIndex = storyData.volumes.findIndex(v => v.id === ids.volumeId);
                const volume = storyData.volumes[volumeIndex];
                if (!volume) return;

                const index = volume.chapters.findIndex(c => c.id === ids.chapterId);
                if ((direction === 'up' && index > 0) || (direction === 'down' && index < volume.chapters.length - 1)) {
                    const newIndex = direction === 'up' ? index - 1 : index + 1;
                    const newChapters = [...volume.chapters];
                    [newChapters[index], newChapters[newIndex]] = [newChapters[newIndex], newChapters[index]];

                    const newVolumes = [...storyData.volumes];
                    newVolumes[volumeIndex] = { ...volume, chapters: newChapters };
                    setStoryData(prev => ({ ...prev, volumes: newVolumes }));

                    await reorderChaptersInVolume(storyId, ids.volumeId, newChapters.map(c => c.id));
                }
            }
        } catch (err) {
            alert('Thay đổi thứ tự thất bại.');
            const freshData = await getStoryById(storyId);
            if (freshData) setStoryData(freshData);
        }
    }, [storyId, storyData.volumes, reorderVolumesInStory, reorderChaptersInVolume, getStoryById]);

    const filteredVolumes = useMemo(() => {
        if (!storyData.volumes) return [];
        if (!adminChapterSearchTerm.trim()) return storyData.volumes;
        const searchTerm = adminChapterSearchTerm.toLowerCase();
        return storyData.volumes.map(vol => ({
            ...vol,
            chapters: vol.chapters.filter(chap => chap.title.toLowerCase().includes(searchTerm))
        })).filter(vol => vol.chapters.length > 0);
    }, [storyData.volumes, adminChapterSearchTerm]);

    // Styles
    const inputStyles = "w-full p-3 border rounded-xl bg-sukem-bg text-sukem-text border-sukem-border focus:ring-2 focus:ring-sukem-primary focus:border-transparent transition-all duration-200 shadow-sm outline-none placeholder-sukem-text-muted/50";
    const labelStyles = "block text-sm font-bold text-sukem-text mb-2";

    if (loading) return <div className="flex justify-center items-center h-screen -mt-16"><LoadingSpinner size="lg" /></div>;

    if (error && !storyData.title && !isNewStory) {
        return (
            <div className="max-w-xl mx-auto text-center py-16 px-6 bg-red-50 rounded-xl border border-red-200">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-400 mb-4" />
                <p className="text-lg font-semibold text-red-700 mb-2">Đã xảy ra lỗi</p>
                <p className="text-red-600">{error}</p>
                <button onClick={() => navigate('/admin')} className="mt-6 px-4 py-2 bg-sukem-bg text-sukem-text rounded-lg border border-sukem-border hover:bg-sukem-card font-medium transition-colors">
                    Quay lại Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-4 sm:p-6 lg:p-8 pb-32 sm:pb-8"> {/* pb-32 để tránh footer mobile che mất nội dung */}
            
            {/* Header Desktop - Nút lưu ẩn trên Mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-sukem-card p-6 rounded-2xl border border-sukem-border shadow-sm">
                <div className="flex-1">
                    <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-sm font-bold text-sukem-text-muted hover:text-sukem-primary transition-all duration-200 mb-3 group">
                        <ArrowUturnLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-200" />
                        Quay lại Dashboard
                    </button>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-sukem-text leading-tight">
                        {isNewStory ? 'Thêm Truyện Mới' : `Chỉnh Sửa: ${storyData.title || '...'}`}
                    </h1>
                    {!isNewStory && storyData.title && (
                        <p className="mt-2 text-sm text-sukem-text-muted">Quản lý thông tin và nội dung truyện</p>
                    )}
                </div>
                {/* Nút lưu chính (Chỉ hiện trên Desktop) */}
                <div className="hidden sm:block sm:sticky sm:top-24 sm:z-10">
                    <button
                        form="storyForm"
                        type="submit"
                        disabled={isSaving || imageUploading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-sukem-primary to-sukem-accent text-white font-bold rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                    >
                        {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
                        {isNewStory ? 'Lưu Truyện' : 'Cập nhật'}
                    </button>
                </div>
            </div>

            {/* Thông báo lỗi */}
            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 text-sm text-red-700 shadow-md animate-fade-in">
                    <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 mt-0.5" />
                    <span className="font-medium flex-1">{error}</span>
                </div>
            )}

            {/* Form thông tin truyện */}
            <form id="storyForm" onSubmit={handleStorySubmit} className="bg-sukem-card p-5 sm:p-8 rounded-2xl shadow-sm border border-sukem-border space-y-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sukem-border">
                    <div className="p-2 bg-gradient-to-br from-sukem-primary to-sukem-accent rounded-lg">
                        <PencilIcon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-sukem-text">Thông tin cơ bản</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
                    {/* Ảnh bìa - Responsive optimized */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-2">
                        <label className={labelStyles}>Ảnh bìa *</label>
                        {/* Wrapper giới hạn chiều rộng trên mobile để không bị quá to */}
                        <div className="max-w-[200px] md:max-w-none mx-auto md:mx-0">
                            <div className="aspect-[2/3] relative border-2 border-sukem-border border-dashed rounded-2xl flex items-center justify-center text-center p-3 bg-sukem-bg group transition-all duration-300 hover:border-sukem-primary hover:shadow-lg overflow-hidden">
                                {imageUploading && (
                                    <div className="absolute inset-0 bg-sukem-card/90 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                                        <LoadingSpinner size="md" />
                                        <span className="text-sm mt-3 font-medium text-sukem-text-muted">Đang tải...</span>
                                    </div>
                                )}
                                {storyData.coverImage ? (
                                    <img src={storyData.coverImage} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-sm" />
                                ) : (
                                    <div className="text-sukem-text-muted space-y-2">
                                        <PhotoIcon className="h-12 w-12 mx-auto text-sukem-border" />
                                        <p className="text-sm font-bold">Tải ảnh lên</p>
                                        <p className="text-xs">JPG, PNG, GIF</p>
                                    </div>
                                )}
                                <label htmlFor="coverImage" className="absolute inset-0 cursor-pointer bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all duration-300 backdrop-blur-[1px]">
                                    <PencilIcon className="h-8 w-8 mb-2" />
                                    <span className="text-sm font-bold">Thay đổi</span>
                                </label>
                                <input id="coverImage" name="coverImage" type="file" className="sr-only" onChange={handleCoverImageChange} accept="image/jpeg,image/png,image/gif,image/webp" />
                            </div>
                        </div>
                        <p className="text-xs text-sukem-text-muted text-center px-2">Tối đa 10MB.</p>
                    </div>

                    {/* Các input khác */}
                    <div className="md:col-span-8 lg:col-span-9 space-y-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div><label htmlFor="title" className={labelStyles}>Tên truyện *</label><input id="title" name="title" value={storyData.title || ''} onChange={handleStoryChange} required className={inputStyles} placeholder="Nhập tên truyện..." /></div>
                            <div><label htmlFor="author" className={labelStyles}>Tác giả *</label><input id="author" name="author" value={storyData.author || ''} onChange={handleStoryChange} required className={inputStyles} placeholder="Nhập tên tác giả..." /></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div><label htmlFor="alias" className={labelStyles}>Tên khác <span className="text-xs font-normal text-sukem-text-muted">(cách nhau bởi dấu phẩy)</span></label><input id="alias" name="alias" value={aliasInput} onChange={(e) => handleStringToArrayChange(e, 'alias')} className={inputStyles} placeholder="Tên gọi khác..." /></div>
                            <div><label htmlFor="tags" className={labelStyles}>Tags <span className="text-xs font-normal text-sukem-text-muted">(cách nhau bởi dấu phẩy)</span></label><input id="tags" name="tags" value={tagsInput} onChange={(e) => handleStringToArrayChange(e, 'tags')} className={inputStyles} placeholder="Tiên hiệp, Huyền huyễn..." /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                            <div>
                                <label htmlFor="status" className={labelStyles}>Trạng thái</label>
                                <select id="status" name="status" value={storyData.status} onChange={handleStoryChange} className={inputStyles}>
                                    <option value="Đang dịch">Đang dịch</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                </select>
                            </div>
                            <div className="flex flex-col justify-end space-y-3 pt-2 sm:pt-0">
                                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-sukem-bg transition-colors border border-transparent hover:border-sukem-border">
                                    <input type="checkbox" id="isHot" name="isHot" checked={!!storyData.isHot} onChange={handleStoryChange} className="h-4 w-4 text-red-500 border-sukem-border rounded focus:ring-red-500 bg-white" />
                                    <span className="text-sm font-bold text-sukem-text select-none text-red-500">Đánh dấu "Hot"</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-sukem-bg transition-colors border border-transparent hover:border-sukem-border">
                                    <input type="checkbox" id="isInBanner" name="isInBanner" checked={!!storyData.isInBanner} onChange={handleStoryChange} className="h-4 w-4 text-sukem-accent border-sukem-border rounded focus:ring-sukem-accent bg-white" />
                                    <span className="text-sm font-bold text-sukem-text select-none text-sukem-accent">Hiển thị trên Banner</span>
                                </label>
                            </div>
                        </div>
                        <div><label htmlFor="description" className={labelStyles}>Mô tả</label><textarea id="description" name="description" value={storyData.description || ''} onChange={handleStoryChange} rows={6} className={inputStyles + " min-h-[100px]"} placeholder="Nhập tóm tắt nội dung truyện..."></textarea></div>
                    </div>
                </div>
            </form>

            {/* Quản lý Tập & Chương */}
            {!isNewStory && storyId && (
                <div className="bg-sukem-card p-5 sm:p-8 rounded-2xl shadow-sm border border-sukem-border space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 mb-6 border-b border-sukem-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sukem-bg rounded-lg border border-sukem-border">
                                <DocumentTextIcon className="h-5 w-5 text-sukem-text" />
                            </div>
                            <h2 className="text-xl font-bold text-sukem-text whitespace-nowrap">Quản lý Tập & Chương</h2>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="Tìm chương trong danh sách..."
                                value={adminChapterSearchTerm}
                                onChange={e => setAdminChapterSearchTerm(e.target.value)}
                                className={inputStyles + " pl-10 text-sm"}
                            />
                            <MagnifyingGlassIcon className="h-5 w-5 text-sukem-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Form thêm tập */}
                    <form onSubmit={handleAddVolume} className="flex flex-col sm:flex-row gap-3 mb-6 p-4 sm:p-5 bg-sukem-bg rounded-xl border border-sukem-border">
                        <input type="text" value={newVolumeTitle} onChange={(e) => setNewVolumeTitle(e.target.value)} placeholder="Ví dụ: Tập 1" className={inputStyles + " flex-grow bg-sukem-card"} required />
                        <button type="submit" className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 text-sm transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform active:scale-95">
                            <PlusIcon className="h-5 w-5" /> Thêm Tập
                        </button>
                    </form>

                    {/* Danh sách tập và chương */}
                    <div className="space-y-4">
                        {filteredVolumes && filteredVolumes.length > 0 ? filteredVolumes.map((vol, volIndex) => (
                            <div key={vol.id} className="border border-sukem-border rounded-xl shadow-sm overflow-hidden bg-white">
                                {/* Header Tập - Responsive Layout */}
                                <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2 p-3 sm:p-4 bg-sukem-bg border-b border-sukem-border">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="flex flex-col bg-sukem-card p-0.5 rounded border border-sukem-border flex-shrink-0">
                                            <MoveButton direction="up" disabled={volIndex === 0} onClick={() => handleMove('up', 'volume', { volumeId: vol.id })} ariaLabel="Lên" />
                                            <div className="h-px bg-sukem-border my-0.5"></div>
                                            <MoveButton direction="down" disabled={volIndex === (storyData.volumes?.length ?? 1) - 1} onClick={() => handleMove('down', 'volume', { volumeId: vol.id })} ariaLabel="Xuống" />
                                        </div>
                                        <span className="font-bold text-base text-sukem-text truncate">{vol.title}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <Link to={`/admin/story/${storyId}/volume/${vol.id}/chapter/new`} className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 text-xs transition-all shadow-sm">
                                            <PlusIcon className="h-4 w-4" /> <span className="hidden sm:inline">Chương</span>
                                        </Link>
                                        <button onClick={() => handleVolumeTitleChange(vol.id)} className="p-1.5 sm:p-2 rounded-lg text-sukem-text-muted hover:bg-sukem-card hover:text-sukem-text transition-all border border-transparent hover:border-sukem-border">
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleVolumeDelete(vol.id, vol.title)} className="p-1.5 sm:p-2 rounded-lg text-sukem-text-muted hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Danh sách chương */}
                                <div className="bg-sukem-card">
                                    {vol.chapters && vol.chapters.length > 0 ? (
                                        <ul className="divide-y divide-sukem-border/50">
                                            {vol.chapters.map((chap, chapIndex) => (
                                                <li key={chap.id} className="flex justify-between items-center p-3 pl-2 sm:pl-4 group hover:bg-sukem-bg transition-colors duration-200">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="flex flex-col opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                            <MoveButton direction="up" disabled={chapIndex === 0} onClick={() => handleMove('up', 'chapter', { volumeId: vol.id, chapterId: chap.id })} ariaLabel="Lên" />
                                                            <MoveButton direction="down" disabled={chapIndex === vol.chapters.length - 1} onClick={() => handleMove('down', 'chapter', { volumeId: vol.id, chapterId: chap.id })} ariaLabel="Xuống" />
                                                        </div>
                                                        <span className="font-medium text-sm text-sukem-text truncate pr-2" title={chap.title}>{chap.title}</span>
                                                        {chap.isRaw && <span className="ml-auto sm:ml-0 flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">RAW</span>}
                                                    </div>
                                                    
                                                    <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
                                                        <Link to={`/admin/story/${storyId}/volume/${vol.id}/chapter/edit/${chap.id}`} className="p-1.5 sm:p-2 rounded-lg text-sukem-accent hover:bg-sukem-bg hover:text-sukem-primary transition-all">
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Link>
                                                        <button onClick={() => handleChapterDelete(vol.id, chap.id, chap.title)} className="p-1.5 sm:p-2 rounded-lg text-sukem-text-muted hover:bg-red-50 hover:text-red-500 transition-all">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        adminChapterSearchTerm
                                            ? <p className="text-center text-xs italic text-sukem-text-muted py-3 px-2">Không tìm thấy chương khớp.</p>
                                            : <p className="text-center text-sm text-sukem-text-muted py-4 px-2">Chưa có chương nào.</p>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-sukem-text-muted py-8 italic bg-sukem-bg rounded-xl border border-sukem-border border-dashed">
                                {adminChapterSearchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có tập nào được thêm.'}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Modal xác nhận */}
            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                onClose={closeConfirmation}
                onConfirm={handleConfirmDelete}
                title={`Xác nhận xóa ${confirmDelete.itemType === 'volume' ? 'tập' : 'chương'}`}
                message={
                    <span>
                        Bạn có chắc chắn muốn xóa <strong>"{confirmDelete.itemTitle}"</strong>?
                        {confirmDelete.itemType === 'volume' && ' Tất cả các chương bên trong cũng sẽ bị xóa.'}
                        <br />
                        Hành động này không thể hoàn tác.
                    </span>
                }
                confirmText="Xác nhận xóa"
                isDestructive={true}
            />

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-sukem-card border-t border-sukem-border z-50 sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <button
                    form="storyForm"
                    type="submit"
                    disabled={isSaving || imageUploading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sukem-primary to-sukem-accent text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-70"
                >
                    {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
                    {isNewStory ? 'Lưu Truyện' : 'Cập nhật Thay đổi'}
                </button>
            </div>
        </div>
    );
};

export default StoryEditPage;