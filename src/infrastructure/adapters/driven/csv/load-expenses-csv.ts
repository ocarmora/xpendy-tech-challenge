import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';

/**
 * One CSV row mapped to the raw input shapes expected by the boundary parsers.
 * Values stay untrusted here — validation/normalization happens in parseExpense
 * and parseEmployee, not in this reader.
 */
export type RawExpenseRow = {
  expense: unknown;
  employee: unknown;
};

type CsvRecord = Record<string, string>;

/**
 * Reads the historical-expenses CSV and maps each row to the raw expense and
 * employee inputs. File I/O and column mapping live here; the domain and the
 * validation rules stay unaware of the CSV format.
 */
export async function loadExpensesCsv(path: string): Promise<RawExpenseRow[]> {
  const content = await readFile(path, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as unknown as CsvRecord[];

  return records.map((row) => ({
    expense: {
      id: row.gasto_id,
      amount: Number(row.monto),
      currency: row.moneda,
      date: row.fecha,
      category: row.categoria,
    },
    employee: {
      id: row.empleado_id,
      firstName: row.empleado_nombre,
      lastName: row.empleado_apellido,
      costCenter: row.empleado_cost_center,
    },
  }));
}
