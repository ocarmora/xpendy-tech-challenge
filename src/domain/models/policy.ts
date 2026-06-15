/** Age thresholds (in calendar days) that classify an expense. */
export type AgeLimits = { pendingDays: number; rejectedDays: number };

/** Per-category amount thresholds, in the policy's base currency. */
export type CategoryLimit = { approvedUpTo: number; pendingUpTo: number };

/** A category forbidden for a given cost center. */
export type CostCenterRestriction = { costCenter: string; forbiddenCategory: string };

/** The set of rules a company defines to control spending. */
export type Policy = {
  baseCurrency: string;
  ageLimits: AgeLimits;
  categoryLimits: Record<string, CategoryLimit>;
  costCenterRules: CostCenterRestriction[];
};
