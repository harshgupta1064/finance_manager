import { asyncHandler } from '../utils/asyncHandler.js';
import * as dashboardService from '../services/dashboard.service.js';

export const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary(req.query);
  res.json({ success: true, data });
});

export const getByCategory = asyncHandler(async (req, res) => {
  const data = await dashboardService.getByCategory(req.query);
  res.json({ success: true, data });
});

export const getTrends = asyncHandler(async (req, res) => {
  const { period } = req.validated.query;
  const data = period === 'week'
    ? await dashboardService.getWeeklyTrends()
    : await dashboardService.getMonthlyTrends();
  res.json({ success: true, data });
});

export const getRecent = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecentTransactions();
  res.json({ success: true, data });
});
