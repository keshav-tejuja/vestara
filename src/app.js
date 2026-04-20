const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const portfolioRouter = require('./routes/portfolio');
const { setupBullBoard } = require('./config/bullBoard'); // ADD
const analysisRouter = require('./routes/analysis'); // ADD
const newsRouter = require('./routes/news'); // ADD
const alertsRouter = require('./routes/alerts');

const app = express();

app.use(helmet({
    contentSecurityPolicy: false // disable for Bull Board UI to render properly
}));
app.use(cors());
app.use(express.json());

// Bull Board UI — mount before other routes
const serverAdapter = setupBullBoard(); // ADD
app.use('/admin/queues', serverAdapter.getRouter()); // ADD
app.use('/analysis', analysisRouter); // ADD
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/portfolio', portfolioRouter);
app.use('/news', newsRouter); // ADD
app.use('/alerts', alertsRouter);
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;