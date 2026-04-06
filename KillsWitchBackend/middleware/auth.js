const jwt = require('jsonwebtoken');
require('dotenv').config();

// Supports JWT from Authorization header or httpOnly cookie 'access_token'
exports.auth = (req, res, next)=>{
   const authHeader = req.headers.authorization;
   const cookieToken = req.cookies && req.cookies.access_token;

   const token = authHeader && authHeader.startsWith('Bearer ')
     ? authHeader.split(' ')[1]
     : cookieToken;

   if (!token) {
     return res.status(401).json({ error: 'Authorization token missing' });
   }
 
   try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded;
       next();
   } catch (ex) {
       res.status(401).send('Invalid token.');
   }
}

// Optional auth: doesn't fail if no token, but extracts user if token is provided
exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies && req.cookies.access_token;

  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : cookieToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (ex) {
      console.log('Optional auth token verification failed:', ex.message);
      // Don't fail, just continue without user
    }
  }
  
  next();
}

 exports.authorize = (roles = [])=>{
    return (req, res, next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(403).send('Forbidden. You do not have permission to access this resource');
    }
    next();
};

 };

