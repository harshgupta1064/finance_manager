import request from 'supertest';
import app from '../app.js';
import { prisma } from '../src/config/db.js';

afterAll(async () => {
  await prisma.$disconnect();
});

// Helper to get a token for a given role using seed credentials
const getToken = async (email, password) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data?.accessToken;
};

describe('RBAC — Role-Based Access Control', () => {
  let viewerToken;
  let analystToken;
  let adminToken;

  beforeAll(async () => {
    viewerToken  = await getToken('viewer@test.com',  'Viewer@123');
    analystToken = await getToken('analyst@test.com', 'Analyst@123');
    adminToken   = await getToken('admin@test.com',   'Admin@123');
  });

  describe('DELETE /api/records/:id', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app).delete('/api/records/some-id');
      expect(res.status).toBe(401);
    });

    it('should return 403 when VIEWER tries to delete a record', async () => {
      const res = await request(app)
        .delete('/api/records/some-id')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 when ANALYST tries to delete a record', async () => {
      const res = await request(app)
        .delete('/api/records/some-id')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app).patch('/api/users/some-id/role');
      expect(res.status).toBe(401);
    });

    it('should return 403 when VIEWER tries to change a user role', async () => {
      const res = await request(app)
        .patch('/api/users/some-id/role')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ role: 'ADMIN' });
      expect(res.status).toBe(403);
    });

    it('should return 403 when ANALYST tries to change a user role', async () => {
      const res = await request(app)
        .patch('/api/users/some-id/role')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ role: 'ADMIN' });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users', () => {
    it('should return 403 when VIEWER tries to list users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 when ANALYST tries to list users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 when ADMIN lists users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/records — ANALYST allowed, VIEWER denied', () => {
    const recordPayload = {
      name: 'Noodles',
      amount: 4500,
      type: 'EXPENSE',
      category: 'Food',
      date: '2024-01-15',
      notes: 'Grocery shopping',
    };

    it('should return 403 when VIEWER tries to create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(recordPayload);
      expect(res.status).toBe(403);
    });

    it('should return 201 when ANALYST creates a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send(recordPayload);
      expect(res.status).toBe(201);
    });
  });
});
