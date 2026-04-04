import { prisma } from '../config/db.js';

const buildDateFilter = (startDate, endDate) =>
  startDate || endDate
    ? { date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate   && { lte: new Date(endDate) }),
      }}
    : {};

export const getSummary = async ({ startDate, endDate } = {}) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const [income, expense] = await prisma.$transaction([
    prisma.financialRecord.aggregate({
      where: { type: 'INCOME', isDeleted: false, ...dateFilter },
      _sum: { amount: true },
    }),
    prisma.financialRecord.aggregate({
      where: { type: 'EXPENSE', isDeleted: false, ...dateFilter },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome   = Number(income._sum.amount  ?? 0);
  const totalExpenses = Number(expense._sum.amount ?? 0);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
  };
};

export const getByCategory = async ({ startDate, endDate } = {}) => {
  const dateFilter = buildDateFilter(startDate, endDate);
  return prisma.financialRecord.groupBy({
    by: ['category', 'type'],
    where: { isDeleted: false, ...dateFilter },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } },
  });
};

export const getMonthlyTrends = async () => {
  const results = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('month', date)::date AS month,
      type,
      SUM(amount)::float              AS total,
      COUNT(*)::int                   AS count
    FROM "FinancialRecord"
    WHERE "isDeleted" = false
    GROUP BY month, type
    ORDER BY month DESC
    LIMIT 48
  `;
  return results;
};

export const getWeeklyTrends = async () => {
  const results = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('week', date)::date AS week,
      type,
      SUM(amount)::float             AS total,
      COUNT(*)::int                  AS count
    FROM "FinancialRecord"
    WHERE "isDeleted" = false
    GROUP BY week, type
    ORDER BY week DESC
    LIMIT 104
  `;
  return results;
};

export const getRecentTransactions = async () => {
  return prisma.financialRecord.findMany({
    where:   { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take:    10,
    include: { user: { select: { name: true } } },
  });
};
