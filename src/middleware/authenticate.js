import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No token provided'));
  }
  const token = authHeader.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user) return next(new ApiError(401, 'User not found'));
    if (!user.isActive) return next(new ApiError(403, 'Account is deactivated'));

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};
