const multer = require('multer');
const path = require('path');

const ALLOWED_EXT = ['.csv', '.xls', '.xlsx'];
const MAX_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      const err = new Error('Only .csv, .xls and .xlsx files are allowed.');
      err.code = 'BAD_FILE_TYPE';
      return cb(err);
    }
    cb(null, true);
  },
});

function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File is too large. The maximum size is 5 MB.' });
    }
    if (err.code === 'BAD_FILE_TYPE') {
      return res.status(415).json({ message: err.message });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Send the file in a form field named "file".' });
    }
    next(err);
  });
}

module.exports = { uploadSingle };