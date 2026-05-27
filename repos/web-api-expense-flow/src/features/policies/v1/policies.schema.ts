import { z } from 'zod';

const policyBody = z.object({
  category: z.enum(['meals', 'travel', 'accommodation', 'other']),
  maxAmountPerItem: z.number().positive().optional(),
  maxAmountPerDay: z.number().positive().optional(),
  requiresReceipt: z.boolean(),
  requiresNotes: z.boolean(),
});

export const createPolicySchema = policyBody;
export const updatePolicySchema = policyBody;
