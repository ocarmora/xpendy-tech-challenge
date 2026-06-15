import { describe, it, expect } from 'vitest';
import { parsePolicy } from '../../../../../src/infrastructure/adapters/driven/config/parse-policy.js';

const validPolicy = {
  baseCurrency: 'USD',
  ageLimits: { pendingDays: 30, rejectedDays: 60 },
  categoryLimits: {
    food: { approvedUpTo: 100, pendingUpTo: 150 },
  },
  costCenterRules: [{ costCenter: 'core_engineering', forbiddenCategory: 'food' }],
};

describe('parsePolicy', () => {
  it('accepts a coherent policy', () => {
    expect(() => parsePolicy(validPolicy)).not.toThrow();
  });

  it('rejects age limits where pending is not lower than rejected', () => {
    // Incoherent thresholds (pending >= rejected) create impossible ranges;
    // configuration must fail fast at load time.
    expect(() =>
      parsePolicy({ ...validPolicy, ageLimits: { pendingDays: 60, rejectedDays: 30 } }),
    ).toThrow();
  });

  it('rejects a category limit where approved exceeds pending', () => {
    expect(() =>
      parsePolicy({
        ...validPolicy,
        categoryLimits: { food: { approvedUpTo: 200, pendingUpTo: 150 } },
      }),
    ).toThrow();
  });

  it('accepts a category limit where approved equals pending', () => {
    // An empty PENDING range is legitimate — it mirrors the challenge's own
    // example (transport: 200/200): approved or rejected, no review band.
    expect(() =>
      parsePolicy({
        ...validPolicy,
        categoryLimits: { transport: { approvedUpTo: 200, pendingUpTo: 200 } },
      }),
    ).not.toThrow();
  });
});
