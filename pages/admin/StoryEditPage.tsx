// src/pages/admin/StoryEditPage.tsx//

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext.tsx';
import { Story, Volume, Chapter } from '../../types.ts';
import {
    PlusIcon, TrashIcon, PencilIcon, ArrowPathIcon,
    ArrowUpIcon, ArrowDownIcon, PhotoIcon, ArrowUturnLeftIcon,
    ExclamationTriangleIcon, MagnifyingGlassIcon, CheckIcon // Thêm CheckIcon
} from '@heroicons/react/24/solid';
import { uploadImage } from '../../services/uploadService.ts';
import LoadingSpinner from '../../components/LoadingSpinner.tsx';
import ConfirmationModal from '../../components/ConfirmationModal.tsx'; // Import modal

// Interface cho state xác nhận xóa
interface ConfirmDeleteState {
  isOpen: boolean;
  itemType: 'volume' | 'chapter' | null;
  itemId: string;
  itemTitle: string;
  volumeId?: string; // Cần thiết khi xóa chapter
}

// Component nút di chuyển (không đổi)
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
        className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
        {direction === 'up' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
    </button>
);


const StoryEditPage: React.FC = () => {
    const { storyId } = useParams<{ storyId: string }>();
    const navigate = useNavigate();

    const {
        stories, getStoryById, addStory, updateStory, addVolume, deleteVolume,
        updateVolume, deleteChapterFromVolume, reorderVolumesInStory, reorderChaptersInVolume
    } = useStories();

    // States cho dữ liệu truyện và UI
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
    // State cho modal xác nhận xóa
    const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({
        isOpen: false,
        itemType: null,
        itemId: '',
        itemTitle: '',
    });


    // --- Load dữ liệu truyện ---
    useEffect(() => {
        setLoading(true);
        setError('');
        if (storyId) { // Chỉnh sửa truyện hiện có
            setIsNewStory(false);
            getStoryById(storyId)
                .then(existingStory => {
                    if (existingStory) {
                        setStoryData(existingStory);
                        setTagsInput(existingStory.tags?.join(', ') || '');
                        setAliasInput(existingStory.alias?.join(', ') || '');
                        setAdminChapterSearchTerm(''); // Reset tìm kiếm khi tải
                    } else {
                         setError('Không tìm thấy truyện.');
                         setTimeout(() => navigate('/admin'), 2000); // Điều hướng về dashboard nếu lỗi
                    }
                })
                .catch(() => {
                     setError('Lỗi khi tải dữ liệu truyện.');
                     setTimeout(() => navigate('/admin'), 2000);
                 })
                .finally(() => setLoading(false));
        } else { // Tạo truyện mới
            setIsNewStory(true);
            setStoryData({ // Giá trị mặc định cho truyện mới
                title: '', author: '', alias: [], description: '', coverImage: '',
                tags: [], status: 'Đang dịch', isHot: false, isInBanner: false, volumes: []
            });
            setTagsInput('');
            setAliasInput('');
            setLoading(false);
        }
    }, [storyId, getStoryById, navigate]);

    // --- Đồng bộ volumes từ context (khi chương/tập được cập nhật từ trang khác) ---
    useEffect(() => {
        if (!isNewStory && storyId) {
            const updatedStoryFromContext = stories.find(s => s.id === storyId);
            if (updatedStoryFromContext && JSON.stringify(updatedStoryFromContext.volumes) !== JSON.stringify(storyData.volumes)) {
                console.log("Syncing volumes from context...");
                setStoryData(prev => ({...prev, volumes: updatedStoryFromContext.volumes}));
            }
        }
    }, [stories, storyId, isNewStory, storyData.volumes]);

    // --- Xử lý thay đổi input ---
    const handleStoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setStoryData(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
    };

    const handleStringToArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'tags' | 'alias') => {
        const value = e.target.value;
        (field === 'tags' ? setTagsInput : setAliasInput)(value);
        setStoryData(prev => ({...prev, [field]: value.split(',').map(item => item.trim()).filter(Boolean)}));
    };

    // --- Xử lý tải ảnh bìa ---
    const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Kiểm tra dung lượng và loại file
            if (file.size > 10 * 1024 * 1024) { setError('Ảnh bìa không được vượt quá 10MB.'); return; }
            if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) { setError('Chỉ chấp nhận ảnh định dạng JPG, PNG, GIF, WEBP.'); return; }

            setImageUploading(true);
            setError('');
            try {
                const imageUrl = await uploadImage(file);
                setStoryData(prev => ({ ...prev, coverImage: imageUrl }));
            } catch (error: any) {
                setError('Tải ảnh bìa thất bại: ' + (error.response?.data?.message || error.message));
                console.error(error);
            } finally {
                setImageUploading(false);
            }
        }
    };

    // --- Xử lý submit form truyện ---
    const handleStorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // Validate dữ liệu cơ bản
        if (!storyData.title?.trim() || !storyData.author?.trim() || !storyData.coverImage?.trim()) {
            setError("Tên truyện, Tác giả và Ảnh bìa là bắt buộc.");
            window.scrollTo(0, 0); // Cuộn lên đầu để xem lỗi
            return;
        }
        // Chuẩn bị dữ liệu gửi đi
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
            if (isNewStory) { // Tạo mới
                const newStory = await addStory(submitData);
                alert(`Đã thêm truyện "${newStory.title}" thành công!`);
                navigate(`/admin/story/edit/${newStory.id}`, { replace: true }); // Chuyển sang trang sửa
            } else if(storyId) { // Cập nhật
                const updatedStory = await updateStory(storyId, submitData);
                alert(`Đã cập nhật truyện "${updatedStory.title}" thành công!`);
                // Cập nhật state và input nếu slug thay đổi (dẫn đến ID thay đổi)
                 setStoryData(updatedStory);
                 setTagsInput(updatedStory.tags?.join(', ') || '');
                 setAliasInput(updatedStory.alias?.join(', ') || '');
                 if (updatedStory.id !== storyId) { // Nếu ID thay đổi do slug
                    navigate(`/admin/story/edit/${updatedStory.id}`, { replace: true });
                 }
            }
        } catch(err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Lưu thất bại. Vui lòng thử lại.';
            setError(errorMessage);
            window.scrollTo(0, 0);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Quản lý Modal Xác nhận Xóa ---
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
                // alert(`Đã xóa tập "${confirmDelete.itemTitle}".`); // Thay bằng toast/notification nếu muốn
            } else if (confirmDelete.itemType === 'chapter' && confirmDelete.volumeId) {
                await deleteChapterFromVolume(storyId, confirmDelete.volumeId, confirmDelete.itemId);
                // alert(`Đã xóa chương "${confirmDelete.itemTitle}".`);
            }
        } catch (err) {
            alert(`Xóa ${confirmDelete.itemType === 'volume' ? 'tập' : 'chương'} thất bại.`);
            console.error(err);
        }
        // Modal tự đóng khi confirm
    };

    // --- Các hàm xử lý Volume và Chapter ---
    const handleChapterDelete = useCallback((volumeId: string, chapterId: string, chapterTitle: string) => {
        openConfirmation('chapter', chapterId, chapterTitle, volumeId);
    }, []);

    const handleAddVolume = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (storyId && newVolumeTitle.trim()) {
             try {
                 await addVolume(storyId, newVolumeTitle.trim());
                 setNewVolumeTitle(''); // Xóa input sau khi thêm thành công
             } catch (err) { alert('Thêm tập thất bại.'); }
        }
    }, [storyId, newVolumeTitle, addVolume]);

    const handleVolumeDelete = useCallback((volumeId: string, volumeTitle: string) => {
        openConfirmation('volume', volumeId, volumeTitle);
    }, []);

    const handleVolumeTitleChange = useCallback(async (volumeId: string) => {
        const currentVolume = storyData.volumes?.find(v => v.id === volumeId);
        const newTitle = prompt("Nhập tên tập mới:", currentVolume?.title || ''); // Dùng prompt đơn giản
        if (storyId && newTitle !== null && newTitle.trim() !== '' && newTitle.trim() !== currentVolume?.title) {
             try { await updateVolume(storyId, volumeId, newTitle.trim()); } catch (err) { alert('Đổi tên tập thất bại.'); }
        }
    }, [storyId, storyData.volumes, updateVolume]);

    // --- Hàm di chuyển Tập/Chương ---
    const handleMove = useCallback(async (direction: 'up' | 'down', type: 'volume' | 'chapter', ids: { volumeId?: string; chapterId?: string }) => {
        if (!storyId || !storyData.volumes) return;
        try {
            if (type === 'volume' && ids.volumeId) { // Di chuyển Volume
                const index = storyData.volumes.findIndex(v => v.id === ids.volumeId);
                if ((direction === 'up' && index > 0) || (direction === 'down' && index < storyData.volumes.length - 1)) {
                    const newIndex = direction === 'up' ? index - 1 : index + 1;
                    const newVolumes = [...storyData.volumes];
                    [newVolumes[index], newVolumes[newIndex]] = [newVolumes[newIndex], newVolumes[index]]; // Hoán đổi vị trí
                    await reorderVolumesInStory(storyId, newVolumes.map(v => v.id)); // Gọi API
                }
            } else if (type === 'chapter' && ids.volumeId && ids.chapterId) { // Di chuyển Chapter
                const volume = storyData.volumes.find(v => v.id === ids.volumeId);
                if (!volume) return;
                const index = volume.chapters.findIndex(c => c.id === ids.chapterId);
                if ((direction === 'up' && index > 0) || (direction === 'down' && index < volume.chapters.length - 1)) {
                    const newIndex = direction === 'up' ? index - 1 : index + 1;
                    const newChapters = [...volume.chapters];
                    [newChapters[index], newChapters[newIndex]] = [newChapters[newIndex], newChapters[index]];
                    await reorderChaptersInVolume(storyId, ids.volumeId, newChapters.map(c => c.id)); // Gọi API
                }
            }
        } catch (err) {
            alert('Thay đổi thứ tự thất bại.');
            // Cân nhắc fetch lại data để đồng bộ nếu lỗi
        }
    }, [storyId, storyData.volumes, reorderVolumesInStory, reorderChaptersInVolume]);

    // --- Lọc danh sách chương/tập theo từ khóa tìm kiếm ---
    const filteredVolumes = useMemo(() => {
        if (!storyData.volumes) return [];
        if (!adminChapterSearchTerm.trim()) {
            return storyData.volumes; // Trả về tất cả nếu không tìm kiếm
        }
        const searchTerm = adminChapterSearchTerm.toLowerCase();
        // Lọc chương trong mỗi tập, sau đó lọc những tập không có chương nào khớp
        return storyData.volumes.map(vol => ({
            ...vol,
            chapters: vol.chapters.filter(chap => chap.title.toLowerCase().includes(searchTerm))
        })).filter(vol => vol.chapters.length > 0); // Chỉ giữ lại tập có chương khớp
    }, [storyData.volumes, adminChapterSearchTerm]);

    // --- Styles dùng chung ---
    const inputStyles = "w-full p-2.5 border rounded-lg bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-150 shadow-sm";
    const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

    // --- Loading state ---
    if (loading) return <div className="flex justify-center items-center h-screen -mt-16"><LoadingSpinner size="lg"/></div>;

    // --- Error state (nếu không load được truyện) ---
     if (error && !storyData.title && !isNewStory) {
         return (
             <div className="max-w-xl mx-auto text-center py-16 px-6 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700/50">
                 <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-400 mb-4"/>
                <p className="text-lg font-semibold text-red-700 dark:text-red-200 mb-2">Đã xảy ra lỗi</p>
                <p className="text-red-600 dark:text-red-300">{error}</p>
                 <button onClick={() => navigate('/admin')} className="mt-6 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium">
                    Quay lại Dashboard
                </button>
             </div>
         );
     }

    // --- RENDER UI ---
    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div>
                     <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors mb-1 group">
                         <ArrowUturnLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-200" />
                         Quay lại Dashboard
                     </button>
                    <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white leading-tight">
                        {isNewStory ? 'Thêm Truyện Mới' : `Chỉnh Sửa: ${storyData.title || '...'}`}
                    </h1>
                 </div>
                 {/* Nút lưu chính (sticky trên desktop) */}
                 <div className="sm:sticky sm:top-20 sm:z-10">
                     <button
                        form="storyForm" // Liên kết với form bên dưới
                        type="submit"
                        disabled={isSaving || imageUploading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
                        {isNewStory ? 'Lưu Truyện' : 'Cập nhật Thông Tin'}
                    </button>
                 </div>
            </div>

            {/* Thông báo lỗi */}
            {error && (
                 <div className="p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r-lg flex items-center gap-3 text-sm text-red-700 dark:text-red-300 shadow-sm">
                    <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0"/>
                    <span className="font-medium">{error}</span>
                 </div>
             )}

            {/* Form thông tin truyện */}
            <form id="storyForm" onSubmit={handleStorySubmit} className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-lg space-y-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-3 mb-6 text-slate-800 dark:text-slate-200">Thông tin cơ bản</h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
                    {/* Ảnh bìa */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-1.5">
                        <label className={labelStyles}>Ảnh bìa *</label>
                        <div className="aspect-[2/3] relative border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg flex items-center justify-center text-center p-2 bg-slate-50 dark:bg-slate-700/20 group">
                             {/* Loading overlay */}
                             {imageUploading && (
                                <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 flex flex-col items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                                    <LoadingSpinner size="md" />
                                    <span className="text-xs mt-2 text-slate-500 dark:text-slate-400">Đang tải lên...</span>
                                </div>
                             )}
                             {/* Ảnh preview hoặc placeholder */}
                            {storyData.coverImage ? (
                                <img src={storyData.coverImage} alt="Preview" className="max-h-full w-auto object-contain rounded-md mx-auto shadow-md"/>
                             ) : (
                                <div className="text-slate-400 dark:text-slate-500 space-y-1">
                                    <PhotoIcon className="h-10 w-10 mx-auto"/>
                                    <p className="text-xs font-medium">Chọn hoặc kéo thả ảnh</p>
                                </div>
                             )}
                             {/* Nút upload ẩn và overlay */}
                             <label htmlFor="coverImage" className="absolute inset-0 cursor-pointer bg-black/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 rounded-lg">
                                <PencilIcon className="h-7 w-7 mb-1"/>
                                <span className="text-xs font-medium">Thay đổi ảnh</span>
                             </label>
                             <input id="coverImage" name="coverImage" type="file" className="sr-only" onChange={handleCoverImageChange} accept="image/jpeg,image/png,image/gif,image/webp" />
                        </div>
                         <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">JPG, PNG, GIF, WEBP. Tối đa 10MB.</p>
                    </div>
                     {/* Các input khác */}
                    <div className="md:col-span-8 lg:col-span-9 space-y-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div><label htmlFor="title" className={labelStyles}>Tên truyện *</label><input id="title" name="title" value={storyData.title || ''} onChange={handleStoryChange} required className={inputStyles} /></div>
                             <div><label htmlFor="author" className={labelStyles}>Tác giả *</label><input id="author" name="author" value={storyData.author || ''} onChange={handleStoryChange} required className={inputStyles} /></div>
                        </div>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div><label htmlFor="alias" className={labelStyles}>Tên khác <span className="text-xs font-normal text-slate-400">(cách nhau bởi dấu phẩy)</span></label><input id="alias" name="alias" value={aliasInput} onChange={(e) => handleStringToArrayChange(e, 'alias')} className={inputStyles} /></div>
                            <div><label htmlFor="tags" className={labelStyles}>Tags <span className="text-xs font-normal text-slate-400">(cách nhau bởi dấu phẩy)</span></label><input id="tags" name="tags" value={tagsInput} onChange={(e) => handleStringToArrayChange(e, 'tags')} className={inputStyles} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                             <div>
                                <label htmlFor="status" className={labelStyles}>Trạng thái</label>
                                <select id="status" name="status" value={storyData.status} onChange={handleStoryChange} className={inputStyles}>
                                    <option value="Đang dịch">Đang dịch</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                </select>
                             </div>
                             {/* Checkbox Hot và Banner */}
                             <div className="flex flex-col justify-end space-y-3 pt-2 sm:pt-0">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" id="isHot" name="isHot" checked={!!storyData.isHot} onChange={handleStoryChange} className="h-4 w-4 text-red-600 border-slate-300 dark:border-slate-500 rounded focus:ring-red-500 bg-white dark:bg-slate-700/50" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300 select-none">Đánh dấu "Hot" (Nổi bật)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" id="isInBanner" name="isInBanner" checked={!!storyData.isInBanner} onChange={handleStoryChange} className="h-4 w-4 text-amber-600 border-slate-300 dark:border-slate-500 rounded focus:ring-amber-500 bg-white dark:bg-slate-700/50" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300 select-none">Hiển thị trên Banner</span>
                                </label>
                            </div>
                        </div>
                        {/* Mô tả */}
                        <div><label htmlFor="description" className={labelStyles}>Mô tả</label><textarea id="description" name="description" value={storyData.description || ''} onChange={handleStoryChange} rows={6} className={inputStyles + " min-h-[100px]"}></textarea></div>
                    </div>
                </div>
                {/* Nút lưu cho màn hình nhỏ */}
                <div className="sm:hidden pt-4 border-t border-slate-200 dark:border-slate-700">
                     <button type="submit" disabled={isSaving || imageUploading} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow disabled:opacity-70 disabled:cursor-not-allowed">
                        {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
                        {isNewStory ? 'Lưu Truyện' : 'Cập nhật thông tin'}
                    </button>
                 </div>
            </form>

            {/* Quản lý Tập & Chương (chỉ hiển thị khi sửa truyện) */}
            {!isNewStory && storyId && (
                <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-lg space-y-6 border border-slate-200 dark:border-slate-700">
                    {/* Header và ô tìm kiếm */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">Quản lý Tập & Chương</h2>
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="Tìm chương trong danh sách..."
                                value={adminChapterSearchTerm}
                                onChange={e => setAdminChapterSearchTerm(e.target.value)}
                                className={inputStyles + " pl-10 text-sm"} // Thêm padding trái
                            />
                             <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Form thêm tập */}
                    <form onSubmit={handleAddVolume} className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <input type="text" value={newVolumeTitle} onChange={(e) => setNewVolumeTitle(e.target.value)} placeholder="Tên tập mới (ví dụ: Tập 1: Mở Đầu)" className={inputStyles + " flex-grow"} required />
                        <button type="submit" className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800"><PlusIcon className="h-4 w-4"/> Thêm Tập</button>
                    </form>

                    {/* Danh sách tập và chương */}
                    <div className="space-y-5">
                        {filteredVolumes && filteredVolumes.length > 0 ? filteredVolumes.map((vol, volIndex) => (
                            <div key={vol.id} className="border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
                                {/* Header Tập */}
                                <div className="flex flex-wrap justify-between items-center gap-2 p-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-700/70 border-b border-slate-200 dark:border-slate-600">
                                    <div className="flex items-center gap-2">
                                        {/* Nút di chuyển tập */}
                                         <div className="flex flex-col bg-white dark:bg-slate-600 p-0.5 rounded border border-slate-200 dark:border-slate-500">
                                            <MoveButton direction="up" disabled={volIndex === 0} onClick={() => handleMove('up', 'volume', { volumeId: vol.id })} ariaLabel={`Di chuyển tập ${vol.title} lên trên`} />
                                            <div className="h-px bg-slate-200 dark:bg-slate-500 my-0.5"></div>
                                            <MoveButton direction="down" disabled={volIndex === (storyData.volumes?.length ?? 1) - 1} onClick={() => handleMove('down', 'volume', { volumeId: vol.id })} ariaLabel={`Di chuyển tập ${vol.title} xuống dưới`} />
                                        </div>
                                        <span className="font-semibold text-base text-slate-800 dark:text-slate-100">{vol.title}</span>
                                    </div>
                                    {/* Nút hành động tập */}
                                    <div className="flex items-center gap-1.5">
                                        <Link
                                            to={`/admin/story/${storyId}/volume/${vol.id}/chapter/new`}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
                                            title="Thêm chương mới"
                                        >
                                            <PlusIcon className="h-3.5 w-3.5"/> <span className="hidden sm:inline">Chương</span>
                                        </Link>
                                        <button title={`Sửa tên tập`} onClick={() => handleVolumeTitleChange(vol.id)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-300 dark:text-slate-400 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400">
                                            <PencilIcon className="h-4 w-4"/>
                                        </button>
                                        <button title={`Xóa tập`} onClick={() => handleVolumeDelete(vol.id, vol.title)} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400">
                                            <TrashIcon className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>
                                {/* Danh sách chương trong tập */}
                                <div className="bg-white dark:bg-slate-800/50">
                                    {vol.chapters && vol.chapters.length > 0 ? (
                                        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {vol.chapters.map((chap, chapIndex) => (
                                            <li key={chap.id} className="flex justify-between items-center p-2 pl-3 group hover:bg-orange-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                                                {/* Tên chương và nút di chuyển */}
                                                <div className="flex items-center gap-2 min-w-0">
                                                     <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                        <MoveButton direction="up" disabled={chapIndex === 0} onClick={() => handleMove('up', 'chapter', { volumeId: vol.id, chapterId: chap.id })} ariaLabel={`Di chuyển chương ${chap.title} lên trên`} />
                                                        <MoveButton direction="down" disabled={chapIndex === vol.chapters.length - 1} onClick={() => handleMove('down', 'chapter', { volumeId: vol.id, chapterId: chap.id })} ariaLabel={`Di chuyển chương ${chap.title} xuống dưới`} />
                                                    </div>
                                                    <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate" title={chap.title}>{chap.title}</span>
                                                     {chap.isRaw && <span className="ml-1.5 flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300 rounded-full">RAW</span>}
                                                </div>
                                                {/* Nút hành động chương */}
                                                <div className="flex-shrink-0 flex items-center gap-1 ml-2">
                                                    <Link title={`Sửa chương`} to={`/admin/story/${storyId}/volume/${vol.id}/chapter/edit/${chap.id}`} className="p-1.5 rounded-full text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400">
                                                        <PencilIcon className="h-4 w-4"/>
                                                    </Link>
                                                    <button title={`Xóa chương`} onClick={() => handleChapterDelete(vol.id, chap.id, chap.title)} className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400">
                                                        <TrashIcon className="h-4 w-4"/>
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                        </ul>
                                    ) : (
                                         adminChapterSearchTerm
                                             ? <p className="text-center text-xs italic text-slate-500 dark:text-slate-400 py-3 px-2">Không có chương nào khớp trong tập này.</p>
                                             : <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4 px-2">Chưa có chương nào.</p>
                                     )}
                                </div>
                            </div>
                        )) : (
                             <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                                {adminChapterSearchTerm ? 'Không tìm thấy tập/chương nào phù hợp.' : 'Chưa có tập nào được thêm.'}
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
                isDestructive={true} // Nút confirm màu đỏ
            />
        </div>
    );
};

export default StoryEditPage;
