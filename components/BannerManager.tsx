import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import * as storyService from '../services/storyService';
import LoadingSpinner from './LoadingSpinner';
import { 
    TrashIcon, 
    ArrowUpIcon, 
    ArrowDownIcon, 
    PlusIcon, 
    MagnifyingGlassIcon,
    PhotoIcon,
    CheckCircleIcon
} from '@heroicons/react/24/solid';

const BannerManager: React.FC = () => {
  const [bannerStories, setBannerStories] = useState<Story[]>([]);
  const [originalBannerStories, setOriginalBannerStories] = useState<Story[]>([]); // Để so sánh xem có thay đổi không
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // State loading khi lưu
  
  // States cho tìm kiếm (Giữ nguyên)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Story[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allStoriesCache, setAllStoriesCache] = useState<Story[]>([]); 

  // 1. Lấy danh sách Banner
  const fetchBannerStories = async () => {
    try {
      setLoading(true);
      const data = await storyService.getBannerStories();
      // Đảm bảo sắp xếp đúng theo priority từ server về
      const sortedData = data.sort((a, b) => (a.bannerPriority || 0) - (b.bannerPriority || 0));
      setBannerStories(sortedData);
      setOriginalBannerStories(JSON.parse(JSON.stringify(sortedData))); // Deep copy để lưu gốc
    } catch (error) {
      console.error('Lỗi lấy banner:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Lấy toàn bộ truyện 1 lần để phục vụ tìm kiếm nhanh (Client-side search)
  useEffect(() => {
    fetchBannerStories();
    storyService.getAllStories().then(data => setAllStoriesCache(data)).catch(console.error);
  }, []);

  // 3. Xử lý tìm kiếm
  const handleSearch = () => {
    if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
    }
    setIsSearching(true);
    const filtered = allStoriesCache.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !bannerStories.find(b => b.id === s.id)
    );
    setSearchResults(filtered.slice(0, 5));
    setIsSearching(false);
  };

  // 4. Thêm truyện vào Banner (Chỉ thêm vào UI, chưa gọi API ngay)
  const addToBanner = (story: Story) => {
      if (bannerStories.find(s => s.id === story.id)) return;

      const newStory = { ...story, isInBanner: true, bannerPriority: bannerStories.length };
      setBannerStories([...bannerStories, newStory]);
      setSearchResults(prev => prev.filter(s => s.id !== story.id)); 
      setSearchTerm(''); 
  };

  // 5. Xóa truyện khỏi Banner (Chỉ xóa UI)
  const removeFromBanner = (storyId: string) => {
    if (!window.confirm('Gỡ truyện này khỏi danh sách (Cần bấm Lưu để áp dụng)?')) return;
    setBannerStories(prev => prev.filter(s => s.id !== storyId));
  };

  // 6. Đổi thứ tự (Chỉ đổi State)
  const swapPriority = (index1: number, index2: number) => {
      const newStories = [...bannerStories];
      [newStories[index1], newStories[index2]] = [newStories[index2], newStories[index1]];
      // Cập nhật lại priority ảo cho UI nếu cần, thực tế API sẽ dùng index mảng
      setBannerStories(newStories);
  };

  // 7. HÀM LƯU QUAN TRỌNG
  const handleSaveChanges = async () => {
      if (!window.confirm('Bạn có chắc chắn muốn lưu thứ tự banner hiện tại?')) return;
      setIsSaving(true);
      try {
          const updatePromises = bannerStories.map((story, index) => {
              return storyService.updateStoryBannerConfig(story.id, {
                  isInBanner: true,
                  bannerPriority: index // Gán index mới làm priority
              });
          });

          // Xử lý các truyện bị xóa khỏi banner (nằm trong original nhưng không có trong current)
          const removedStories = originalBannerStories.filter(
              orig => !bannerStories.find(curr => curr.id === orig.id)
          );
          const removePromises = removedStories.map(story => 
              storyService.updateStoryBannerConfig(story.id, { isInBanner: false })
          );

          await Promise.all([...updatePromises, ...removePromises]);
          
          alert('Đã lưu cấu hình banner thành công!');
          fetchBannerStories(); // Refresh lại từ server để đồng bộ
      } catch (error) {
          console.error('Lỗi khi lưu:', error);
          alert('Có lỗi xảy ra khi lưu banner.');
      } finally {
          setIsSaving(false);
      }
  };

  // Check xem có thay đổi chưa để hiện nút Lưu
  const hasChanges = JSON.stringify(bannerStories.map(s => s.id)) !== JSON.stringify(originalBannerStories.map(s => s.id));

  if (loading) return <div className="p-4"><LoadingSpinner /></div>;

  return (
    // Container chính: bg-sukem-card
    <div className="bg-sukem-card rounded-xl shadow-lg border border-sukem-border h-full flex flex-col overflow-hidden max-h-[600px] lg:max-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="p-4 border-b border-sukem-border bg-sukem-bg/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-sukem-text flex items-center gap-2">
                <PhotoIcon className="w-5 h-5 text-sukem-primary"/>
                Thiết lập Banner
            </h2>
            <p className="text-xs text-sukem-text-muted mt-1">Sắp xếp xong nhớ bấm "Lưu thay đổi".</p>
          </div>
          
          {hasChanges && (
              <button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-sukem-primary text-white rounded-lg shadow hover:bg-red-600 transition-all font-bold text-sm disabled:opacity-50"
              >
                  {isSaving ? <LoadingSpinner size="sm"/> : <CheckCircleIcon className="w-5 h-5"/>}
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
          )}
      </div>
      
      {/* Danh sách Banner */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {bannerStories.length === 0 ? (
              <div className="text-center py-8 text-sukem-text-muted border-2 border-dashed border-sukem-border rounded-lg">
                  Chưa có truyện nào trên banner.
              </div>
          ) : (
            bannerStories.map((story, index) => (
                // Item: bg-sukem-bg
                <div key={story.id} className="flex items-center gap-3 bg-sukem-bg p-2 rounded-lg border border-sukem-border shadow-sm hover:shadow-md transition-shadow group">
                    {/* Số thứ tự */}
                    <div className="w-6 h-6 rounded-full bg-sukem-primary/10 text-sukem-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                    </div>

                    {/* Ảnh & Tên */}
                    <img src={story.coverImage} alt="" className="w-10 h-14 object-cover rounded bg-sukem-card" />
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-sukem-text truncate">{story.title}</p>
                        <p className="text-xs text-sukem-text-muted truncate">{story.author}</p>
                    </div>

                    {/* Nút điều khiển */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => index > 0 && swapPriority(index, index - 1)}
                            disabled={index === 0}
                            className="p-1 hover:bg-sukem-card rounded text-sukem-text-muted hover:text-sukem-accent disabled:opacity-20"
                        >
                            <ArrowUpIcon className="w-3 h-3" />
                        </button>
                        <button 
                            onClick={() => index < bannerStories.length - 1 && swapPriority(index, index + 1)}
                            disabled={index === bannerStories.length - 1}
                            className="p-1 hover:bg-sukem-card rounded text-sukem-text-muted hover:text-sukem-accent disabled:opacity-20"
                        >
                            <ArrowDownIcon className="w-3 h-3" />
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => removeFromBanner(story.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sukem-text-muted hover:text-red-500 transition-colors"
                        title="Gỡ khỏi danh sách (Chưa lưu)"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))
          )}
      </div>

      {/* Khu vực Tìm kiếm & Thêm */}
      <div className="p-4 border-t border-sukem-border bg-sukem-bg relative">
        <h3 className="text-xs font-bold uppercase text-sukem-text-muted mb-2">Thêm truyện mới</h3>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập tên truyện..."
            className="w-full pl-3 pr-10 py-2 text-sm border border-sukem-border rounded-lg bg-sukem-card text-sukem-text focus:ring-2 focus:ring-sukem-primary focus:border-transparent outline-none placeholder-sukem-text-muted"
          />
          <button 
            onClick={handleSearch}
            className="absolute right-1 top-1 p-1.5 bg-sukem-primary text-white rounded hover:opacity-90 transition-opacity"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Kết quả tìm kiếm popup */}
        {searchResults.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 max-h-48 overflow-y-auto custom-scrollbar border border-sukem-border rounded-lg bg-sukem-card shadow-xl z-20">
                {searchResults.map(story => (
                    <div key={story.id} className="flex items-center justify-between p-2 hover:bg-sukem-bg transition-colors cursor-pointer group" onClick={() => addToBanner(story)}>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <img src={story.coverImage} alt="" className="w-8 h-10 object-cover rounded" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-sukem-text truncate">{story.title}</p>
                                <p className="text-xs text-sukem-text-muted truncate">{story.author}</p>
                            </div>
                        </div>
                        <PlusIcon className="w-5 h-5 text-sukem-secondary group-hover:scale-110 transition-transform" />
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default BannerManager;