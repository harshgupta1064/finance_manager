import request from 'supertest';
import app from '../app.js';
import { prisma } from '../src/config/db.js';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth Endpoints', () => {
  const uniqueEmail = `test_${Date.now()}@example.com`;

  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201 without passwordHash', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: uniqueEmail, password: 'Secret@123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email', uniqueEmail);
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 409 on duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: uniqueEmail, password: 'Secret@123' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 when password has no uppercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'another@example.com', password: 'secret123' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 422 when email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'not-an-email', password: 'Secret@123' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with accessToken on valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: uniqueEmail, password: 'Secret@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
    });

    it('should return 401 on wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: uniqueEmail, password: 'WrongPassword1' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 on non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'doesnotexist@example.com', password: 'Secret@123' });

      expect(res.status).toBe(401);
    });
  });

  describe('Deactivated account vs JWT', () => {
    it('should return 403 on protected routes after admin deactivates the user', async () => {
      const email = `deactivated_${Date.now()}@example.com`;

      const reg = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Deactivate Me', email, password: 'Secret@123' });
      expect(reg.status).toBe(201);
      const { id: userId } = reg.body.data;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'Secret@123' });
      expect(loginRes.status).toBe(200);
      const { accessToken } = loginRes.body.data;

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin@123' });
      expect(adminLogin.status).toBe(200);
      const adminToken = adminLogin.body.data.accessToken;

      const patch = await request(app)
        .patch(`/api/users/${userId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });
      expect(patch.status).toBe(200);

      const blocked = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(blocked.status).toBe(403);
      expect(blocked.body.message).toMatch(/deactivat/i);

      await request(app)
        .patch(`/api/users/${userId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });
    });
  });
});
