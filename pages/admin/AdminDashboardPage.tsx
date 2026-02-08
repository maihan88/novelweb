import React, { useMemo, useState } from 'react';
import { useStories } from '../../contexts/StoryContext';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, DocumentTextIcon, PencilIcon, TrashIcon, PlusIcon, CircleStackIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import BannerManager from '../../components/BannerManager';

// Component Card Thống kê: Dùng hệ màu Sukem
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; colorClasses: string; iconBg: string }> =
    ({ title, value, icon: Icon, colorClasses, iconBg }) => (
    <div className={`group bg-sukem-card p-6 rounded-2xl shadow-sm border border-sukem-border flex items-center gap-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1`}>
        <div className={`p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${iconBg}`}>
            <Icon className="h-7 w-7"/>
        </div>
        <div className="flex-1">
            <h3 className="text-sm font-medium text-sukem-text-muted mb-1">{title}</h3>
            <p className={`text-3xl font-bold tracking-tight ${colorClasses}`}>{value}</p>
        </div>
    </div>
);

const AdminDashboardPage: React.FC = () => {
  const { stories, deleteStory, loading, error } = useStories();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const safeStories = Array.isArray(stories) ? stories : [];

  const stats = useMemo(() => {
    if (!safeStories) return { totalStories: 0, totalViews: 0, totalChapters: 0 };
    const totalChapters = safeStories.reduce((acc, story) =>
        acc + (story.volumes?.reduce((volAcc, vol) =>
            volAcc + (vol.chapters?.length || 0), 0) || 0), 0);
     const totalViews = safeStories.reduce((acc, story) =>
        acc + (story.volumes?.reduce((volAcc, vol) =>
            volAcc + (vol.chapters?.reduce((chapAcc, chap) => chapAcc + (chap.views || 0), 0) || 0), 0) || 0), 0);
    return {
      totalStories: safeStories.length,
      totalViews,
      totalChapters,
    };
  }, [safeStories]);

  // Filter stories based on search term
  const filteredStories = useMemo(() => {
    if (!searchTerm.trim()) return safeStories;
    const term = searchTerm.toLowerCase();
    return safeStories.filter(story => 
      story.title.toLowerCase().includes(term) ||
      story.author.toLowerCase().includes(term) ||
      story.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }, [safeStories, searchTerm]);

  const handleDelete = async (storyId: string, storyTitle: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa truyện "${storyTitle}" không? Hành động này không thể hoàn tác.`)) {
      try {
        await deleteStory(storyId);
      } catch (err) {
        alert('Đã xảy ra lỗi khi xóa truyện.');
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-4 lg:p-0 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-sukem-text mb-2">Bảng điều khiển</h1>
          <p className="text-sukem-text-muted">Tổng quan và quản lý hệ thống.</p>
        </div>
        <Link
          to="/admin/story/new"
          className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sukem-primary to-sukem-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-sukem-primary/30 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-5 w-5"/>
          Thêm truyện mới
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
            title="Tổng số truyện"
            value={stats.totalStories}
            icon={CircleStackIcon}
            colorClasses="text-sukem-secondary"
            iconBg="bg-sukem-secondary/20 text-sukem-secondary"
        />
         <StatCard
            title="Tổng lượt xem"
            value={stats.totalViews.toLocaleString('vi-VN')}
            icon={EyeIcon}
            colorClasses="text-blue-500"
            iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-500"
        />
        <StatCard
            title="Tổng số chương"
            value={stats.totalChapters.toLocaleString('vi-VN')}
            icon={DocumentTextIcon}
            colorClasses="text-sukem-primary"
            iconBg="bg-sukem-primary/20 text-sukem-primary"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cột trái (2/3): Danh sách truyện */}
          <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <h2 className="text-2xl font-bold font-serif text-sukem-text">Kho Truyện</h2>
               {/* Search Bar */}
               <div className="relative w-full sm:w-80">
                 <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-sukem-text-muted pointer-events-none" />
                 <input
                   type="text"
                   placeholder="Tìm kiếm truyện..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-10 py-2.5 border border-sukem-border rounded-full bg-sukem-card text-sukem-text placeholder-sukem-text-muted/50 focus:outline-none focus:ring-2 focus:ring-sukem-accent focus:border-transparent transition-all duration-200 shadow-sm"
                 />
                 {searchTerm && (
                   <button
                     onClick={() => setSearchTerm('')}
                     className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-sukem-border transition-colors"
                     title="Xóa tìm kiếm"
                   >
                     <XMarkIcon className="h-4 w-4 text-sukem-text-muted" />
                   </button>
                 )}
               </div>
             </div>
             
              <div className="bg-sukem-card rounded-2xl shadow-sm overflow-hidden border border-sukem-border">
                {loading ? (
                    <div className="p-10 flex justify-center"><LoadingSpinner /></div>
                ) : error ? (
                    <div className="p-10 text-center text-sukem-primary">{error}</div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-sukem-border">
                      <thead className="bg-sukem-bg">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-sukem-text-muted uppercase tracking-wider">Truyện</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-sukem-text-muted uppercase tracking-wider">Trạng thái</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-sukem-text-muted uppercase tracking-wider hidden sm:table-cell">Cập nhật</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-sukem-text-muted uppercase tracking-wider">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="bg-sukem-card divide-y divide-sukem-border">
                        {filteredStories.length > 0 ? filteredStories.map((story) => (
                          <tr key={story.id} className="hover:bg-sukem-bg transition-colors duration-200 group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 h-14 w-10 rounded-md overflow-hidden shadow-sm border border-sukem-border group-hover:shadow-md transition-all">
                                      <img className="h-full w-full object-cover" src={story.coverImage} alt={story.title} />
                                  </div>
                                  <div className="min-w-0 max-w-[150px] sm:max-w-xs">
                                      <div className="text-sm font-bold text-sukem-text truncate group-hover:text-sukem-primary transition-colors" title={story.title}>{story.title}</div>
                                      <div className="text-xs text-sukem-text-muted truncate mt-0.5">{story.author}</div>
                                  </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${story.status === 'Hoàn thành' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-sukem-bg text-sukem-text-muted border-sukem-border'}`}>
                                {story.status}
                              </span>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-xs text-sukem-text-muted hidden sm:table-cell">
                                {new Date(story.lastUpdatedAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end items-center gap-2">
                                  <button
                                    onClick={() => navigate(`/admin/story/edit/${story.id}`)}
                                    className="p-2 rounded-lg text-sukem-accent hover:bg-sukem-bg hover:text-sukem-primary transition-all duration-200"
                                    title="Sửa nội dung"
                                  >
                                    <PencilIcon className="h-5 w-5"/>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(story.id, story.title)}
                                    className="p-2 rounded-lg text-sukem-text-muted hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                                    title="Xóa"
                                  >
                                    <TrashIcon className="h-5 w-5"/>
                                  </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <p className="text-sukem-text-muted text-lg">
                                    {searchTerm ? 'Không tìm thấy truyện nào phù hợp' : 'Chưa có truyện nào.'}
                                  </p>
                                  {searchTerm && (
                                    <button
                                      onClick={() => setSearchTerm('')}
                                      className="text-sm text-sukem-primary hover:underline font-medium"
                                    >
                                      Xóa bộ lọc
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
          </div>

          {/* Cột phải (1/3): Banner Manager */}
          <div className="lg:col-span-1">
             <BannerManager />
          </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;