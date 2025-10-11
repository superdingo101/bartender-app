const jwt = require('jsonwebtoken');
const config = require('../config');

// Verify JWT token
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required. Please provide a valid token.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(token, config.jwt.secret);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
    }
    return res.status(500).json({ 
      error: 'Authentication failed' 
    });
  }
};

// Check if user has required role
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
      } catch (error) {
        // Invalid token, but continue as guest
        console.log('Optional auth: Invalid token, continuing as guest');
      }
    }
    // No token or invalid token - continue as guest
    next();
  } catch (error) {
    // Ignore errors for optional auth and continue
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};