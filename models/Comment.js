// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // Reference to parent Post
    content: { type: String, required: true },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }] // Array of replies to the comment
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);