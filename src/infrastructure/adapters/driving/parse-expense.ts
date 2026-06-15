import { z } from 'zod';
import { ExpenseDate } from '../../../domain/models/expense-date.js';
import type { Expense } from '../../../domain/models/expense.js';

const ExpenseSchema = z.object({
  id: z.string().min(1),
  amount: z.number(),
  currency: z.string().trim().toUpperCase().length(3),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected ISO date (YYYY-MM-DD)')
    .refine(ExpenseDate.isValid, 'Not a real calendar date (e.g. 2026-02-30)'),
  category: z.string().trim().toLowerCase().min(1),
});

/** Parses untrusted input into a normalized, valid Expense. */
export function parseExpense(raw: unknown): Expense {
  return ExpenseSchema.parse(raw);
}
