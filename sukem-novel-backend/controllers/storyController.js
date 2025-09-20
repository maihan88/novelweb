
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
    console.log('=== CREATE STORY REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', req.headers);
    
    try {
        const { title, author, description, coverImage, tags, status, isHot, isInBanner, alias } = req.body;

        // Validation
        if (!title || !author || !coverImage) {
            console.log('Validation failed:', { title: !!title, author: !!author, coverImage: !!coverImage });
            return res.status(400).json({ message: 'Vui lòng cung cấp đủ Tên truyện, Tác giả và Ảnh bìa' });
        }

        // Process arrays
        const tagsArray = tags && typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : (Array.isArray(tags) ? tags : []);
        const aliasArray = alias && typeof alias === 'string' ? alias.split(',').map(name => name.trim()).filter(Boolean) : (Array.isArray(alias) ? alias : []);

        console.log('Processed data:', {
            title,
            author,
            description,
            coverImage,
            tagsArray,
            aliasArray,
            status,
            isHot,
            isInBanner
        });

        // Create story object
        const storyData = {
            title,
            author,
            description,
            coverImage,
            tags: tagsArray,
            status,
            isHot,
            isInBanner,
            alias: aliasArray,
            volumes: [],
        };

        console.log('Creating story with data:', JSON.stringify(storyData, null, 2));

        const story = new Story(storyData);
        const createdStory = await story.save();
        
        console.log('Story created successfully:', createdStory.id);
        res.status(201).json(createdStory);
        
    } catch (error) {
        console.error('=== CREATE STORY ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // MongoDB specific errors
        if (error.name === 'ValidationError') {
            console.error('Validation errors:', error.errors);
            return res.status(400).json({ 
                message: 'Dữ liệu không hợp lệ', 
                errors: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            });
        }
        
        if (error.code === 11000) {
            console.error('Duplicate key error:', error.keyPattern);
            return res.status(400).json({ message: 'Truyện với ID này đã tồn tại' });
        }
        
        res.status(500).json({ 
            message: "Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update a story
// @route   PUT /api/stories/:id
// @access  Private/Admin
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
            
            if (tags !== undefined) {
                 story.tags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : (Array.isArray(tags) ? tags : []);
            }
            if (alias !== undefined) {
                 story.alias = typeof alias === 'string' ? alias.split(',').map(name => name.trim()).filter(Boolean) : (Array.isArray(alias) ? alias : []);
            }
            
            story.lastUpdatedAt = new Date();

            const updatedStory = await story.save(); // Middleware pre('save') sẽ chạy ở đây nếu title thay đổi
            res.json(updatedStory); // Trả về truyện đã được cập nhật (có thể có id mới)
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Detailed error updating story:', error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message
        });
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
            await story.save();
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
                await story.save();
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
        const { title, content, isRaw } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        if (story) {
            const volume = story.volumes.find(v => v.id === req.params.volumeId);
            if (volume) {
                const newChapter = {
                    id: `ch-${Date.now()}`,
                    title,
                    content,
                    isRaw: !!isRaw,
                    views: 0
                };
                volume.chapters.push(newChapter);
                if (!newChapter.isRaw) {
                    story.lastUpdatedAt = new Date();
                }
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
        if (wasRaw && !chapter.isRaw) {
            story.lastUpdatedAt = new Date();
        }
        await story.save();
        res.json({ id: chapterId, title, content, isRaw });
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
        const result = await Story.updateOne(
            { "id": id, "volumes.chapters.id": chapterId },
            { $inc: { "volumes.$[v].chapters.$[c].views": 1 } },
            { arrayFilters: [{ "v.chapters.id": chapterId }, { "c.id": chapterId }] }
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

// @desc    Reorder volumes in a story
// @route   PUT /api/stories/:id/volumes/reorder
// @access  Private/Admin
exports.reorderVolumes = async (req, res) => {
    try {
        const { orderedVolumeIds } = req.body;
        const story = await Story.findOne({ id: req.params.id });

        if (!story) {
            return res.status(404).json({ message: 'Không tìm thấy truyện' });
        }

        const reorderedVolumes = orderedVolumeIds.map(volId => {
            return story.volumes.find(v => v.id === volId);
        }).filter(Boolean);

        if (reorderedVolumes.length !== story.volumes.length) {
             return res.status(400).json({ message: 'Danh sách ID tập không hợp lệ' });
        }

        story.volumes = reorderedVolumes;
        await story.save();
        res.json(story.volumes);

    } catch (error) {
        console.error('Lỗi khi sắp xếp tập:', error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};

// @desc    Reorder chapters in a volume
// @route   PUT /api/stories/:id/volumes/:volumeId/chapters/reorder
// @access  Private/Admin
exports.reorderChapters = async (req, res) => {
    try {
        const { orderedChapterIds } = req.body;
        const story = await Story.findOne({ id: req.params.id });

        if (!story) {
            return res.status(404).json({ message: 'Không tìm thấy truyện' });
        }

        const volume = story.volumes.find(v => v.id === req.params.volumeId);
        if (!volume) {
            return res.status(404).json({ message: 'Không tìm thấy tập' });
        }
        
        const reorderedChapters = orderedChapterIds.map(chapId => {
            return volume.chapters.find(c => c.id === chapId);
        }).filter(Boolean);

        if (reorderedChapters.length !== volume.chapters.length) {
            return res.status(400).json({ message: 'Danh sách ID chương không hợp lệ' });
        }

        volume.chapters = reorderedChapters;
        await story.save();
        res.json(volume.chapters);

    } catch (error) {
        console.error('Lỗi khi sắp xếp chương:', error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};
