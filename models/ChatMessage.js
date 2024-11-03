// models/ChatMessage.js
const mongoose = require('mongoose');
const chatMessageSchema = new mongoose.Schema({
    room: String,
    user: String,
    message: String,
    emoji: String, // Optional: You can add this if you want to store emojis
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
