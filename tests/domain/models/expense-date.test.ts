import { describe, it, expect } from 'vitest';
import { ExpenseDate } from '../../../src/domain/models/expense-date.js';

const TODAY = new Date('2026-06-10T00:00:00Z');

describe('ExpenseDate', () => {
  describe('fromIso', () => {
    it('should create an instance from a valid ISO date string', () => {
      const expenseDate = ExpenseDate.fromIso('2026-06-10');

      expect(expenseDate).toBeInstanceOf(ExpenseDate);
    });

    it('should throw when given a malformed date string', () => {
      expect(() => ExpenseDate.fromIso('10-06-2026')).toThrow();
    });

    it('should throw when given a well-formed but impossible date', () => {
      expect(() => ExpenseDate.fromIso('2026-02-30')).toThrow();
    });
  });

  describe('isValid', () => {
    it('should be true for a real calendar date', () => {
      expect(ExpenseDate.isValid('2026-06-10')).toBe(true);
    });

    it('should be false for a well-formed but impossible date', () => {
      expect(ExpenseDate.isValid('2026-02-30')).toBe(false);
    });

    it('should be false for a malformed string', () => {
      expect(ExpenseDate.isValid('10-06-2026')).toBe(false);
    });
  });

  describe('daysOld', () => {
    it('should return 0 when the expense date is today', () => {
      const expenseDate = ExpenseDate.fromIso('2026-06-10');

      const days = expenseDate.daysOld(TODAY);

      expect(days).toBe(0);
    });

    it('should return the exact number of elapsed calendar days', () => {
      const expenseDate = ExpenseDate.fromIso('2026-05-11'); // 30 days before TODAY

      const days = expenseDate.daysOld(TODAY);

      expect(days).toBe(30);
    });

    it('should return a negative number when the expense date is in the future', () => {
      const expenseDate = ExpenseDate.fromIso('2026-06-15');

      const days = expenseDate.daysOld(TODAY);

      expect(days).toBe(-5);
    });

    it('should count calendar days in UTC regardless of the time of day', () => {
      const expenseDate = ExpenseDate.fromIso('2026-06-09');
      const lateEveningToday = new Date('2026-06-10T23:59:00Z');

      const days = expenseDate.daysOld(lateEveningToday);

      expect(days).toBe(1);
    });
  });

  describe('isFuture', () => {
    it('should be false when the expense date is today', () => {
      const expenseDate = ExpenseDate.fromIso('2026-06-10');

      expect(expenseDate.isFuture(TODAY)).toBe(false);
    });

    it('should be false when the expense date is before today', () => {
      const expenseDate = ExpenseDate.fromIso('2026-06-09');

      expect(expenseDate.isFuture(TODAY)).toBe(false);
    });

    it('should be true when the expense date is after today', () => {
      const expenseDate = ExpenseDate.fromIso('2026-06-11');

      expect(expenseDate.isFuture(TODAY)).toBe(true);
    });
  });
});
