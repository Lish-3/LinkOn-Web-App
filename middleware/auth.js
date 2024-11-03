// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Expecting "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Ensure you have a JWT_SECRET in .env
        const user = await User.findById(decoded.id); // Attach user info to request

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        req.user = user; // Attach the user info to the request
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        // Handle token verification errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Invalid token.' }); // Forbidden for invalid tokens
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please log in again.' }); // Token expired
        }
        return res.status(500).json({ message: 'Internal server error.' }); // Catch-all for unexpected errors
    }
};

module.exports = authMiddleware;
