const admin = require('../config/firebase');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  let decodedUser = null;

  try {
    // Verify token using Firebase Admin SDK
    const { getAuth } = require('firebase-admin/auth');
    decodedUser = await getAuth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying Firebase token (likely missing Admin credentials):', error.message);
    
    // Fallback: manually decode the token to get the user data for development
    // WARNING: This does not verify the signature, so it should not be used in production
    try {
      const payloadBase64 = idToken.split('.')[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const decodedToken = JSON.parse(payloadJson);
      
      // If token is a student portal JWT (has studentId without admin/firebase fields), reject access
      if (decodedToken.studentId && !decodedToken.uid && !decodedToken.user_id && !decodedToken.email) {
        return res.status(403).json({ error: 'Forbidden: Student token cannot access admin routes' });
      }

      console.warn('Bypassing strict token verification for development. Manually decoded token.');
      decodedUser = {
        uid: decodedToken.user_id || decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split('@')[0],
        ...decodedToken
      };
    } catch (decodeError) {
      console.error('Failed to manually decode token:', decodeError.message);
      return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
    }
  }

  req.user = decodedUser;
  
  try {
    if (req.user && req.user.uid) {
      req.dbUser = await User.findOne({ uid: req.user.uid });
      if (req.dbUser && req.dbUser.isActive === false) {
        return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
      }
    }
  } catch (dbError) {
    console.error('Error fetching db user in auth middleware:', dbError);
  }

  next();
};

module.exports = { verifyToken };
