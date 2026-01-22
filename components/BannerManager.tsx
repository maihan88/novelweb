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
    PhotoIcon
} from '@heroicons/react/24/solid';

const BannerManager: React.FC = () => {
  const [bannerStories, setBannerStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Story[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allStoriesCache, setAllStoriesCache] = useState<Story[]>([]); 

  // 1. Lấy danh sách Banner
  const fetchBannerStories = async () => {
    try {
      setLoading(true);
      const data = await storyService.getBannerStories();
      setBannerStories(data);
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
    // Lọc các truyện có tên chứa từ khóa VÀ chưa nằm trong banner
    const filtered = allStoriesCache.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !bannerStories.find(b => b.id === s.id)
    );
    setSearchResults(filtered.slice(0, 5)); // Chỉ hiện 5 kết quả
    setIsSearching(false);
  };

  // 4. Thêm truyện vào Banner
  const addToBanner = async (story: Story) => {
    try {
      // Priority mặc định là số lượng hiện tại (để nó nằm cuối cùng)
      const newPriority = bannerStories.length;
      await storyService.updateStoryBannerConfig(story.id, {
        isInBanner: true,
        bannerPriority: newPriority
      });
      
      // Cập nhật UI ngay lập tức
      const newStory = { ...story, isInBanner: true, bannerPriority: newPriority };
      setBannerStories([...bannerStories, newStory]);
      setSearchResults(prev => prev.filter(s => s.id !== story.id)); 
      setSearchTerm(''); 
    } catch (error) {
      alert('Lỗi khi thêm vào banner');
    }
  };

  // 5. Xóa truyện khỏi Banner
  const removeFromBanner = async (storyId: string) => {
    if (!window.confirm('Gỡ truyện này khỏi banner?')) return;
    try {
      await storyService.updateStoryBannerConfig(storyId, { isInBanner: false });
      setBannerStories(prev => prev.filter(s => s.id !== storyId));
    } catch (error) {
      alert('Lỗi gỡ khỏi banner');
    }
  };

  // 6. Đổi thứ tự (Swap Priority)
  const swapPriority = async (index1: number, index2: number) => {
      const story1 = bannerStories[index1];
      const story2 = bannerStories[index2];
      
      try {
          // Optimistic UI Update (Đổi trên giao diện trước cho mượt)
          const newStories = [...bannerStories];
          [newStories[index1], newStories[index2]] = [newStories[index2], newStories[index1]];
          // Cập nhật lại priority ảo trong state để hiển thị đúng nếu cần
          newStories[index1].bannerPriority = index1; 
          newStories[index2].bannerPriority = index2;
          setBannerStories(newStories);

          // Gọi API cập nhật ngầm
          await Promise.all([
              storyService.updateStoryBannerConfig(story1.id, { bannerPriority: story2.bannerPriority || index2 }),
              storyService.updateStoryBannerConfig(story2.id, { bannerPriority: story1.bannerPriority || index1 })
          ]);
      } catch (error) {
          console.error('Lỗi sắp xếp:', error);
          fetchBannerStories(); // Tải lại nếu lỗi
      }
  };

  if (loading) return <div className="p-4"><LoadingSpinner /></div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col overflow-hidden max-h-[600px] lg:max-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <PhotoIcon className="w-5 h-5 text-orange-500"/>
            Thiết lập Banner
          </h2>
          <p className="text-xs text-slate-500 mt-1">Dùng nút mũi tên để sắp xếp thứ tự hiển thị.</p>
      </div>
      
      {/* Danh sách Banner */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {bannerStories.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  Chưa có truyện nào trên banner.
              </div>
          ) : (
            bannerStories.map((story, index) => (
                <div key={story.id} className="flex items-center gap-3 bg-white dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow group">
                    {/* Số thứ tự */}
                    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                    </div>

                    {/* Ảnh & Tên */}
                    <img src={story.coverImage} alt="" className="w-10 h-14 object-cover rounded bg-slate-200" />
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{story.title}</p>
                        <p className="text-xs text-slate-500 truncate">{story.author}</p>
                    </div>

                    {/* Nút điều khiển */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => index > 0 && swapPriority(index, index - 1)}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-500 hover:text-blue-500 disabled:opacity-20"
                        >
                            <ArrowUpIcon className="w-3 h-3" />
                        </button>
                        <button 
                            onClick={() => index < bannerStories.length - 1 && swapPriority(index, index + 1)}
                            disabled={index === bannerStories.length - 1}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-500 hover:text-blue-500 disabled:opacity-20"
                        >
                            <ArrowDownIcon className="w-3 h-3" />
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => removeFromBanner(story.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500 transition-colors"
                        title="Gỡ khỏi banner"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))
          )}
      </div>

      {/* Khu vực Tìm kiếm & Thêm */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 relative">
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Thêm truyện mới</h3>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập tên truyện..."
            className="w-full pl-3 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
          <button 
            onClick={handleSearch}
            className="absolute right-1 top-1 p-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Kết quả tìm kiếm popup */}
        {searchResults.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 max-h-48 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 shadow-xl z-20">
                {searchResults.map(story => (
                    <div key={story.id} className="flex items-center justify-between p-2 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group" onClick={() => addToBanner(story)}>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <img src={story.coverImage} alt="" className="w-8 h-10 object-cover rounded" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{story.title}</p>
                                <p className="text-xs text-slate-500 truncate">{story.author}</p>
                            </div>
                        </div>
                        <PlusIcon className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default BannerManager;