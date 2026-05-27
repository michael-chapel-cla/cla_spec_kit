import { z } from 'zod';

export const createApprovalSchema = z
  .object({
    reportId: z.number().int().positive(),
    decision: z.enum(['Approved', 'Rejected']),
    comment: z.string().max(2000).optional(),
  })
  .refine((data) => !(data.decision === 'Rejected' && !data.comment), {
    message: 'A comment is required when rejecting a report',
    path: ['comment'],
  });
