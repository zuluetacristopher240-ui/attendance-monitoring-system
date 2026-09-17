/**
 * middleware/auth.js
 * 
 * Centralized authentication at authorization middleware.
 * 
 * Usage sa routes:
 *   const { verifyToken, requireRole } = require('../middleware/auth');
 *   router.get('/protected', verifyToken, handler);
 *   router.post('/admin-only', verifyToken, requireRole('admin'), handler);
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token. Kung valid, i-attach ang decoded user sa req.user.
 * req.user = { id, username, role }
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization header format.' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    return res.status(401).json({ message: 'Authentication failed.' });
  }
}

/**
 * Role-based access control.
 * 
 * Usage:
 *   router.delete('/:id', verifyToken, requireRole('admin'), handler);
 *   router.get('/', verifyToken, requireRole('admin', 'teacher'), handler);
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission for this action.' 
      });
    }

    next();
  };
}

module.exports = { verifyToken, requireRole };