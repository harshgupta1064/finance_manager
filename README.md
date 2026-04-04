# Finance Dashboard API

A robust, full-featured backend REST API built to manage financial records, process analytics, and enforce strict robust role-based access control (RBAC). 

This project was engineered with a heavy focus on architectural clarity, database integrity, and production-ready practices like input validation, rate limiting, and JWT authentication.

## Features Implemented

**Core Requirements:**
- **User & Role Management:** Secure system supporting `ADMIN`, `ANALYST`, and `VIEWER` roles. Admins can manage users and access statuses seamlessly.
- **Financial Records:** Complete CRUD operations for tracking financial transactions (Income/Expenses) with detailed categorizations, dates, and filtering logic.
- **Dashboard Analytics:** High-performance data aggregation endpoints providing net balance, category distributions, recent activity, and monthly/weekly structural trends.
- **Data Persistence:** Reliable relational data modeling using PostgreSQL and Prisma ORM.

**Optional Enhancements Included:**
- **Authentication:** Dual-token JWT architecture (Access + Refresh tokens) for robust session management.
- **Advanced Access Control:** Middleware securely blocks unauthorized role actions. Viewers only read, Analysts read & create records, and Admins have full system control.
- **Soft Deletes:** Records are flagged as deleted (`isDeleted`) preserving historical audit integrity without hard-dropping rows.
- **Search & Pagination:** Record endpoints support paginated limits and fuzzy search across names, categories, and notes.
- **Rate Limiting:** Protects exposed endpoints (login/register) against brute-force attacks using `express-rate-limit`.
- **Testing:** Automated integration suites built with `Jest`.
- **Documentation:** Real-time, interactive API exploration via Swagger UI.

## Tech Stack
- **Runtime Framework:** Node.js, Express.js
- **Database & ORM:** PostgreSQL, Prisma 7 (`@prisma/adapter-pg`)
- **Validation:** Zod (Type-safe schema validation)
- **Security:** bcryptjs (hashing), jsonwebtoken (auth), Helmet (HTTP headers)
- **Testing:** Jest, Supertest
- **API Specs:** Swagger JSDoc, Swagger UI Express

## Local Setup Guide

Follow these steps to get the application running locally on your machine.

**1. Prerequisites**
- Node.js (v18+)
- PostgreSQL installed and running locally

**2. Clone and Install**
```bash
git clone https://github.com/harshgupta1064/finance_manager.git
cd finance_manager
npm install
```

**3. Environment Variables**
Create a `.env` file from the provided example:
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```
Ensure you update the `DATABASE_URL` in your `.env` to point to an active PostgreSQL database, and define a random string for your `JWT_SECRET`.

**4. Database Migration & Seeding**
Sync the Prisma schema to your database and seed it with the necessary administrative accounts:
```bash
npm run db:push
npm run db:seed
```

**5. Start the Server**
```bash
npm run dev
```
The server will start on port `3000`. You can now access the API at `http://localhost:3000`.

## Seed Users (RBAC Testing)

To demonstrate the access control logic, the seeding command provisions the following test accounts:

| Role | Login Email | Password | Permissions |
|--------|----------------|----------------|----------------|
| **Admin** | `admin@test.com` | `Admin@123` | Full access. Can create, edit, soft-delete records, and manage user roles/statuses. |
| **Analyst** | `analyst@test.com` | `Analyst@123` | Standard access. Can read all records/dashboard stats and create new records. |
| **Viewer** | `viewer@test.com` | `Viewer@123` | Read-only. Can only view records and dashboard aggregates. |

## API Documentation

For the full detailed overview of available endpoints, request structures, and response payloads:

 **[Read the API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

**Interactive Swagger UI:**
- **Live Demo Link:** [https://finance-manager-vrhv.onrender.com/api/docs/](https://finance-manager-vrhv.onrender.com/api/docs/)
- **Local:** Once your server is running, navigate to `http://localhost:3000/api/docs` in your browser to interact directly with the API endpoints!

## 🏗️ Architectural Highlights
- **Separation of Concerns:** Deep modularity passing data from standard `Routes` ➔ `Controllers` (Handling HTTP logic) ➔ `Services` (Core Business/DB Logic).
- **Centralized Error Handling:** Global error catching wrapper utilizing custom `ApiError` instances ensures uniform JSON responses even during unexpected Prisma faults.
- **Audit Logging:** An `AuditLog` table silently tracks core actor mutations across records for complete accountability.
