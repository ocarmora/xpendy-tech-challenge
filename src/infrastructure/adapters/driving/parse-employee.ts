import { z } from 'zod';
import type { Employee } from '../../../domain/models/employee.js';

const EmployeeSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  costCenter: z.string().trim().toLowerCase().min(1),
});

/** Parses untrusted input into a normalized, valid Employee. */
export function parseEmployee(raw: unknown): Employee {
  return EmployeeSchema.parse(raw);
}
