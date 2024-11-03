const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config(); 

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const nodemailer = require('nodemailer');
const ChatMessage = require('./models/ChatMessage');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

connectDB();

app.use(express.json());
app.use(express.static('frontend'));
app.use('/post_images', express.static(__dirname + '/frontend/post_images'));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// 404 Not Found middleware
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// General error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,       
        pass: process.env.EMAIL_PASS,   
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    } else {
        console.log('Ready to send emails!');
    }
});
// Listen for incoming socket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join Room Event
    socket.on('join room', async (room, user) => {
        if (!user || !user.isAuthenticated) {
            socket.emit('authError', 'User not authenticated');
            return;
        }
        // Set user information for later use
        socket.user = user.name;
        socket.room = room; 
        socket.join(room);
        console.log(`User ${user.name} joined room: ${room}`);
        // Notify other users that this user has joined
        socket.to(room).emit('userJoined', `${user.name} has joined the chat.`);
        // Load previous messages from the database and send to the client
        try {
            const messages = await ChatMessage.find({ room }).sort({ timestamp: 1 });
            socket.emit('previousMessages', messages);
        } catch (error) {
            console.error('Error loading previous messages:', error);
            socket.emit('errorLoadingMessages', 'Could not load previous messages.');
        }
    });
      // Listen for chat messages
      socket.on('chat message', (data) => {
        console.log("Received message:", data); 
        // Emit the message to all users in the room
        io.to(data.room).emit('chat message', { user: data.user, message: data.message });
    });

    // Disconnect Event
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        if (socket.room) {
            socket.to(socket.room).emit('userLeft', `${socket.user} has left the chat.`);
        }
    });

    // Typing Indicator Events
    socket.on('typing', (room) => {
        if (socket.user) {
            socket.to(room).emit('displayTyping', `${socket.user} is typing...`);
        }
    });

    socket.on('stopTyping', (room) => {
        socket.to(room).emit('displayTyping', "");
    });

    // // React to Messages
    // socket.on('reactMessage', ({ room, messageId, emoji }) => {
    //     io.to(room).emit('messageReaction', { messageId, emoji });
    // });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
