const Story = require('../models/storyModel');

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
        const story = new Story(req.body);
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
        const story = await Story.findOneAndUpdate(
            { id: req.params.id },
            req.body,
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
        const { title, content } = req.body;
        const story = await Story.findOne({ id: req.params.id });
        
        if (story) {
            const volume = story.volumes.find(v => v.id === req.params.volumeId);
            if (volume) {
                const chapter = volume.chapters.find(c => c.id === req.params.chapterId);
                if (chapter) {
                    chapter.title = title;
                    chapter.content = content;
                    await story.save();
                    res.json(chapter);
                } else {
                    res.status(404).json({ message: 'Chapter not found' });
                }
            } else {
                res.status(404).json({ message: 'Volume not found' });
            }
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error updating chapter:', error);
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
        const story = await Story.findOne({ id: req.params.id });
        
        if (story) {
            let chapterFound = false;
            for (const volume of story.volumes) {
                const chapter = volume.chapters.find(c => c.id === req.params.chapterId);
                if (chapter) {
                    chapter.views += 1;
                    chapterFound = true;
                    break;
                }
            }
            
            if (chapterFound) {
                await story.save();
                res.json({ message: 'Chapter view incremented' });
            } else {
                res.status(404).json({ message: 'Chapter not found' });
            }
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error('Error incrementing chapter view:', error);
        res.status(500).json({ message: "Server Error" });
    }
}; 