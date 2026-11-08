import { Request, Response, NextFunction } from 'express';

export const webAppAuth = (req: Request, res: Response, next: NextFunction) => {
  // WebApp Telegram initData yuborishi kerak
  // Hozircha test uchun maxsus kalit qo'llaymiz
  const webAppSecret = req.headers['x-webapp-secret'];

  if (!webAppSecret || webAppSecret !== process.env.WEBAPP_SECRET) {
    return res.status(403).json({ error: 'Faqat WebApp uchun ruxsat berilgan' });
  }

  next();
};