import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext';
import { Story, Volume } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const StoryEditPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const isNewStory = !storyId;
  const navigate = useNavigate();
  const { getStory, addStory, updateStory, addVolume, deleteVolume } = useStories();

  const [storyData, setStoryData] = useState<Partial<Story>>({
    title: '',
    author: '',
    alias: [],
    description: '',
    coverImage: '',
    status: 'ongoing',
    tags: [],
    volumes: [],
    isHot: false,
    isInBanner: false,
  });
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [newVolumeTitle, setNewVolumeTitle] = useState('');

  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (!isNewStory) {
      const story = getStory(storyId);
      if (story) {
        setStoryData(story);
      }
    }
    setLoading(false);
  }, [storyId, getStory, isNewStory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    setStoryData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStoryData(prev => ({ ...prev, [name]: value.split(',').map(item => item.trim()) }));
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        toast.error("Lỗi cấu hình Cloudinary.");
        return;
    }
    setIsUploading(true);
    const uploadToastId = toast.loading('Đang tải ảnh lên...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'Tải ảnh thất bại.');
        setStoryData(prev => ({ ...prev, coverImage: result.secure_url }));
        toast.success('Tải ảnh thành công!', { id: uploadToastId });
    } catch (error: any) {
        toast.error(error.message, { id: uploadToastId });
    } finally {
        setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyData.title || !storyData.author) {
      toast.error("Tiêu đề và tác giả là bắt buộc.");
      return;
    }
    // Đảm bảo storyId được truyền đúng
    if (!isNewStory && storyId) {
        const promise = updateStory(storyId, storyData);
        toast.promise(promise, {
            loading: 'Đang cập nhật...',
            success: 'Cập nhật thành công!',
            error: 'Cập nhật thất bại.',
        });
    } else {
        const promise = addStory(storyData as any);
        toast.promise(promise, {
            loading: 'Đang thêm truyện...',
            success: (result) => {
                navigate(`/admin/story/edit/${result.id}`);
                return 'Thêm truyện thành công!';
            },
            error: 'Thêm truyện thất bại.',
        });
    }
  };

  const handleAddVolume = async () => {
    if (!newVolumeTitle.trim() || !storyId) return;
    const promise = addVolume(storyId, newVolumeTitle);
    toast.promise(promise, {
        loading: 'Đang thêm tập...',
        success: () => { setNewVolumeTitle(''); return 'Thêm tập thành công!'; },
        error: 'Thêm tập thất bại.',
    });
  };
  
  const handleVolumeDelete = (volumeId: string) => {
    if (!storyId) return;
    if (window.confirm('Bạn có chắc muốn xóa tập này?')) {
        const promise = deleteVolume(storyId, volumeId);
        toast.promise(promise, {
            loading: 'Đang xóa...',
            success: 'Xóa tập thành công!',
            error: 'Xóa tập thất bại.'
        });
    }
  }

  if (loading) return <LoadingSpinner />;

  const inputStyles = "w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600";

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <h1 className="text-3xl font-bold font-serif">{isNewStory ? 'Thêm Truyện Mới' : `Chỉnh Sửa: ${storyData.title}`}</h1>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                {/* Image Upload UI */}
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ảnh bìa</label>
                <div className="mt-1 flex flex-col items-center justify-center p-4 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md text-center">
                    {storyData.coverImage && <img src={storyData.coverImage} alt="Preview" className="mb-4 h-48 w-auto object-contain rounded-md"/>}
                    <label htmlFor="coverImage" className="relative cursor-pointer bg-white dark:bg-slate-700 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 p-2">
                        <span>{isUploading ? 'Đang tải...' : 'Tải ảnh lên'}</span>
                        <input id="coverImage" name="coverImage" type="file" className="sr-only" onChange={handleCoverImageChange} accept="image/*" disabled={isUploading} />
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Hoặc dán link vào ô dưới</p>
                </div>
                <input type="text" name="coverImage" placeholder="Dán link ảnh vào đây" value={storyData.coverImage || ''} onChange={handleChange} className={`mt-2 ${inputStyles}`} disabled={isUploading} />
            </div>
            <div className="md:col-span-2 space-y-4">
                <input name="title" value={storyData.title || ''} onChange={handleChange} placeholder="Tên truyện" required className={inputStyles} />
                <input name="author" value={storyData.author || ''} onChange={handleChange} placeholder="Tác giả" required className={inputStyles} />
                <input name="alias" value={storyData.alias?.join(', ')} onChange={handleArrayChange} placeholder="Tên khác (cách nhau bởi dấu phẩy)" className={inputStyles} />
                <input name="tags" value={storyData.tags?.join(', ')} onChange={handleArrayChange} placeholder="Tags (cách nhau bằng dấu phẩy)" className={inputStyles} />
                <div className="flex items-center gap-4">
                    <select name="status" value={storyData.status} onChange={handleChange} className={`${inputStyles} flex-grow`}>
                        <option value="ongoing">Đang tiến hành</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="dropped">Tạm ngưng</option>
                    </select>
                    <div className="flex items-center space-x-2"><input type="checkbox" id="isHot" name="isHot" checked={!!storyData.isHot} onChange={handleChange} /><label htmlFor="isHot">"Hot"</label></div>
                    <div className="flex items-center space-x-2"><input type="checkbox" id="isInBanner" name="isInBanner" checked={!!storyData.isInBanner} onChange={handleChange} /><label htmlFor="isInBanner">Banner</label></div>
                </div>
            </div>
        </div>
        <textarea name="description" value={storyData.description || ''} onChange={handleChange} placeholder="Mô tả" rows={4} className={inputStyles}></textarea>
        <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-opacity">
            {isNewStory ? 'Lưu Truyện' : 'Cập nhật thông tin'}
        </button>
      </form>
      {!isNewStory && (
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Quản lý Tập & Chương</h2>
            {/* Add new volume */}
            <div className="flex gap-2 mb-4">
                <input type="text" value={newVolumeTitle} onChange={(e) => setNewVolumeTitle(e.target.value)} placeholder="Tên tập mới" className={`flex-grow ${inputStyles}`} />
                <button type="button" onClick={handleAddVolume} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"><PlusIcon className="h-5 w-5"/>Thêm</button>
            </div>
            {/* List volumes */}
            <div className="space-y-4">
                {storyData.volumes?.map((volume: Volume) => (
                    <div key={volume.id} className="p-4 border rounded-md dark:border-gray-600">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">{volume.title}</h3>
                            <div className="flex gap-2">
                                <Link to={`/admin/story/${storyId}/chapter/new?volumeId=${volume.id}`} className="p-2 text-blue-500 hover:text-blue-700"><PlusIcon className="h-5 w-5"/></Link>
                                <button onClick={() => alert('Chức năng sửa tên tập sẽ được thêm sau!')} className="p-2 text-gray-500 hover:text-gray-700"><PencilIcon className="h-5 w-5"/></button>
                                <button onClick={() => handleVolumeDelete(volume.id)} className="p-2 text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                            </div>
                        </div>
                        {/* List chapters */}
                        <ul className="space-y-2 pl-4">
                            {volume.chapters.map(chapter => (
                                <li key={chapter.id} className="flex justify-between items-center">
                                    <span>{chapter.title}</span>
                                    <div className="flex gap-2">
                                        <Link to={`/admin/story/${storyId}/chapter/${chapter.id}/edit?volumeId=${volume.id}`} className="p-1 text-gray-500 hover:text-gray-700"><PencilIcon className="h-5 w-5"/></Link>
                                        <button onClick={() => alert('Chức năng xóa chương sẽ được thêm sau!')} className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditPage;
