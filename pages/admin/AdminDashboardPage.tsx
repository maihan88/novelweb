import React, { useMemo } from 'react';
import { useStories } from '../../contexts/StoryContext';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, DocumentTextIcon, PencilIcon, TrashIcon, PlusIcon, CircleStackIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import BannerManager from '../../components/BannerManager';

// Component Card Thống kê
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; colorClasses: string }> =
    ({ title, value, icon: Icon, colorClasses }) => (
    <div className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4 ${colorClasses}`}>
        <div className="p-3 bg-white/50 dark:bg-black/20 rounded-full">
            <Icon className="h-6 w-6"/>
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const AdminDashboardPage: React.FC = () => {
  const { stories, deleteStory, loading, error } = useStories();
  const navigate = useNavigate();

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
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">Bảng điều khiển</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tổng quan và quản lý hệ thống.</p>
        </div>
        <Link
          to="/admin/story/new"
          className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
        >
          <PlusIcon className="h-5 w-5"/>
          Thêm truyện mới
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
            title="Tổng số truyện"
            value={stats.totalStories}
            icon={CircleStackIcon}
            colorClasses="text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-900/50"
        />
         <StatCard
            title="Tổng lượt xem"
            value={stats.totalViews.toLocaleString('vi-VN')}
            icon={EyeIcon}
            colorClasses="text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-900/50"
        />
        <StatCard
            title="Tổng số chương"
            value={stats.totalChapters.toLocaleString('vi-VN')}
            icon={DocumentTextIcon}
             colorClasses="text-green-600 dark:text-green-300 border-green-100 dark:border-green-900/50"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cột trái (2/3): Danh sách truyện */}
          <div className="lg:col-span-2 space-y-4">
             <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Kho Truyện</h2>
             
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                {loading ? (
                    <div className="p-10 flex justify-center"><LoadingSpinner /></div>
                ) : error ? (
                    <div className="p-10 text-center text-red-500">{error}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Truyện</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Cập nhật</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                        {safeStories.length > 0 ? safeStories.map((story) => (
                          <tr key={story.id} className="odd:bg-white dark:odd:bg-slate-800 even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-slate-700/60 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-8">
                                      <img className="h-10 w-8 rounded object-cover shadow-sm" src={story.coverImage} alt="" />
                                  </div>
                                  <div className="ml-3 min-w-0 max-w-[150px] sm:max-w-xs">
                                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={story.title}>{story.title}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{story.author}</div>
                                  </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${story.status === 'Hoàn thành' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'}`}>
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
                                    className="text-orange-600 hover:text-orange-800 dark:text-amber-400 dark:hover:text-amber-200 p-1.5 rounded hover:bg-orange-100 dark:hover:bg-stone-700"
                                    title="Sửa nội dung"
                                  >
                                    <PencilIcon className="h-4 w-4"/>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(story.id, story.title)}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded hover:bg-red-100 dark:hover:bg-stone-700"
                                    title="Xóa"
                                  >
                                    <TrashIcon className="h-4 w-4"/>
                                  </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">Chưa có truyện nào.</td></tr>
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
