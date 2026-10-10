const jwt=require('jsonwebtoken');
const {findActiveById}=require('../models/sessionModel');

async function requireAuth(req,res,next){
    try{
        const [schema, token]=(req.headers.authorization || ''). split(' ');
        if(schema !== 'Bearer' || !token){
            return res.status(401).json({message:'Authentication required'});

        }

        let payload;
        try{
            payload=jwt.verify(token, process.env.JWT_ACCESS_SECRET, {algorithms: ['HS256']});

        }catch {
            return res.status(401).json({message: 'Invalid or expired token'});

        }
        const session=await findActiveById(payload.sid);
        if(!session){
            return res.status(401).json({message: 'Session has ended. Please sign in again.'});
        }
        req.user = {id: Number(payload.sub), role:payload.role, sessionId:payload.sid};
        next()
    }catch(err){
        next(err)
    }

    
}
module.exports={requireAuth}