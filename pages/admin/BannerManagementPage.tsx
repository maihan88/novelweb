import React, { useState, useEffect, useMemo } from 'react';
import { Story } from '../../types';
import * as storyService from '../../services/storyService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../contexts/ToastContext';
import {
  TrashIcon, MagnifyingGlassIcon, PhotoIcon, CheckCircleIcon, PlusIcon, RectangleStackIcon, XMarkIcon
} from '@heroicons/react/24/solid';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  TouchSensor,
  MouseSensor,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item for Banner List ---
interface SortableItemProps {
  story: Story;
  index: number;
  onRemove: (id: string) => void;
}

const SortableItem = ({ story, index, onRemove }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: story.id,
    data: { story }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-4 p-3 rounded-xl border shadow-sm touch-none select-none transition-all group ${isDragging
          ? 'bg-sukem-primary/10 border-sukem-primary ring-2 ring-sukem-primary/20'
          : 'bg-sukem-bg border-sukem-border hover:shadow-md'
        }`}
    >
      <div className="cursor-grab active:cursor-grabbing p-1 text-sukem-text-muted">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
      </div>

      <div className="w-8 h-8 rounded-full bg-sukem-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
        {index + 1}
      </div>

      <img src={story.coverImage} alt="" className="w-10 h-14 object-cover rounded-md bg-sukem-card shadow-sm pointer-events-none" />

      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm text-sukem-text truncate">{story.title}</p>
        <p className="text-xs text-sukem-text-muted truncate">{story.author}</p>
      </div>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onRemove(story.id); }}
        className="p-2 text-sukem-text-muted hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
        title="Gỡ khỏi banner"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

// --- Main Page ---
const BannerManagementPage: React.FC = () => {
  const [bannerStories, setBannerStories] = useState<Story[]>([]);
  const [originalBannerStories, setOriginalBannerStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [allStoriesCache, setAllStoriesCache] = useState<Story[]>([]);
  const [activeDragData, setActiveDragData] = useState<{ story: Story } | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [bannerData, allData] = await Promise.all([
        storyService.getBannerStories(),
        storyService.getAllStories()
      ]);
      const sortedBanner = bannerData.sort((a: Story, b: Story) => (a.bannerPriority || 0) - (b.bannerPriority || 0));
      setBannerStories(sortedBanner);
      setOriginalBannerStories(JSON.parse(JSON.stringify(sortedBanner)));
      setAllStoriesCache(allData);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu banner:', error);
      showToast('Không thể tải dữ liệu banner. Vui lòng thử lại sau.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  const displayedAvailable = useMemo(() => {
    return allStoriesCache
      .filter(s => !bannerStories.find(b => b.id === s.id))
      .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allStoriesCache, bannerStories, searchTerm]);

  const addToBanner = (story: Story) => {
    if (bannerStories.find(s => s.id === story.id)) return;
    setBannerStories([...bannerStories, { ...story, isInBanner: true }]);
  };

  const requestRemove = (storyId: string) => {
    setItemToDelete(storyId);
    setIsDeleteModalOpen(true);
  };

  const confirmRemove = () => {
    if (itemToDelete) {
      setBannerStories(prev => prev.filter(s => s.id !== itemToDelete));
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const requestSave = () => { if (hasChanges) setIsSaveModalOpen(true); };

  const confirmSave = async () => {
    setIsSaveModalOpen(false);
    setIsSaving(true);
    try {
      const updatePromises = bannerStories.map((story, index) =>
        storyService.updateStoryBannerConfig(story.id, { isInBanner: true, bannerPriority: index })
      );
      const removedStories = originalBannerStories.filter(orig => !bannerStories.find(curr => curr.id === orig.id));
      const removePromises = removedStories.map(story =>
        storyService.updateStoryBannerConfig(story.id, { isInBanner: false })
      );

      await Promise.all([...updatePromises, ...removePromises]);

      showToast('Đã lưu cấu hình banner thành công!', 'success');

      fetchInitialData();
    } catch (error) {
      console.error(error);
      showToast('Có lỗi xảy ra khi lưu. Vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    const story = e.active.data.current?.story as Story;
    if (story) setActiveDragData({ story });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setBannerStories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const hasChanges = JSON.stringify(bannerStories.map(s => s.id)) !== JSON.stringify(originalBannerStories.map(s => s.id));

  if (loading) return <div className="p-10 flex justify-center"><LoadingSpinner /></div>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="animate-fade-in p-4 lg:p-0 pb-20 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-sukem-text mb-2">Quản Lý Banner</h1>
          <p className="text-sukem-text-muted">Thiết lập các truyện hiển thị trên Banner ở Trang chủ. Kéo thả để sắp xếp thứ tự.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CỘT 1: DANH SÁCH BANNER HIỆN TẠI */}
          <div className="bg-sukem-card rounded-2xl shadow-sm border border-sukem-border p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sukem-border">
              <PhotoIcon className="h-6 w-6 text-sukem-primary" />
              <h2 className="text-xl font-bold font-serif text-sukem-text">Banner Hiện Tại ({bannerStories.length})</h2>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar pr-2">
              <SortableContext items={bannerStories.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {bannerStories.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-sukem-border rounded-xl flex flex-col items-center justify-center text-sukem-text-muted">
                      <RectangleStackIcon className="w-12 h-12 mb-3 opacity-50" />
                      <p className="font-bold text-lg">Banner trống</p>
                      <p className="text-sm mt-1">Thêm truyện từ danh sách bên phải.</p>
                    </div>
                  ) : (
                    bannerStories.map((story, index) => (
                      <SortableItem key={story.id} story={story} index={index} onRemove={requestRemove} />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>

            {/* Save Button */}
            {hasChanges && (
              <div className="mt-6 pt-4 border-t border-sukem-border">
                <button
                  onClick={requestSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-sukem-primary text-white rounded-xl shadow-lg shadow-sukem-primary/25 hover:brightness-110 hover:-translate-y-0.5 transition-all font-bold text-sm disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isSaving ? <LoadingSpinner size="sm" /> : <CheckCircleIcon className="w-5 h-5" />}
                  {isSaving ? 'Đang lưu thay đổi...' : 'Lưu thay đổi Banner'}
                </button>
              </div>
            )}
          </div>

          {/* CỘT 2: TÌM VÀ THÊM TRUYỆN */}
          <div className="bg-sukem-card rounded-2xl shadow-sm border border-sukem-border p-6 flex flex-col">
            <h2 className="text-xl font-bold font-serif text-sukem-text mb-6">Thêm Truyện Vào Banner</h2>

            <div className="relative mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm truyện để thêm..."
                className="w-full pl-10 pr-4 py-3 bg-sukem-bg border border-sukem-border rounded-xl text-sukem-text focus:outline-none focus:ring-2 focus:ring-sukem-accent transition-all"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-sukem-text-muted" />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar pr-2 space-y-3">
              {displayedAvailable.length === 0 ? (
                <p className="text-center text-sukem-text-muted italic py-10">
                  {searchTerm ? 'Không tìm thấy truyện nào khớp với từ khóa.' : 'Đã thêm tất cả truyện vào banner.'}
                </p>
              ) : (
                displayedAvailable.map(story => (
                  <div key={story.id} className="flex items-center gap-4 p-3 bg-sukem-bg rounded-xl border border-sukem-border hover:border-sukem-accent transition-all group">
                    <img src={story.coverImage} alt={story.title} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sukem-text truncate text-sm">{story.title}</h4>
                      <p className="text-xs text-sukem-text-muted truncate">{story.author}</p>
                    </div>
                    <button
                      onClick={() => addToBanner(story)}
                      className="p-2 text-sukem-accent hover:bg-sukem-primary hover:text-white rounded-lg transition-colors"
                      title="Thêm vào banner"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeDragData ? (
          <div className="flex items-center gap-3 p-3 rounded-xl border shadow-2xl bg-sukem-card border-sukem-primary ring-2 ring-sukem-primary/30 opacity-95 rotate-2 cursor-grabbing w-[300px]">
            <img src={activeDragData.story.coverImage} alt="" className="w-10 h-14 object-cover rounded-md shadow-sm pointer-events-none" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-sukem-text truncate">{activeDragData.story.title}</p>
              <p className="text-xs text-sukem-text-muted truncate">{activeDragData.story.author}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmRemove}
        title="Gỡ khỏi Banner"
        message="Bạn có chắc chắn muốn gỡ truyện này khỏi banner? (Vẫn cần bấm Lưu để áp dụng)"
        confirmText="Gỡ bỏ"
        cancelText="Hủy"
        isDestructive={true}
      />

      <ConfirmationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirm={confirmSave}
        title="Lưu thay đổi"
        message="Bạn có chắc chắn muốn lưu thứ tự và danh sách banner hiện tại không?"
        confirmText="Đồng ý lưu"
        cancelText="Đóng"
      />
    </DndContext>
  );
};

export default BannerManagementPage;