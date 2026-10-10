const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { overview } = require('../controllers/adminController');

const router = express.Router();

router.use(requireAuth, authorize('admin'));
router.get('/overview', overview);

module.exports = router;