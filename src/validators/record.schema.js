import { z } from 'zod';

export const createRecordSchema = z.object({
  body: z.object({
    name:     z.string().min(1, 'Name is required').max(100),
    amount:   z.number().positive('Amount must be positive'),
    type:     z.enum(['INCOME', 'EXPENSE']),
    category: z.string().min(1).max(100),
    date:     z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
    notes:    z.string().max(500).optional(),
  }),
});

export const updateRecordSchema = z.object({
  body: z.object({
    name:     z.string().min(1).max(100).optional(),
    amount:   z.number().positive().optional(),
    type:     z.enum(['INCOME', 'EXPENSE']).optional(),
    category: z.string().min(1).max(100).optional(),
    date:     z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date').optional(),
    notes:    z.string().max(500).optional(),
  }),
});

export const queryRecordSchema = z.object({
  query: z.object({
    type:      z.enum(['INCOME', 'EXPENSE']).optional(),
    category:  z.string().optional(),
    search:    z.string().min(1).max(200).optional(),
    startDate: z.string().optional(),
    endDate:   z.string().optional(),
    page:      z.coerce.number().min(1).default(1),
    limit:     z.coerce.number().min(1).max(100).default(10),
  }),
});
