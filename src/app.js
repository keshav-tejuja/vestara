const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const portfolioRouter = require('./routes/portfolio');
const { setupBullBoard } = require('./config/bullBoard'); // ADD
const analysisRouter = require('./routes/analysis'); // ADD
const newsRouter = require('./routes/news'); // ADD
const historyRouter = require('./routes/history'); // ADD
const alertsRouter = require('./routes/alerts');

const app = express();

app.use(helmet({
    contentSecurityPolicy: false // disable for Bull Board UI to render properly
}));
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.FRONTEND_URL || true)
        : 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Bull Board UI — mount before other routes
const serverAdapter = setupBullBoard(); // ADD
app.use('/admin/queues', serverAdapter.getRouter()); // ADD
app.use('/analysis', analysisRouter); // ADD
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/portfolio', portfolioRouter);
app.use('/news', newsRouter); // ADD
app.use('/history', historyRouter); // ADD
app.use('/alerts', alertsRouter);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*any', (req, res, next) => {
        // Skip API routes to let them fall through to 404 handler
        const apiPrefixes = ['/auth', '/portfolio', '/news', '/history', '/alerts', '/analysis', '/health', '/admin/queues'];
        if (apiPrefixes.some(prefix => req.path.startsWith(prefix))) {
            return next();
        }
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
}

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;