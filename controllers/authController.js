const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const multer = require('multer');
const authMiddleware = require('../middleware/auth'); 
const transporter = require('../utils/mailer');
const crypto = require('crypto');

const secret_key = process.env.SECRET_KEY || 'zxcvnaaa';

// Function to generate a JWT token
const generateToken = (user) => {
    return jwt.sign({ id: user._id, username: user.username, role: user.role }, secret_key, {
        expiresIn: '1h',
    });
};

// User Registration (Signup)
exports.signup = async (req, res) => {
    const { username, email, password, role = 'user' } = req.body;

    try {
        // Check if user with the same email or username already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        // Hash the password and save the new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, role, isActive: true });
        
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// User Login
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        // Check if user exists and if the account is active
        if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid username, password, or inactive account" });
        }

        // Generate and return token
        const token = generateToken(user);
        res.header('Authorization', token).json({
            message: 'Login Success',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Forgot Passord////////////////////////
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate OTP and expiration time
        const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
        const otpExpiration = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        // Save OTP and expiration in user data
        user.resetOtp = otp;
        user.resetOtpExpires = otpExpiration;
        await user.save();

        // Send OTP email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Error in forgotPassword:', error); // Log the error
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};


// Reset Password using OTP
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    console.log('Request received:', { email, otp, newPassword });
    try {
        const user = await User.findOne({ email });
        console.log('User found:', user); 
        if (!user || !user.resetOtp || user.resetOtpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        console.log('Stored OTP:', user.resetOtp);  
        if (user.resetOtp !== otp) {
            return res.status(400).json({ message: 'Incorrect OTP' });
        }

        // Hash the new password before saving
        const hashedPassword = await bcrypt.hash(newPassword, 10); 
        user.password = hashedPassword;
        user.resetOtp = undefined;
        user.resetOtpExpires = undefined;
        await user.save();
        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error); 
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};

// Get User Profile 
exports.getUserProfile = [authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}];

// Update User Profile 
exports.updateUser = [authMiddleware, async (req, res) => {
    const { username, email, role } = req.body;
    const userId = req.user.id;

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, { username, email, role }, { new: true });

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}];

// Delete User Account 
exports.deleteUser = [authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByIdAndDelete(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}];

// Deactivate User Account 
exports.deactivateAccount = [authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}];

// Reactivate User Account 
exports.reactivateAccount = [authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByIdAndUpdate(userId, { isActive: true }, { new: true });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Account reactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}];
