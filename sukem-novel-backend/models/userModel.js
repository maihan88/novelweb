const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const bookmarkSchema = new mongoose.Schema({
    chapterId: { type: String, required: true },
    progress: { type: Number, default: 0 },
    lastRead: { type: Date, default: Date.now },
    chapterTitle: { type: String, default: '' },
    volumeTitle: { type: String, default: '' }
}, { _id: false });

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now },
    
    favorites: {
        type: [String],
        default: []
    },
    bookmarks: {
        type: Map,
        of: bookmarkSchema,
        default: {}
    },
    ratedStories: {
        type: Map,
        of: Number,
        default: {}
    }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

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