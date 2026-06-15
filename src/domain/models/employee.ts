/** The employee who reported an expense. */
export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  /** Lowercase cost-center label (e.g. "core_engineering"). */
  costCenter: string;
};
