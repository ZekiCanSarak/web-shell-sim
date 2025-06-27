import express from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedHandler, wrapHandler } from '../types';

const router = express.Router();

// Follow a user
const followUser: AuthenticatedHandler = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.id, 10);

        if (followerId === followingId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        // Check if already following
        const existingFollow = await pool.query(
            'SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2',
            [followerId, followingId]
        );

        if (existingFollow.rows.length > 0) {
            // Unfollow
            await pool.query(
                'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
                [followerId, followingId]
            );
            res.json({ message: 'User unfollowed' });
        } else {
            // Follow
            await pool.query(
                'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
                [followerId, followingId]
            );
            res.json({ message: 'User followed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user profile
const getUserProfile: AuthenticatedHandler = async (req, res) => {
    try {
        const { username } = req.params;
        const userId = req.user.id;

        const userProfile = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.created_at,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
                (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
                EXISTS(
                    SELECT 1 FROM follows 
                    WHERE follower_id = $1 AND following_id = u.id
                ) as is_following
            FROM users u
            WHERE u.username = $2
        `, [userId, username]);

        if (userProfile.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(userProfile.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

router.post('/follow/:id', authenticateToken, wrapHandler(followUser));
router.get('/profile/:username', authenticateToken, wrapHandler(getUserProfile));

export { router }; 