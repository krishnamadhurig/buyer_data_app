const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { uploadBuyers, listBuyers } = require('../controllers/buyerController');

const router = express.Router();

router.post('/upload', requireAuth, uploadSingle, uploadBuyers);
router.get('/', requireAuth, listBuyers);

module.exports = router;