import { Router } from 'express';
import { getSummary, getByCategory, getTrends, getRecent } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { dashboardTrendsQuerySchema } from '../validators/dashboard.schema.js';

const router = Router();

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Total income, expenses, and net balance (all roles)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Summary object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncome:    { type: number }
 *                 totalExpenses:  { type: number }
 *                 netBalance:     { type: number }
 */

/**
 * @swagger
 * /api/dashboard/by-category:
 *   get:
 *     summary: Totals grouped by category (all roles)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of category totals }
 */

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Income vs expense trends by month or week (all roles)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, week]
 *           default: month
 *         description: month (last 48 months) or week (last 104 weeks)
 *     responses:
 *       200: { description: Array of aggregates (month or week bucket + type + total + count) }
 *       422: { description: Invalid period }
 */

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Last 10 transactions (all roles)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Array of recent records }
 */

router.use(authenticate);

router.get('/summary',     getSummary);
router.get('/by-category', getByCategory);
router.get('/trends', validate(dashboardTrendsQuerySchema), getTrends);
router.get('/recent',      getRecent);

export default router;
