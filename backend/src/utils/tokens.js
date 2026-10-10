const crypto=require('crypto');
const jwt=require('jsonwebtoken');

function signAccessToken({userId, role, sessionId}) {
    return jwt.sign({role, sid:sessionId}, process.env.JWT_ACCESS_SECRET, {
        subject:String(userId),
        expiresIn: `${process.env.ACCESS_TOKEN_TTL_MIN || 10}m`,
        algorithm: 'HS256'

    });

}

function generateRefreshToken(){
    return crypto.randomBytes(48).toString('base64url');
}

function hashToken(token){
    return crypto.createHash('sha256').update(token).digest('hex');

}

module.exports={signAccessToken, generateRefreshToken, hashToken};
