import type { EvaluationContext, Rule, RuleResult } from './rule.js';

/**
 * Rejects the expense when its category is explicitly forbidden for the
 * employee's cost center in the policy's restriction list.
 */
export class CostCenterRule implements Rule {
  public readonly id = '3';

  public evaluate(context: EvaluationContext): RuleResult | null {
    const { employee, expense, policy } = context;

    const restriction = policy.costCenterRules.find(
      (rule) =>
        rule.costCenter === employee.costCenter && rule.forbiddenCategory === expense.category,
    );

    if (!restriction) {
      return null;
    }

    return {
      ruleId: this.id,
      status: 'REJECTED',
      reason: 'FORBIDDEN_CATEGORY_FOR_COST_CENTER',
    };
  }
}
