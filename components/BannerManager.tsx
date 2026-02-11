import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import * as storyService from '../services/storyService';
import LoadingSpinner from './LoadingSpinner';
import ConfirmationModal from './ConfirmationModal';
import { 
    TrashIcon, MagnifyingGlassIcon, PhotoIcon, CheckCircleIcon, PlusIcon
} from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// DND Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
  MouseSensor
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

// --- Sortable Item Component ---
interface SortableItemProps {
    story: Story;
    index: number;
    onRemove: (id: string) => void;
}

const SortableItem = ({ story, index, onRemove }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: story.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
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

            <img src={story.coverImage} alt="" className="w-10 h-14 object-cover rounded-md bg-sukem-card shadow-sm" />
            
            <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-sukem-text truncate">{story.title}</p>
                <p className="text-xs text-sukem-text-muted truncate">{story.author}</p>
            </div>
            
            <button 
                onPointerDown={(e) => e.stopPropagation()} 
                onClick={(e) => { e.stopPropagation(); onRemove(story.id); }}
                className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                title="Gỡ khỏi banner"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
};


const BannerManager: React.FC = () => {
  const [bannerStories, setBannerStories] = useState<Story[]>([]);
  const [originalBannerStories, setOriginalBannerStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modals State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false); // Modal cho nút Lưu
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Story[]>([]);
  const [allStoriesCache, setAllStoriesCache] = useState<Story[]>([]); 

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchBannerStories = async () => {
    try {
      setLoading(true);
      const data = await storyService.getBannerStories();
      const sortedData = data.sort((a, b) => (a.bannerPriority || 0) - (b.bannerPriority || 0));
      setBannerStories(sortedData);
      setOriginalBannerStories(JSON.parse(JSON.stringify(sortedData)));
    } catch (error) {
      console.error('Lỗi lấy banner:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannerStories();
    storyService.getAllStories().then(data => setAllStoriesCache(data)).catch(console.error);
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) { setSearchResults([]); return; }
    const filtered = allStoriesCache.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !bannerStories.find(b => b.id === s.id)
    );
    setSearchResults(filtered.slice(0, 5));
  };

  const addToBanner = (story: Story) => {
      if (bannerStories.find(s => s.id === story.id)) return;
      setBannerStories([...bannerStories, { ...story, isInBanner: true }]);
      setSearchResults(prev => prev.filter(s => s.id !== story.id)); 
      setSearchTerm(''); 
  };

  // Actions
  const requestRemove = (storyId: string) => {
    setItemToDelete(storyId);
    setIsDeleteModalOpen(true);
  };

  const confirmRemove = () => {
    if (itemToDelete) {
        setBannerStories(prev => prev.filter(s => s.id !== itemToDelete));
    }
    setIsDeleteModalOpen(false); // Đóng modal
    setItemToDelete(null);
  };

  const requestSave = () => {
      if (hasChanges) setIsSaveModalOpen(true);
  };

  const confirmSave = async () => {
      setIsSaveModalOpen(false); // Đóng modal trước khi chạy
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
          alert('✅ Đã lưu cấu hình banner thành công!');
          fetchBannerStories();
      } catch (error) {
          console.error(error);
          alert('❌ Có lỗi xảy ra khi lưu.');
      } finally {
          setIsSaving(false);
      }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setBannerStories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const hasChanges = JSON.stringify(bannerStories.map(s => s.id)) !== JSON.stringify(originalBannerStories.map(s => s.id));

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

  return (
    <>
        <div className="bg-sukem-card rounded-2xl shadow-lg border border-sukem-border h-full flex flex-col overflow-hidden max-h-[80vh]">
            <div className="p-5 border-b border-sukem-border bg-gradient-to-r from-sukem-bg to-sukem-card flex justify-between items-center flex-shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-sukem-text flex items-center gap-2">
                        <PhotoIcon className="w-6 h-6 text-sukem-primary"/>
                        Quản lý Banner
                    </h2>
                    <p className="text-xs text-sukem-text-muted mt-1">Kéo thả để sắp xếp.</p>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-sukem-bg/50">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={bannerStories.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3 pb-20"> 
                            {bannerStories.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-sukem-border rounded-xl">
                                    <p className="text-sukem-text-muted font-medium">Danh sách trống</p>
                                    <p className="text-xs text-sukem-text-muted mt-1">Hãy thêm truyện vào banner</p>
                                </div>
                            ) : (
                                bannerStories.map((story, index) => (
                                    <SortableItem key={story.id} story={story} index={index} onRemove={requestRemove} />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            <div className="p-4 border-t border-sukem-border bg-sukem-card relative z-20 flex-shrink-0 flex flex-col gap-4">
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Tìm truyện thêm vào banner..."
                        className="w-full pl-10 pr-10 py-3 text-sm border border-sukem-border rounded-xl bg-sukem-bg text-sukem-text focus:ring-2 focus:ring-sukem-primary focus:border-transparent outline-none shadow-sm"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sukem-text-muted" />
                    {searchTerm && (
                        <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-sukem-primary text-white rounded-lg hover:bg-sukem-accent">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    )}
                    
                    {searchResults.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 max-h-60 overflow-y-auto custom-scrollbar border border-sukem-border rounded-xl bg-sukem-card shadow-xl z-50 p-2 space-y-1">
                            {searchResults.map(story => (
                                <button key={story.id} onClick={() => addToBanner(story)} className="w-full flex items-center gap-3 p-2 hover:bg-sukem-bg rounded-lg transition-colors text-left group">
                                    <img src={story.coverImage} alt="" className="w-10 h-14 object-cover rounded shadow-sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-sukem-text truncate group-hover:text-sukem-primary">{story.title}</p>
                                        <p className="text-xs text-sukem-text-muted">{story.author}</p>
                                    </div>
                                    <PlusIcon className="w-5 h-5 text-sukem-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className={cn("transition-all duration-300 overflow-hidden", hasChanges ? "max-h-16 opacity-100" : "max-h-0 opacity-0")}>
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
        </div>

        {/* Modal Xóa */}
        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmRemove}
            title="Gỡ khỏi Banner"
            message="Gỡ truyện này khỏi danh sách? (Cần bấm Lưu để áp dụng)"
            confirmText="Gỡ bỏ"
            cancelText="Hủy"
            isDestructive={true}
        />

         {/* Modal Lưu */}
         <ConfirmationModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onConfirm={confirmSave}
            title="Lưu thay đổi"
            message="Bạn có chắc chắn muốn lưu thứ tự banner hiện tại không?"
            confirmText="Đồng ý lưu"
            cancelText="Đóng"
        />
    </>
  );
};

export default BannerManager;