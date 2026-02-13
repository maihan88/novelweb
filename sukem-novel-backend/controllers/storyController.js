const mongoose = require('mongoose');
const Story = require('../models/storyModel');
const Chapter = require('../models/chapterModel');
const User = require('../models/userModel');

// Helper function để tạo query tìm kiếm theo _id hoặc custom id
const getStoryQuery = (id) => {
    if (mongoose.Types.ObjectId.isValid(id)) {
        return { _id: id };
    }
    return { id: id };
};

// @desc    Lấy thống kê cho Admin Dashboard
// @route   GET /api/stories/admin/stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalStories = await Story.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalChapters = await Chapter.countDocuments();

        const viewsStats = await Story.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$totalViews" }
                }
            }
        ]);
        const totalViews = viewsStats.length > 0 ? viewsStats[0].totalViews : 0;

        const stories = await Story.aggregate([
            { $sort: { lastUpdatedAt: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'chapters',
                    localField: '_id',
                    foreignField: 'storyId',
                    as: 'chapters'
                }
            },
            {
                $project: {
                    title: 1, author: 1, totalViews: 1, status: 1, coverImage: 1,
                    createdAt: 1, updatedAt: 1, lastUpdatedAt: 1,
                    chapterCount: { $size: "$chapters" }
                }
            }
        ]);

        res.json({
            stats: { totalStories, totalUsers, totalChapters, totalViews },
            stories
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Lỗi server khi lấy thống kê" });
    }
};

// @desc    Lấy danh sách stories (Home + Search + Filter)
// @route   GET /api/stories
exports.getAllStories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const sortType = req.query.sort || 'updated';
        const status = req.query.status;
        const keyword = req.query.keyword;
        const isHot = req.query.isHot === 'true';
        
        // Nhận tham số khoảng chương (VD: "0-50", "1000-max")
        const chapterRange = req.query.chapterRange;
        
        let minChapter = 0;
        let maxChapter = 999999;

        // Phân tích chapterRange thành min/max
        if (chapterRange) {
            const parts = chapterRange.split('-');
            if (parts.length === 2) {
                minChapter = parseInt(parts[0]) || 0;
                // Nếu part[1] là 'max' hoặc số quá lớn
                maxChapter = parts[1] === 'max' ? 999999 : (parseInt(parts[1]) || 999999);
            }
        }

        const useAdvancedFilter = (minChapter > 0 || maxChapter < 999999);

        // --- LUỒNG 1: CƠ BẢN (Home/List thường) ---
        if (!useAdvancedFilter) {
            const query = {};
            if (status && status !== 'all') {
                if(status === 'ongoing') query.status = 'Đang dịch';
                else if(status === 'completed') query.status = 'Hoàn thành';
                else query.status = status;
            }
            if (isHot) query.isHot = true;
            if (keyword) {
                query.$or = [
                    { title: { $regex: keyword, $options: 'i' } },
                    { author: { $regex: keyword, $options: 'i' } },
                    { alias: { $regex: keyword, $options: 'i' } }
                ];
            }

            let sortOption = {};
            switch (sortType) {
                case 'hot': query.isHot = true; sortOption = { bannerPriority: 1, lastUpdatedAt: -1 }; break;
                case 'new': sortOption = { createdAt: -1 }; break;
                case 'view': sortOption = { totalViews: -1, lastUpdatedAt: -1 }; break;
                case 'updated': default: sortOption = { lastUpdatedAt: -1 }; break;
            }

            const skip = (page - 1) * limit;
            const [storiesRaw, totalDocs] = await Promise.all([
                Story.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
                Story.countDocuments(query)
            ]);

            const storiesWithLatest = await Promise.all(storiesRaw.map(async (story) => {
                const latestChapter = await Chapter.findOne({ storyId: story._id, isRaw: false })
                    .select('title createdAt id').sort({ createdAt: -1 });
                const count = await Chapter.countDocuments({ storyId: story._id });
                return { ...story, latestChapter: latestChapter || null, chapterCount: count };
            }));

            return res.json({
                stories: storiesWithLatest,
                pagination: { page, limit, totalDocs, totalPages: Math.ceil(totalDocs / limit) }
            });
        }

        // --- LUỒNG 2: NÂNG CAO (Có lọc chương) ---
        else {
            const skip = (page - 1) * limit;
            let pipeline = [];
            const matchStage = {};
            
            if (status && status !== 'all') {
                if(status === 'ongoing') matchStage.status = 'Đang dịch';
                else if(status === 'completed') matchStage.status = 'Hoàn thành';
                else matchStage.status = status;
            }
            if (isHot) matchStage.isHot = true;
            if (keyword) {
                matchStage.$or = [
                    { title: { $regex: keyword, $options: 'i' } },
                    { author: { $regex: keyword, $options: 'i' } },
                    { alias: { $regex: keyword, $options: 'i' } }
                ];
            }
            pipeline.push({ $match: matchStage });

            pipeline.push({
                $lookup: { from: 'chapters', localField: '_id', foreignField: 'storyId', as: 'chapterData' }
            });

            pipeline.push({
                $addFields: { calculatedChapterCount: { $size: "$chapterData" } }
            });

            pipeline.push({
                $match: { calculatedChapterCount: { $gte: minChapter, $lte: maxChapter } }
            });

            let sortStage = {};
            switch (sortType) {
                case 'hot': sortStage = { isHot: -1, bannerPriority: 1, lastUpdatedAt: -1 }; break;
                case 'new': sortStage = { createdAt: -1 }; break;
                case 'view': sortStage = { totalViews: -1, lastUpdatedAt: -1 }; break;
                case 'updated': default: sortStage = { lastUpdatedAt: -1 }; break;
            }
            pipeline.push({ $sort: sortStage });

            pipeline.push({
                $facet: {
                    stories: [ { $skip: skip }, { $limit: limit }, { $project: { chapterData: 0 } } ],
                    totalCount: [{ $count: "count" }]
                }
            });

            const results = await Story.aggregate(pipeline);
            const storiesRaw = results[0].stories;
            const totalDocs = results[0].totalCount[0] ? results[0].totalCount[0].count : 0;

            const storiesWithLatest = await Promise.all(storiesRaw.map(async (story) => {
                const latestChapter = await Chapter.findOne({ storyId: story._id, isRaw: false })
                    .select('title createdAt id').sort({ createdAt: -1 });
                return { ...story, latestChapter: latestChapter || null, chapterCount: story.calculatedChapterCount };
            }));

            return res.json({
                stories: storiesWithLatest,
                pagination: { page, limit, totalDocs, totalPages: Math.ceil(totalDocs / limit) }
            });
        }
    } catch (error) {
        console.error('Error getAllStories:', error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Lấy chi tiết Story
exports.getStoryById = async (req, res) => {
    try {
        const query = getStoryQuery(req.params.id);
        const story = await Story.findOne(query).lean();
        
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        const chapters = await Chapter.find({ storyId: story._id })
            .select('id title volumeId views isRaw createdAt updatedAt')
            .sort({ createdAt: 1 })
            .lean();

        if (story.volumes && story.volumes.length > 0) {
            story.volumes = story.volumes.map(vol => {
                const volChapters = chapters.filter(c => c.volumeId === vol.id);
                return { ...vol, chapters: volChapters };
            });
        }
        story.views = story.totalViews; 
        res.json(story);
    } catch (error) {
        console.error('Error getStoryById:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Lấy nội dung chương
exports.getChapterContent = async (req, res) => {
    try {
        const chapter = await Chapter.findOne({ id: req.params.chapterId });
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        const isAdmin = req.user && req.user.role === 'admin';
        if (!isAdmin) {
            chapter.views += 1;
            await chapter.save();
            Story.findByIdAndUpdate(chapter.storyId, { $inc: { totalViews: 1 } }).exec();
        }
        res.json(chapter);
    } catch (error) {
         res.status(500).json({ message: "Server Error" });
    }
};

// --- ADMIN FUNCTIONS ---

exports.createStory = async (req, res) => {
    try {
        const { title, author, description, coverImage, tags, status, isHot, isInBanner, alias } = req.body;
        const tagsArray = Array.isArray(tags) ? tags : (tags ? tags.split(',') : []);
        
        const story = new Story({
            title, author, description, coverImage, 
            tags: tagsArray, status, isHot, isInBanner, alias,
            volumes: [],
            lastUpdatedAt: new Date()
        });

        const createdStory = await story.save();
        res.status(201).json(createdStory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateStory = async (req, res) => {
    try {
        const query = getStoryQuery(req.params.id);
        const story = await Story.findOne(query);
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

        story.lastUpdatedAt = new Date();
        const updatedStory = await story.save();
        res.json(updatedStory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addVolume = async (req, res) => {
    try {
        const query = getStoryQuery(req.params.id);
        const story = await Story.findOne(query);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        const newVolume = { id: `vol-${Date.now()}`, title: req.body.title };
        story.volumes.push(newVolume);
        await story.save();
        res.json(newVolume);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- HÀM MỚI THÊM: Cập nhật Volume ---
exports.updateVolume = async (req, res) => {
    try {
        const { title } = req.body;
        const query = getStoryQuery(req.params.id);
        const story = await Story.findOne(query);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Tìm volume trong mảng volumes
        const volume = story.volumes.find(v => v.id === req.params.volumeId);
        
        if (!volume) {
            return res.status(404).json({ message: 'Volume not found' });
        }

        // Cập nhật dữ liệu
        if (title) volume.title = title;

        // Lưu thay đổi
        story.lastUpdatedAt = new Date();
        await story.save();

        res.json(volume);
    } catch (error) {
        console.error("Update Volume Error:", error);
        res.status(500).json({ message: error.message });
    }
};
// -------------------------------------

exports.addChapter = async (req, res) => {
    try {
        const { title, content, isRaw } = req.body;
        const query = getStoryQuery(req.params.id);
        const story = await Story.findOne(query);
        if (!story) return res.status(404).json({ message: 'Story not found' });
        
        const volumeExists = story.volumes.find(v => v.id === req.params.volumeId);
        if (!volumeExists) return res.status(404).json({ message: 'Volume not found' });

        const newChapter = new Chapter({
            storyId: story._id,
            volumeId: req.params.volumeId,
            id: `ch-${Date.now()}`,
            title, content, isRaw: !!isRaw, views: 0,
            createdAt: new Date(), updatedAt: new Date()
        });

        await newChapter.save();
        if (!newChapter.isRaw) {
            await Story.findByIdAndUpdate(story._id, { lastUpdatedAt: new Date() });
        }
        res.json(newChapter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findOne({ id: req.params.chapterId });
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        const { title, content, isRaw } = req.body;
        if (title) chapter.title = title;
        if (content) chapter.content = content;
        if (isRaw !== undefined) chapter.isRaw = isRaw;
        
        chapter.updatedAt = new Date(); 
        await chapter.save();
        if (!chapter.isRaw) {
            await Story.findByIdAndUpdate(chapter.storyId, { lastUpdatedAt: new Date() });
        }
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findOne({ id: req.params.chapterId });
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        const storyId = chapter.storyId;
        await Chapter.deleteOne({ id: req.params.chapterId });
        await Story.findByIdAndUpdate(storyId, { lastUpdatedAt: new Date() });
        res.json({ message: 'Chapter removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBannerStories = async (req, res) => {
    try {
        const stories = await Story.aggregate([
            { $match: { isInBanner: true } },
            { $sort: { bannerPriority: 1, lastUpdatedAt: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'chapters', localField: '_id', foreignField: 'storyId', as: 'chapterList' } },
            { $addFields: { 
                chapterCount: { $size: { $filter: { input: "$chapterList", as: "ch", cond: { $ne: ["$$ch.isRaw", true] } } } },
                firstChapterId: { $arrayElemAt: ["$chapterList.id", 0] }
            }},
            { $project: { chapterList: 0 } }
        ]);
        res.json(stories);
    } catch (error) {
        console.error("Banner Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateStoryBannerConfig = async (req, res) => {
    try {
        const { isInBanner, bannerPriority } = req.body;
        const query = getStoryQuery(req.params.id);
        const story = await Story.findOne(query);

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
        const query = getStoryQuery(req.params.id);
        const story = await Story.findOne(query);

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
        const query = getStoryQuery(req.params.id);
        const story = await Story.findOne(query);

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