import type { Expense } from '../domain/models/expense.js';
import type { Employee } from '../domain/models/employee.js';
import type { Status } from '../domain/models/status.js';
import { STATUSES } from '../domain/models/status.js';
import type { ExpenseValidator, ValidationResult } from './ports/expense-validator.js';
import { detectAnomalies, type Anomaly } from './anomaly/detect-anomalies.js';

/** A successfully parsed CSV row: an expense paired with its employee. */
export type ExpenseEntry = { expense: Expense; employee: Employee };

export type BatchReport = {
  /** Count of expenses resolved to each final status. */
  breakdown: Record<Status, number>;
  anomalies: Anomaly[];
  results: ValidationResult[];
};

function emptyBreakdown(): Record<Status, number> {
  return Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<Status, number>;
}

/**
 * Analyzes a batch of expenses: validates each one against the policy (via the
 * injected validator) to build the status breakdown, and runs the anomaly
 * detectors over the whole batch. Pure orchestration over domain types and the
 * ExpenseValidator port — no I/O, no knowledge of CSV or HTTP.
 */
export async function analyzeBatch(
  entries: readonly ExpenseEntry[],
  validator: ExpenseValidator,
): Promise<BatchReport> {
  const breakdown = emptyBreakdown();
  const results: ValidationResult[] = [];

  for (const { expense, employee } of entries) {
    const result = await validator.validate(expense, employee);
    breakdown[result.status] += 1;
    results.push(result);
  }

  return {
    breakdown,
    anomalies: detectAnomalies(entries.map((entry) => entry.expense)),
    results,
  };
}
