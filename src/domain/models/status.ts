export const STATUSES = ['APPROVED', 'PENDING', 'REJECTED'] as const;
export type Status = (typeof STATUSES)[number];

/**
 * Resolves the final status of an expense from the partial results
 * produced by every rule that applied to it.
 *
 * Resolution table (deny-overrides semantics):
 * REJECTED > PENDING > APPROVED, defaulting to PENDING when no criterion matches.
 *
 * @param statuses - Statuses produced by the rules that applied.
 * @returns The resolved final status.
 */
export function resolve(statuses: readonly Status[]): Status {
  if (statuses.includes('REJECTED')) return 'REJECTED';
  if (statuses.includes('PENDING')) return 'PENDING';
  if (statuses.includes('APPROVED')) return 'APPROVED';

  return 'PENDING';
}
