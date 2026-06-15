import { describe, it, expect } from 'vitest';
import { resolve } from '../../../src/domain/models/status.js';

describe('resolve', () => {
  describe('when at least one rule status is REJECTED', () => {
    it('resolves to REJECTED', () => {
      const ruleStatuses = ['APPROVED', 'PENDING', 'REJECTED'] as const;

      const finalStatus = resolve(ruleStatuses);
      expect(finalStatus).toBe('REJECTED');
    });
  });

  describe('when at least one rule status is PENDING', () => {
    describe('and there are no REJECTED statuses', () => {
      it('resolves to PENDING', () => {
        const ruleStatuses = ['APPROVED', 'PENDING'] as const;

        const finalStatus = resolve(ruleStatuses);
        expect(finalStatus).toBe('PENDING');
      });
    });
  });

  describe('when at least one rule status is APPROVED', () => {
    describe('and there are no REJECTED or PENDING statuses', () => {
      it('resolves to APPROVED', () => {
        const ruleStatuses = ['APPROVED'] as const;

        const finalStatus = resolve(ruleStatuses);
        expect(finalStatus).toBe('APPROVED');
      });
    });
  });

  /**
   * Design decision: when no resolution criterion matches (which in practice
   * means no rule produced a result), the expense falls back to PENDING —
   * the conservative choice: it requires human review.
   */
  describe('when no rule status matches any known criteria', () => {
    it('resolves to PENDING', () => {
      const ruleStatuses = [] as const;

      const finalStatus = resolve(ruleStatuses);
      expect(finalStatus).toBe('PENDING');
    });
  });
});
