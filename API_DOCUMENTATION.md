# Finance Dashboard API — Technical Documentation

This document serves as the comprehensive technical reference for the Finance Dashboard API. It outlines system assumptions, authentication mechanisms, enumerations, standard HTTP codes, and extensive payload structures for all endpoints.

---

## 🔐 1. Authentication Strategy

The API utilizes a dual-token **JSON Web Token (JWT)** architecture to balance stateless performance with secure invalidation capabilities.

- **Access Tokens:** Standard JWT passed in the `Authorization` header as a Bearer token (`Authorization: Bearer <accessToken>`). They have a short lifespan (e.g., 15 minutes).
- **Refresh Tokens:** Opaque hashes stored securely within the database (`RefreshToken` table). Used against `/api/auth/refresh` to obtain new Access Tokens without forcing the user to log in again.
- **Stateful Middle-Layer Validation:** Even after verifying the cryptographic signature of the Access Token, the `authenticate` middleware looks up the user's `id` in the database. 
  - *Advantage:* If an Admin disables a user account (`isActive: false`) or changes their role, the security rules apply instantaneously on their next request, overriding the stateless nature of the JWT.

---

## 📌 2. Design Assumptions & Tradeoffs

- **Soft Deleting:** Financial records are never hard-deleted (`DELETE` from DB). They are flagged with `isDeleted = true`. The API logic intentionally omits all soft-deleted records from Dashboard math and Lists to preserve referential integrity and audit logs.
- **Role Scoping:** Viewers, Analysts, and Admins all see the same aggregated dashboard numbers. Roles govern **mutating access** (who has the authorization to create, change, or delete data) rather than isolating ledger visibility per user. 
- **Pagination Defaults:** Any endpoint returning lists defaults to `page=1` and `limit=10`. Limits are forcefully capped at 100 to prevent database memory exhaustion.
- **Rate Limiting:** IP-based request throttling is applied globally (100 reqs/15m) and strictly on authentication endpoints (20 reqs/15m) to prevent brute-force attacks.

---

## 📜 3. Global Enums

### Roles
| Enum | Application Permission Level |
|---------|-------------|
| **`VIEWER`** | Read-only access to all financial records and dashboard analytics. |
| **`ANALYST`**| Read access to records/analytics, plus capability to **Create (POST)** records. |
| **`ADMIN`**  | Full CRUD access to records (including global Updates and Soft Deletes) operations. Exclusive access to update User Access/Roles. |

### Record Type
| Enum | Description |
|---------|-------------|
| **`INCOME`** | Positive cash flow transactions (e.g., Salary, Freelancing). |
| **`EXPENSE`**| Negative cash flow transactions (e.g., Rent, Utilities, Food). |

---

## 🚥 4. Standard Response Formats & Error Codes

All APIs respond with a consistent JSON envelope to make frontend integration predictable.

### Success Structures
**Single Resource (200 OK / 201 Created)**
```json
{
  "success": true,
  "data": { ...resourceObject }
}
```

**Paginated Lists (200 OK)**
```json
{
  "success": true,
  "data": [ { ...record1 }, { ...record2 } ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Global Error Codes
When `success: false`, an error message is returned. A `422` error includes an `errors` object mapping fields to their validation failures (handled safely by Zod).

| Status Code | Description | Example Payload |
|-------------|-------------|-----------------|
| **`400`**   | Bad Request | `{"success":false, "message":"Invalid input parameters"}` |
| **`401`**   | Unauthorized| `{"success":false, "message":"Not authenticated"}` (Missing/Expired JWT) |
| **`403`**   | Forbidden   | `{"success":false, "message":"Account deactivated or insufficient permissions"}` |
| **`404`**   | Not Found   | `{"success":false, "message":"Resource does not exist"}` |
| **`409`**   | Conflict    | `{"success":false, "message":"Email already in use"}` |
| **`422`**   | Unprocessable| `{"success":false, "message":"Validation failed", "errors": {"email": ["Invalid email format"]}}` |
| **`429`**   | Rate Limit  | `{"success":false, "message":"Too many requests, try again later"}` |
| **`500`**   | Server Error| `{"success":false, "message":"Internal server error"}` |

---

## 🔌 5. API Reference

### 👤 Authentication Endpoints

#### `POST /api/auth/register`
Creates a fresh user account. Defaults to the `VIEWER` role.
- **Request Body:**
  ```json
  { "name": "John Doe", "email": "john@test.com", "password": "SecurePassword123!" }
  ```
- **Response `201 Created`:**
  ```json
  { "success": true, "message": "User registered successfully", "data": { "id": "...", "email": "john@test.com", "role": "VIEWER" } }
  ```

#### `POST /api/auth/login`
- **Request Body:**
  ```json
  { "email": "john@test.com", "password": "SecurePassword123!" }
  ```
- **Response `200 OK`:** Returns access and refresh keys. 
  ```json
  { "success": true, "data": { "user": { "id": "...", "role": "VIEWER" }, "accessToken": "eyJhbG...", "refreshToken": "9d8f8a..." } }
  ```

#### `GET /api/auth/me`
Retrieves current session context mapping. Requires Bearer Token.
- **Response `200 OK`:**
  ```json
  { "success": true, "data": { "id": "...", "name": "John", "email": "john@test.com", "role": "VIEWER" } }
  ```

#### `POST /api/auth/refresh`
Exchanges a valid refresh token for fresh Access/Refresh keys.
- **Request Body:**
  ```json
  { "refreshToken": "your_existing_refresh_token" }
  ```
- **Response `200 OK`:** `{ "success": true, "data": { "accessToken": "new...", "refreshToken": "new..." } }`

---

### 🛡️ User Management Endpoints (Requires `ADMIN`)

#### `PATCH /api/users/:id/role`
Updates a user's RBAC scope natively.
- **Request Body:**
  ```json
  { "role": "ANALYST" } // Must be one of the Role enums
  ```
- **Response `200 OK`:** `{ "success": true, "data": { "id": "...", "role": "ANALYST" } }`

#### `PATCH /api/users/:id/status`
Soft-locks an account. Users set to `isActive: false` immediately receive 403s on future calls.
- **Request Body:**
  ```json
  { "isActive": false }
  ```
- **Response `200 OK`:** `{ "success": true, "data": { "isActive": false } }`

---

### 💵 Financial Records Endpoints

#### `POST /api/records` (Requires `ADMIN` or `ANALYST`)
Creates a new financial transaction attached to the actor creating it.
- **Request Body:**
  ```json
  {
    "name": "Design Freelance",
    "amount": 25000.50,
    "type": "INCOME",
    "category": "Freelancing",
    "date": "2025-05-15",
    "notes": "Project XYZ payment"
  }
  ```
- **Response `201 Created`:** `{ "success": true, "data": { "id": "...", "name": "Design Freelance", ... } }`

#### `GET /api/records` (Requires `Auth`)
Lists records with complex, case-insensitive logic. Excludes soft-deleted records.
- **Query Parameters:**
  - `page` (int), `limit` (int)
  - `type` (Enum: `INCOME` | `EXPENSE`)
  - `category` (string, fuzzy logic)
  - `search` (string, fuzzy logic looking against `name`, `category`, OR `notes`)
  - `startDate`, `endDate` (ISO Strings bounding `date`)
- **Response `200 OK`:** Returns Paginated List format (see Section 4).

#### `PUT /api/records/:id` (Requires `ADMIN`)
Updates specific traits of a record.
- **Request Body:** Accepts partial updates of the `POST` payload schema.
- **Response `200 OK`:** Returns updated record data.

#### `DELETE /api/records/:id` (Requires `ADMIN`)
Soft-deletes the record securely.
- **Response `204 No Content`** (Empty body).

---

### 📊 Dashboard Aggregation Endpoints (Requires `Auth`)

#### `GET /api/dashboard/summary`
Calculates total gross values exclusively analyzing `isDeleted: false` records.
- **Query Params:** `startDate`, `endDate`
- **Response `200 OK`:**
  ```json
  { "success": true, "data": { "totalIncome": 25000, "totalExpenses": 1800, "netBalance": 23200 } }
  ```

#### `GET /api/dashboard/by-category`
Provides a breakdown of expenditures/incomes segmented precisely by text category.
- **Response `200 OK`:**
  ```json
  { "success": true, "data": [ 
    { "category": "Rent", "type": "EXPENSE", "_sum": { "amount": "18000" }, "_count": { "id": 1 } }
  ] }
  ```

#### `GET /api/dashboard/trends`
Runs complex SQL truncations to output rolling analytics.
- **Query Params:** `period` => `month` (Default, max 48 buckets) or `week` (max 104 buckets).
- **Response `200 OK`:**
  ```json
  { "success": true, "data": [
    { "month": "2024-03-01", "type": "INCOME", "total": 85000, "count": 2 }
  ] }
  ```

#### `GET /api/dashboard/recent`
Returns exactly the last 10 transactions added to the platform for instant display.
- **Response `200 OK`:** Array of the 10 most recent Record objects.
