// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    resetOtp: { type: String }, 
    resetOtpExpires: { type: Date } ,
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
    },
    password: { type: String, required: true },
    role: { 
        type: String, 
        default: 'user', 
        enum: ['user', 'admin']  // Restrict role to specific values
    },
    isActive: { type: Boolean, default: true }, // For account deactivation
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }] // Reference to Post model
    
}, { timestamps: true }); 

module.exports = mongoose.model('User', userSchema);
