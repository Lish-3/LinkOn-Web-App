const express = require('express');
const multer = require('multer');
const { upload,createPostFromCSV } = require('../controllers/postController');
const {
    createPost,
    timelinePosts,
    updatePost,
    deletePost,
    likePost,
    getUserPosts,
    addComment,
    getComments,
    deleteComment,
    getPosts 
} = require('../controllers/postController');

const authMiddleware = require('../middleware/auth'); 
const router = express.Router();

// Post routes
router.post('/', authMiddleware, upload.array('media', 10), createPost); 
router.get('/', authMiddleware, getPosts);
router.post('/uploadcsv', authMiddleware, upload.single('file'), createPostFromCSV);

router.get('/timeline', authMiddleware, timelinePosts); 
router.get('/myposts', authMiddleware, getUserPosts); 
router.put('/:postId', authMiddleware, updatePost); 
router.delete('/:postId', authMiddleware, deletePost); 
router.post('/:postId/like', authMiddleware, likePost); 

// Comment routes
router.post('/:postId/comments', authMiddleware, addComment); 
router.get('/:postId/comments', authMiddleware, getComments); 
router.delete('/:postId/comments/:commentId', authMiddleware, deleteComment); 

module.exports = router;
