const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { priceQueue, newsQueue, reportQueue } = require('./queues');

const setupBullBoard = () => {
    // Create Express adapter for Bull Board
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    // Register all queues with Bull Board
    createBullBoard({
        queues: [
            new BullMQAdapter(priceQueue),
            new BullMQAdapter(newsQueue),
            new BullMQAdapter(reportQueue),
        ],
        serverAdapter
    });

    return serverAdapter;
};

module.exports = { setupBullBoard };