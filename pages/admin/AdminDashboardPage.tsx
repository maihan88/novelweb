import React, { useEffect, useState, useMemo } from 'react';
import { storyService, DashboardData } from '../../services/storyService';
import { Link, useNavigate } from 'react-router-dom';
import { 
    EyeIcon, 
    DocumentTextIcon, 
    PencilIcon, 
    TrashIcon, 
    PlusIcon, 
    CircleStackIcon, 
    MagnifyingGlassIcon, 
    XMarkIcon,
    // UsersIcon // <--- Bỏ import icon này
} from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import BannerManager from '../../components/BannerManager';

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
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const result = await storyService.getDashboardStats();
            setData(result);
        } catch (err) {
            console.error(err);
            setError('Không thể tải dữ liệu thống kê.');
        } finally {
            setLoading(false);
        }
    };
    fetchStats();
  }, []);

  const filteredStories = useMemo(() => {
    if (!data?.stories) return [];
    if (!searchTerm.trim()) return data.stories;
    const term = searchTerm.toLowerCase();
    return data.stories.filter(story => 
      story.title.toLowerCase().includes(term) ||
      story.author.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const handleDelete = async (storyId: string, storyTitle: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa truyện "${storyTitle}" không? Hành động này không thể hoàn tác.`)) {
      try {
        await storyService.deleteStory(storyId);
        const updatedData = await storyService.getDashboardStats();
        setData(updatedData);
      } catch (err) {
        alert('Đã xảy ra lỗi khi xóa truyện.');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><LoadingSpinner /></div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!data) return null;

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

      {/* Stats Section - SỬA GRID LAYOUT THÀNH 3 CỘT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
            title="Tổng số truyện"
            value={data.stats.totalStories}
            icon={CircleStackIcon}
            colorClasses="text-sukem-secondary"
            iconBg="bg-sukem-secondary/20 text-sukem-secondary"
        />
         <StatCard
            title="Tổng lượt xem"
            value={data.stats.totalViews.toLocaleString('vi-VN')}
            icon={EyeIcon}
            colorClasses="text-blue-500"
            iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-500"
        />
        <StatCard
            title="Tổng số chương"
            value={data.stats.totalChapters.toLocaleString('vi-VN')}
            icon={DocumentTextIcon}
            colorClasses="text-sukem-primary"
            iconBg="bg-sukem-primary/20 text-sukem-primary"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <h2 className="text-2xl font-bold font-serif text-sukem-text">Kho Truyện</h2>
               
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
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-sukem-border">
                      <thead className="bg-sukem-bg">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-sukem-text-muted uppercase tracking-wider">Truyện</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-sukem-text-muted uppercase tracking-wider">Số chương</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-sukem-text-muted uppercase tracking-wider">Lượt xem</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-sukem-text-muted uppercase tracking-wider">Trạng thái</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-sukem-text-muted uppercase tracking-wider">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="bg-sukem-card divide-y divide-sukem-border">
                        {filteredStories.length > 0 ? filteredStories.map((story) => (
                          <tr key={story._id} className="hover:bg-sukem-bg transition-colors duration-200 group">
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
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                    {story.chapterCount}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-sukem-text">
                                {story.totalViews?.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${story.status === 'Hoàn thành' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
                                {story.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end items-center gap-2">
                                  <button
                                    onClick={() => navigate(`/admin/story/edit/${story._id}`)}
                                    className="p-2 rounded-lg text-sukem-accent hover:bg-sukem-bg hover:text-sukem-primary transition-all duration-200"
                                    title="Sửa nội dung"
                                  >
                                    <PencilIcon className="h-5 w-5"/>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(story._id, story.title)}
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
                              <td colSpan={5} className="px-6 py-16 text-center">
                                <p className="text-sukem-text-muted text-lg">
                                    {searchTerm ? 'Không tìm thấy truyện nào' : 'Chưa có dữ liệu.'}
                                </p>
                              </td>
                            </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
              </div>
          </div>

          <div className="lg:col-span-1">
             <BannerManager />
          </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;