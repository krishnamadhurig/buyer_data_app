const router=require('express').Router();
const {register,login, me, logout, refresh}=require('../controllers/authController');
const {requireAuth}=require('../middleware/auth')
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login)
router.get('/me', requireAuth, me)
router.post('/logout', logout);
router.post('/refresh', refresh);

module.exports=router;