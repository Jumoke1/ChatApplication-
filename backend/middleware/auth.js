// const jwt = require("jsonwebtoken")

// module.exports = function(req, res, next){


//     const token = req.header("Authorization")?.split(" ")[1];

//     if (!token) {
//         return res.status(401).json({message:'Access denied. No token provide'})
//     }
//     try {
//         const decode = jwt.verify(token, process.env.JWT_SECRET)
//         req.user = {_id: decode.userId}
//         next();
//     }catch(err) {
//         return res.status(400).json({message:"Invalid token."});
//     }

// };

const jwt = require("jsonwebtoken")

module.exports = function(req, res, next) {
    console.log('=== AUTH MIDDLEWARE CALLED ===');
    console.log('URL:', req.originalUrl);
    console.log('Auth header:', req.header("Authorization"));
    
    const token = req.header("Authorization")?.split(" ")[1];
    
    console.log('Token extracted:', token ? 'YES' : 'NO');
    console.log('Token first 30 chars:', token?.substring(0, 30) + '...');

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({message:'Access denied. No token provided'});
    }
    
    try {
        console.log('Verifying token with secret...');
        const decode = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        console.log('Token decoded successfully!');
        console.log('Decoded payload:', decode);
        console.log('User ID from token:', decode.userId);
        
        req.user = {_id: decode.userId};
        console.log('req.user set to:', req.user);
        
        next();
    } catch(err) {
        console.log('Token verification FAILED:', err.message);
        console.log('Error name:', err.name);
        console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
        
        return res.status(400).json({message:"Invalid token."});
    }
};