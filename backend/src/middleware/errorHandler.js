import { env } from '../config/env.js';

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details
      }
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field} already exists`
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token expired'
      }
    });
  }

  // Custom error with code
  if (err.code) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  // Default error
  const isDev = env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'Internal server error',
      stack: isDev ? err.stack : undefined
    }
  });
}
