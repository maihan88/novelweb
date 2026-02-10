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
        // 1. Đếm tổng số
        const totalStories = await Story.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalChapters = await Chapter.countDocuments();

        // 2. Tính tổng lượt xem
        const viewsStats = await Story.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$totalViews" }
                }
            }
        ]);
        const totalViews = viewsStats.length > 0 ? viewsStats[0].totalViews : 0;

        // 3. Lấy danh sách truyện cho bảng
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
                    title: 1,
                    author: 1,
                    totalViews: 1,
                    status: 1,
                    coverImage: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    lastUpdatedAt: 1,
                    chapterCount: { $size: "$chapters" }
                }
            }
        ]);

        res.json({
            stats: {
                totalStories,
                totalUsers,
                totalChapters,
                totalViews
            },
            stories
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Lỗi server khi lấy thống kê" });
    }
};

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

        const [storiesRaw, totalDocs] = await Promise.all([
            Story.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
            Story.countDocuments(query)
        ]);

        const storiesWithLatest = await Promise.all(storiesRaw.map(async (story) => {
            const latestChapter = await Chapter.findOne({ 
                storyId: story._id,
                isRaw: false 
            })
            .select('title createdAt id') 
            .sort({ createdAt: -1 });

            return {
                ...story,
                latestChapter: latestChapter || null
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

// @desc    Lấy chi tiết Story (Hỗ trợ cả _id và custom id)
// @route   GET /api/stories/:id
exports.getStoryById = async (req, res) => {
    try {
        const query = getStoryQuery(req.params.id);
        const story = await Story.findOne(query).lean();
        
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
exports.getChapterContent = async (req, res) => {
    try {
        const chapter = await Chapter.findOne({ id: req.params.chapterId });
        
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        const isAdmin = req.user && req.user.role === 'admin';

        if (!isAdmin) {
            chapter.views += 1;
            await chapter.save();
            Story.findByIdAndUpdate(chapter.storyId, { 
                $inc: { totalViews: 1 }
            }).exec();
        }

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

        story.lastUpdatedAt = new Date(); // Cập nhật thời gian sửa

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
            title,
            content,
            isRaw: !!isRaw,
            views: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newChapter.save();

        if (!newChapter.isRaw) {
            await Story.findByIdAndUpdate(story._id, { 
                lastUpdatedAt: new Date() 
            });
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
            await Story.findByIdAndUpdate(chapter.storyId, { 
                lastUpdatedAt: new Date() 
            });
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

        await Story.findByIdAndUpdate(storyId, { 
            lastUpdatedAt: new Date() 
        });

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
            {
                $lookup: {
                    from: 'chapters',
                    localField: '_id',
                    foreignField: 'storyId',
                    as: 'chapterList'
                }
            },
            {
                $addFields: {
                    chapterCount: { 
                        $size: { 
                            $filter: {
                                input: "$chapterList",
                                as: "ch",
                                cond: { $ne: ["$$ch.isRaw", true] }
                            }
                        } 
                    },
                    firstChapterId: { $arrayElemAt: ["$chapterList.id", 0] }
                }
            },
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