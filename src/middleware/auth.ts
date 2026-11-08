import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'socialcom-super-secret-key-2026';

export interface AuthUser {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: 'superadmin' | 'merchant' | 'staff' | 'delivery';
  shopId?: number | null;
  deliveryAgentId?: number | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const generateToken = (payload: AuthUser): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé : jeton manquant' });
  }

  const token = authHeader.split('Bearer ')[1];

  // 1. Try local JWT first
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    return next();
  } catch (_jwtError) {
    // 2. If JWT fails, try Firebase ID token verification
    try {
      const decodedFirebase = await adminAuth.verifyIdToken(token);
      req.user = {
        id: 0,
        uid: decodedFirebase.uid,
        email: decodedFirebase.email || '',
        fullName: decodedFirebase.name || decodedFirebase.email || 'Utilisateur',
        role: 'merchant',
      };
      return next();
    } catch (_fbError) {
      return res.status(401).json({ error: 'Jeton de session invalide ou expiré' });
    }
  }
};

export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Accès réservé au Super Administrateur' });
  }
  next();
};

export const requireShopAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  if (req.user.role === 'superadmin') {
    return next();
  }
  if (!req.user.shopId) {
    return res.status(403).json({ error: 'Aucune boutique associée à ce compte' });
  }
  next();
};
