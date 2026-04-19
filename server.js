require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/socket');
const { startWorkers } = require('./src/jobs/workers');     // ADD
const { startScheduler } = require('./src/jobs/scheduler'); // ADD

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    const server = http.createServer(app);
    initSocket(server);

    // Start BullMQ workers first, then scheduler
    startWorkers();    // ADD
    startScheduler();  // ADD

    server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔌 Socket.io ready`);
        console.log(`🎛️  Bull Board: http://localhost:${PORT}/admin/queues`); // ADD
    });
};

startServer();