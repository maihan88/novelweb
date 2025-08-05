const Story = require('../models/storyModel');

// Hàm trợ giúp để tạo slug từ tiêu đề
const slugify = (text) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// @desc    Fetch all stories
// @route   GET /api/stories
// @access  Public
exports.getAllStories = async (req, res) => {
    try {
        const stories = await Story.find({}).sort({ lastUpdatedAt: -1 });
        res.json(stories);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Fetch a single story by id
// @route   GET /api/stories/:id
// @access  Public
exports.getStoryById = async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.id });
        if (story) {
            res.json(story);
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error fetching story:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private/Admin
exports.createStory = async (req, res) => {
    try {
        // --- PHẦN SỬA LỖI BẮT ĐẦU TỪ ĐÂY ---
        const { title, author, description, coverImage, tags, status, isHot, isInBanner } = req.body;

        // Thêm logic xử lý cho alias và tags
        const tagsArray = tags && typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
        const aliasArray = alias && typeof alias === 'string' ? alias.split(',').map(name => name.trim()).filter(Boolean) : [];

        if (!title || !author || !coverImage) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đủ Tên truyện, Tác giả và Ảnh bìa' });
        }
        
        // 1. Tạo một ID duy nhất từ tiêu đề và một hậu tố ngẫu nhiên
        const baseId = slugify(title);
        let storyId = baseId;
        let counter = 1;
        // Kiểm tra xem ID đã tồn tại chưa, nếu có thì thêm số vào cuối
        while (await Story.findOne({ id: storyId })) {
            storyId = `${baseId}-${counter}`;
            counter++;
        }

        // 2. Tạo đối tượng truyện mới với ID đã được sinh ra
        const story = new Story({
            id: storyId,
            title,
            author,
            description,
            coverImage,
            tags: tagsArray, // Sử dụng mảng đã xử lý
            status,
            isHot,
            isInBanner,
            alias: aliasArray, // Sử dụng mảng đã xử lý
            volumes: [],
        });

        // --- KẾT THÚC PHẦN SỬA LỖI ---

        const createdStory = await story.save();
        res.status(201).json(createdStory);
    } catch (error) {
        console.error('Error creating story:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update a story
// @route   PUT /api/stories/:id
// @access  Private/Admin
exports.updateStory = async (req, res) => {
    try {
        // Loại bỏ trường `id` ra khỏi req.body để tránh việc cố gắng cập nhật nó
        const { id, ...updateData } = req.body;

        // Thêm logic xử lý cho alias và tags
        if (updateData.tags && typeof updateData.tags === 'string') {
            updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }
        if (updateData.alias && typeof updateData.alias === 'string') {
            updateData.alias = updateData.alias.split(',').map(name => name.trim()).filter(Boolean);
        }

        const story = await Story.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (story) {
            res.json(story);
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error updating story:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private/Admin
exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findOneAndDelete({ id: req.params.id });
        
        if (story) {
            res.json({ message: 'Story removed' });
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// ... (Các hàm còn lại giữ nguyên không đổi)
// @desc    Increment story views
// @route   POST /api/stories/:id/view
// @access  Public
exports.incrementView = async (req, res) => {
    try {
        const story = await Story.findOneAndUpdate(
            { id: req.params.id },
            { $inc: { views: 1 } },
            { new: true }
        );
        
        if (story) {
            res.json({ message: 'View incremented' });
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error incrementing view:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Add rating to story
// @route   POST /api/stories/:id/rating
// @access  Private
exports.addRating = async (req, res) => {
    try {
        const { rating } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        
        if (story) {
            const newRatingsCount = story.ratingsCount + 1;
            const newTotalRating = story.rating * story.ratingsCount + rating;
            const newAverageRating = newTotalRating / newRatingsCount;
            
            story.rating = newAverageRating;
            story.ratingsCount = newRatingsCount;
            
            const updatedStory = await story.save();
            res.json(updatedStory);
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error adding rating:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Add volume to story
// @route   POST /api/stories/:id/volumes
// @access  Private/Admin
exports.addVolume = async (req, res) => {
    try {
        const { title } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        
        if (story) {
            const newVolume = {
                id: `vol-${Date.now()}`,
                title,
                chapters: []
            };
            
            story.volumes.push(newVolume);
            const updatedStory = await story.save();
            res.json(newVolume);
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error adding volume:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update volume
// @route   PUT /api/stories/:id/volumes/:volumeId
// @access  Private/Admin
exports.updateVolume = async (req, res) => {
    try {
        const { title } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        
        if (story) {
            const volume = story.volumes.find(v => v.id === req.params.volumeId);
            if (volume) {
                volume.title = title;
                const updatedStory = await story.save();
                res.json(volume);
            } else {
                res.status(404).json({ message: 'Volume not found' });
            }
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error updating volume:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Delete volume
// @route   DELETE /api/stories/:id/volumes/:volumeId
// @access  Private/Admin
exports.deleteVolume = async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.id });
        
        if (story) {
            story.volumes = story.volumes.filter(v => v.id !== req.params.volumeId);
            await story.save();
            res.json({ message: 'Volume removed' });
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error deleting volume:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Add chapter to volume
// @route   POST /api/stories/:id/volumes/:volumeId/chapters
// @access  Private/Admin
exports.addChapter = async (req, res) => {
    try {
        const { title, content } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        
        if (story) {
            const volume = story.volumes.find(v => v.id === req.params.volumeId);
            if (volume) {
                const newChapter = {
                    id: `ch-${Date.now()}`,
                    title,
                    content,
                    views: 0
                };
                
                volume.chapters.push(newChapter);
                await story.save();
                res.json(newChapter);
            } else {
                res.status(404).json({ message: 'Volume not found' });
            }
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error adding chapter:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update chapter
// @route   PUT /api/stories/:id/volumes/:volumeId/chapters/:chapterId
// @access  Private/Admin
exports.updateChapter = async (req, res) => {
    try {
        const { id, volumeId, chapterId } = req.params;
        const { title, content } = req.body;

        // Sử dụng updateOne với arrayFilters để cập nhật trực tiếp trong DB
        // Thao tác này sẽ không kích hoạt 'pre-save' hook, do đó không cập nhật `lastUpdatedAt`
        const result = await Story.updateOne(
            { 
                "id": id, 
                "volumes.id": volumeId,
                "volumes.chapters.id": chapterId 
            },
            { 
                $set: { 
                    "volumes.$[v].chapters.$[c].title": title,
                    "volumes.$[v].chapters.$[c].content": content,
                } 
            },
            {
                arrayFilters: [
                    { "v.id": volumeId },
                    { "c.id": chapterId }
                ],
            }
        );

        if (result.modifiedCount > 0) {
            // Để trả về chapter đã cập nhật, ta cần query lại nó, nhưng để đơn giản,
            // ta có thể chỉ trả về một thông báo thành công hoặc dữ liệu mới
            res.json({ id: chapterId, title, content });
        } else {
            res.status(404).json({ message: 'Không tìm thấy truyện, tập hoặc chương' });
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật chương:', error);
        res.status(500).json({ message: "Server Error" });
    }
};


// @desc    Delete chapter
// @route   DELETE /api/stories/:id/volumes/:volumeId/chapters/:chapterId
// @access  Private/Admin
exports.deleteChapter = async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.id });
        
        if (story) {
            const volume = story.volumes.find(v => v.id === req.params.volumeId);
            if (volume) {
                volume.chapters = volume.chapters.filter(c => c.id !== req.params.chapterId);
                await story.save();
                res.json({ message: 'Chapter removed' });
            } else {
                res.status(404).json({ message: 'Volume not found' });
            }
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error deleting chapter:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Increment chapter view
// @route   POST /api/stories/:id/chapters/:chapterId/view
// @access  Public
exports.incrementChapterView = async (req, res) => {
    try {
        const { id, chapterId } = req.params;

        // Sử dụng findOneAndUpdate với arrayFilters để cập nhật trực tiếp trong DB
        // Thao tác này hiệu quả hơn và sẽ KHÔNG kích hoạt 'pre-save' hook
        const result = await Story.updateOne(
            { "id": id, "volumes.chapters.id": chapterId },
            { $inc: { "volumes.$[v].chapters.$[c].views": 1 } },
            {
                arrayFilters: [{ "v.chapters.id": chapterId }, { "c.id": chapterId }],
            }
        );

        if (result.modifiedCount > 0) {
            res.json({ message: 'Chapter view incremented' });
        } else {
            res.status(404).json({ message: 'Story or Chapter not found' });
        }
    } catch (error) {
        console.error('Error incrementing chapter view:', error);
        res.status(500).json({ message: "Server Error" });
    }
};