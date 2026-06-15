import { describe, it, expect } from 'vitest';
import { analyzeBatch, type ExpenseEntry } from '../../src/application/analyze-batch.use-case.js';
import type {
  ExpenseValidator,
  ValidationResult,
} from '../../src/application/ports/expense-validator.js';
import { anExpense, anEmployee } from '../helpers/builders.js';

/** Stub validator: resolves each expense to a status looked up by id. */
function validatorReturning(
  statuses: Record<string, ValidationResult['status']>,
): ExpenseValidator {
  return {
    validate: (expense) =>
      Promise.resolve({
        expenseId: expense.id,
        status: statuses[expense.id] ?? 'PENDING',
        reasons: [],
      }),
  };
}

function entry(id: string, overrides = {}): ExpenseEntry {
  return { expense: anExpense({ id, ...overrides }), employee: anEmployee() };
}

describe('analyzeBatch', () => {
  it('tallies the final status of every expense', async () => {
    const entries = [entry('g_1'), entry('g_2'), entry('g_3')];
    const validator = validatorReturning({ g_1: 'APPROVED', g_2: 'APPROVED', g_3: 'REJECTED' });

    const report = await analyzeBatch(entries, validator);

    expect(report.breakdown).toEqual({ APPROVED: 2, PENDING: 0, REJECTED: 1 });
    expect(report.results).toHaveLength(3);
  });

  it('starts every status bucket at zero', async () => {
    const report = await analyzeBatch([], validatorReturning({}));

    expect(report.breakdown).toEqual({ APPROVED: 0, PENDING: 0, REJECTED: 0 });
  });

  it('reports anomalies detected across the batch', async () => {
    const entries = [
      entry('g_1', { amount: -10 }),
      entry('g_2', { amount: 50, currency: 'USD', date: '2026-05-26' }),
      entry('g_3', { amount: 50, currency: 'USD', date: '2026-05-26' }),
    ];

    const report = await analyzeBatch(entries, validatorReturning({}));

    expect(report.anomalies.map((a) => a.type)).toEqual(['NEGATIVE_AMOUNT', 'EXACT_DUPLICATE']);
  });
});
