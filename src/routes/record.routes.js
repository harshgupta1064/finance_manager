import { Router } from 'express';
import {
  createRecord, getRecords, getRecord, updateRecord, deleteRecord
} from '../controllers/record.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createRecordSchema, updateRecordSchema, queryRecordSchema
} from '../validators/record.schema.js';

const router = Router();

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a financial record (admin, analyst)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:   { type: number, example: 5000 }
 *               type:     { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string, example: "Salary" }
 *               date:     { type: string, example: "2024-01-15" }
 *               notes:    { type: string }
 *     responses:
 *       201: { description: Record created }
 *       403: { description: Insufficient permissions }
 *       422: { description: Validation error }
 */

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: List records with filtering and pagination (all roles)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [INCOME, EXPENSE] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Case-insensitive match on name, category, or notes
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated records }
 */

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get a single record (all roles)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Record object }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a record (admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:   { type: number }
 *               type:     { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string }
 *               date:     { type: string }
 *               notes:    { type: string }
 *     responses:
 *       200: { description: Updated record }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *   delete:
 *     summary: Soft delete a record (admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */

router.post('/',
  authenticate, authorize('ADMIN', 'ANALYST'),
  validate(createRecordSchema), createRecord);

router.get('/',
  authenticate,
  validate(queryRecordSchema), getRecords);

router.get('/:id',
  authenticate, getRecord);

router.put('/:id',
  authenticate, authorize('ADMIN'),
  validate(updateRecordSchema), updateRecord);

router.delete('/:id',
  authenticate, authorize('ADMIN'), deleteRecord);

export default router;
