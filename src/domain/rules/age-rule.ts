import type { EvaluationContext, Rule, RuleResult } from './rule.js';

/**
 * Classifies the expense by how many calendar days old it is, using the
 * thresholds configured in the policy:
 * - 0 ≤ days ≤ pendingDays            → APPROVED
 * - pendingDays < days ≤ rejectedDays → PENDING
 * - days > rejectedDays               → REJECTED
 *
 * Future-dated expenses fall outside every range above; by design
 * decision they are sent to human review with a dedicated alert.
 */
export class AgeRule implements Rule {
  public readonly id = '1';

  public evaluate(context: EvaluationContext): RuleResult | null {
    const { pendingDays, rejectedDays } = context.policy.ageLimits;
    const days = context.expenseDate.daysOld(context.referenceDate);

    if (days > rejectedDays) {
      return {
        ruleId: this.id,
        status: 'REJECTED',
        reason: 'AGE_LIMIT',
      };
    }

    if (days > pendingDays) {
      return {
        ruleId: this.id,
        status: 'PENDING',
        reason: 'AGE_LIMIT',
      };
    }

    return { ruleId: this.id, status: 'APPROVED' };
  }
}
