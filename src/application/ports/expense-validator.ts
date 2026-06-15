import type { Expense } from '../../domain/models/expense.js';
import type { Employee } from '../../domain/models/employee.js';
import type { Status } from '../../domain/models/status.js';
import type { RuleViolationReason } from '../../domain/models/rule-violation-reason.js';

export type ValidationResult = {
  expenseId: string;
  status: Status;
  reasons: RuleViolationReason[];
};

export interface ExpenseValidator {
  validate(expense: Expense, employee: Employee): Promise<ValidationResult>;
}
