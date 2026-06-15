import type { ValidationResult } from '../../../application/ports/expense-validator.js';
import type { Status } from '../../../domain/models/status.js';
import type { Employee } from '../../../domain/models/employee.js';
import type { Expense } from '../../../domain/models/expense.js';
import type { Policy } from '../../../domain/models/policy.js';
import type { RuleViolationReason } from '../../../domain/models/rule-violation-reason.js';

export type PresentedAlert = { codigo: string; mensaje: string };
export type PresentedResult = {
  gasto_id: string;
  status: string;
  alertas: PresentedAlert[];
};

const STATUS_ES: Record<Status, string> = {
  APPROVED: 'APROBADO',
  PENDING: 'PENDIENTE',
  REJECTED: 'RECHAZADO',
};

type AlertContext = { expense: Expense; employee: Employee; policy: Policy };

const ALERTS: Record<
  RuleViolationReason,
  { codigo: string; mensaje: (ctx: AlertContext) => string }
> = {
  AGE_LIMIT: {
    codigo: 'LIMITE_ANTIGUEDAD',
    mensaje: (ctx) =>
      `Gasto excede los ${ctx.policy.ageLimits.pendingDays} días. Requiere revisión.`,
  },
  CATEGORY_LIMIT: {
    codigo: 'LIMITE_CATEGORIA',
    mensaje: (ctx) =>
      `Gasto de '${ctx.expense.category}' excede el límite aprobado de la categoría.`,
  },
  FORBIDDEN_CATEGORY_FOR_COST_CENTER: {
    codigo: 'POLITICA_CENTRO_COSTO',
    mensaje: (ctx) =>
      `El C.C. '${ctx.employee.costCenter}' no puede reportar '${ctx.expense.category}'.`,
  },
};

export function presentResult(
  result: ValidationResult,
  expense: Expense,
  employee: Employee,
  policy: Policy,
): PresentedResult {
  const ctx: AlertContext = { expense, employee, policy };

  return {
    gasto_id: result.expenseId,
    status: STATUS_ES[result.status],
    alertas: result.reasons.map((reason) => ({
      codigo: ALERTS[reason].codigo,
      mensaje: ALERTS[reason].mensaje(ctx),
    })),
  };
}
