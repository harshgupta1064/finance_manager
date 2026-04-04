import request from 'supertest';
import app from '../app.js';
import { prisma } from '../src/config/db.js';

afterAll(async () => {
  await prisma.$disconnect();
});

const getToken = async (email, password) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data?.accessToken;
};

describe('Dashboard Endpoints', () => {
  let token;

  beforeAll(async () => {
    token = await getToken('viewer@test.com', 'Viewer@123');
  });

  describe('GET /api/dashboard/summary', () => {
    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(401);
    });

    it('should return summary with totalIncome, totalExpenses, netBalance as numbers', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.totalIncome).toBe('number');
      expect(typeof res.body.data.totalExpenses).toBe('number');
      expect(typeof res.body.data.netBalance).toBe('number');
    });

    it('should support date range filtering', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalIncome');
    });
  });

  describe('GET /api/dashboard/by-category', () => {
    it('should return an array', async () => {
      const res = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('should return an array of monthly data', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return an array when period=week', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?period=week')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 422 for invalid period', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?period=daily')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/dashboard/recent', () => {
    it('should return an array of recent transactions', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/records search', () => {
    it('should return 200 and filter when search matches seeded data', async () => {
      const res = await request(app)
        .get('/api/records?search=Salary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.every((r) =>
        /salary/i.test(r.name) || /salary/i.test(r.category) || (r.notes && /salary/i.test(r.notes))
      )).toBe(true);
    });
  });
});
