// maihan88/novelweb/novelweb-30378715fdd33fd98f7c1318544ef93eab22c598/sukem-novel-backend/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const bookmarkSchema = new mongoose.Schema({
    chapterId: { type: String, required: true },
    progress: { type: Number, required: true },
    lastRead: { type: Date, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now },
    // --- BẮT ĐẦU THÊM MỚI ---
    favorites: {
        type: [String], // Mảng các storyId
        default: []
    },
    bookmarks: {
        type: Map,
        of: bookmarkSchema, // Một Map với key là storyId và value là object Bookmark
        default: {}
    },
    ratedStories: {
        type: Map,
        of: Number, // Một Map với key là storyId và value là điểm số (1-5)
        default: {}
    }
    // --- KẾT THÚC THÊM MỚI ---
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.password;
    }
});

module.exports = mongoose.model('User', userSchema);
