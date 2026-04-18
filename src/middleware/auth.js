const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
    try {
        // 1. Check if token exists in request header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            });
        }

        // 2. Extract token from "Bearer <token>"
        const token = authHeader.split(' ')[1];

        // 3. Verify token is valid and not expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // decoded = { id: 1, iat: ..., exp: ... }

        // 4. Find user in DB to make sure they still exist
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                error: 'User no longer exists.'
            });
        }

        // 5. Attach user to request object
        // Now any route using this middleware can access req.user
        req.user = user;
        next(); // move to the actual route handler

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { protect };