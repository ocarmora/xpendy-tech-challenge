/** Codes a rule attaches when it flags an expense. */
export const RULE_VIOLATION_REASONS = [
  'AGE_LIMIT',
  'CATEGORY_LIMIT',
  'FORBIDDEN_CATEGORY_FOR_COST_CENTER',
] as const;

export type RuleViolationReason = (typeof RULE_VIOLATION_REASONS)[number];
