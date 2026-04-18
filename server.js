require('dotenv').config();
const http = require('http'); // ADD THIS
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/socket'); // ADD THIS
const { startPricePoller } = require('./src/jobs/pricePoller'); // ADD THIS

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    // Create HTTP server from Express app
    // Socket.io needs raw HTTP server, not Express app directly
    const server = http.createServer(app);

    // Initialize Socket.io on the HTTP server
    initSocket(server);

    // Start background price polling job
    startPricePoller();

    // Listen on HTTP server instead of app
    server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔌 Socket.io ready`);
    });
};

startServer();