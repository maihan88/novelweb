const Story = require('../models/storyModel');

// Hàm slugify
const slugify = (text) => {
  if (!text) return '';
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
exports.getAllStories = async (req, res) => {
    try {
        const stories = await Story.find({})
            .sort({ lastUpdatedAt: -1 })
            .select('-volumes.chapters.content'); 
        res.json(stories);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Fetch a single story by id
// @route   GET /api/stories/:id
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
exports.createStory = async (req, res) => {
    try {
        const { title, author, description, coverImage, tags, status, isHot, isInBanner, alias } = req.body;
        if (!title || !author || !coverImage) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đủ Tên truyện, Tác giả và Ảnh bìa' });
        }
        const tagsArray = tags && typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : (Array.isArray(tags) ? tags : []);
        const aliasArray = alias && typeof alias === 'string' ? alias.split(',').map(name => name.trim()).filter(Boolean) : (Array.isArray(alias) ? alias : []);

        const storyData = {
            title, author, description, coverImage, tags: tagsArray, status, isHot, isInBanner, alias: aliasArray, volumes: [],
        };

        const story = new Story(storyData);
        const createdStory = await story.save();
        res.status(201).json(createdStory);
    } catch (error) {
        console.error('Create story error:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update a story
// @route   PUT /api/stories/:id
exports.updateStory = async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.id });
        if (story) {
            const { title, author, description, coverImage, tags, status, isHot, isInBanner, alias } = req.body;
            story.title = title || story.title;
            story.author = author || story.author;
            story.description = description !== undefined ? description : story.description;
            story.coverImage = coverImage || story.coverImage;
            story.status = status || story.status;
            story.isHot = isHot !== undefined ? isHot : story.isHot;
            story.isInBanner = isInBanner !== undefined ? isInBanner : story.isInBanner;
            if (tags !== undefined) story.tags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : (Array.isArray(tags) ? tags : []);
            if (alias !== undefined) story.alias = typeof alias === 'string' ? alias.split(',').map(name => name.trim()).filter(Boolean) : (Array.isArray(alias) ? alias : []);

            const updatedStory = await story.save(); 
            res.json(updatedStory);
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findOneAndDelete({ id: req.params.id });
        if (story) {
            res.json({ message: 'Story removed' });
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Add rating
// @route   POST /api/stories/:id/rating
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
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Add volume
// @route   POST /api/stories/:id/volumes
exports.addVolume = async (req, res) => {
    try {
        const { title } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        if (story) {
            const newVolume = { id: `vol-${Date.now()}`, title, chapters: [] };
            story.volumes.push(newVolume);
            await story.save();
            res.json(newVolume);
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update volume
// @route   PUT /api/stories/:id/volumes/:volumeId
exports.updateVolume = async (req, res) => {
    try {
        const { title } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        if (story) {
            const volume = story.volumes.find(v => v.id === req.params.volumeId);
            if (volume) {
                volume.title = title;
                await story.save();
                res.json(volume);
            } else {
                res.status(404).json({ message: 'Volume not found' });
            }
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Delete volume
// @route   DELETE /api/stories/:id/volumes/:volumeId
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
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Add chapter
// @route   POST /api/stories/:id/volumes/:volumeId/chapters
exports.addChapter = async (req, res) => {
    try {
        const { title, content, isRaw } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        if (story) {
            const volume = story.volumes.find(v => v.id === req.params.volumeId);
            if (volume) {
                const newChapter = { id: `ch-${Date.now()}`, title, content, isRaw: !!isRaw, views: 0 };
                volume.chapters.push(newChapter);
                if (!newChapter.isRaw) story.lastUpdatedAt = new Date();
                await story.save();
                res.json(newChapter);
            } else {
                res.status(404).json({ message: 'Volume not found' });
            }
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update chapter
// @route   PUT /api/stories/:id/volumes/:volumeId/chapters/:chapterId
exports.updateChapter = async (req, res) => {
    try {
        const { id, volumeId, chapterId } = req.params;
        const { title, content, isRaw } = req.body;
        const story = await Story.findOne({ id: id });
        if (!story) return res.status(404).json({ message: 'Không tìm thấy truyện' });
        const volume = story.volumes.find(v => v.id === volumeId);
        if (!volume) return res.status(404).json({ message: 'Không tìm thấy tập' });
        const chapter = volume.chapters.find(c => c.id === chapterId);
        if (!chapter) return res.status(404).json({ message: 'Không tìm thấy chương' });
        
        const wasRaw = chapter.isRaw;
        chapter.title = title;
        chapter.content = content;
        chapter.isRaw = !!isRaw;
        if (wasRaw && !chapter.isRaw) story.lastUpdatedAt = new Date();
        await story.save();
        res.json({ id: chapterId, title, content, isRaw });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Delete chapter
// @route   DELETE /api/stories/:id/volumes/:volumeId/chapters/:chapterId
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
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Increment chapter view
// @route   POST /api/stories/:id/chapters/:chapterId/view
exports.incrementChapterView = async (req, res) => {
    try {
        const { id, chapterId } = req.params;
        const result = await Story.updateOne(
            { "id": id, "volumes.chapters.id": chapterId },
            { $inc: { "volumes.$[v].chapters.$[c].views": 1 } },
            { arrayFilters: [{ "v.chapters.id": chapterId }, { "c.id": chapterId }] }
        );
        if (result.modifiedCount > 0) res.json({ message: 'Chapter view incremented' });
        else res.status(404).json({ message: 'Story or Chapter not found' });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Reorder volumes
// @route   PUT /api/stories/:id/volumes/reorder
exports.reorderVolumes = async (req, res) => {
    try {
        const { orderedVolumeIds } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        if (!story) return res.status(404).json({ message: 'Không tìm thấy truyện' });
        const reorderedVolumes = orderedVolumeIds.map(volId => story.volumes.find(v => v.id === volId)).filter(Boolean);
        if (reorderedVolumes.length !== story.volumes.length) return res.status(400).json({ message: 'Danh sách ID tập không hợp lệ' });
        story.volumes = reorderedVolumes;
        await story.save();
        res.json(story.volumes);
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server" });
    }
};

// @desc    Reorder chapters
// @route   PUT /api/stories/:id/volumes/:volumeId/chapters/reorder
exports.reorderChapters = async (req, res) => {
    try {
        const { orderedChapterIds } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        if (!story) return res.status(404).json({ message: 'Không tìm thấy truyện' });
        const volume = story.volumes.find(v => v.id === req.params.volumeId);
        if (!volume) return res.status(404).json({ message: 'Không tìm thấy tập' });
        const reorderedChapters = orderedChapterIds.map(chapId => volume.chapters.find(c => c.id === chapId)).filter(Boolean);
        if (reorderedChapters.length !== volume.chapters.length) return res.status(400).json({ message: 'Danh sách ID chương không hợp lệ' });
        volume.chapters = reorderedChapters;
        await story.save();
        res.json(volume.chapters);
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server" });
    }
};

// --- CÁC HÀM MỚI CHO BANNER ---

// @desc    Lấy danh sách banner (đã sort)
// @route   GET /api/stories/banner/list
exports.getBannerStories = async (req, res) => {
    try {
        const stories = await Story.find({ isInBanner: true })
            .sort({ bannerPriority: 1, lastUpdatedAt: -1 })
            .select('-volumes.chapters.content');
        res.json(stories);
    } catch (error) {
        console.error('Lỗi lấy banner:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Cập nhật nhanh cấu hình banner (Admin)
// @route   PUT /api/stories/:id/banner
exports.updateStoryBannerConfig = async (req, res) => {
    try {
        const { isInBanner, bannerPriority } = req.body;
        const story = await Story.findOne({ id: req.params.id });

        if (story) {
            if (typeof isInBanner !== 'undefined') story.isInBanner = isInBanner;
            if (typeof bannerPriority !== 'undefined') story.bannerPriority = bannerPriority;
            const updatedStory = await story.save();
            res.json({ id: updatedStory.id, title: updatedStory.title, isInBanner: updatedStory.isInBanner, bannerPriority: updatedStory.bannerPriority });
        } else {
            res.status(404).json({ message: 'Không tìm thấy truyện' });
        }
    } catch (error) {
        console.error('Lỗi cập nhật banner:', error);
        res.status(500).json({ message: "Server Error" });
    }
};
