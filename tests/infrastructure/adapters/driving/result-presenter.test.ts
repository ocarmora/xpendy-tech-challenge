import { describe, it, expect } from 'vitest';
import { presentResult } from '../../../../src/infrastructure/adapters/driving/result-presenter.js';
import type { ValidationResult } from '../../../../src/application/ports/expense-validator.js';
import { anExpense, anEmployee, aPolicy } from '../../../helpers/builders.js';

describe('presentResult', () => {
  it('maps an approved result to the Spanish contract with no alerts', () => {
    const result: ValidationResult = { expenseId: 'g_125', status: 'APPROVED', reasons: [] };

    const presented = presentResult(result, anExpense(), anEmployee(), aPolicy());

    expect(presented).toEqual({ gasto_id: 'g_125', status: 'APROBADO', alertas: [] });
  });

  it('uses gasto_id and translates the status', () => {
    const result: ValidationResult = { expenseId: 'g_007', status: 'PENDING', reasons: [] };

    const presented = presentResult(result, anExpense(), anEmployee(), aPolicy());

    expect(presented.gasto_id).toBe('g_007');
    expect(presented.status).toBe('PENDIENTE');
  });

  it('renders the age-limit alert with the policy threshold', () => {
    const result: ValidationResult = {
      expenseId: 'g_123',
      status: 'PENDING',
      reasons: ['AGE_LIMIT'],
    };

    const presented = presentResult(
      result,
      anExpense(),
      anEmployee(),
      aPolicy({ ageLimits: { pendingDays: 30, rejectedDays: 60 } }),
    );

    expect(presented.alertas).toEqual([
      { codigo: 'LIMITE_ANTIGUEDAD', mensaje: 'Gasto excede los 30 días. Requiere revisión.' },
    ]);
  });

  it('renders the cost-center alert interpolating cost center and category', () => {
    const result: ValidationResult = {
      expenseId: 'g_124',
      status: 'REJECTED',
      reasons: ['FORBIDDEN_CATEGORY_FOR_COST_CENTER'],
    };

    const presented = presentResult(
      result,
      anExpense({ category: 'food' }),
      anEmployee({ costCenter: 'core_engineering' }),
      aPolicy(),
    );

    expect(presented.status).toBe('RECHAZADO');
    expect(presented.alertas).toEqual([
      {
        codigo: 'POLITICA_CENTRO_COSTO',
        mensaje: "El C.C. 'core_engineering' no puede reportar 'food'.",
      },
    ]);
  });

  it('maps the category-limit code', () => {
    const result: ValidationResult = {
      expenseId: 'g_200',
      status: 'REJECTED',
      reasons: ['CATEGORY_LIMIT'],
    };

    const presented = presentResult(
      result,
      anExpense({ category: 'food' }),
      anEmployee(),
      aPolicy(),
    );

    expect(presented.alertas[0]?.codigo).toBe('LIMITE_CATEGORIA');
  });

  it('renders every accumulated alert', () => {
    const result: ValidationResult = {
      expenseId: 'g_300',
      status: 'REJECTED',
      reasons: ['AGE_LIMIT', 'CATEGORY_LIMIT', 'FORBIDDEN_CATEGORY_FOR_COST_CENTER'],
    };

    const presented = presentResult(result, anExpense(), anEmployee(), aPolicy());

    expect(presented.alertas).toHaveLength(3);
  });
});
