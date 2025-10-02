import { containsProfanity } from './profanity';
import type { Request, Response, NextFunction } from 'express';

export async function validateContent(req: Request, res: Response, next: NextFunction) {
  const { title, description } = req.body ?? {};

  if (title) {
    const titleCheck = containsProfanity(title);
    if (titleCheck.detected) {
      return res.status(400).json({
        error: 'Inappropriate content detected',
        field: 'title',
        message: 'Please remove inappropriate language',
      });
    }
  }

  if (description) {
    const descCheck = containsProfanity(description);
    if (descCheck.detected) {
      return res.status(400).json({
        error: 'Inappropriate content detected',
        field: 'description',
        message: 'Please review our community guidelines.',
      });
    }
  }

  next();
}
