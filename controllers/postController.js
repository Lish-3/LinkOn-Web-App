// controllers/postController.js 

const Post = require('../models/Post');
const User = require('../models/User');
const path = require('path'); 
const multer = require('multer');
const Comment = require('../models/Comment'); 
const fs = require('fs');
const csv = require('csv-parser');


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Define the createPost function with file upload support
exports.createPost = async (req, res) => {
    const { content } = req.body;
    const username = req.user.username; 
    const post = new Post({ 
        userId: req.user.id, 
        username,
        content, 
        likeCount: 0, 
        comments: [], 
        media: [] 
    });

    if (req.files) {
        post.media = req.files.map(file => file.path.trim()); // Trim any whitespace
    }
    

    try {
        await post.save();
        await User.findByIdAndUpdate(req.user.id, { $push: { posts: post._id } });
        res.status(201).json({ message: "Post created successfully", post });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find(); // Fetch all posts
        res.status(200).json({ posts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPostFromCSV = (req, res) => {
    const results = [];

    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Parse the CSV file
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            // Create posts from parsed data
            for (const postData of results) {
                const { content, media } = postData; 
                const post = new Post({
                    userId: req.user.id,
                    content,
                    likeCount: 0,
                    comments: [],
                    media: media ? media.split(';') : [] // letting media paths are separated by semicolon
                });
                
                try {
                    await post.save();
                    await User.findByIdAndUpdate(req.user.id, { $push: { posts: post._id } });
                } catch (error) {
                    console.error('Error saving post:', error);
                }
            }
            // Clean up the uploaded file
            fs.unlinkSync(req.file.path);

            res.status(201).json({ message: "Posts created successfully", results });
        });
};

// Define the getUserPosts function
exports.getUserPosts = async (req, res) => {
    try {
        const userPosts = await Post.find({ userId: req.user.id }).populate('userId', 'username').sort({ createdAt: -1 });;
        res.json({ posts: userPosts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
// Define the timelinePosts function
exports.timelinePosts = async (req, res) => {
    try {
        // Fetch posts from all users except the logged-in user
        const timelinePosts = await Post.find({ userId: { $ne: req.user.id } })
            .populate('userId', 'username') // populate username of each post creator
            .sort({ createdAt: -1 });
        
        res.json({ timeline: timelinePosts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Define the updatePost function
exports.updatePost = async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only update your own post" });
        }

        post.content = content;

        // If files are uploaded, update the media array
        if (req.files) {
            post.media = req.files.map(file => file.path); // Update with new media
        }

        await post.save();
        res.json({ message: 'Post updated successfully', post });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Define the deletePost function
exports.deletePost = async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Only post owner or admin can delete
        if (req.user.id !== post.userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You can only delete your own post" });
        }

        await Post.findByIdAndDelete(postId);
        res.json({ message: "Post deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Define the likePost function
exports.likePost = async (req, res) => {
    const postId = req.params.postId;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Prevent the user from liking their own post
        if (post.userId.toString() === req.user.id) {
            return res.status(403).json({ message: "Cannot like your own post" });
        }

        // Initialize the likes array if it doesn't exist
        post.likes = post.likes || [];

        // Check if the user has already liked the post
        const userIndex = post.likes.indexOf(req.user.id);
        if (userIndex !== -1) {
            return res.status(400).json({ message: "You already liked this post" });
        }

        // Add user ID to the likes array and increment the like count
        post.likes.push(req.user.id);
        post.likeCount = (post.likeCount || 0) + 1;
        await post.save();

        // Send only necessary data
        res.json({ message: "Post liked successfully", likeCount: post.likeCount, postId: post._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Define the addComment function
exports.addComment = async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Cannot comment on own post
        if (post.userId.toString() === req.user.id) {
            return res.status(403).json({ message: "Cannot comment on own post" });
        }

        const comment = new Comment({
            userId: req.user.id,
            postId: postId,
            content
        });

        await comment.save();
        post.comments.push(comment._id); // Update the post with the new comment's ID
        await post.save();

        res.status(201).json({ message: "Comment added successfully", comment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Define the deleteComment function
exports.deleteComment = async (req, res) => {
    const { postId, commentId } = req.params;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Find the comment
        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        // Only the user who made the comment or an admin can delete it
        if (comment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You can only delete your own comment" });
        }

        await Comment.findByIdAndDelete(commentId); // Delete the comment
        post.comments = post.comments.filter(c => c.toString() !== commentId); // Remove from post
        await post.save();

        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Define the getComments function
exports.getComments = async (req, res) => {
    const { postId } = req.params;

    try {
        const comments = await Comment.find({ postId }).populate('userId', 'username');
        res.json({ comments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.upload = upload; 