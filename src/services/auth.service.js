import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const registerUser = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

  // Generate Refresh Token
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

export const refreshAuthTokens = async ({ refreshToken }) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  const existingToken = await prisma.refreshToken.findFirst({
    where: { tokenHash },
    include: { user: true },
  });

  if (!existingToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (existingToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: existingToken.id } });
    throw new ApiError(401, 'Refresh token expired');
  }

  const { user } = existingToken;
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  // Rotate token: Destroy the old one
  await prisma.refreshToken.delete({ where: { id: existingToken.id } });

  // Generate new Access and Refresh tokens
  const payload = { id: user.id, email: user.email, role: user.role };
  const newAccessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  
  const newRefreshToken = crypto.randomBytes(32).toString('hex');
  const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async ({ refreshToken }) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  // Attempt to delete it, ignore if it doesn't exist
  await prisma.refreshToken.deleteMany({
    where: { tokenHash },
  });
  return true;
};
