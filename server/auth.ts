import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db, User, Role } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hse_safety_jwt_secret_key_2026_987654';

export interface TokenPayload {
  userId: string;
  username: string;
  roleId: string;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  role?: Role;
  permissions?: string[];
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    roleId: user.roleId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  const database = db.getData();
  const user = database.users.find((u) => u.id === payload.userId && u.status === 'Active');
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User account not found or deactivated' });
  }

  const role = database.roles.find((r) => r.id === user.roleId);
  const permissions = role ? role.permissions : [];

  req.user = user;
  req.role = role;
  req.permissions = permissions;
  next();
}

export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.permissions) {
      return res.status(401).json({ error: 'Unauthorized: Please authenticate first' });
    }

    // Administrator role has all access
    if (req.role?.id === 'role-admin' || req.permissions.includes(permissionCode)) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: Missing required permission: ${permissionCode}`,
      errorAr: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء',
    });
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.role) {
    return res.status(401).json({ error: 'Unauthorized: Please authenticate first' });
  }

  if (req.role.id === 'role-admin') {
    return next();
  }

  return res.status(403).json({
    error: 'Forbidden: Administrator privileges required for this action',
    errorAr: 'هذا الإجراء مخصص لمدير النظام فقط',
  });
}
