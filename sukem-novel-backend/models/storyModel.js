// maihan88/novelweb/novelweb-367f3a44cd5ec3aa64d1df30fd841fd8db53199c/sukem-novel-backend/models/storyModel.js
const mongoose = require('mongoose');

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

const volumeSchema = new mongoose.Schema({
    id: { type: String, required: true }, 
    title: { type: String, required: true },
}, { _id: false });

const storySchema = new mongoose.Schema({
    id: { type: String, unique: true }, // Bỏ index: true vì unique đã bao gồm index
    title: { type: String, required: true },
    alias: { type: [String], default: [] },
    author: { type: String, required: true },
    description: String,
    coverImage: { type: String, required: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['Đang dịch', 'Hoàn thành'], default: 'Đang dịch' },
    volumes: [volumeSchema],
    rating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    isHot: { type: Boolean, default: false },
    isInBanner: { type: Boolean, default: false },
    bannerPriority: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
    totalViews: { type: Number, default: 0 } 
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false
});

// Index tổng hợp cho hiệu năng query
storySchema.index({ isInBanner: 1, bannerPriority: 1 });
storySchema.index({ isHot: 1, lastUpdatedAt: -1 });
storySchema.index({ lastUpdatedAt: -1 });

storySchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('title')) {
        if (!this.id) {
            let baseId = slugify(this.title);
            if (!baseId || baseId.length === 0) baseId = `story-${Date.now()}`;
            let storyId = baseId;
            let counter = 1;
            const StoryModel = this.constructor;
            while (await StoryModel.countDocuments({ id: storyId }) > 0) {
                storyId = `${baseId}-${counter}`;
                counter++;
            }
            this.id = storyId;
        }
    }
    next();
});

const Story = mongoose.model('Story', storySchema);
module.exports = Story;