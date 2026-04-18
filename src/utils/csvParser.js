const csv = require('csv-parser');
const { Readable } = require('stream');

// csv-parser works with streams (like reading a file)
// Since our file is in memory (Buffer from multer),
// we convert it to a readable stream first
const parseCSV = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const errors = [];

        // Convert buffer to readable stream
        const stream = Readable.from(buffer.toString());

        stream
            .pipe(csv({
                // trim whitespace from headers and values
                mapHeaders: ({ header }) => header.trim().toLowerCase(),
                mapValues: ({ value }) => value.trim()
            }))
            .on('data', (row) => {
                // Validate each row has required fields
                if (!row.symbol || !row.quantity || !row.avg_cost) {
                    errors.push(`Invalid row: ${JSON.stringify(row)}`);
                    return;
                }

                // Validate quantity and avg_cost are numbers
                const quantity = parseFloat(row.quantity);
                const avg_cost = parseFloat(row.avg_cost);

                if (isNaN(quantity) || isNaN(avg_cost)) {
                    errors.push(`Invalid numbers in row: ${JSON.stringify(row)}`);
                    return;
                }

                if (quantity <= 0 || avg_cost <= 0) {
                    errors.push(`Quantity and cost must be positive: ${JSON.stringify(row)}`);
                    return;
                }

                results.push({
                    symbol: row.symbol.toUpperCase(),
                    company_name: row.company_name || null,
                    quantity,
                    avg_cost
                });
            })
            .on('end', () => {
                if (results.length === 0) {
                    reject(new Error('No valid holdings found in CSV'));
                    return;
                }
                resolve({ holdings: results, errors });
            })
            .on('error', (error) => {
                reject(new Error(`CSV parsing failed: ${error.message}`));
            });
    });
};

module.exports = { parseCSV };