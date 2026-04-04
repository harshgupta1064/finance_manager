# Finance Dashboard API — Reference

This document describes the HTTP API for users, roles, financial records, and dashboard metrics.

- **Base URL:** `http://localhost:3000` (local)
- **Interactive spec:** `http://localhost:3000/api/docs` (Swagger UI)

## Contents

1. [Authentication](#authentication-strategy)
2. [Response shape](#response-format)
3. [Auth routes](#authentication-endpoints)
4. [User management](#user-management-endpoints)
5. [Financial records](#financial-records-endpoints)
6. [Dashboard](#dashboard-endpoints)

---

## Authentication strategy

The API uses JWTs. Login and register responses include an `accessToken`; send it on protected routes:

`Authorization: Bearer <accessToken>`

Refresh tokens are stored hashed server-side and can be rotated via the refresh endpoint.

### Roles

| Role    | Typical use |
|---------|-------------|
| VIEWER  | Read records and dashboards only |
| ANALYST | Read everything; create records |
| ADMIN   | Full record CRUD (including soft delete), user listing, role and status updates |

### Design assumptions

- Viewers and analysts see the same non-deleted data and aggregates. Access control is about **actions**, not separate per-user ledgers unless you extend the model.
- Soft-deleted records are omitted from lists and dashboard math.
- If `isActive` is false, authenticated requests return **403** on the next call, regardless of JWT expiry, because the user record is read after the token is verified. If the user id in the token no longer exists, the API returns **401**.
- Rate limits: 100 requests / 15 minutes / IP on most routes; 20 / 15 minutes on `POST /api/auth/register` and `POST /api/auth/login`. Disabled when `NODE_ENV=test`. Excess traffic returns **429** (see auth section below).
- **Record list search:** `GET /api/records` accepts optional `search` (see financial records section).
- **Trends granularity:** `GET /api/dashboard/trends` accepts `period=month` or `period=week`; invalid values yield **422**.

---

## Response format

Success, single resource:

```json
{
  "success": true,
  "data": { }
}
```

Success, paginated list:

```json
{
  "success": true,
  "data": [ ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Short explanation",
  "errors": { "fieldName": ["validation detail"] }
}
```

`errors` is present mainly for validation (422) responses.

---

## Authentication endpoints

Repeated register or login attempts from the same IP can receive **429 Too Many Requests** when rate limiting applies (see assumptions above).

### POST /api/auth/register

Creates a user with default role `VIEWER`.

- **Auth:** No
- **Body:** `name`, `email`, `password` (see Zod rules in code for password policy)
- **201** — Created  
- **409** — Email already in use  
- **422** — Validation failed  

### POST /api/auth/login

- **Auth:** No  
- **Body:** `email`, `password`  
- **200** — `{ user, accessToken, refreshToken }`  
- **401** — Wrong credentials  
- **403** — Account deactivated  

### GET /api/auth/me

- **Auth:** Yes  
- **200** — Current user (`id`, `email`, `role` from database)  

### POST /api/auth/refresh

- **Auth:** No  
- **Body:** `refreshToken`  
- **200** — New access and refresh tokens  

### POST /api/auth/logout

- **Auth:** No  
- **Body:** `refreshToken`  
- **204** — Refresh token removed  

---

## User management endpoints

All require **ADMIN**.

### GET /api/users

Query: `page`, `limit`. Returns a paginated user list.

### GET /api/users/:id

Returns one user.

### PATCH /api/users/:id/role

Body: `{ "role": "VIEWER" | "ANALYST" | "ADMIN" }`

### PATCH /api/users/:id/status

Body: `{ "isActive": true | false }`  
Deactivation blocks further API use without deleting the user row.

---

## Financial records endpoints

### POST /api/records

- **Auth:** ADMIN, ANALYST  
- **Body example:**

```json
{
  "name": "Monthly pay",
  "amount": 1250.5,
  "type": "INCOME",
  "category": "Salary",
  "date": "2024-03-20",
  "notes": "March"
}
```

`type` is `INCOME` or `EXPENSE`. `notes` is optional.

- **201** — Created  

### GET /api/records

- **Auth:** All roles  
- **Query:**  
  - `type` — `INCOME` or `EXPENSE`  
  - `category` — substring, case-insensitive  
  - `search` — optional; matches `name`, `category`, or `notes` (AND with other filters)  
  - `startDate`, `endDate` — filter on record date  
  - `page`, `limit` — pagination (defaults 1 and 10, max limit 100)  

### PUT /api/records/:id

- **Auth:** ADMIN  
- **Body:** Any subset of the create fields  

### DELETE /api/records/:id

- **Auth:** ADMIN  
- **204** — Soft-deleted (`isDeleted` set true)  

---

## Dashboard endpoints

All require authentication (any role).

### GET /api/dashboard/summary

Optional query: `startDate`, `endDate`.  
Returns `totalIncome`, `totalExpenses`, `netBalance` (numbers derived from decimal sums).

### GET /api/dashboard/by-category

Optional: `startDate`, `endDate`.  
Returns grouped sums (and counts) by `category` and `type`.

### GET /api/dashboard/trends

- **Query:** `period` — `month` (default; up to 48 monthly buckets) or `week` (up to 104 weekly buckets, week start from PostgreSQL `DATE_TRUNC`).
- **200** — Array of rows: bucket start date (`month` or `week` column depending on `period`), `type` (`INCOME` / `EXPENSE`), `total`, `count`.
- **422** — `period` is present but not `month` or `week` (validated with Zod).

### GET /api/dashboard/recent

Returns up to 10 latest non-deleted records (by creation time), with basic user info where applicable.
