# 📈 Finance Dashboard API (Backend Project)

Hi there! 👋 Welcome to my Finance Dashboard API backend. This project was built as part of an assessment to demonstrate my ability to design backend architecture, structure data correctly, and implement strong role-based access control.

As an intern working on this piece, I had a blast putting all the pieces together! I focused heavily on ensuring the application is clean, maintainable, and built on reliable modern practices.

## 🛠️ Tech Stack & Decisions
I wanted to build something robust but not overly complicated, so I picked the following tools:
- **Node.js & Express:** For handling the server and routing.
- **PostgreSQL & Prisma 7:** Used as the database and ORM. I really enjoyed how Prisma explicitly manages the schema and handles migrations wonderfully!
- **Zod:** To handle all request validation safely before data even hits the core business logic.
- **JWT (JSON Web Tokens):** For authenticating users cleanly alongside rotating refresh tokens.
- **Jest:** For unit and integration tests to make sure everything works properly.

## 🚀 How to Run Locally

If you want to spin this up on your own machine to test my logic, here are the exact steps I followed:

**1. Clone the repo & install dependencies**
```bash
git clone https://github.com/harshgupta1064/finance_manager.git
cd finance_manager
npm install
```

**2. Environment Variables**
Copy the example file to set up your `.env`:
```bash
# On Linux/Mac: cp .env.example .env
# On Windows: copy .env.example .env
```
*Note: Make sure to open the `.env` file and fill in your `DATABASE_URL` (points to your Postgres database) and secure `JWT_SECRET`.*

**3. Database Setup**
I created a couple of helpful scripts to push the Prisma schema and populate the database with some initial users.
```bash
npm run db:push
npm run db:seed
```

**4. Start the Application**
```bash
npm run dev
```
The server will boot up and be accessible at `http://localhost:3000`.

## 🧑‍💻 Test Accounts (Seed Data)
If you ran the seed command above, you can log in immediately using these default accounts to test out exactly how the Role-Based Access Control (RBAC) works:

| Role | Email | Password | Permissions |
|--------|----------------|----------------|----------------|
| **Admin** | `admin@test.com` | `Admin@123` | Full access to records and managing users. |
| **Analyst** | `analyst@test.com` | `Analyst@123` | Can create & read records, but no user management. |
| **Viewer** | `viewer@test.com` | `Viewer@123` | Read-only access to records and dashboard. |

## 📚 API Documentation

I've documented all the endpoints, request models, and expected responses in a separate file to keep this README uncluttered and easy to read. 

👉 **[Please check the `API_DOCUMENTATION.md` file here](./API_DOCUMENTATION.md) for full details on how to interact with the API!**

Alternatively, once you have the app running locally, you can explore the fully interactive **Swagger UI** generated straight from my route definitions by visiting:
`http://localhost:3000/api/docs`

## 💡 Things I Focused On & Learned
- **Separation of Concerns:** I kept my routes, controllers, middleware, and database services completely separated. This made understanding the flow of data much easier!
- **Soft Deletes:** Instead of permanently dropping transaction records from the database, I rely on an `isDeleted` flag so we never accidentally lose historical data.
- **Rate Limiting:** Added a basic rate limiter using `express-rate-limit` so the login/register endpoints wouldn't get overwhelmed by brute-force attacks.

*Thank you so much for taking the time to review my code. I am really eager to learn and grow, so any feedback on my structural choices, design decisions, or code quality would be highly appreciated!* 🙌
