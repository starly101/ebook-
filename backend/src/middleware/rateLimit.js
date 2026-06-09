import rateLimit from 'express-rate-limit';

/**
 * Strict rate limit for auth routes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * General API rate limit
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please slow down'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limit for AI endpoints
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'AI rate limit exceeded, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
