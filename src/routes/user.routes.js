import { Router } from 'express';
import { listUsers, getUser, updateRole, updateStatus } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { updateRoleSchema, updateStatusSchema } from '../validators/user.schema.js';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated user list }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a single user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User object }
 *       404: { description: Not found }
 */

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user role (admin only)
 *     tags: [Users]
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
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [VIEWER, ANALYST, ADMIN] }
 *     responses:
 *       200: { description: Updated user }
 *       404: { description: Not found }
 */

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user (admin only)
 *     tags: [Users]
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
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: Updated user }
 *       404: { description: Not found }
 */

router.use(authenticate, authorize('ADMIN'));

router.get('/',             listUsers);
router.get('/:id',          getUser);
router.patch('/:id/role',   validate(updateRoleSchema),   updateRole);
router.patch('/:id/status', validate(updateStatusSchema), updateStatus);

export default router;
