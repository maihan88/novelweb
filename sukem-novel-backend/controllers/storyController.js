const Story = require('../models/storyModel');
const Chapter = require('../models/chapterModel');

// @desc    Lấy danh sách stories (Home/Search)
// @route   GET /api/stories
// @desc    Lấy danh sách stories (Home/Search)
exports.getAllStories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const sortType = req.query.sort || 'updated';
        const status = req.query.status;
        const keyword = req.query.keyword;

        const query = {};
        if (status && status !== 'all') query.status = status;
        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { author: { $regex: keyword, $options: 'i' } },
                { alias: { $regex: keyword, $options: 'i' } }
            ];
        }
        if (req.query.isHot === 'true') query.isHot = true;

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
                sortOption = { totalViews: -1, lastUpdatedAt: -1 };
                break;
            case 'updated': 
            default:
                sortOption = { lastUpdatedAt: -1 };
                break;
        }

        const skip = (page - 1) * limit;

        // 1. Lấy danh sách truyện cơ bản
        const [storiesRaw, totalDocs] = await Promise.all([
            Story.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
            Story.countDocuments(query)
        ]);

        // 2. [QUAN TRỌNG] Tìm chương mới nhất cho từng truyện
        // Dùng Promise.all để chạy song song cho nhanh
        const storiesWithLatest = await Promise.all(storiesRaw.map(async (story) => {
            // Tìm chương mới nhất (không phải Raw) của truyện này
            const latestChapter = await Chapter.findOne({ 
                storyId: story._id,
                isRaw: false // Chỉ lấy chương đã xuất bản
            })
            .select('title createdAt id') // Chỉ lấy thông tin cần thiết hiển thị
            .sort({ createdAt: -1 }); // Mới nhất lên đầu

            return {
                ...story,
                latestChapter: latestChapter || null // Gắn thêm field này
            };
        }));

        res.json({
            stories: storiesWithLatest,
            pagination: {
                page, limit, totalDocs,
                totalPages: Math.ceil(totalDocs / limit),
            }
        });

    } catch (error) {
        console.error('Error getAllStories:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Lấy chi tiết Story (Ghép Chapters vào Volumes)
// @route   GET /api/stories/:id
exports.getStoryById = async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.id }).lean();
        
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        const chapters = await Chapter.find({ storyId: story._id })
            .select('id title volumeId views isRaw createdAt')
            .sort({ createdAt: 1 })
            .lean();

        if (story.volumes && story.volumes.length > 0) {
            story.volumes = story.volumes.map(vol => {
                const volChapters = chapters.filter(c => c.volumeId === vol.id);
                return {
                    ...vol,
                    chapters: volChapters
                };
            });
        }

        story.views = story.totalViews; 
        res.json(story);
    } catch (error) {
        console.error('Error getStoryById:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Lấy NỘI DUNG 1 chương
// @route   GET /api/stories/:id/chapters/:chapterId
exports.getChapterContent = async (req, res) => {
    try {
        const chapter = await Chapter.findOne({ id: req.params.chapterId });
        
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        // --- LOGIC VIEW MỚI ---
        // req.user có được nhờ optionalAuth middleware
        const isAdmin = req.user && req.user.role === 'admin';

        // Chỉ tính view nếu KHÔNG phải Admin
        if (!isAdmin) {
            chapter.views += 1;
            await chapter.save();

            // Update view tổng cho truyện (không update lastUpdatedAt khi đọc)
            Story.findByIdAndUpdate(chapter.storyId, { 
                $inc: { totalViews: 1 }
            }).exec();
        }
        // ---------------------

        res.json(chapter);
    } catch (error) {
         res.status(500).json({ message: "Server Error" });
    }
};

// --- CÁC HÀM ADMIN ---

exports.createStory = async (req, res) => {
    try {
        const { title, author, description, coverImage, tags, status, isHot, isInBanner, alias } = req.body;
        const tagsArray = Array.isArray(tags) ? tags : (tags ? tags.split(',') : []);
        
        const story = new Story({
            title, author, description, coverImage, 
            tags: tagsArray, status, isHot, isInBanner, alias,
            volumes: [] 
        });

        const createdStory = await story.save();
        res.status(201).json(createdStory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateStory = async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.id });
        if (!story) return res.status(404).json({ message: 'Story not found' });

        const { title, author, description, coverImage, status, isHot, isInBanner, bannerPriority } = req.body;
        
        if(title) story.title = title;
        if(author) story.author = author;
        if(description) story.description = description;
        if(coverImage) story.coverImage = coverImage;
        if(status) story.status = status;
        if(isHot !== undefined) story.isHot = isHot;
        if(isInBanner !== undefined) story.isInBanner = isInBanner;
        if(bannerPriority !== undefined) story.bannerPriority = bannerPriority;

        const updatedStory = await story.save();
        res.json(updatedStory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addVolume = async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.id });
        if (!story) return res.status(404).json({ message: 'Story not found' });

        const newVolume = { 
            id: `vol-${Date.now()}`, 
            title: req.body.title 
        };
        
        story.volumes.push(newVolume);
        await story.save();
        
        res.json(newVolume);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thêm Chapter (Đã sửa logic Raw)
exports.addChapter = async (req, res) => {
    try {
        const { title, content, isRaw } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        
        if (!story) return res.status(404).json({ message: 'Story not found' });
        
        const volumeExists = story.volumes.find(v => v.id === req.params.volumeId);
        if (!volumeExists) return res.status(404).json({ message: 'Volume not found' });

        const newChapter = new Chapter({
            storyId: story._id,
            volumeId: req.params.volumeId,
            id: `ch-${Date.now()}`,
            title,
            content,
            isRaw: !!isRaw,
            views: 0
        });

        await newChapter.save();

        // --- LOGIC MỚI ---
        // Chỉ cập nhật 'lastUpdatedAt' nếu chương này KHÔNG phải là Nháp (Raw)
        if (!isRaw) {
            story.lastUpdatedAt = new Date();
            await story.save();
        }
        // -----------------

        res.json(newChapter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Update Chapter (Đã sửa logic Raw)
exports.updateChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findOne({ id: req.params.chapterId });
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        const { title, content, isRaw } = req.body;
        
        chapter.title = title || chapter.title;
        chapter.content = content || chapter.content;
        
        if (isRaw !== undefined) chapter.isRaw = isRaw;

        await chapter.save();

        // --- LOGIC MỚI ---
        // Kiểm tra xem sau khi sửa xong, chương có đang ở trạng thái CÔNG KHAI không?
        // Nếu là công khai (!isRaw) -> Cập nhật truyện lên top.
        // Nếu là nháp (isRaw) -> Không làm gì cả.
        const isNowRaw = (isRaw !== undefined) ? isRaw : chapter.isRaw;
        
        if (!isNowRaw) {
            // Chỉ cần update trường lastUpdatedAt
            await Story.findByIdAndUpdate(chapter.storyId, { lastUpdatedAt: new Date() });
        }
        // -----------------

        res.json(chapter);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteChapter = async (req, res) => {
    try {
        await Chapter.findOneAndDelete({ id: req.params.chapterId });
        res.json({ message: 'Chapter removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBannerStories = async (req, res) => {
    try {
        const stories = await Story.find({ isInBanner: true })
            .sort({ bannerPriority: 1, lastUpdatedAt: -1 })
            .limit(10);
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateStoryBannerConfig = async (req, res) => {
    try {
        const { isInBanner, bannerPriority } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        if(story) {
            story.isInBanner = isInBanner;
            story.bannerPriority = bannerPriority;
            await story.save();
            res.json(story);
        } else {
            res.status(404).json({ message: "Story not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.id });
        if(story) {
            await Chapter.deleteMany({ storyId: story._id }); 
            await story.deleteOne();
            res.json({ message: 'Story removed' });
        } else {
             res.status(404).json({ message: 'Story not found' });
        }
    } catch(e) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.incrementChapterView = async (req, res) => {
    try {
        const chapter = await Chapter.findOne({ id: req.params.chapterId });
        if(chapter) {
            chapter.views += 1;
            await chapter.save();
            
            await Story.findByIdAndUpdate(chapter.storyId, { $inc: { totalViews: 1 } });
            res.json({ message: 'View updated' });
        } else {
             res.status(404).json({ message: 'Chapter not found' });
        }
    } catch(e) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.reorderVolumes = async (req, res) => {
    try {
        const { orderedVolumeIds } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        if (!story) return res.status(404).json({ message: 'Not found' });
        
        const newVolumes = [];
        orderedVolumeIds.forEach(vid => {
            const v = story.volumes.find(vol => vol.id === vid);
            if(v) newVolumes.push(v);
        });
        story.volumes = newVolumes;
        await story.save();
        res.json(story.volumes);
    } catch(e) { res.status(500).json({message: "Error"}); }
};
