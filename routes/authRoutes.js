// authRoutes.js
const express = require('express');
const { signup, login, getUserProfile, updateUser, deleteUser, deactivateAccount, reactivateAccount,forgotPassword,
    resetPassword } = require('../controllers/authController');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// User registration and login
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword); 
router.post('/resetpassword', resetPassword); 

// Protected routes - require authentication
router.get('/profile', getUserProfile); 
router.delete('/delete', deleteUser); 
router.patch('/deactivate', deactivateAccount); 
router.patch('/reactivate', reactivateAccount); 
router.patch('/update', authMiddleware, updateUser); 
module.exports = router;
