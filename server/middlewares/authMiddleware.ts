import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'nutrition_assistant_super_secret_key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    console.warn(`[AuthMiddleware] 401 Unauthorized on ${req.method} ${req.originalUrl} - Missing or malformed Authorization header.`);
    res.status(401).json({ message: 'Access Denied: No token provided' });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: 'user' | 'admin';
    };
    req.user = decoded;
    next();
  } catch (error: any) {
    console.warn(`[AuthMiddleware] 401 Unauthorized on ${req.method} ${req.originalUrl} - Token verification failed:`, error.message || error);
    res.status(401).json({ message: 'Access Denied: Invalid or expired token' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Access Denied: Unauthorized' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access Denied: Admin access required' });
    return;
  }

  next();
}
