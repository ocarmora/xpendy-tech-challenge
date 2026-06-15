import { describe, it, expect } from 'vitest';
import { AgeRule } from '../../../src/domain/rules/age-rule.js';
import { anExpense, anEvaluationContext, aPolicy, reasonOf } from '../../helpers/builders.js';

function contextWithExpenseDate(date: string) {
  return anEvaluationContext({ expense: anExpense({ date }) });
}

describe('AgeRule', () => {
  const rule = new AgeRule();

  describe('when the expense age is within the approval window', () => {
    it('approves an expense dated today', () => {
      const context = contextWithExpenseDate('2026-06-10');

      const result = rule.evaluate(context);

      expect(result?.status).toBe('APPROVED');
    });

    it('approves an expense exactly at the pending threshold', () => {
      const context = contextWithExpenseDate('2026-05-11'); // 30 days old

      const result = rule.evaluate(context);

      expect(result?.status).toBe('APPROVED');
    });

    it('does not attach any alert when approving', () => {
      const context = contextWithExpenseDate('2026-06-10');

      const result = rule.evaluate(context);

      expect(reasonOf(result)).toBeUndefined();
    });
  });

  describe('when the expense age exceeds the pending threshold', () => {
    it('marks as pending an expense one day past the threshold', () => {
      const context = contextWithExpenseDate('2026-05-10'); // 31 days old

      const result = rule.evaluate(context);

      expect(result?.status).toBe('PENDING');
    });

    it('marks as pending an expense exactly at the rejection threshold', () => {
      const context = contextWithExpenseDate('2026-04-11'); // 60 days old

      const result = rule.evaluate(context);

      expect(result?.status).toBe('PENDING');
    });

    it('attaches the age-limit alert', () => {
      const context = contextWithExpenseDate('2026-05-10');

      const result = rule.evaluate(context);

      expect(reasonOf(result)).toBe('AGE_LIMIT');
    });
  });

  describe('when the expense age exceeds the rejection threshold', () => {
    it('rejects an expense one day past the threshold', () => {
      const context = contextWithExpenseDate('2026-04-10'); // 61 days old

      const result = rule.evaluate(context);

      expect(result?.status).toBe('REJECTED');
    });

    it('attaches the `AGE_LIMIT` reason', () => {
      const context = contextWithExpenseDate('2026-04-10');

      const result = rule.evaluate(context);

      expect(reasonOf(result)).toBe('AGE_LIMIT');
    });
  });

  describe('when the thresholds come from a custom policy', () => {
    it('reads the limits from the policy instead of hardcoded values', () => {
      const context = anEvaluationContext({
        expense: anExpense({ date: '2026-05-21' }), // 20 days old
        policy: aPolicy({ ageLimits: { pendingDays: 15, rejectedDays: 45 } }),
      });

      const result = rule.evaluate(context);

      expect(result?.status).toBe('PENDING');
    });
  });
});
