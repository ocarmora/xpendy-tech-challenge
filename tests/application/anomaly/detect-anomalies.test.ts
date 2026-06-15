import { describe, it, expect } from 'vitest';
import {
  detectNegativeAmounts,
  detectExactDuplicates,
  detectAnomalies,
} from '../../../src/application/anomaly/detect-anomalies.js';
import { anExpense } from '../../helpers/builders.js';

describe('detectNegativeAmounts', () => {
  it('flags every expense with a negative amount', () => {
    const expenses = [
      anExpense({ id: 'g_1', amount: 50 }),
      anExpense({ id: 'g_2', amount: -25 }),
      anExpense({ id: 'g_3', amount: -1 }),
    ];

    const anomalies = detectNegativeAmounts(expenses);

    expect(anomalies).toEqual([
      { type: 'NEGATIVE_AMOUNT', expenseId: 'g_2', amount: -25, currency: 'USD' },
      { type: 'NEGATIVE_AMOUNT', expenseId: 'g_3', amount: -1, currency: 'USD' },
    ]);
  });

  it('returns nothing when no amount is negative', () => {
    const expenses = [anExpense({ amount: 0 }), anExpense({ amount: 10 })];

    expect(detectNegativeAmounts(expenses)).toEqual([]);
  });
});

describe('detectExactDuplicates', () => {
  it('groups expenses sharing amount, currency and date', () => {
    const expenses = [
      anExpense({ id: 'g_1', amount: 50, currency: 'USD', date: '2026-05-26' }),
      anExpense({ id: 'g_2', amount: 50, currency: 'USD', date: '2026-05-26' }),
      anExpense({ id: 'g_3', amount: 99, currency: 'USD', date: '2026-05-26' }),
    ];

    const anomalies = detectExactDuplicates(expenses);

    expect(anomalies).toEqual([
      {
        type: 'EXACT_DUPLICATE',
        expenseIds: ['g_1', 'g_2'],
        amount: 50,
        currency: 'USD',
        date: '2026-05-26',
      },
    ]);
  });

  it('detects duplicates across different employees (employee is ignored)', () => {
    const expenses = [
      anExpense({ id: 'g_1', amount: 50, currency: 'USD', date: '2026-05-26' }),
      anExpense({ id: 'g_2', amount: 50, currency: 'USD', date: '2026-05-26' }),
    ];

    expect(detectExactDuplicates(expenses)).toHaveLength(1);
  });

  it('lists every member of a group larger than two', () => {
    const expenses = [
      anExpense({ id: 'g_1', amount: 90, currency: 'USD', date: '2026-05-31' }),
      anExpense({ id: 'g_2', amount: 90, currency: 'USD', date: '2026-05-31' }),
      anExpense({ id: 'g_3', amount: 90, currency: 'USD', date: '2026-05-31' }),
    ];

    const [anomaly] = detectExactDuplicates(expenses);

    expect(anomaly?.type).toBe('EXACT_DUPLICATE');
    expect(anomaly).toMatchObject({ expenseIds: ['g_1', 'g_2', 'g_3'] });
  });

  it('does not flag expenses that differ in currency or date', () => {
    const expenses = [
      anExpense({ id: 'g_1', amount: 50, currency: 'USD', date: '2026-05-26' }),
      anExpense({ id: 'g_2', amount: 50, currency: 'CLP', date: '2026-05-26' }),
      anExpense({ id: 'g_3', amount: 50, currency: 'USD', date: '2026-05-27' }),
    ];

    expect(detectExactDuplicates(expenses)).toEqual([]);
  });
});

describe('detectAnomalies', () => {
  it('combines negative-amount and duplicate detectors', () => {
    const expenses = [
      anExpense({ id: 'g_1', amount: -10 }),
      anExpense({ id: 'g_2', amount: 50, currency: 'USD', date: '2026-05-26' }),
      anExpense({ id: 'g_3', amount: 50, currency: 'USD', date: '2026-05-26' }),
    ];

    const anomalies = detectAnomalies(expenses);

    expect(anomalies.map((a) => a.type)).toEqual(['NEGATIVE_AMOUNT', 'EXACT_DUPLICATE']);
  });
});
