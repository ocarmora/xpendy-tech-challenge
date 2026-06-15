import type { EvaluationContext, Rule, RuleResult } from './rule.js';

/**
 * Classifies the expense amount against the limits configured for its category.
 */
export class CategoryLimitRule implements Rule {
  public readonly id = '2';

  evaluate(context: EvaluationContext): RuleResult | null {
    const { category } = context.expense;
    const categoryPolicy = context.policy.categoryLimits[category];

    if (!categoryPolicy) {
      return null;
    }

    const { amountInBaseCurrency } = context;
    const { approvedUpTo, pendingUpTo } = categoryPolicy;

    if (amountInBaseCurrency <= approvedUpTo) {
      return {
        ruleId: this.id,
        status: 'APPROVED',
      };
    }

    if (amountInBaseCurrency <= pendingUpTo) {
      return {
        ruleId: this.id,
        status: 'PENDING',
        reason: 'CATEGORY_LIMIT',
      };
    }

    return {
      ruleId: this.id,
      status: 'REJECTED',
      reason: 'CATEGORY_LIMIT',
    };
  }
}
