// maihan88/novelweb/novelweb-367f3a44cd5ec3aa64d1df30fd841fd8db53199c/sukem-novel-backend/models/chapterModel.js
const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true },
    volumeId: { type: String, required: true },
    id: { type: String, required: true, unique: true }, // unique: true đã là một index
    title: { type: String, required: true },
    content: { type: String, required: true },
    isRaw: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    chapterNumber: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Chỉ giữ lại index bổ trợ cho query theo story/volume
chapterSchema.index({ storyId: 1, volumeId: 1 });
// Bỏ chapterSchema.index({ id: 1 }) vì đã có unique: true ở trên

const Chapter = mongoose.model('Chapter', chapterSchema);
module.exports = Chapter;