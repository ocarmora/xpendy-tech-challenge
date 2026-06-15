import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadPolicyFile } from '../../src/infrastructure/adapters/driven/config/load-policy-file.js';
import { parseExpense } from '../../src/infrastructure/adapters/driving/parse-expense.js';
import { parseEmployee } from '../../src/infrastructure/adapters/driving/parse-employee.js';
import { presentResult } from '../../src/infrastructure/adapters/driving/result-presenter.js';
import { buildExpenseValidator } from '../../src/compose.js';
import { InMemoryRateProvider } from '../../src/infrastructure/adapters/driven/rate-provider/in-memory-rate-provider.js';
import { FixedClock } from '../helpers/fixed-clock.js';

/**
 * End-to-end: exercises the whole flow with the real adapters wired by the
 * composition root — load policy from disk → parse input → validate → present.
 * Only the clock and rate provider are pinned so the verdict is deterministic.
 */
describe('analyze expense (end-to-end)', () => {
  const policyPath = path.join(process.cwd(), 'config', 'policy.json');
  const clock = new FixedClock(new Date('2026-06-10T00:00:00Z'));

  async function analyze(rawExpense: unknown, rawEmployee: unknown) {
    const policy = await loadPolicyFile(policyPath);
    const validator = buildExpenseValidator(policy, new InMemoryRateProvider(), clock);

    const expense = parseExpense(rawExpense);
    const employee = parseEmployee(rawEmployee);

    const result = await validator.validate(expense, employee);
    return presentResult(result, expense, employee, policy);
  }

  it('approves a recent, in-limit expense for an unrestricted cost center', async () => {
    const presented = await analyze(
      { id: 'g_001', amount: 80, currency: 'USD', date: '2026-06-05', category: 'food' },
      { id: 'e_001', firstName: 'Ada', lastName: 'Lovelace', costCenter: 'sales_team' },
    );

    expect(presented).toEqual({ gasto_id: 'g_001', status: 'APROBADO', alertas: [] });
  });

  it('rejects and reports every violated rule', async () => {
    // 70 days old, food over every limit, forbidden for core_engineering.
    const presented = await analyze(
      { id: 'g_002', amount: 500, currency: 'USD', date: '2026-04-01', category: 'food' },
      { id: 'e_002', firstName: 'Alan', lastName: 'Turing', costCenter: 'core_engineering' },
    );

    expect(presented.gasto_id).toBe('g_002');
    expect(presented.status).toBe('RECHAZADO');
    expect(presented.alertas.map((a) => a.codigo)).toEqual([
      'LIMITE_ANTIGUEDAD',
      'LIMITE_CATEGORIA',
      'POLITICA_CENTRO_COSTO',
    ]);
  });
});
