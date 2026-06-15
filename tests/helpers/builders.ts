import type { Expense } from '../../src/domain/models/expense.js';
import type { Employee } from '../../src/domain/models/employee.js';
import type { Policy } from '../../src/domain/models/policy.js';
import { ExpenseDate } from '../../src/domain/models/expense-date.js';
import type { RuleViolationReason } from '../../src/domain/models/rule-violation-reason.js';
import type { EvaluationContext, RuleResult } from '../../src/domain/rules/rule.js';

/**
 * Reads the reason off a rule result, narrowing the discriminated union.
 * Returns undefined for an APPROVED result (which carries no reason) or null.
 */
export function reasonOf(result: RuleResult | null): RuleViolationReason | undefined {
  return result && 'reason' in result ? result.reason : undefined;
}

export function anExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'g_001',
    amount: 50,
    currency: 'USD',
    date: '2026-06-01',
    category: 'food',
    ...overrides,
  };
}

export function anEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'e_001',
    firstName: 'Ada',
    lastName: 'Lovelace',
    costCenter: 'sales_team',
    ...overrides,
  };
}

export function aPolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    baseCurrency: 'USD',
    ageLimits: { pendingDays: 30, rejectedDays: 60 },
    categoryLimits: {
      food: { approvedUpTo: 100, pendingUpTo: 150 },
      transport: { approvedUpTo: 200, pendingUpTo: 200 },
    },
    costCenterRules: [{ costCenter: 'core_engineering', forbiddenCategory: 'food' }],
    ...overrides,
  };
}

const DEFAULT_REFERENCE_DATE = new Date('2026-06-10T00:00:00Z');

/**
 * Builds an EvaluationContext for unit-testing rules in isolation. Derives
 * expenseDate from the expense's date by default, mirroring what the use case
 * does at runtime, so each rule test does not have to wire it by hand.
 */
export function anEvaluationContext(overrides: Partial<EvaluationContext> = {}): EvaluationContext {
  const expense = overrides.expense ?? anExpense();

  return {
    expense,
    employee: anEmployee(),
    policy: aPolicy(),
    amountInBaseCurrency: 50,
    referenceDate: DEFAULT_REFERENCE_DATE,
    expenseDate: ExpenseDate.fromIso(expense.date),
    ...overrides,
  };
}
