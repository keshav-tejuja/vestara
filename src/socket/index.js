const jwt = require('jsonwebtoken');
const User = require('../models/user');

let io; // global io instance

const initSocket = (server) => {
    const { Server } = require('socket.io');

    io = new Server(server, {
        cors: {
            origin: '*', // in production, restrict to your frontend URL
            methods: ['GET', 'POST']
        }
    });

    // Middleware — authenticate socket connections using JWT
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            // Attach user to socket
            socket.user = user;
            next();

        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.user.email}`);

        // Each user joins their own private room
        // This lets us send updates to specific users
        socket.join(`user:${socket.user.id}`);

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.user.email}`);
        });
    });

    return io;
};

// Send P&L update to a specific user
const sendPnLUpdate = (userId, pnlData) => {
    if (!io) return;
    io.to(`user:${userId}`).emit('pnl_update', pnlData);
};

// Get io instance anywhere in the app
const getIO = () => io;

module.exports = { initSocket, sendPnLUpdate, getIO };