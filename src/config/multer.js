const multer = require('multer');

// memoryStorage stores file in RAM as a Buffer
// instead of saving to disk first
// This is better for CSV processing since we
// parse it immediately and don't need to keep the file
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Only allow CSV files
    if (file.mimetype === 'text/csv' ||
        file.originalname.endsWith('.csv')) {
        cb(null, true); // accept file
    } else {
        cb(new Error('Only CSV files are allowed'), false); // reject file
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

module.exports = upload;