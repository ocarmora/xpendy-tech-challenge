import { describe, it, expect } from 'vitest';
import { CategoryLimitRule } from '../../../src/domain/rules/category-limit-rule.js';
import { anExpense, anEvaluationContext, reasonOf } from '../../helpers/builders.js';

function contextWith(category: string, amountInBaseCurrency: number) {
  return anEvaluationContext({ expense: anExpense({ category }), amountInBaseCurrency });
}

describe('CategoryLimitRule', () => {
  const rule = new CategoryLimitRule();

  describe('when the amount is within the approved limit', () => {
    it('approves an amount below the approved threshold', () => {
      const context = contextWith('food', 99.99);

      const result = rule.evaluate(context);

      expect(result?.status).toBe('APPROVED');
    });

    it('approves an amount exactly at the approved threshold', () => {
      const context = contextWith('food', 100);

      const result = rule.evaluate(context);

      expect(result?.status).toBe('APPROVED');
    });

    it('does not attach any reason when approving', () => {
      const context = contextWith('food', 100);

      const result = rule.evaluate(context);

      expect(reasonOf(result)).toBeUndefined();
    });
  });

  describe('when the amount exceeds the approved limit but not the pending limit', () => {
    it('marks as pending an amount just above the approved threshold', () => {
      const context = contextWith('food', 100.01);

      const result = rule.evaluate(context);

      expect(result?.status).toBe('PENDING');
    });

    it('marks as pending an amount exactly at the pending threshold', () => {
      const context = contextWith('food', 150);

      const result = rule.evaluate(context);

      expect(result?.status).toBe('PENDING');
    });

    it('attaches the `CATEGORY_LIMIT` alert', () => {
      const context = contextWith('food', 120);

      const result = rule.evaluate(context);

      expect(reasonOf(result)).toBe('CATEGORY_LIMIT');
    });
  });

  describe('when the amount exceeds the pending limit', () => {
    it('rejects an amount just above the pending threshold', () => {
      const context = contextWith('food', 150.01);

      const result = rule.evaluate(context);

      expect(result?.status).toBe('REJECTED');
    });

    it('attaches the `CATEGORY_LIMIT` alert', () => {
      const context = contextWith('food', 120);

      const result = rule.evaluate(context);

      expect(reasonOf(result)).toBe('CATEGORY_LIMIT');
    });
  });

  describe('when the category has an empty pending band', () => {
    // The challenge's own policy example: transport 200/200. There is no
    // amount that lands between approved and pending — it either gets
    // approved or rejected, with no review band in between.
    it('approves an amount at the shared threshold', () => {
      const context = contextWith('transport', 200);

      const result = rule.evaluate(context);

      expect(result?.status).toBe('APPROVED');
    });

    it('rejects an amount just above the shared threshold', () => {
      const context = contextWith('transport', 200.01);

      const result = rule.evaluate(context);

      expect(result?.status).toBe('REJECTED');
    });
  });

  describe('when the category has no configured limit', () => {
    it('does not apply', () => {
      const context = contextWith('software', 5000);

      const result = rule.evaluate(context);

      expect(result).toBeNull();
    });
  });

  describe('when the expense currency differs from the base currency', () => {
    it('compares the converted amount, not the original one', () => {
      // 100,000 CLP converted to 100 USD: the rule must look at the
      // converted amount (approved) — using the raw amount would reject.
      const context = anEvaluationContext({
        expense: anExpense({ category: 'food', amount: 100_000, currency: 'CLP' }),
        amountInBaseCurrency: 100,
      });

      const result = rule.evaluate(context);

      expect(result?.status).toBe('APPROVED');
    });
  });
});
