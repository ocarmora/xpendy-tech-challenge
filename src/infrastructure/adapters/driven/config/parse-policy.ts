import { z } from 'zod';
import type { Policy } from '../../../../domain/models/policy.js';

const CategoryLimitSchema = z
  .object({
    approvedUpTo: z.number().positive(),
    pendingUpTo: z.number().positive(),
  })
  .refine((l) => l.approvedUpTo <= l.pendingUpTo, {
    message: 'approvedUpTo cannot exceed pendingUpTo',
  });

const PolicySchema = z.object({
  baseCurrency: z.string().trim().toUpperCase().length(3),
  ageLimits: z
    .object({
      pendingDays: z.number().int().nonnegative(),
      rejectedDays: z.number().int().nonnegative(),
    })
    .refine((a) => a.pendingDays < a.rejectedDays, {
      message: 'pendingDays must be lower than rejectedDays',
    }),
  categoryLimits: z.record(z.string(), CategoryLimitSchema),
  costCenterRules: z.array(
    z.object({
      costCenter: z.string().trim().toLowerCase(),
      forbiddenCategory: z.string().trim().toLowerCase(),
    }),
  ),
});

/** Parses untrusted input into a coherent, normalized Policy. */
export function parsePolicy(raw: unknown): Policy {
  return PolicySchema.parse(raw);
}
