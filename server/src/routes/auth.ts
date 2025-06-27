import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { AuthenticatedHandler, wrapHandler } from '../types';

const router = express.Router();

// Register
const register: AuthenticatedHandler = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );

        // Generate JWT
        const token = jwt.sign(
            { id: newUser.rows[0].id },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '24h' }
        );

        res.json({ token, user: newUser.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login
const login: AuthenticatedHandler = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const user = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.rows[0].id },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.rows[0].id,
                username: user.rows[0].username
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

router.post('/register', wrapHandler(register));
router.post('/login', wrapHandler(login));

export { router }; 