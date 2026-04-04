import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { logAction } from './audit.service.js';
import { getPagination } from '../utils/pagination.js';

export const createRecord = async (data, actorId) => {
  return prisma.$transaction(async (tx) => {
    const record = await tx.financialRecord.create({
      data: { ...data, userId: actorId, date: new Date(data.date) },
    });
    await logAction(tx, {
      actorId, action: 'CREATE', entity: 'FinancialRecord',
      entityId: record.id, metadata: { amount: data.amount, type: data.type },
    });
    return record;
  });
};

export const getRecords = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const { type, category, search, startDate, endDate } = query;

  const searchFilter = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const where = {
    isDeleted: false,
    ...(type     && { type }),
    ...(category && { category: { contains: category, mode: 'insensitive' } }),
    ...searchFilter,
    ...((startDate || endDate) && {
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate   && { lte: new Date(endDate) }),
      },
    }),
  };

  const [records, total] = await prisma.$transaction([
    prisma.financialRecord.findMany({
      where, skip, take: limit,
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return { records, total, page, limit };
};

export const getRecordById = async (id) => {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!record) throw new ApiError(404, 'Record not found');
  return record;
};

export const updateRecord = async (id, data, actorId) => {
  const existing = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(404, 'Record not found');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.financialRecord.update({
      where: { id },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) }),
      },
    });
    await logAction(tx, {
      actorId, action: 'UPDATE', entity: 'FinancialRecord',
      entityId: id, metadata: { changes: data },
    });
    return updated;
  });
};

export const softDeleteRecord = async (id, actorId) => {
  const existing = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(404, 'Record not found');

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.financialRecord.update({
      where: { id },
      data: { isDeleted: true },
    });
    await logAction(tx, {
      actorId, action: 'DELETE', entity: 'FinancialRecord', entityId: id,
    });
    return deleted;
  });
};
