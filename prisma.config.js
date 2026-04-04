import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrate: {
    adapter: () => new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  },
});
