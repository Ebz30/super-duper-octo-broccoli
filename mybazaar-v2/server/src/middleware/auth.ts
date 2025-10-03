import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include session user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

// Middleware to require authentication
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Please log in to access this resource',
    });
  }

  // TODO: Fetch user from database and attach to request
  // For now, just pass through
  next();
};

// Middleware for optional authentication (user data if logged in)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.userId) {
    // TODO: Fetch user from database and attach to request
  }
  next();
};
