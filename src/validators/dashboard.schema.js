import { z } from 'zod';

export const dashboardTrendsQuerySchema = z.object({
  query: z.object({
    period: z.enum(['month', 'week']).default('month'),
  }),
});
