# Finance Dashboard API

REST API for financial records, role-based access, and dashboard aggregates. Built for the Finance Data Processing and Access Control backend exercise: Express, PostgreSQL, Prisma, JWT auth, and Zod validation.

## Quick start

**1. Install and configure**

```bash
git clone https://github.com/harshgupta1064/finance_manager
cd finance_manager
npm install
cp .env.example .env
```

Set `DATABASE_URL` and `JWT_SECRET` in `.env` before running migrations or the server.

**2. Database**

PostgreSQL must be running. Apply the schema and seed demo data:

```bash
npm run db:push
npm run db:seed
```

**3. Run**

```bash
npm run dev
```

- Base URL: `http://localhost:3000`
- OpenAPI UI: `http://localhost:3000/api/docs`

**Rate limits:** With `NODE_ENV=test`, limits are disabled for automated tests. Otherwise: 100 requests per 15 minutes per IP (global), and 20 per 15 minutes on `POST /api/auth/register` and `POST /api/auth/login`. Adjust in `src/middleware/rateLimit.js` if needed; behind a reverse proxy, configure Express `trust proxy` so client IPs are correct.

## Assumptions

- **Who sees what:** Viewers and analysts read the same set of non-deleted records and the same dashboard totals. Roles differ by what each may **do** (create, update, delete, manage users), not by hiding rows per user.
- **Soft delete:** List and aggregate queries ignore records where `isDeleted` is true.
- **Inactive accounts:** After an admin sets `isActive` to false, the next authenticated request fails with 403 even if the JWT has not expired, because the user row is loaded on each request.

## Behaviour worth noting

These are implemented in code and reflected in Swagger; details below are the short version.

| Topic | What to know |
|--------|----------------|
| Auth on every protected call | After the JWT is verified, the user is loaded from the database. Role changes apply on the next request; missing users get 401; inactive users get 403 (message indicates deactivation). |
| Rate limiting | Global cap plus stricter limits on register and login. Implementation: `src/middleware/rateLimit.js`. Off when `NODE_ENV=test`. Over-limit responses use HTTP 429. |
| Record search | `GET /api/records?search=...` matches `name`, `category`, or `notes` (case-insensitive), combined with `type`, `category`, and date filters as AND. |
| Dashboard trends | `GET /api/dashboard/trends?period=month` (default, up to 48 months) or `period=week` (up to 104 weeks). Any other `period` value returns 422. |

## Seed users (local only)

| Email            | Password    | Role    | Notes                          |
|------------------|-------------|---------|--------------------------------|
| admin@test.com   | Admin@123   | ADMIN   | Full record and user management |
| analyst@test.com | Analyst@123 | ANALYST | Create records; no user admin   |
| viewer@test.com  | Viewer@123  | VIEWER  | Read-only                       |

## API overview

Protected routes expect: `Authorization: Bearer <accessToken>`.

Detail for request and response shapes is in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) and in Swagger at `/api/docs`.

**Authentication**

- `POST /api/auth/register` — sign up (default role VIEWER)
- `POST /api/auth/login` — access and refresh tokens
- `GET /api/auth/me` — current user (authenticated)
- `POST /api/auth/refresh` — new tokens
- `POST /api/auth/logout` — drop refresh token

**Financial records**

- `POST /api/records` — create (ADMIN, ANALYST)
- `GET /api/records` — list with pagination, filters, optional `search` on name, category, notes (all roles)
- `GET /api/records/:id` — one record (all roles)
- `PUT /api/records/:id` — update (ADMIN)
- `DELETE /api/records/:id` — soft delete (ADMIN)

**Dashboard**

- `GET /api/dashboard/summary` — income, expenses, net balance (all roles)
- `GET /api/dashboard/by-category` — totals by category (all roles)
- `GET /api/dashboard/trends` — `period=month` (default) or `period=week` (all roles)
- `GET /api/dashboard/recent` — latest 10 records (all roles)

**Users (ADMIN only)**

- `GET /api/users` — paginated list
- `GET /api/users/:id` — one user
- `PATCH /api/users/:id/role` — set role
- `PATCH /api/users/:id/status` — activate or deactivate

## Stack and behavior (short)

PostgreSQL and Prisma; amounts stored as `DECIMAL(12,2)`. Validation uses Zod (422 with field errors where applicable). Record mutations that need atomicity use Prisma transactions; record create/update/delete are also written to audit logs. Refresh tokens are stored hashed and rotated on refresh. Integration tests live under `tests/` and expect a running database (same `DATABASE_URL` as local dev).
