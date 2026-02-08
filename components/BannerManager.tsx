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
    const filtered = allStoriesCache.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !bannerStories.find(b => b.id === s.id)
    );
    setSearchResults(filtered.slice(0, 5));
    setIsSearching(false);
  };

  // 4. Thêm truyện vào Banner
  const addToBanner = async (story: Story) => {
    try {
      const newPriority = bannerStories.length;
      await storyService.updateStoryBannerConfig(story.id, {
        isInBanner: true,
        bannerPriority: newPriority
      });
      
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
          const newStories = [...bannerStories];
          [newStories[index1], newStories[index2]] = [newStories[index2], newStories[index1]];
          newStories[index1].bannerPriority = index1; 
          newStories[index2].bannerPriority = index2;
          setBannerStories(newStories);

          await Promise.all([
              storyService.updateStoryBannerConfig(story1.id, { bannerPriority: story2.bannerPriority || index2 }),
              storyService.updateStoryBannerConfig(story2.id, { bannerPriority: story1.bannerPriority || index1 })
          ]);
      } catch (error) {
          console.error('Lỗi sắp xếp:', error);
          fetchBannerStories();
      }
  };

  if (loading) return <div className="p-4"><LoadingSpinner /></div>;

  return (
    // Container chính: bg-sukem-card
    <div className="bg-sukem-card rounded-xl shadow-lg border border-sukem-border h-full flex flex-col overflow-hidden max-h-[600px] lg:max-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="p-4 border-b border-sukem-border bg-sukem-bg/50">
          <h2 className="text-lg font-bold text-sukem-text flex items-center gap-2">
            <PhotoIcon className="w-5 h-5 text-sukem-primary"/>
            Thiết lập Banner
          </h2>
          <p className="text-xs text-sukem-text-muted mt-1">Dùng nút mũi tên để sắp xếp thứ tự hiển thị.</p>
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
                        title="Gỡ khỏi banner"
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