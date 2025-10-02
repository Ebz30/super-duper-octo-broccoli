// Simple in-memory rate limiter
// In production, use Redis for distributed rate limiting

const requestCounts = new Map();

function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const identifier = req.session?.userId || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    if (requestCounts.size > 10000) {
      for (const [key, data] of requestCounts.entries()) {
        if (data.resetTime < now) {
          requestCounts.delete(key);
        }
      }
    }
    
    // Get or create request data
    let requestData = requestCounts.get(identifier);
    
    if (!requestData || requestData.resetTime < now) {
      requestData = {
        count: 0,
        resetTime: now + windowMs
      };
      requestCounts.set(identifier, requestData);
    }
    
    requestData.count++;
    
    if (requestData.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }
    
    next();
  };
}

// Login rate limiter - max 5 attempts per 15 minutes
const loginAttempts = new Map();

function loginRateLimit(req, res, next) {
  const identifier = req.body.email || req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  let attempts = loginAttempts.get(identifier);
  
  if (!attempts || attempts.resetTime < now) {
    attempts = {
      count: 0,
      resetTime: now + windowMs
    };
    loginAttempts.set(identifier, attempts);
  }
  
  attempts.count++;
  
  if (attempts.count > 5) {
    return res.status(429).json({
      error: 'Too many login attempts',
      message: 'Account temporarily locked. Please try again in 15 minutes',
      retryAfter: Math.ceil((attempts.resetTime - now) / 1000)
    });
  }
  
  next();
}

function clearLoginAttempts(identifier) {
  loginAttempts.delete(identifier);
}

module.exports = {
  rateLimit,
  loginRateLimit,
  clearLoginAttempts
};
