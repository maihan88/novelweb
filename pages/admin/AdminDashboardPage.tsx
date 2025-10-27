import React, { useMemo } from 'react';
import { useStories } from '../../contexts/StoryContext.tsx';
import { Link, useNavigate } from 'react-router-dom';
import { ChartBarIcon, EyeIcon, DocumentTextIcon, PencilIcon, TrashIcon, PlusIcon, CircleStackIcon } from '@heroicons/react/24/solid'; // Thêm CircleStackIcon
import LoadingSpinner from '../../components/LoadingSpinner.tsx';

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
    // Tính toán chính xác hơn, bỏ qua các chương null/undefined nếu có
    const totalChapters = safeStories.reduce((acc, story) =>
        acc + (story.volumes?.reduce((volAcc, vol) =>
            volAcc + (vol.chapters?.length || 0), 0) || 0), 0);
    // Tính tổng lượt xem từ các chương
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">Bảng điều khiển</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tổng quan và quản lý truyện.</p>
        </div>
        <Link
          to="/admin/story/new"
          className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
        >
          <PlusIcon className="h-5 w-5"/>
          Thêm truyện mới
        </Link>
      </div>

      {/* Stats Section - Sử dụng StatCard */}
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

      {/* Stories Table Section */}
      <div>
           <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Danh sách truyện</h2>
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Truyện</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Lần cập nhật cuối</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lượt xem</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                    {safeStories.length > 0 ? safeStories.map((story, index) => (
                      <tr key={story.id} className="odd:bg-white dark:odd:bg-slate-800 even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-slate-700/60 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-10"> {/* Tăng nhẹ kích thước ảnh */}
                                  <img className="h-12 w-10 rounded object-cover shadow-sm" src={story.coverImage} alt={`Bìa ${story.title}`} />
                              </div>
                              <div className="ml-4 min-w-0"> {/* Thêm min-w-0 để truncate hoạt động */}
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={story.title}>{story.title}</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate" title={story.author}>{story.author}</div>
                              </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${story.status === 'Hoàn thành' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'}`}>
                            {story.status}
                          </span>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                            {new Date(story.lastUpdatedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{story.views.toLocaleString('vi-VN')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/story/edit/${story.id}`)}
                                className="text-orange-600 hover:text-orange-800 dark:text-amber-400 dark:hover:text-amber-200 p-1.5 rounded-md hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors"
                                title="Chỉnh sửa truyện"
                              >
                                <PencilIcon className="h-4 w-4"/>
                              </button>
                              <button
                                onClick={() => handleDelete(story.id, story.title)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-stone-700 transition-colors"
                                title="Xóa truyện"
                              >
                                <TrashIcon className="h-4 w-4"/>
                              </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                                Chưa có truyện nào được thêm.
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
