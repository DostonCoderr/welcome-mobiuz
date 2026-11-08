import { Request, Response, NextFunction } from 'express';
import { protect } from './auth';

// Bot sirri YOKI WebApp sirri YOKI admin JWT
export const botOrWebApp = (req: Request, res: Response, next: NextFunction) => {
  const bot = req.headers['x-bot-secret'];
  const web = req.headers['x-webapp-secret'];
  if (bot && bot === process.env.BOT_SECRET) return next();
  if (web && web === process.env.WEBAPP_SECRET) return next();
  return res.status(403).json({ error: 'Ruxsat berilmagan' });
};

export const anyAuth = (req: Request, res: Response, next: NextFunction) => {
  const bot = req.headers['x-bot-secret'];
  const web = req.headers['x-webapp-secret'];
  if (bot && bot === process.env.BOT_SECRET) return next();
  if (web && web === process.env.WEBAPP_SECRET) return next();
  return protect(req, res, next); // admin panel: Bearer JWT
};