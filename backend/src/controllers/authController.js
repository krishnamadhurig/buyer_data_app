const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { validateRegister } = require('../utils/validators');
const crypto = require('crypto');
const {
    createSession,
    revokeByRefreshHash,
    findActiveByRefreshHash,
    rotateRefreshToken,
} = require('../models/sessionModel');

const { signAccessToken, generateRefreshToken, hashToken } = require('../utils/tokens');


const IDLE_MIN = Number(process.env.SESSION_IDLE_TTL_MIN) || 10;
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

async function register(req, res) {
    try {
        const errors = validateRegister(req.body);
        if (Object.keys(errors).length) {
            return res.status(422).json({ message: 'Please fix the errors', errors });
        }
        const name = req.body.name.trim();
        const email = req.body.email.trim().toLowerCase();
        const mobile = req.body.mobile.trim();
        const { password } = req.body;

        const existing = await userModel.findByEmailorMobile(email, mobile);
        if (existing.length) {
            const duplicate = {};
            if (existing.some((u) => u.email === email)) duplicate.email = 'This emails is already registered';
            if (existing.some((u) => u.mobile === mobile)) duplicate.mobile = 'This mobile number is already registered';
            return res.status(409).json({ message: 'Account already exists', errors: duplicate });
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const id = await userModel.createUser({ name, email, mobile, passwordHash });

        res.status(201).json({ message: 'Account created', user: { id, name, email, mobile } });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Account already exists" });

        }
        console.log(err)
        res.status(500).json({ message: 'Something went wrong' })
    }
}

async function login(req, res) {
    try {
        const raw = typeof req.body.identifier === 'string' ? req.body.identifier.trim() : '';
        const password = typeof req.body.password === 'string' ? req.body.password : '';

        if (!raw || !password) {
            return res.status(422).json({ message: 'Enter your email or mobile number and password' });
        }
        const identifier = raw.includes('@') ? raw.toLowerCase() : raw.replace(/\D/g, '');
        const user = await userModel.findForLogin(identifier);
        const passwordOk = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
        if (!user || !passwordOk) {
            return res.status(401).json({ message: 'Email, mobile or password is incorrect' });
        }
        const sessionId = crypto.randomUUID();
        const refreshToken = generateRefreshToken();
        await createSession({
            id: sessionId,
            userId: user.id,
            refreshHash: hashToken(refreshToken),
            idleMinutes: IDLE_MIN,
        });
        const accessToken = signAccessToken({ userId: user.id, role: user.role, sessionId });

        res.cookie('rt', refreshToken, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === "true",
            sameSite: process.env.COOKIE_SAMESITE || 'lax',
            path: '/api/auth',
            maxAge: IDLE_MIN * 60 * 1000,
        });
        res.json({
            accessToken,
            expiresIn: (Number(process.env.ACCESS_TOKEN_TTL_MIN) || 10) * 60,
            user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: user.role },
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
}
async function me(req, res, next) {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) return res.status(401).json({ message: "Account no longer exists" });
        res.json({ user });
    } catch (err) {
        next(err)
    }
}
async function logout(req, res, next) {
    try {
        const refreshToken = req.cookies.rt;
        if (refreshToken) {
            await revokeByRefreshHash(hashToken(refreshToken));
        }
        res.clearCookie('rt', {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: process.env.COOKIE_SAMESITE || 'lax',
            path: '/api/auth',
        });
        res.json({ message: 'Logged out' });
    } catch (err) {
        next(err);
    }
}

async function refresh(req, res, next) {
    try {
        if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const oldToken = req.cookies.rt;
        if (!oldToken) {
            return res.status(401).json({ message: 'Session expired. Please sign in again.' });
        }

        const oldHash = hashToken(oldToken);
        const session = await findActiveByRefreshHash(oldHash);
        if (!session) {
            return res.status(401).json({ message: 'Session expired. Please sign in again.' });
        }

        const idleMinutes = Number(process.env.SESSION_IDLE_TTL_MIN || 10);
        const newToken = generateRefreshToken();

        const rotated = await rotateRefreshToken({
            id: session.id,
            oldHash,
            newHash: hashToken(newToken),
            idleMinutes,
        });
        if (!rotated) {
            return res.status(401).json({ message: 'Session expired. Please sign in again.' });
        }

        const user = await userModel.findById(session.user_id);
        if (!user) {
            return res.status(401).json({ message: 'Account no longer exists' });
        }

        const accessToken = signAccessToken({
            userId: user.id,
            role: user.role,
            sessionId: session.id,
        });

        res.cookie('rt', newToken, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: process.env.COOKIE_SAMESITE || 'lax',
            path: '/api/auth',
            maxAge: idleMinutes * 60 * 1000,
        });

        res.json({
            accessToken,
            expiresIn: Number(process.env.ACCESS_TOKEN_TTL_MIN || 10) * 60,
            user,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { register, login, me, logout, refresh };


