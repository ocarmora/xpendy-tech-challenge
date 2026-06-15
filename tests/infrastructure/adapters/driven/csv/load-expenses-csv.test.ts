import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadExpensesCsv } from '../../../../../src/infrastructure/adapters/driven/csv/load-expenses-csv.js';

const samplePath = path.join(process.cwd(), 'tests', 'fixtures', 'expenses-sample.csv');

describe('loadExpensesCsv', () => {
  it('maps each row to raw expense and employee inputs', async () => {
    const rows = await loadExpensesCsv(samplePath);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      expense: { id: 'g_001', amount: 50, currency: 'USD', date: '2026-05-26', category: 'food' },
      employee: {
        id: 'e_002',
        firstName: 'Bruno',
        lastName: 'Soto',
        costCenter: 'sales_team',
      },
    });
  });

  it('converts the amount column to a number', async () => {
    const rows = await loadExpensesCsv(samplePath);
    const second = rows[1]?.expense as { amount: number; currency: string };

    expect(second.amount).toBe(81000);
    expect(second.currency).toBe('CLP');
  });
});
