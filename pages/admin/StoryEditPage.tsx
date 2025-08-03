// pages/admin/StoryEditPage.tsx

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StoryContext } from '../../contexts/StoryContext';
import { Story, Volume } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth

const StoryEditPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const isNewStory = !storyId;
  const navigate = useNavigate();
  const { token } = useAuth(); // Lấy token để xác thực
  const { getStory, addStory, updateStory, addVolume, deleteVolume, stories } = useContext(StoryContext);

  const [storyData, setStoryData] = useState<Partial<Story>>({
    title: '',
    author: '',
    alias: '', // Sửa: Khởi tạo là chuỗi rỗng
    description: '',
    coverImage: '',
    status: 'ongoing',
    tags: [],
    isHot: false,
    isInBanner: false,
  });

  const [loading, setLoading] = useState(!isNewStory);
  const [isUploading, setIsUploading] = useState(false);
  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  
  // Lấy thông tin Cloudinary từ file .env
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (!isNewStory && storyId) {
      const story = getStory(storyId);
      if (story) {
        setStoryData(story);
        setLoading(false);
      } else {
        // Nếu không tìm thấy story trong context, có thể nó chưa được tải
        // Bạn có thể thêm logic fetch story theo id ở đây nếu cần
        // Tạm thời chỉ báo lỗi và quay về
        toast.error("Không tìm thấy truyện!");
        navigate('/admin');
      }
    }
  }, [storyId, isNewStory, getStory, navigate, stories]);

  // --- HÀM XỬ LÝ THAY ĐỔI DỮ LIỆU ---
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Xử lý checkbox riêng
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setStoryData(prev => ({ ...prev, [name]: checked }));
    } else {
        setStoryData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Hàm xử lý riêng cho tags
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag); // Lọc bỏ tag rỗng
    setStoryData(prev => ({ ...prev, tags: tagsArray }));
  };

  // Hàm xử lý upload ảnh
  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        toast.error("Lỗi cấu hình Cloudinary. Vui lòng kiểm tra file .env");
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
        toast.error(`Lỗi tải ảnh: ${error.message}`, { id: uploadToastId });
    } finally {
        setIsUploading(false);
    }
  };

  // --- HÀM SUBMIT FORM ---
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyData.title || !storyData.author) {
      toast.error("Tiêu đề và tác giả là bắt buộc.");
      return;
    }
    
    let promise;
    if (isNewStory) {
        promise = addStory(storyData as Story); // `addStory` đã được sửa để có token
        toast.promise(promise, {
            loading: 'Đang thêm truyện...',
            success: (newStory) => {
                navigate(`/admin/story/edit/${newStory.id}`);
                return 'Thêm truyện thành công!';
            },
            error: (err) => `Thêm truyện thất bại: ${err.message}`,
        });
    } else if (storyId) {
        promise = updateStory(storyId, storyData); // `updateStory` đã được sửa để có token
        toast.promise(promise, {
            loading: 'Đang cập nhật...',
            success: 'Cập nhật thành công!',
            error: (err) => `Cập nhật thất bại: ${err.message}`,
        });
    }
  };

  // --- HÀM XỬ LÝ VOLUME ---
  
  const handleAddVolume = async () => {
    if (!newVolumeTitle.trim() || !storyId) return;
    const promise = addVolume(storyId, newVolumeTitle);
    toast.promise(promise, {
        loading: 'Đang thêm tập...',
        success: () => { setNewVolumeTitle(''); return 'Thêm tập thành công!'; },
        error: (err) => `Thêm tập thất bại: ${err.message}`,
    });
  };
  
  const handleVolumeDelete = (volumeId: string) => {
    if (!storyId) return;
    if (window.confirm('Bạn có chắc muốn xóa tập này? Tất cả các chương trong tập cũng sẽ bị xóa.')) {
        const promise = deleteVolume(storyId, volumeId);
        toast.promise(promise, {
            loading: 'Đang xóa tập...',
            success: 'Xóa tập thành công!',
            error: (err) => `Xóa tập thất bại: ${err.message}`,
        });
    }
  }

  // --- RENDER ---

  if (loading) return <LoadingSpinner />;

  const inputStyles = "w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors";
  const labelStyles = "block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 animate-fade-in">
      <div>
        <Link to="/admin" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2">
            <ArrowUturnLeftIcon className="h-4 w-4" />
            Quay lại Bảng điều khiển
        </Link>
        <h1 className="text-3xl font-bold font-serif">{isNewStory ? 'Thêm Truyện Mới' : `Chỉnh Sửa: ${storyData.title}`}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <label className={labelStyles}>Ảnh bìa</label>
                <div className="mt-1 flex flex-col items-center justify-center p-4 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md text-center">
                    {storyData.coverImage ? (
                        <img src={storyData.coverImage} alt="Preview" className="mb-4 h-48 w-auto object-contain rounded-md shadow-md"/>
                    ) : (
                        <div className="text-slate-500 mb-4">Chưa có ảnh</div>
                    )}
                    <label htmlFor="coverImage" className="relative cursor-pointer bg-slate-200 dark:bg-slate-700 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 p-2 text-sm">
                        <span>{isUploading ? 'Đang tải...' : 'Tải ảnh từ máy'}</span>
                        <input id="coverImage" name="coverImage" type="file" className="sr-only" onChange={handleCoverImageChange} accept="image/*" disabled={isUploading} />
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Hoặc dán link vào ô dưới</p>
                </div>
                <input type="text" name="coverImage" placeholder="Dán link ảnh vào đây" value={storyData.coverImage || ''} onChange={handleChange} className={`mt-2 ${inputStyles}`} disabled={isUploading} />
            </div>
            <div className="md:col-span-2 space-y-4">
                <input name="title" value={storyData.title || ''} onChange={handleChange} placeholder="Tên truyện" required className={inputStyles} />
                <input name="author" value={storyData.author || ''} onChange={handleChange} placeholder="Tác giả" required className={inputStyles} />
                
                {/* --- INPUT ALIAS ĐÃ SỬA --- */}
                <input name="alias" value={storyData.alias || ''} onChange={handleChange} placeholder="Tên khác (nếu có)" className={inputStyles} />
                
                {/* --- INPUT TAGS ĐÃ SỬA --- */}
                <input name="tags" value={storyData.tags?.join(', ') || ''} onChange={handleTagsChange} placeholder="Tags (cách nhau bằng dấu phẩy)" className={inputStyles} />
                
                <div className="flex items-center gap-4">
                    <select name="status" value={storyData.status} onChange={handleChange} className={`${inputStyles} flex-grow`}>
                        <option value="ongoing">Đang tiến hành</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="dropped">Tạm ngưng</option>
                    </select>
                    <div className="flex items-center space-x-2"><input type="checkbox" id="isHot" name="isHot" checked={!!storyData.isHot} onChange={handleChange} className="h-4 w-4 rounded" /><label htmlFor="isHot">Hot</label></div>
                    <div className="flex items-center space-x-2"><input type="checkbox" id="isInBanner" name="isInBanner" checked={!!storyData.isInBanner} onChange={handleChange} className="h-4 w-4 rounded" /><label htmlFor="isInBanner">Banner</label></div>
                </div>
            </div>
        </div>
        <textarea name="description" value={storyData.description || ''} onChange={handleChange} placeholder="Mô tả" rows={5} className={inputStyles}></textarea>
        <button type="submit" className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-md">
            {isNewStory ? 'Lưu và Tạo Truyện' : 'Cập nhật thông tin'}
        </button>
      </form>
      
      {/* Phần quản lý Volume chỉ hiển thị khi sửa truyện */}
      {!isNewStory && (
        <div className="mt-8 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Quản lý Tập & Chương</h2>
            <div className="flex gap-2 mb-4">
                <input type="text" value={newVolumeTitle} onChange={(e) => setNewVolumeTitle(e.target.value)} placeholder="Tên tập mới" className={`flex-grow ${inputStyles}`} />
                <button type="button" onClick={handleAddVolume} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 shadow-md"><PlusIcon className="h-5 w-5"/>Thêm Tập</button>
            </div>
            
            <div className="space-y-4">
                {storyData.volumes?.map((volume: Volume) => (
                    <div key={volume.id} className="p-4 border rounded-md dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">{volume.title}</h3>
                            <div className="flex gap-2">
                                <Link to={`/admin/story/${storyId}/volume/${volume.id}/chapter/new`} className="p-2 text-blue-500 hover:text-blue-700" title="Thêm chương mới"><PlusIcon className="h-5 w-5"/></Link>
                                <button onClick={() => alert('Chức năng sửa tên tập sẽ được thêm sau!')} className="p-2 text-slate-500 hover:text-slate-700" title="Sửa tên tập"><PencilIcon className="h-5 w-5"/></button>
                                <button onClick={() => handleVolumeDelete(volume.id)} className="p-2 text-red-500 hover:text-red-700" title="Xóa tập"><TrashIcon className="h-5 w-5"/></button>
                            </div>
                        </div>
                        
                        <ul className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-600 ml-2">
                            {volume.chapters.length > 0 ? volume.chapters.map(chapter => (
                                <li key={chapter.id} className="flex justify-between items-center text-sm">
                                    <span>{chapter.title}</span>
                                    <div className="flex gap-2">
                                        <Link to={`/admin/story/${storyId}/volume/${volume.id}/chapter/edit/${chapter.id}`} className="p-1 text-slate-500 hover:text-slate-700" title="Sửa chương"><PencilIcon className="h-4 w-4"/></Link>
                                    </div>
                                </li>
                            )) : (
                                <li className="text-sm text-slate-500 italic">Chưa có chương nào trong tập này.</li>
                            )}
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