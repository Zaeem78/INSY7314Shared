// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation Error', details: errors });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Joi validation error
  if (err.isJoi) {
    return res.status(400).json({ error: err.details[0].message });
  }

  // SQLite errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({ error: 'Invalid reference' });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = { errorHandler };
