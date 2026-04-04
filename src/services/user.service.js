import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination } from '../utils/pagination.js';

export const getAllUsers = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip, take: limit,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);
  return { users, total, page, limit };
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const updateUserRole = async (id, role) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, 'User not found');
  return prisma.user.update({
    where: { id }, data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
};

export const updateUserStatus = async (id, isActive) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, 'User not found');
  return prisma.user.update({
    where: { id }, data: { isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });
};
