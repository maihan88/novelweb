import React, { useMemo } from 'react';
import { useStories } from '../../contexts/StoryContext.tsx';
import { Link, useNavigate } from 'react-router-dom';
import { ChartBarIcon, EyeIcon, DocumentTextIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast'; // Import toast

const AdminDashboardPage: React.FC = () => {
  const { stories, deleteStory } = useStories();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalViews = stories.reduce((acc, story) => acc + story.views, 0);
    const totalChapters = stories.reduce((acc, story) => acc + story.volumes.reduce((volAcc, vol) => volAcc + vol.chapters.length, 0), 0);
    return {
      totalStories: stories.length,
      totalViews,
      totalChapters,
    };
  }, [stories]);

  const showConfirm = (message: string, onConfirm: () => void) => {
    toast((t) => (
      <div className="flex flex-col items-center gap-3">
        <span className="text-center">{message}</span>
        <div className="flex gap-4">
          <button
            className="px-4 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => {
              onConfirm();
              toast.dismiss(t.id);
            }}
          >
            Xóa
          </button>
          <button
            className="px-4 py-1 bg-gray-200 text-black rounded-md hover:bg-gray-300"
            onClick={() => toast.dismiss(t.id)}
          >
            Hủy
          </button>
        </div>
      </div>
    ), {
      duration: 6000, // Tăng thời gian hiển thị để người dùng quyết định
    });
  };

  const handleDelete = (storyId: string, storyTitle: string) => {
    showConfirm(`Bạn có chắc chắn muốn xóa truyện "${storyTitle}"?`, async () => {
      try {
        await deleteStory(storyId);
        toast.success(`Đã xóa truyện "${storyTitle}"!`);
      } catch (error) {
        toast.error('Xóa truyện thất bại.');
        console.error(error);
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif">Bảng điều khiển</h1>
          <p className="text-slate-500 dark:text-slate-400">Quản lý toàn bộ truyện của bạn tại đây.</p>
        </div>
        <Link
          to="/admin/story/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-md hover:opacity-90 transition-opacity shadow"
        >
          <PlusIcon className="h-5 w-5"/>
          Thêm truyện mới
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full"><DocumentTextIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300"/></div>
            <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng số truyện</h3>
                <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{stats.totalStories}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-full"><EyeIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-300"/></div>
            <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng lượt xem</h3>
                <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{stats.totalViews.toLocaleString('vi-VN')}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full"><ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-300"/></div>
            <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng số chương</h3>
                <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{stats.totalChapters}</p>
            </div>
        </div>
      </div>

      {/* Stories Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Tên truyện</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Lượt xem</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Hành động</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-md object-cover" src={story.coverImage} alt="" />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{story.title}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{story.author}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${story.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-cyan-100 text-cyan-800'}`}>
                      {story.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{story.views.toLocaleString('vi-VN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => navigate(`/admin/story/edit/${story.id}`)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><PencilIcon className="h-5 w-5"/></button>
                    <button onClick={() => handleDelete(story.id, story.title)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><TrashIcon className="h-5 w-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;