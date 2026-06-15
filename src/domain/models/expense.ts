/** An expense reported by an employee, normalized and ready to evaluate. */
export type Expense = {
  id: string;
  amount: number;
  /** ISO 4217 code, uppercase (e.g. "USD"). */
  currency: string;
  /** ISO date string, YYYY-MM-DD. */
  date: string;
  /** Lowercase category label (e.g. "food"). */
  category: string;
};
