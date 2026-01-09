import React, { useMemo, useState } from 'react';
import { useStories } from '../../contexts/StoryContext';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, DocumentTextIcon, PencilIcon, TrashIcon, PlusIcon, CircleStackIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import BannerManager from '../../components/BannerManager';

// Component Card Thống kê với animation và hover effects
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; colorClasses: string; iconBg: string }> =
    ({ title, value, icon: Icon, colorClasses, iconBg }) => (
    <div className={`group bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 ${colorClasses}`}>
        <div className={`p-4 ${iconBg} rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className="h-7 w-7"/>
        </div>
        <div className="flex-1">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
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
        alert(`Đã xóa truyện "${storyTitle}" thành công.`);
      } catch (err) {
        alert('Đã xảy ra lỗi khi xóa truyện.');
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-4 lg:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 dark:text-white mb-2">Bảng điều khiển</h1>
          <p className="text-slate-500 dark:text-slate-400">Tổng quan và quản lý hệ thống.</p>
        </div>
        <Link
          to="/admin/story/new"
          className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
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
            colorClasses="text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-900/50"
            iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
        />
         <StatCard
            title="Tổng lượt xem"
            value={stats.totalViews.toLocaleString('vi-VN')}
            icon={EyeIcon}
            colorClasses="text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-900/50"
            iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300"
        />
        <StatCard
            title="Tổng số chương"
            value={stats.totalChapters.toLocaleString('vi-VN')}
            icon={DocumentTextIcon}
            colorClasses="text-green-600 dark:text-green-300 border-green-100 dark:border-green-900/50"
            iconBg="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cột trái (2/3): Danh sách truyện */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <h2 className="text-2xl font-bold font-serif text-slate-800 dark:text-slate-200">Kho Truyện</h2>
               {/* Search Bar */}
               <div className="relative w-full sm:w-80">
                 <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                 <input
                   type="text"
                   placeholder="Tìm kiếm truyện..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm"
                 />
                 {searchTerm && (
                   <button
                     onClick={() => setSearchTerm('')}
                     className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                     title="Xóa tìm kiếm"
                   >
                     <XMarkIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                   </button>
                 )}
               </div>
             </div>
             
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                {loading ? (
                    <div className="p-10 flex justify-center"><LoadingSpinner /></div>
                ) : error ? (
                    <div className="p-10 text-center text-red-500 dark:text-red-400">{error}</div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700/30">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Truyện</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Trạng thái</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">Cập nhật</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredStories.length > 0 ? filteredStories.map((story) => (
                          <tr key={story.id} className="odd:bg-white dark:odd:bg-slate-800 even:bg-slate-50/50 dark:even:bg-slate-800/30 hover:bg-orange-50 dark:hover:bg-slate-700/60 transition-all duration-200 group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 h-14 w-10 rounded-md overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-200">
                                      <img className="h-full w-full object-cover" src={story.coverImage} alt={story.title} />
                                  </div>
                                  <div className="min-w-0 max-w-[150px] sm:max-w-xs">
                                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" title={story.title}>{story.title}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{story.author}</div>
                                  </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${story.status === 'Hoàn thành' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800'}`}>
                                {story.status}
                              </span>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                                {new Date(story.lastUpdatedAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end items-center gap-2">
                                  <button
                                    onClick={() => navigate(`/admin/story/edit/${story.id}`)}
                                    className="text-orange-600 hover:text-orange-800 dark:text-amber-400 dark:hover:text-amber-200 p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110"
                                    title="Sửa nội dung"
                                  >
                                    <PencilIcon className="h-5 w-5"/>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(story.id, story.title)}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110"
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
                                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                                    {searchTerm ? 'Không tìm thấy truyện nào phù hợp' : 'Chưa có truyện nào.'}
                                  </p>
                                  {searchTerm && (
                                    <button
                                      onClick={() => setSearchTerm('')}
                                      className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
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
