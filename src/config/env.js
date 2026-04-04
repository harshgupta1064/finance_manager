import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const schema = z.object({
  DATABASE_URL:   z.string().url(),
  JWT_SECRET:     z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().default(7),
  PORT:           z.coerce.number().default(3000),
  NODE_ENV:       z.enum(['development', 'production', 'test']).default('development'),
});

export const env = schema.parse(process.env);
