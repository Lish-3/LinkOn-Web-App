// models/Post.js
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: false },  // Add this field
    content: { type: String, required: true },
    media: [{ type: String }], // Array to store URLs of uploaded files
    createdAt: { type: Date, default: Date.now },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    comments: [{ 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
        content: String, 
        createdAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Post', PostSchema);
