import React, { useState, useEffect, useMemo } from 'react';
import { Story } from '../types';
import * as storyService from '../services/storyService';
import LoadingSpinner from './LoadingSpinner';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { 
    TrashIcon, MagnifyingGlassIcon, PhotoIcon, CheckCircleIcon, PlusIcon, RectangleStackIcon 
} from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  useDroppable,
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

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));
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
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl border shadow-sm touch-none select-none transition-colors group bg-sukem-bg border-sukem-border",
                isDragging ? "bg-sukem-primary/10 border-sukem-primary ring-2 ring-sukem-primary/20" : "hover:border-sukem-primary/50"
            )}
        >
            <div className="cursor-grab active:cursor-grabbing p-1 text-sukem-text-muted">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
            </div>

            <div className="w-6 h-6 rounded-full bg-sukem-card border border-sukem-border text-sukem-text flex items-center justify-center text-xs font-bold flex-shrink-0">
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
                className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
                title="Gỡ khỏi banner"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

interface AvailableItemProps {
    story: Story;
    onAdd: () => void;
}

const AvailableItem = ({ story, onAdd }: AvailableItemProps) => {
    return (
        <div
            className="flex items-center gap-3 p-3 rounded-xl border shadow-sm select-none transition-colors group bg-sukem-bg border-sukem-border hover:border-sukem-primary/50"
        >
            <img src={story.coverImage} alt="" className="w-10 h-14 object-cover rounded-md bg-sukem-card shadow-sm pointer-events-none" />
            
            <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-sukem-text truncate group-hover:text-sukem-primary transition-colors">{story.title}</p>
                <p className="text-xs text-sukem-text-muted truncate">{story.author}</p>
            </div>
            
            <button
                onClick={onAdd}
                className="p-2 bg-sukem-primary/10 text-sukem-primary rounded-lg hover:bg-sukem-primary hover:text-white transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
                title="Thêm vào banner"
            >
                <PlusIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

// --- Main Component ---
const BannerManager: React.FC = () => {
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

  const { setNodeRef: setBannerRef } = useDroppable({ id: 'banner-container' });
  const { setNodeRef: setAvailableRef } = useDroppable({ id: 'available-container' });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [bannerData, allData] = await Promise.all([
          storyService.getBannerStories(),
          storyService.getAllStories()
      ]);
      const sortedBanner = bannerData.sort((a, b) => (a.bannerPriority || 0) - (b.bannerPriority || 0));
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

    const overId = over.id as string;

    const isOverAvailableArea = overId === 'available-container';
    
    if (isOverAvailableArea) {
        setBannerStories(prev => prev.filter(s => s.id !== active.id));
    } else {
        if (active.id !== over.id) {
            setBannerStories((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }
  };

  const hasChanges = JSON.stringify(bannerStories.map(s => s.id)) !== JSON.stringify(originalBannerStories.map(s => s.id));

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
    >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh] min-h-[600px]">
            
            {/* CỘT TRÁI: DANH SÁCH BANNER */}
            <div className="bg-sukem-card rounded-2xl shadow-lg border border-sukem-border flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-sukem-border bg-gradient-to-r from-sukem-bg to-sukem-card flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-sukem-text flex items-center gap-2">
                            <PhotoIcon className="w-6 h-6 text-sukem-primary"/>
                            Banner Hiện Tại
                        </h2>
                        <p className="text-xs text-sukem-text-muted mt-1">Kéo thả để sắp xếp hoặc ném sang phải để gỡ.</p>
                    </div>
                    <div className="px-3 py-1 bg-sukem-primary/10 text-sukem-primary font-bold rounded-full text-sm">
                        {bannerStories.length} truyện
                    </div>
                </div>
                
                <div ref={setBannerRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-sukem-bg/30 relative">
                    <SortableContext items={bannerStories.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3 pb-4 min-h-full"> 
                            {bannerStories.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-sukem-border rounded-xl h-full flex flex-col items-center justify-center text-sukem-text-muted">
                                    <RectangleStackIcon className="w-12 h-12 mb-3 opacity-50" />
                                    <p className="font-bold text-lg">Banner trống</p>
                                    <p className="text-sm mt-1">Click vào biểu tượng + ở Kho Truyện để thêm.</p>
                                </div>
                            ) : (
                                bannerStories.map((story, index) => (
                                    <SortableItem key={story.id} story={story} index={index} onRemove={requestRemove} />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </div>

                <div className={cn("transition-all duration-300 overflow-hidden bg-sukem-card z-20", hasChanges ? "max-h-24 opacity-100 border-t border-sukem-border p-4" : "max-h-0 opacity-0 p-0 border-transparent")}>
                    <button 
                        onClick={requestSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-sukem-primary to-sukem-accent text-white rounded-xl shadow-lg shadow-sukem-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <LoadingSpinner size="sm" /> : <CheckCircleIcon className="w-5 h-5"/>}
                        {isSaving ? 'Đang lưu thay đổi...' : 'Lưu thay đổi Banner'}
                    </button>
                </div>
            </div>

            {/* CỘT PHẢI: KHO TRUYỆN CÓ SẴN */}
            <div className="bg-sukem-card rounded-2xl shadow-lg border border-sukem-border flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-sukem-border bg-sukem-bg/50 flex flex-col gap-3 flex-shrink-0">
                    <h2 className="text-lg font-bold text-sukem-text flex items-center gap-2">
                        <MagnifyingGlassIcon className="w-5 h-5 text-sukem-primary"/>
                        Kho Truyện
                    </h2>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm truyện để thêm vào banner..."
                        className="w-full px-4 py-2.5 text-sm border border-sukem-border rounded-xl bg-sukem-card text-sukem-text focus:ring-2 focus:ring-sukem-primary focus:border-transparent outline-none shadow-sm transition-shadow"
                    />
                </div>
                
                <div ref={setAvailableRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-sukem-bg/30 relative">
                    <div className="space-y-3 pb-4 min-h-full">
                        {displayedAvailable.length === 0 ? (
                            <div className="text-center py-16 text-sukem-text-muted italic flex flex-col items-center justify-center h-full">
                                {searchTerm ? 'Không tìm thấy truyện nào khớp với từ khóa.' : 'Đã thêm tất cả truyện vào banner.'}
                            </div>
                        ) : (
                            displayedAvailable.map(story => (
                                <AvailableItem key={story.id} story={story} onAdd={() => addToBanner(story)} />
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

export default BannerManager;