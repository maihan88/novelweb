import React, { useEffect, useState, useMemo } from 'react';
import { storyService, DashboardData } from '../../services/storyService';
import { Link, useNavigate } from 'react-router-dom';
import {
    PencilIcon,
    TrashIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../contexts/ToastContext';

const StoryManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [stories, setStories] = useState<DashboardData['stories']>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; storyId: string | null; storyTitle: string }>({
        isOpen: false, storyId: null, storyTitle: '',
    });

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const result = await storyService.getDashboardStats();
                setStories(result.stories || []);
            } catch (err) {
                console.error(err);
                setError('Không thể tải dữ liệu truyện.');
            } finally {
                setLoading(false);
            }
        };
        fetchStories();
    }, []);

    const filteredStories = useMemo(() => {
        if (!stories) return [];
        if (!searchTerm.trim()) return stories;
        const term = searchTerm.toLowerCase();
        return stories.filter(story =>
            story.title.toLowerCase().includes(term) ||
            story.author.toLowerCase().includes(term)
        );
    }, [stories, searchTerm]);

    const onRequestDelete = (storyId: string, storyTitle: string) => {
        setDeleteModal({ isOpen: true, storyId, storyTitle });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.storyId) return;
        try {
            await storyService.deleteStory(deleteModal.storyId);
            const updatedData = await storyService.getDashboardStats();
            setStories(updatedData.stories || []);
            showToast(`Đã xóa truyện "${deleteModal.storyTitle}" thành công.`, 'success');
        } catch (err) {
            showToast('Đã xảy ra lỗi khi xóa truyện.', 'error');
            console.error(err);
        }
        setDeleteModal(prev => ({ ...prev, isOpen: false }));
    };

    if (loading) return <div className="p-10 flex justify-center"><LoadingSpinner /></div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-6 animate-fade-in p-4 lg:p-0 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-serif text-sukem-text mb-2">Quản Lý Truyện</h1>
                    <p className="text-sukem-text-muted">Quản lý, thêm, sửa, xóa truyện trong hệ thống.</p>
                </div>
                <Link
                    to="/admin/story/new"
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-sukem-primary text-white font-bold rounded-xl hover:brightness-110 hover:shadow-lg hover:shadow-sukem-primary/25 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                    <PlusIcon className="h-5 w-5" />
                    Thêm truyện mới
                </Link>
            </div>

            <div className="bg-sukem-card rounded-2xl shadow-sm border border-sukem-border p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold font-serif text-sukem-text">Kho Truyện</h2>

                    <div className="relative w-full sm:w-80">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-sukem-text-muted pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm truyện..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border border-sukem-border rounded-full bg-sukem-bg text-sukem-text placeholder-sukem-text-muted/50 focus:outline-none focus:ring-2 focus:ring-sukem-accent focus:border-transparent transition-all duration-200 shadow-sm"
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

                <div className="overflow-x-auto custom-scrollbar border border-sukem-border rounded-xl">
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
                                            <div className="flex-shrink-0 h-16 w-12 rounded-md overflow-hidden shadow-sm border border-sukem-border group-hover:shadow-md transition-all">
                                                <img className="h-full w-full object-cover" src={story.coverImage} alt={story.title} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-sukem-text group-hover:text-sukem-primary transition-colors max-w-sm truncate" title={story.title}>{story.title}</div>
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
                                        {story.totalViews?.toLocaleString('vi-VN')}
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
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => onRequestDelete(story._id, story.title)}
                                                className="p-2 rounded-lg text-sukem-text-muted hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                                                title="Xóa"
                                            >
                                                <TrashIcon className="h-5 w-5" />
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

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmDelete}
                title="Xóa truyện"
                message={
                    <span>Bạn có chắc chắn muốn xóa truyện <strong>{deleteModal.storyTitle}</strong> không?<br />Hành động này không thể hoàn tác.</span>
                }
                confirmText="Xóa ngay"
                isDestructive={true}
            />
        </div>
    );
};

export default StoryManagementPage;