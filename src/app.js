const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const portfolioRouter = require('./routes/portfolio'); // ADD THIS

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/portfolio', portfolioRouter); // ADD THIS

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;