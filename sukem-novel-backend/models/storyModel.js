const mongoose = require('mongoose');

// --- HÀM TẠO SLUG ---
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
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    isRaw: { type: Boolean, default: false },
}, { _id: false });

const volumeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    chapters: [chapterSchema],
}, { _id: false });

const storySchema = new mongoose.Schema({
    // --- SỬA ĐỔI TẠI ĐÂY: Bỏ `required: true` ---
    id: { type: String, unique: true, index: true },
    // --- KẾT THÚC SỬA ĐỔI ---
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

storySchema.virtual('views').get(function() {
  if (!this.volumes || this.volumes.length === 0) {
    return 0;
  }
  return this.volumes.reduce((totalViews, volume) => {
    const volumeViews = volume.chapters.reduce((volTotal, chapter) => volTotal + chapter.views, 0);
    return totalViews + volumeViews;
  }, 0);
});

// --- MIDDLEWARE TỰ ĐỘNG TẠO SLUG ---
// Hook này sẽ chạy trước khi document được lưu (cả tạo mới và cập nhật)
storySchema.pre('save', async function(next) {
  // Chỉ chạy logic này nếu title được tạo mới hoặc bị thay đổi
  if (this.isNew || this.isModified('title')) {
    const baseId = slugify(this.title);
    let storyId = baseId;
    let counter = 1;

    // Vòng lặp để đảm bảo id là duy nhất
    // this.constructor là model Story
    while (await this.constructor.findOne({ id: storyId })) {
      storyId = `${baseId}-${counter}`;
      counter++;
    }
    this.id = storyId;
  }
  next();
});

module.exports = mongoose.model('Story', storySchema);
