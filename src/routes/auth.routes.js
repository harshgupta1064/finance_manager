import { Router } from 'express';
import { register, login, me, refresh, logout } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from '../validators/auth.schema.js';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: "John Doe" }
 *               email:    { type: string, example: "john@example.com" }
 *               password: { type: string, example: "Secret@123" }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Email already exists }
 *       422: { description: Validation error }
 *       429: { description: Too many requests (rate limit) }
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Returns accessToken }
 *       401: { description: Invalid credentials }
 *       429: { description: Too many requests (rate limit) }
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Current user payload }
 *       401: { description: Unauthorized }
 */
router.get('/me', authenticate, me);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Returns new accessToken and refreshToken }
 *       401: { description: Invalid or expired refresh token }
 */
router.post('/refresh', validate(refreshSchema), refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       204: { description: Refresh token invalidated successfully }
 */
router.post('/logout', validate(logoutSchema), logout);

export default router;
