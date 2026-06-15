import { describe, it, expect } from 'vitest';
import { ValidateExpenseUseCase } from '../../src/application/validate-expense.use-case.js';
import { AgeRule } from '../../src/domain/rules/age-rule.js';
import { CategoryLimitRule } from '../../src/domain/rules/category-limit-rule.js';
import { CostCenterRule } from '../../src/domain/rules/cost-center-rule.js';
import { anExpense, anEmployee, aPolicy } from '../helpers/builders.js';
import type { RateProvider } from '../../src/domain/ports/rate-provider.js';
import { FixedClock } from '../helpers/fixed-clock.js';

const TODAY = new Date('2026-06-10T00:00:00Z');
const clock = new FixedClock(TODAY);

/** Stub provider: fixed rates to USD. Unknown currencies throw, like a real adapter. */
function ratesOf(rates: Record<string, number>): RateProvider {
  return {
    getRate: (currency) => {
      const rate = rates[currency];
      if (rate === undefined) {
        return Promise.reject(new Error(`No rate for currency: ${currency}`));
      }
      return Promise.resolve(rate);
    },
  };
}

function useCaseWith(rates: Record<string, number> = { USD: 1 }): ValidateExpenseUseCase {
  return new ValidateExpenseUseCase(
    aPolicy(),
    [new AgeRule(), new CategoryLimitRule(), new CostCenterRule()],
    ratesOf(rates),
    clock,
  );
}

describe('ValidateExpenseUseCase', () => {
  describe('when every applicable rule approves', () => {
    it('approves the expense with no reasons', async () => {
      const useCase = useCaseWith();
      const expense = anExpense({ date: '2026-06-05', category: 'food', amount: 50 });

      const result = await useCase.validate(expense, anEmployee());

      expect(result.status).toBe('APPROVED');
      expect(result.reasons).toEqual([]);
    });
  });

  describe('when rules disagree', () => {
    it('rejects when one rule rejects even if another approves', async () => {
      // Recent (age approves), cheap food (category approves),
      // but core_engineering must not expense food (rule 3 rejects).
      const useCase = useCaseWith();
      const expense = anExpense({ date: '2026-06-05', category: 'food', amount: 80 });
      const employee = anEmployee({ costCenter: 'core_engineering' });

      const result = await useCase.validate(expense, employee);

      expect(result.status).toBe('REJECTED');
    });

    it('accumulates the reasons of every rule that flagged the expense', async () => {
      // 70 days old (rejected), food over every limit (rejected),
      // forbidden for the cost center (rejected): three reasons, no short-circuit.
      const useCase = useCaseWith();
      const expense = anExpense({ date: '2026-04-01', category: 'food', amount: 500 });
      const employee = anEmployee({ costCenter: 'core_engineering' });

      const result = await useCase.validate(expense, employee);

      expect(result.status).toBe('REJECTED');
      expect(result.reasons).toHaveLength(3);
      expect(result.reasons).toContain('AGE_LIMIT');
      expect(result.reasons).toContain('CATEGORY_LIMIT');
      expect(result.reasons).toContain('FORBIDDEN_CATEGORY_FOR_COST_CENTER');
    });
  });

  describe('when no rule applies beyond an approval', () => {
    it('approves when only the age rule applies', async () => {
      // Unlimited category + unrestricted cost center: only rule 1 applies.
      const useCase = useCaseWith();
      const expense = anExpense({ date: '2026-06-05', category: 'software', amount: 9999 });

      const result = await useCase.validate(expense, anEmployee());

      expect(result.status).toBe('APPROVED');
    });
  });

  describe('currency conversion', () => {
    it('evaluates category limits against the converted amount', async () => {
      // 100,000 CLP at 0.001 → 100 USD: exactly at food's approved limit.
      const useCase = useCaseWith({ USD: 1, CLP: 0.001 });
      const expense = anExpense({
        date: '2026-06-05',
        category: 'food',
        amount: 100_000,
        currency: 'CLP',
      });

      const result = await useCase.validate(expense, anEmployee());

      expect(result.status).toBe('APPROVED');
    });

    it('rounds the converted amount to cents before evaluating rules', async () => {
      // 1 CLP at rate 100.000000001 → 100.000000001: floating-point noise
      // must be rounded to 100.00 (approved), not treated as over the limit.
      const useCase = useCaseWith({ USD: 1, CLP: 100.000000001 });
      const expense = anExpense({
        date: '2026-06-05',
        category: 'food',
        amount: 1,
        currency: 'CLP',
      });

      const result = await useCase.validate(expense, anEmployee());

      expect(result.status).toBe('APPROVED');
    });

    it('does not call the rate provider when the expense is already in the base currency', async () => {
      let calls = 0;
      const countingProvider: RateProvider = {
        getRate: () => {
          calls += 1;
          return Promise.resolve(1);
        },
      };
      const useCase = new ValidateExpenseUseCase(
        aPolicy(),
        [new AgeRule()],
        countingProvider,
        clock,
      );

      await useCase.validate(anExpense({ currency: 'USD', date: '2026-06-05' }), anEmployee());

      expect(calls).toBe(0);
    });
  });

  describe('when the rate provider fails', () => {
    it('propagates a clear error instead of producing a silent verdict', async () => {
      const useCase = useCaseWith({ USD: 1 }); // no CLP rate
      const expense = anExpense({ currency: 'CLP', date: '2026-06-05' });

      await expect(useCase.validate(expense, anEmployee())).rejects.toThrow(/CLP/);
    });
  });
});
