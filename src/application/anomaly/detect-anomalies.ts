import type { Expense } from '../../domain/models/expense.js';

/**
 * A suspicious pattern found in a batch of expenses, beyond what the policy
 * rules check. Discriminated on `type` so each variant carries only the data
 * that makes sense for it.
 */
export type Anomaly =
  | { type: 'NEGATIVE_AMOUNT'; expenseId: string; amount: number; currency: string }
  | {
      type: 'EXACT_DUPLICATE';
      expenseIds: string[];
      amount: number;
      currency: string;
      date: string;
    };

/** Flags expenses with a negative amount (data-entry / migration errors). */
export function detectNegativeAmounts(expenses: readonly Expense[]): Anomaly[] {
  return expenses
    .filter((expense) => expense.amount < 0)
    .map((expense) => ({
      type: 'NEGATIVE_AMOUNT',
      expenseId: expense.id,
      amount: expense.amount,
      currency: expense.currency,
    }));
}

/**
 * Flags groups of expenses that share the same amount, currency and date —
 * exact duplicates per the challenge's definition (employee is intentionally
 * ignored). Each duplicate group yields one anomaly listing every member.
 */
export function detectExactDuplicates(expenses: readonly Expense[]): Anomaly[] {
  const groups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const key = `${expense.amount}|${expense.currency}|${expense.date}`;
    const group = groups.get(key);
    if (group) {
      group.push(expense);
    } else {
      groups.set(key, [expense]);
    }
  }

  const anomalies: Anomaly[] = [];
  for (const group of groups.values()) {
    const first = group[0];
    if (group.length < 2 || !first) {
      continue;
    }
    anomalies.push({
      type: 'EXACT_DUPLICATE',
      expenseIds: group.map((expense) => expense.id),
      amount: first.amount,
      currency: first.currency,
      date: first.date,
    });
  }

  return anomalies;
}

/** Runs every anomaly detector over the batch. */
export function detectAnomalies(expenses: readonly Expense[]): Anomaly[] {
  return [...detectNegativeAmounts(expenses), ...detectExactDuplicates(expenses)];
}
