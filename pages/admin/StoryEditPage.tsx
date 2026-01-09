// src/pages/admin/StoryEditPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext';
import { Story, Volume, Chapter } from '../../types';
import {
    PlusIcon, TrashIcon, PencilIcon, ArrowPathIcon,
    ArrowUpIcon, ArrowDownIcon, PhotoIcon, ArrowUturnLeftIcon,
    ExclamationTriangleIcon, MagnifyingGlassIcon, CheckIcon, DocumentTextIcon
} from '@heroicons/react/24/solid';
import { uploadImage } from '../../services/uploadService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmationModal from '../../components/ConfirmationModal'; 

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

    // --- ĐÃ XÓA USE_EFFECT ĐỒNG BỘ CONTEXT GÂY LỖI ---
    // Trước đây có 1 useEffect ở đây để sync từ context 'stories',
    // nhưng nó gây ra lỗi ghi đè dữ liệu thiếu chapters khi reload trang.

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
                // Sau khi xóa thành công, cần cập nhật lại state storyData để UI phản hồi ngay
                // Cách đơn giản nhất là gọi lại getStoryById hoặc filter tay trên state hiện tại
                setStoryData(prev => ({
                    ...prev,
                    volumes: prev.volumes?.filter(v => v.id !== confirmDelete.itemId)
                }));
            } else if (confirmDelete.itemType === 'chapter' && confirmDelete.volumeId) {
                await deleteChapterFromVolume(storyId, confirmDelete.volumeId, confirmDelete.itemId);
                // Cập nhật UI tay để không cần reload
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
            console.error(err);
        }
        // Modal tự đóng khi confirm (do logic trong ConfirmationModal component hoặc set isOpen false ở đây nếu cần)
        closeConfirmation();
    };

    // --- Các hàm xử lý Volume và Chapter ---
    const handleChapterDelete = useCallback((volumeId: string, chapterId: string, chapterTitle: string) => {
        openConfirmation('chapter', chapterId, chapterTitle, volumeId);
    }, []);

    const handleAddVolume = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (storyId && newVolumeTitle.trim()) {
             try {
                 const newVol = await addVolume(storyId, newVolumeTitle.trim());
                 setNewVolumeTitle(''); 
                 // Cập nhật UI ngay lập tức
                 setStoryData(prev => ({
                     ...prev,
                     volumes: [...(prev.volumes || []), { ...newVol, chapters: [] }] // API trả về volume mới chưa có chapter
                 }));
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
                 // Update UI
                 setStoryData(prev => ({
                    ...prev,
                    volumes: prev.volumes?.map(v => v.id === volumeId ? { ...v, title: newTitle.trim() } : v)
                 }));
             } catch (err) { alert('Đổi tên tập thất bại.'); }
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
                    
                    // Optimistic update (Cập nhật UI trước)
                    setStoryData(prev => ({ ...prev, volumes: newVolumes }));
                    
                    await reorderVolumesInStory(storyId, newVolumes.map(v => v.id)); // Gọi API
                }
            } else if (type === 'chapter' && ids.volumeId && ids.chapterId) { // Di chuyển Chapter
                const volumeIndex = storyData.volumes.findIndex(v => v.id === ids.volumeId);
                const volume = storyData.volumes[volumeIndex];
                if (!volume) return;
                
                const index = volume.chapters.findIndex(c => c.id === ids.chapterId);
                if ((direction === 'up' && index > 0) || (direction === 'down' && index < volume.chapters.length - 1)) {
                    const newIndex = direction === 'up' ? index - 1 : index + 1;
                    const newChapters = [...volume.chapters];
                    [newChapters[index], newChapters[newIndex]] = [newChapters[newIndex], newChapters[index]];
                    
                    // Optimistic update
                    const newVolumes = [...storyData.volumes];
                    newVolumes[volumeIndex] = { ...volume, chapters: newChapters };
                    setStoryData(prev => ({ ...prev, volumes: newVolumes }));

                    await reorderChaptersInVolume(storyId, ids.volumeId, newChapters.map(c => c.id)); // Gọi API
                }
            }
        } catch (err) {
            alert('Thay đổi thứ tự thất bại.');
            // Revert lại state nếu cần thiết (ở đây làm đơn giản thì reload lại page hoặc fetch lại data)
            const freshData = await getStoryById(storyId);
            if(freshData) setStoryData(freshData);
        }
    }, [storyId, storyData.volumes, reorderVolumesInStory, reorderChaptersInVolume, getStoryById]);

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
    const inputStyles = "w-full p-3 border-2 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:border-orange-500 transition-all duration-200 shadow-sm hover:border-slate-400 dark:hover:border-slate-500";
    const labelStyles = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2";

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <div className="flex-1">
                     <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200 mb-3 group">
                         <ArrowUturnLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-200" />
                         Quay lại Dashboard
                     </button>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-slate-900 dark:text-white leading-tight">
                        {isNewStory ? 'Thêm Truyện Mới' : `Chỉnh Sửa: ${storyData.title || '...'}`}
                    </h1>
                    {!isNewStory && storyData.title && (
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Quản lý thông tin và nội dung truyện</p>
                    )}
                 </div>
                 {/* Nút lưu chính (sticky trên desktop) */}
                 <div className="sm:sticky sm:top-20 sm:z-10">
                     <button
                        form="storyForm"
                        type="submit"
                        disabled={isSaving || imageUploading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                    >
                        {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
                        {isNewStory ? 'Lưu Truyện' : 'Cập nhật Thông Tin'}
                    </button>
                 </div>
            </div>

            {/* Thông báo lỗi */}
            {error && (
                 <div className="p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 text-sm text-red-700 dark:text-red-300 shadow-md animate-fade-in">
                    <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 mt-0.5"/>
                    <span className="font-medium flex-1">{error}</span>
                 </div>
             )}

            {/* Form thông tin truyện */}
            <form id="storyForm" onSubmit={handleStorySubmit} className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                        <PencilIcon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Thông tin cơ bản</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
                    {/* Ảnh bìa */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-2">
                        <label className={labelStyles}>Ảnh bìa *</label>
                        <div className="aspect-[2/3] relative border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-2xl flex items-center justify-center text-center p-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/30 dark:to-slate-800/30 group transition-all duration-300 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-lg">
                             {/* Loading overlay */}
                             {imageUploading && (
                                <div className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 flex flex-col items-center justify-center z-10 rounded-2xl backdrop-blur-sm">
                                    <LoadingSpinner size="md" />
                                    <span className="text-sm mt-3 font-medium text-slate-600 dark:text-slate-400">Đang tải lên...</span>
                                </div>
                             )}
                             {/* Ảnh preview hoặc placeholder */}
                            {storyData.coverImage ? (
                                <img src={storyData.coverImage} alt="Preview" className="max-h-full w-auto object-contain rounded-xl mx-auto shadow-xl"/>
                             ) : (
                                <div className="text-slate-400 dark:text-slate-500 space-y-2">
                                    <PhotoIcon className="h-12 w-12 mx-auto"/>
                                    <p className="text-sm font-semibold">Chọn hoặc kéo thả ảnh</p>
                                    <p className="text-xs">JPG, PNG, GIF, WEBP</p>
                                </div>
                             )}
                             {/* Nút upload ẩn và overlay */}
                             <label htmlFor="coverImage" className="absolute inset-0 cursor-pointer bg-gradient-to-br from-black/50 to-black/70 dark:from-black/70 dark:to-black/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all duration-300 rounded-2xl backdrop-blur-sm">
                                <PencilIcon className="h-8 w-8 mb-2"/>
                                <span className="text-sm font-semibold">Thay đổi ảnh</span>
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
                <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 border border-slate-200 dark:border-slate-700">
                    {/* Header và ô tìm kiếm */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 mb-6 border-b-2 border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                                <DocumentTextIcon className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">Quản lý Tập & Chương</h2>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="Tìm chương trong danh sách..."
                                value={adminChapterSearchTerm}
                                onChange={e => setAdminChapterSearchTerm(e.target.value)}
                                className={inputStyles + " pl-10 text-sm"}
                            />
                             <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Form thêm tập */}
                    <form onSubmit={handleAddVolume} className="flex flex-col sm:flex-row gap-3 mb-6 p-5 bg-gradient-to-r from-slate-50 to-orange-50 dark:from-slate-700/30 dark:to-slate-800/30 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md">
                        <input type="text" value={newVolumeTitle} onChange={(e) => setNewVolumeTitle(e.target.value)} placeholder="Tên tập mới (ví dụ: Tập 1: Mở Đầu)" className={inputStyles + " flex-grow"} required />
                        <button type="submit" className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 text-sm transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800 transform hover:scale-105 active:scale-95"><PlusIcon className="h-5 w-5"/> Thêm Tập</button>
                    </form>

                    {/* Danh sách tập và chương */}
                    <div className="space-y-4">
                        {filteredVolumes && filteredVolumes.length > 0 ? filteredVolumes.map((vol, volIndex) => (
                            <div key={vol.id} className="border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700">
                                {/* Header Tập */}
                                <div className="flex flex-wrap justify-between items-center gap-2 p-4 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-700 dark:via-slate-700/80 dark:to-slate-700 border-b-2 border-slate-200 dark:border-slate-600">
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
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 text-xs transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transform hover:scale-105"
                                            title="Thêm chương mới"
                                        >
                                            <PlusIcon className="h-4 w-4"/> <span className="hidden sm:inline">Chương</span>
                                        </Link>
                                        <button title={`Sửa tên tập`} onClick={() => handleVolumeTitleChange(vol.id)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 hover:scale-110">
                                            <PencilIcon className="h-4 w-4"/>
                                        </button>
                                        <button title={`Xóa tập`} onClick={() => handleVolumeDelete(vol.id, vol.title)} className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 hover:scale-110">
                                            <TrashIcon className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>
                                {/* Danh sách chương trong tập */}
                                <div className="bg-white dark:bg-slate-800/50">
                                    {vol.chapters && vol.chapters.length > 0 ? (
                                        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {vol.chapters.map((chap, chapIndex) => (
                                                <li key={chap.id} className="flex justify-between items-center p-3 pl-4 group hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 dark:hover:from-slate-700/50 dark:hover:to-slate-700/30 transition-all duration-200">
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
                                                <div className="flex-shrink-0 flex items-center gap-2 ml-2">
                                                    <Link title={`Sửa chương`} to={`/admin/story/${storyId}/volume/${vol.id}/chapter/edit/${chap.id}`} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:scale-110">
                                                        <PencilIcon className="h-4 w-4"/>
                                                    </Link>
                                                    <button title={`Xóa chương`} onClick={() => handleChapterDelete(vol.id, chap.id, chap.title)} className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 hover:scale-110">
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
