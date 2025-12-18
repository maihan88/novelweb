// sukem-novel-backend/models/storyModel.js
const mongoose = require('mongoose');

// --- GIỮ NGUYÊN HÀM SLUGIFY VÀ CÁC SCHEMA CHAPTER/VOLUME CŨ ---
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

const chapterSchema = new mongoose.Schema({
    id: { type: String, required: true }, 
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    isRaw: { type: Boolean, default: false },
}, { _id: false });

const volumeSchema = new mongoose.Schema({
    id: { type: String, required: true }, 
    title: { type: String, required: true },
    chapters: [chapterSchema],
}, { _id: false });

// --- SCHEMA STORY CHÍNH ---
const storySchema = new mongoose.Schema({
    id: { type: String, unique: true, index: true },
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
    
    // --- CẬP NHẬT PHẦN NÀY ---
    isInBanner: { type: Boolean, default: false },
    bannerPriority: { type: Number, default: 0 }, // Số càng nhỏ ưu tiên càng cao
    // -------------------------

    createdAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false
});

// Index hỗn hợp để lấy danh sách banner nhanh nhất và đúng thứ tự
storySchema.index({ isInBanner: 1, bannerPriority: 1 });

storySchema.virtual('views').get(function() {
  if (!this.volumes || this.volumes.length === 0) {
    return 0;
  }
  return this.volumes.reduce((totalViews, volume) => {
    const volumeViews = volume.chapters.reduce((volTotal, chapter) => volTotal + chapter.views, 0);
    return totalViews + volumeViews;
  }, 0);
});

storySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('title')) {
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
  next();
});

const Story = mongoose.model('Story', storySchema);

// Xóa index cũ để tránh lỗi (Code cũ của bạn)
Story.collection.dropIndex('volumes.id_1').catch(() => {});
Story.collection.dropIndex('volumes.chapters.id_1').catch(() => {}); 

module.exports = Story;
