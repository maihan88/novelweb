const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    isRaw: { type: Boolean, default: false },
}, { _id: false }); // Thêm dòng này để Mongoose không tự tạo _id cho chapter

const volumeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    chapters: [chapterSchema],
}, { _id: false }); // Thêm dòng này để Mongoose không tự tạo _id cho volume

const storySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    alias: [String],
    author: { type: String, required: true },
    description: String,
    coverImage: { type: String, required: true },
    tags: [String],
    status: { type: String, enum: ['Đang dịch', 'Hoàn thành'], default: 'Đang dịch' },
    volumes: [volumeSchema],
    rating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    isHot: { type: Boolean, default: false },
    isInBanner: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
}, {
    // Thêm tùy chọn này để Mongoose tự động thêm các trường ảo khi chuyển đổi sang JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// --- THÊM TRƯỜNG ẢO `views` ---
storySchema.virtual('views').get(function() {
  if (!this.volumes || this.volumes.length === 0) {
    return 0;
  }
  // Tính tổng lượt xem từ tất cả các chương trong tất cả các tập
  return this.volumes.reduce((totalViews, volume) => {
    const volumeViews = volume.chapters.reduce((volTotal, chapter) => volTotal + chapter.views, 0);
    return totalViews + volumeViews;
  }, 0);
});

// --- CHÚNG TA ĐÃ XÓA HOÀN TOÀN CÁC ĐOẠN .set('toJSON', ...) GÂY LỖI Ở ĐÂY ---

module.exports = mongoose.model('Story', storySchema);