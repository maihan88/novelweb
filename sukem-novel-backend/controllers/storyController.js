const Story = require('../models/storyModel');

// Hàm slugify (giữ nguyên)
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

// @desc    Fetch stories with filter, sort and pagination
// @route   GET /api/stories
exports.getAllStories = async (req, res) => {
    try {
        // Lấy tham số từ query string (mặc định page 1, limit 12)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const sortType = req.query.sort || 'updated';
        const status = req.query.status;
        const keyword = req.query.keyword;

        // Xây dựng bộ lọc
        const query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }

        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { author: { $regex: keyword, $options: 'i' } }
            ];
        }

        // Xử lý sắp xếp
        let sortOption = {};
        switch (sortType) {
            case 'hot':
                query.isHot = true; 
                sortOption = { bannerPriority: 1, lastUpdatedAt: -1 };
                break;
            case 'new': 
                sortOption = { createdAt: -1 };
                break;
            case 'view': 
                sortOption = { views: -1, lastUpdatedAt: -1 };
                break;
            case 'updated': 
            default:
                sortOption = { lastUpdatedAt: -1 };
                break;
        }

        const skip = (page - 1) * limit;

        // Chạy song song đếm tổng và lấy dữ liệu
        const [stories, totalDocs] = await Promise.all([
            Story.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .select('-volumes.chapters.content'), // Tối ưu: không lấy nội dung chương
            Story.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalDocs / limit);

        // Trả về cấu trúc có pagination
        res.json({
            stories,
            pagination: {
                page,
                limit,
                totalDocs,
                totalPages,
            }
        });

    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// ... (Giữ nguyên TẤT CẢ các hàm khác bên dưới: getStoryById, createStory, updateStory, deleteStory, v.v...)
// ... Lưu ý: Copy lại toàn bộ phần dưới của file cũ vào đây để đảm bảo không mất chức năng
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
