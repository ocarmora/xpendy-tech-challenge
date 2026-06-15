import type { Expense } from '../domain/models/expense.js';
import type { Employee } from '../domain/models/employee.js';
import type { Policy } from '../domain/models/policy.js';
import { ExpenseDate } from '../domain/models/expense-date.js';
import { resolve } from '../domain/models/status.js';
import type { EvaluationContext, Rule, RuleResult } from '../domain/rules/rule.js';
import type { RateProvider } from '../domain/ports/rate-provider.js';
import type { Clock } from '../domain/ports/clock.js';
import type { ExpenseValidator, ValidationResult } from './ports/expense-validator.js';

/**
 * Application service: orchestrates the policy rules and the driven ports
 * (currency rates, clock) to validate one expense.
 */
export class ValidateExpenseUseCase implements ExpenseValidator {
  public constructor(
    private readonly policy: Policy,
    private readonly rules: Rule[],
    private readonly rateProvider: RateProvider,
    private readonly clock: Clock,
  ) {}

  private async convertToBaseCurrency(expense: Expense): Promise<number> {
    if (expense.currency === this.policy.baseCurrency) {
      return expense.amount;
    }

    const rate = await this.rateProvider.getRate(expense.currency, expense.date);

    return Math.round(expense.amount * rate * 100) / 100;
  }

  public async validate(expense: Expense, employee: Employee): Promise<ValidationResult> {
    const context: EvaluationContext = {
      expense,
      employee,
      policy: this.policy,
      amountInBaseCurrency: await this.convertToBaseCurrency(expense),
      referenceDate: this.clock.now(),
      expenseDate: ExpenseDate.fromIso(expense.date),
    };

    const results = this.rules
      .map((rule) => rule.evaluate(context))
      .filter((result): result is RuleResult => result !== null);

    return {
      expenseId: expense.id,
      status: resolve(results.map((result) => result.status)),
      reasons: results.flatMap((result) => ('reason' in result ? [result.reason] : [])),
    };
  }
}
