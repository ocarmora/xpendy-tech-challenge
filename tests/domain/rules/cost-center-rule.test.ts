import { describe, it, expect } from 'vitest';
import {
  anEmployee,
  anExpense,
  anEvaluationContext,
  aPolicy,
  reasonOf,
} from '../../helpers/builders.js';
import { CostCenterRule } from '../../../src/domain/rules/cost-center-rule.js';

function contextWith(expenseCategory: string, employeeCostCenter: string) {
  return anEvaluationContext({
    expense: anExpense({ category: expenseCategory }),
    employee: anEmployee({ costCenter: employeeCostCenter }),
    amountInBaseCurrency: 10,
  });
}

describe('CostCenterRule', () => {
  const rule = new CostCenterRule();

  describe("when the expense category is forbidden for the employee's cost center", () => {
    it('rejects the expense', () => {
      const context = contextWith('food', 'core_engineering');

      const result = rule.evaluate(context);

      expect(result?.status).toBe('REJECTED');
    });

    it('reports the forbidden category as the reason', () => {
      const context = contextWith('food', 'core_engineering');

      const result = rule.evaluate(context);

      expect(reasonOf(result)).toBe('FORBIDDEN_CATEGORY_FOR_COST_CENTER');
    });
  });

  describe('when the pair does not match any restriction', () => {
    it('does not apply for a cost center without restrictions', () => {
      const context = contextWith('food', 'people');

      const result = rule.evaluate(context);

      expect(result).toBeNull();
    });

    it('does not apply for a restricted cost center spending on a non-forbidden category', () => {
      const context = contextWith('transport', 'core_engineering');

      const result = rule.evaluate(context);

      expect(result).toBeNull();
    });
  });

  describe('when the policy defines multiple cost-center restrictions', () => {
    it('rejects a match that is not the first entry in the list', () => {
      const context = anEvaluationContext({
        expense: anExpense({ category: 'travel' }),
        employee: anEmployee({ costCenter: 'people' }),
        policy: aPolicy({
          costCenterRules: [
            { costCenter: 'core_engineering', forbiddenCategory: 'food' },
            { costCenter: 'people', forbiddenCategory: 'travel' },
          ],
        }),
        amountInBaseCurrency: 10,
      });

      const result = rule.evaluate(context);

      expect(result?.status).toBe('REJECTED');
    });

    it('rejects when the same cost center has multiple restrictions and a later one matches', () => {
      // Guards against matching only the first entry for a cost center:
      // the rule must search for the exact (costCenter, category) pair,
      // not "the entry of that cost center".
      const context = anEvaluationContext({
        expense: anExpense({ category: 'travel' }),
        employee: anEmployee({ costCenter: 'core_engineering' }),
        policy: aPolicy({
          costCenterRules: [
            { costCenter: 'core_engineering', forbiddenCategory: 'food' },
            { costCenter: 'core_engineering', forbiddenCategory: 'travel' },
          ],
        }),
        amountInBaseCurrency: 10,
      });

      const result = rule.evaluate(context);

      expect(result?.status).toBe('REJECTED');
    });
  });
});
