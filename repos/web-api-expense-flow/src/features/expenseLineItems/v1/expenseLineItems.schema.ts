import { z } from 'zod';

const categoryEnum = z.enum(['meals', 'travel', 'accommodation', 'other']);

export const createExpenseLineItemSchema = z.object({
  reportId: z.number().int().positive(),
  category: categoryEnum,
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  spendDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  merchant: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  receiptId: z.number().int().positive().optional(),
});

export const updateExpenseLineItemSchema = z.object({
  category: categoryEnum.optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  spendDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  merchant: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  receiptId: z.number().int().positive().nullable().optional(),
});
