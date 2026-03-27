const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true },
    volumeId: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    isRaw: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    chapterNumber: { type: Number, default: 0 }
}, {
    timestamps: true
});

chapterSchema.index({ storyId: 1, volumeId: 1 });

const Chapter = mongoose.model('Chapter', chapterSchema);
module.exports = Chapter;