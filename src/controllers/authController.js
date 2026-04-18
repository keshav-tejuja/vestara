const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Helper to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// @route   POST /auth/register
// @desc    Register a new user
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Name, email and password are required.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters.'
            });
        }

        // 2. Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                error: 'Email already registered.'
            });
        }

        // 3. Hash password
        // 10 = salt rounds — higher means more secure but slower
        // 10 is the industry standard balance
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create user in DB
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // 5. Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// @route   POST /auth/login
// @desc    Login user
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required.'
            });
        }

        // 2. Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            // Generic message — don't reveal if email exists or not
            return res.status(401).json({
                error: 'Invalid email or password.'
            });
        }

        // 3. Compare password with hashed password in DB
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid email or password.'
            });
        }

        // 4. Generate token
        const token = generateToken(user.id);

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// @route   GET /auth/me
// @desc    Get current logged in user
// @access  Private (requires token)
const getMe = async (req, res) => {
    // req.user is attached by the protect middleware
    res.status(200).json({
        user: req.user
    });
};

module.exports = { register, login, getMe };