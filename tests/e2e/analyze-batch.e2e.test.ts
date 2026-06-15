import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadPolicyFile } from '../../src/infrastructure/adapters/driven/config/load-policy-file.js';
import { loadExpensesCsv } from '../../src/infrastructure/adapters/driven/csv/load-expenses-csv.js';
import { parseExpense } from '../../src/infrastructure/adapters/driving/parse-expense.js';
import { parseEmployee } from '../../src/infrastructure/adapters/driving/parse-employee.js';
import { buildExpenseValidator } from '../../src/compose.js';
import { analyzeBatch, type ExpenseEntry } from '../../src/application/analyze-batch.use-case.js';
import { InMemoryRateProvider } from '../../src/infrastructure/adapters/driven/rate-provider/in-memory-rate-provider.js';
import { FixedClock } from '../helpers/fixed-clock.js';

/**
 * End-to-end over the real historical CSV with deterministic adapters
 * (fixed clock, mocked 1:1 rates) so the verdict and counts are stable.
 */
describe('analyze batch (end-to-end over the historical CSV)', () => {
  const policyPath = path.join(process.cwd(), 'config', 'policy.json');
  const csvPath = path.join(process.cwd(), 'data', 'gastos_historicos.csv');
  const clock = new FixedClock(new Date('2026-06-14T00:00:00Z'));

  it('parses every row, tallies statuses and detects the duplicate groups', async () => {
    const policy = await loadPolicyFile(policyPath);
    const rows = await loadExpensesCsv(csvPath);

    const entries: ExpenseEntry[] = rows.map((row) => ({
      expense: parseExpense(row.expense),
      employee: parseEmployee(row.employee),
    }));

    const validator = buildExpenseValidator(policy, new InMemoryRateProvider(1), clock);
    const report = await analyzeBatch(entries, validator);

    const totalClassified =
      report.breakdown.APPROVED + report.breakdown.PENDING + report.breakdown.REJECTED;
    expect(totalClassified).toBe(entries.length);

    const duplicateGroups = report.anomalies.filter((a) => a.type === 'EXACT_DUPLICATE');
    const negatives = report.anomalies.filter((a) => a.type === 'NEGATIVE_AMOUNT');
    expect(duplicateGroups).toHaveLength(7);
    expect(negatives).toHaveLength(0);
  });
});
