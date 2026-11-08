// mobiuz-api/src/middleware/botAuth.ts
import { Request, Response, NextFunction } from 'express';

export const botAuth = (req: Request, res: Response, next: NextFunction) => {
  const botSecret = req.headers['x-bot-secret'];

  if (!botSecret || botSecret !== process.env.BOT_SECRET) {
    return res.status(403).json({ error: 'Faqat bot uchun ruxsat berilgan' });
  }

  next();
};