const Story = require('../models/storyModel');
const Chapter = require('../models/chapterModel');

// @desc    Lấy danh sách stories (Home/Search)
// @route   GET /api/stories
exports.getAllStories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const sortType = req.query.sort || 'updated';
        const status = req.query.status;
        const keyword = req.query.keyword;

        const query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }

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

        // Bây giờ Story rất nhẹ vì không chứa content chương
        // Không sợ lỗi Memory Limit nữa
        const [stories, totalDocs] = await Promise.all([
            Story.find(query).sort(sortOption).skip(skip).limit(limit),
            Story.countDocuments(query)
        ]);

        res.json({
            stories,
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

// @desc    Lấy chi tiết Story (Quan trọng: Ghép Chapters vào Volumes)
// @route   GET /api/stories/:id
exports.getStoryById = async (req, res) => {
    try {
        // 1. Lấy thông tin Story (chỉ có volume headers)
        const story = await Story.findOne({ id: req.params.id }).lean(); // .lean() để trả về plain JS object, dễ modify
        
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // 2. Lấy toàn bộ Chapters thuộc truyện này (Chỉ lấy info, KHÔNG lấy content)
        const chapters = await Chapter.find({ storyId: story._id })
            .select('id title volumeId views isRaw createdAt') // Select fields nhẹ
            .sort({ createdAt: 1 })
            .lean();

        // 3. Ghép Chapters vào đúng Volume của nó
        // Logic này giúp Frontend nhận dữ liệu Y HỆT cấu trúc cũ
        if (story.volumes && story.volumes.length > 0) {
            story.volumes = story.volumes.map(vol => {
                const volChapters = chapters.filter(c => c.volumeId === vol.id);
                return {
                    ...vol,
                    chapters: volChapters // Nhét chapters vào lại volume
                };
            });
        }

        // Tính lại view ảo nếu cần
        story.views = story.totalViews; 

        res.json(story);
    } catch (error) {
        console.error('Error getStoryById:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Lấy NỘI DUNG 1 chương (API Mới để đọc truyện)
// @route   GET /api/stories/:id/chapters/:chapterId
// API này Frontend phải gọi khi vào đọc truyện
exports.getChapterContent = async (req, res) => {
    try {
        // Tìm chapter theo ID chương (vẫn dùng slug id cũ của bạn)
        const chapter = await Chapter.findOne({ id: req.params.chapterId });
        
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        // Tăng view
        chapter.views += 1;
        await chapter.save();

        // Update view tổng cho truyện (chạy background, không await để phản hồi nhanh)
        Story.findByIdAndUpdate(chapter.storyId, { 
            $inc: { totalViews: 1 },
            lastUpdatedAt: new Date()
        }).exec();

        res.json(chapter);
    } catch (error) {
         res.status(500).json({ message: "Server Error" });
    }
};

// --- CÁC HÀM ADMIN (Cần cập nhật logic tách bảng) ---

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

// Thêm Volume (Giữ nguyên logic cũ, chỉ lưu metadata vào Story)
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

// Thêm Chapter (LOGIC THAY ĐỔI NHIỀU NHẤT)
exports.addChapter = async (req, res) => {
    try {
        const { title, content, isRaw } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        
        if (!story) return res.status(404).json({ message: 'Story not found' });
        
        const volumeExists = story.volumes.find(v => v.id === req.params.volumeId);
        if (!volumeExists) return res.status(404).json({ message: 'Volume not found' });

        // Tạo Chapter mới trong bảng Chapter
        const newChapter = new Chapter({
            storyId: story._id, // Link với Story
            volumeId: req.params.volumeId, // Link với Volume
            id: `ch-${Date.now()}`,
            title,
            content,
            isRaw: !!isRaw,
            views: 0
        });

        await newChapter.save();

        // Cập nhật thời gian update của truyện
        story.lastUpdatedAt = new Date();
        await story.save();

        res.json(newChapter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Update Chapter (Tìm trong bảng Chapter)
exports.updateChapter = async (req, res) => {
    try {
        // Tìm chapter bằng id slug
        const chapter = await Chapter.findOne({ id: req.params.chapterId });
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        const { title, content, isRaw } = req.body;
        
        chapter.title = title || chapter.title;
        chapter.content = content || chapter.content;
        if (isRaw !== undefined) chapter.isRaw = isRaw;

        await chapter.save();
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Chapter
exports.deleteChapter = async (req, res) => {
    try {
        await Chapter.findOneAndDelete({ id: req.params.chapterId });
        res.json({ message: 'Chapter removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Banner Logic (Giữ nguyên)
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

// Các hàm khác như deleteVolume, updateVolume, deleteStory cần sửa nhẹ tương tự (xóa trong Story và xóa Chapter liên quan).
// Delete Story thì cần: await Chapter.deleteMany({ storyId: story._id });
exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.id });
        if(story) {
            await Chapter.deleteMany({ storyId: story._id }); // Xóa hết chương con
            await story.deleteOne();
            res.json({ message: 'Story removed' });
        } else {
             res.status(404).json({ message: 'Story not found' });
        }
    } catch(e) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Logic tính view (cập nhật từ client gửi lên)
exports.incrementChapterView = async (req, res) => {
    // Logic này đã được xử lý trong getChapterContent, 
    // nhưng nếu client gọi riêng thì dùng hàm này cập nhật bảng Chapter
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
    // Giữ nguyên logic cũ vì volume vẫn nằm trong Story
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
