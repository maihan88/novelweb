import React, { useState, useEffect, useMemo } from 'react';
import { storyService } from '../../services/storyService';
import { Story } from '../../types';
import { StarIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const FeaturedManagementPage: React.FC = () => {
    const { showToast } = useToast();
    const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
    const [allStories, setAllStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [featuredRes, allRes] = await Promise.all([
                storyService.getFeaturedStoriesList(),
                storyService.getAllStories()
            ]);
            setFeaturedStories(featuredRes);
            setAllStories(allRes);
        } catch (error) {
            showToast('Lỗi khi tải dữ liệu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFeatured = async (storyId: string, isHot: boolean) => {
        try {
            await storyService.updateStoryFeaturedConfig(storyId, { isHot });
            showToast(isHot ? 'Đã thêm vào mục Nổi bật!' : 'Đã gỡ khỏi mục Nổi bật!', 'success');
            fetchData(); 
        } catch (error) {
            showToast('Có lỗi xảy ra', 'error');
        }
    };

    const filteredAvailableStories = useMemo(() => {
        return allStories
            .filter(story => !story.isHot) 
            .filter(story => 
                story.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                story.author.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [allStories, searchQuery]);

    if (loading) return <div className="p-10 flex justify-center"><LoadingSpinner /></div>;

    return (
        <div className="animate-fade-in p-4 lg:p-0 pb-20 space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold font-serif text-sukem-text mb-2">Quản Lý Truyện Nổi Bật</h1>
                <p className="text-sukem-text-muted">Lựa chọn các truyện sẽ được ghim trên Slider Truyện Nổi Bật ngoài trang chủ.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CỘT 1: DANH SÁCH ĐANG NỔI BẬT */}
                <div className="bg-sukem-card rounded-2xl shadow-sm border border-sukem-border p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sukem-border">
                        <StarIcon className="h-6 w-6 text-yellow-500 animate-pulse" />
                        <h2 className="text-xl font-bold font-serif text-sukem-text">Đang Nổi Bật ({featuredStories.length}/10)</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar pr-2 space-y-3">
                        {featuredStories.length === 0 ? (
                            <p className="text-center text-sukem-text-muted italic py-10">Chưa có truyện nổi bật nào.</p>
                        ) : (
                            featuredStories.map((story, index) => (
                                <div key={story._id} className="flex items-center gap-4 p-3 bg-sukem-bg rounded-xl border border-sukem-border hover:shadow-md transition-all group">
                                    <div className="w-8 h-8 rounded-full bg-sukem-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <img src={story.coverImage} alt={story.title} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sukem-text truncate text-sm">{story.title}</h4>
                                        <p className="text-xs text-sukem-text-muted truncate">{story.author}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleFeatured(story._id, false)}
                                        className="p-2 text-sukem-text-muted hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                        title="Gỡ khỏi Nổi bật"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* CỘT 2: TÌM VÀ THÊM TRUYỆN MỚI */}
                <div className="bg-sukem-card rounded-2xl shadow-sm border border-sukem-border p-6 flex flex-col">
                    <h2 className="text-xl font-bold font-serif text-sukem-text mb-6">Thêm Truyện Nổi Bật</h2>
                    
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Tìm kiếm truyện để thêm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-sukem-bg border border-sukem-border rounded-xl text-sukem-text focus:outline-none focus:ring-2 focus:ring-sukem-accent transition-all"
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-sukem-text-muted" />
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar pr-2 space-y-3">
                        {filteredAvailableStories.length === 0 ? (
                            <p className="text-center text-sukem-text-muted italic py-10">Không tìm thấy truyện phù hợp.</p>
                        ) : (
                            filteredAvailableStories.map(story => (
                                <div key={story._id} className="flex items-center gap-4 p-3 bg-sukem-bg rounded-xl border border-sukem-border hover:border-sukem-accent transition-all group">
                                    <img src={story.coverImage} alt={story.title} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sukem-text truncate text-sm">{story.title}</h4>
                                        <p className="text-xs text-sukem-text-muted truncate">{story.author}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleFeatured(story._id, true)}
                                        disabled={featuredStories.length >= 10}
                                        className="p-2 text-sukem-accent hover:bg-sukem-primary hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Thêm vào Nổi bật"
                                    >
                                        <PlusIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeaturedManagementPage;