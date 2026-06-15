import type { Expense } from '../models/expense.js';
import type { Employee } from '../models/employee.js';
import type { Policy } from '../models/policy.js';
import type { ExpenseDate } from '../models/expense-date.js';
import type { RuleViolationReason } from '../models/rule-violation-reason.js';

/** Everything a rule needs to evaluate one expense. Built by the use case. */
export type EvaluationContext = {
  expense: Expense;
  employee: Employee;
  policy: Policy;
  /** Amount already converted to the policy's base currency. */
  amountInBaseCurrency: number;
  /** Injected reference date — rules never call Date.now() themselves. */
  referenceDate: Date;
  /** Expense date already parsed at the boundary — rules never re-parse. */
  expenseDate: ExpenseDate;
};

/**
 * Partial result produced by a single rule. Discriminated on `status`:
 * an APPROVED result never carries a reason; a PENDING or REJECTED result
 * always does. This makes illegal states (an approval with a violation, or
 * a rejection with no reason) unrepresentable.
 */
export type RuleResult =
  | { ruleId: string; status: 'APPROVED' }
  | { ruleId: string; status: 'PENDING' | 'REJECTED'; reason: RuleViolationReason };

/**
 * A policy rule. Returns null when the rule does not apply to the
 * expense (e.g. a category with no configured limit) — only applicable
 * rules contribute to the final resolution.
 */
export interface Rule {
  readonly id: string;
  evaluate(context: EvaluationContext): RuleResult | null;
}
