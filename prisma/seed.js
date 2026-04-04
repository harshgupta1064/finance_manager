import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const categories = ['Salary', 'Food', 'Rent', 'Transport', 'Utilities', 'Healthcare', 'Entertainment', 'Freelance'];

function randomDate(monthsAgo) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(Math.floor(Math.random() * 28) + 1);
  return d;
}

async function main() {
  console.log('Seeding database...');

  await prisma.auditLog.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const [admin, analyst, viewer] = await Promise.all([
    prisma.user.create({ data: {
      name: 'Admin User', email: 'admin@test.com', role: 'ADMIN',
      passwordHash: await bcrypt.hash('Admin@123', 12),
    }}),
    prisma.user.create({ data: {
      name: 'Analyst User', email: 'analyst@test.com', role: 'ANALYST',
      passwordHash: await bcrypt.hash('Analyst@123', 12),
    }}),
    prisma.user.create({ data: {
      name: 'Viewer User', email: 'viewer@test.com', role: 'VIEWER',
      passwordHash: await bcrypt.hash('Viewer@123', 12),
    }}),
  ]);

  const records = [
    { name: 'Monthly Salary', amount: 85000, type: 'INCOME', category: 'Salary',        date: randomDate(0), notes: 'Base pay' },
    { name: 'Website Design', amount: 12000, type: 'INCOME', category: 'Freelance',     date: randomDate(0), notes: 'Client project' },
    { name: 'Apartment Rent', amount: 18000, type: 'EXPENSE', category: 'Rent',         date: randomDate(0), notes: 'Monthly rent' },
    { name: 'Noodles and Pasta', amount: 4500, type: 'EXPENSE', category: 'Food',       date: randomDate(0), notes: 'Groceries' },
    { name: 'Train to Mumbai', amount: 2000, type: 'EXPENSE', category: 'Travel',       date: randomDate(0), notes: 'Train ticket' },
    { name: 'Monthly Salary', amount: 85000, type: 'INCOME', category: 'Salary',        date: randomDate(1) },
    { name: 'Logo Design', amount: 9000, type: 'INCOME', category: 'Freelance',         date: randomDate(1), notes: 'Design work' },
    { name: 'Apartment Rent', amount: 18000, type: 'EXPENSE', category: 'Rent',         date: randomDate(1) },
    { name: 'Snacks', amount: 5200, type: 'EXPENSE', category: 'Food',                  date: randomDate(1) },
    { name: 'Doctor Visit', amount: 3500, type: 'EXPENSE', category: 'Healthcare',      date: randomDate(1), notes: 'Medical checkup' },
    { name: 'Monthly Salary', amount: 85000, type: 'INCOME', category: 'Salary',        date: randomDate(2) },
    { name: 'Apartment Rent', amount: 18000, type: 'EXPENSE', category: 'Rent',         date: randomDate(2) },
    { name: 'Cricket Match Tickets', amount: 6800, type: 'EXPENSE', category: 'Entertainment', date: randomDate(2), notes: 'Weekend match' },
    { name: 'Electricity Bill', amount: 1800, type: 'EXPENSE', category: 'Utility',     date: randomDate(2), notes: 'Electricity + internet' },
    { name: 'Monthly Salary', amount: 85000, type: 'INCOME', category: 'Salary',        date: randomDate(3) },
    { name: 'App Development', amount: 15000, type: 'INCOME', category: 'Freelance',    date: randomDate(3), notes: 'App development' },
    { name: 'Apartment Rent', amount: 18000, type: 'EXPENSE', category: 'Rent',         date: randomDate(3) },
    { name: 'Rice and Dal', amount: 4200, type: 'EXPENSE', category: 'Food',            date: randomDate(3) },
    { name: 'Bus Pass', amount: 2200, type: 'EXPENSE', category: 'Travel',              date: randomDate(4) },
    { name: 'Monthly Salary', amount: 85000, type: 'INCOME', category: 'Salary',        date: randomDate(4) },
  ];

  for (const r of records) {
    await prisma.financialRecord.create({
      data: { ...r, userId: admin.id },
    });
  }

  console.log('Seeded:');
  console.log('  admin@test.com    / Admin@123    → ADMIN');
  console.log('  analyst@test.com  / Analyst@123  → ANALYST');
  console.log('  viewer@test.com   / Viewer@123   → VIEWER');
  console.log('  20 financial records created');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
