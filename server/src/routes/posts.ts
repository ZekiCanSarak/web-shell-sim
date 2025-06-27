import express from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedHandler, wrapHandler } from '../types';

const router = express.Router();

// Create a post
const createPost: AuthenticatedHandler = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;

        const newPost = await pool.query(
            'INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING *',
            [userId, content]
        );

        res.json(newPost.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get feed posts
const getFeedPosts: AuthenticatedHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const posts = await pool.query(`
            SELECT p.*, u.username, 
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id IN (
                SELECT following_id FROM follows WHERE follower_id = $1
            ) OR p.user_id = $1
            ORDER BY p.created_at DESC
            LIMIT 50
        `, [userId]);

        res.json(posts.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Like a post
const likePost: AuthenticatedHandler = async (req, res) => {
    try {
        const postId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        // Check if already liked
        const existingLike = await pool.query(
            'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
            [userId, postId]
        );

        if (existingLike.rows.length > 0) {
            // Unlike
            await pool.query(
                'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
                [userId, postId]
            );
            await pool.query(
                'UPDATE posts SET likes = likes - 1 WHERE id = $1',
                [postId]
            );
            res.json({ message: 'Post unliked' });
        } else {
            // Like
            await pool.query(
                'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
                [userId, postId]
            );
            await pool.query(
                'UPDATE posts SET likes = likes + 1 WHERE id = $1',
                [postId]
            );
            res.json({ message: 'Post liked' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

router.post('/', authenticateToken, wrapHandler(createPost));
router.get('/feed', authenticateToken, wrapHandler(getFeedPosts));
router.post('/:id/like', authenticateToken, wrapHandler(likePost));

export { router }; 