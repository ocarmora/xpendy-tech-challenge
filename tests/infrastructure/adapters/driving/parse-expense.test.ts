import { describe, it, expect } from 'vitest';
import { parseExpense } from '../../../../src/infrastructure/adapters/driving/parse-expense.js';

const validExpense = {
  id: 'g_001',
  amount: 50,
  currency: 'USD',
  date: '2026-06-01',
  category: 'food',
};

describe('parseExpense', () => {
  it('accepts a well-formed expense', () => {
    expect(() => parseExpense(validExpense)).not.toThrow();
  });

  it('normalizes currency to uppercase and category to lowercase', () => {
    const expense = parseExpense({ ...validExpense, currency: ' usd ', category: ' Food ' });

    expect(expense.currency).toBe('USD');
    expect(expense.category).toBe('food');
  });

  it('accepts a negative amount', () => {
    // Design decision: negative amounts are well-formed values with suspicious
    // meaning. They must pass so the batch analyzer (Part 3) can detect them as
    // an anomaly — rejecting them here would make them invisible to the detector.
    expect(() => parseExpense({ ...validExpense, amount: -25 })).not.toThrow();
  });

  it('rejects a NaN amount', () => {
    // NaN <= limit is always false: a NaN amount would silently satisfy every
    // category limit downstream.
    expect(() => parseExpense({ ...validExpense, amount: NaN })).toThrow();
  });

  it('rejects a currency code that is not 3 letters long', () => {
    expect(() => parseExpense({ ...validExpense, currency: 'US' })).toThrow();
  });

  it('rejects a date that is not in ISO format', () => {
    expect(() => parseExpense({ ...validExpense, date: '01/06/2026' })).toThrow();
  });

  it('rejects a well-formed but impossible calendar date', () => {
    // 2026-02-30 matches the ISO regex but is not a real date. Rejecting it here
    // keeps ExpenseDate.fromIso from throwing later inside a rule.
    expect(() => parseExpense({ ...validExpense, date: '2026-02-30' })).toThrow();
  });
});
