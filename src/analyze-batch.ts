import 'dotenv/config';
import path from 'node:path';
import { loadPolicyFile } from './infrastructure/adapters/driven/config/load-policy-file.js';
import { loadExpensesCsv } from './infrastructure/adapters/driven/csv/load-expenses-csv.js';
import { parseExpense } from './infrastructure/adapters/driving/parse-expense.js';
import { parseEmployee } from './infrastructure/adapters/driving/parse-employee.js';
import { buildExpenseValidator, buildRateProvider } from './compose.js';
import { analyzeBatch, type ExpenseEntry } from './application/analyze-batch.use-case.js';

type InvalidRow = { row: number; error: string };

/**
 * Batch analyzer entrypoint: loads the historical CSV, parses each row at the
 * boundary (collecting the rows that fail), validates the valid ones against the
 * policy using the real exchange-rate provider, and prints the status breakdown
 * plus detected anomalies.
 */
async function main(): Promise<void> {
  const policyPath = process.env.POLICY_PATH ?? path.join(process.cwd(), 'config', 'policy.json');
  const csvPath = process.env.CSV_PATH ?? path.join(process.cwd(), 'data', 'gastos_historicos.csv');

  const policy = await loadPolicyFile(policyPath);
  const rows = await loadExpensesCsv(csvPath);

  const entries: ExpenseEntry[] = [];
  const invalidRows: InvalidRow[] = [];

  rows.forEach((row, index) => {
    try {
      entries.push({
        expense: parseExpense(row.expense),
        employee: parseEmployee(row.employee),
      });
    } catch (error: unknown) {
      invalidRows.push({
        row: index + 2, // +1 for the header, +1 for 1-based numbering
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const validator = buildExpenseValidator(policy, buildRateProvider(policy));
  const report = await analyzeBatch(entries, validator);

  console.log(
    JSON.stringify(
      {
        total: rows.length,
        parsed: entries.length,
        invalid: invalidRows.length,
        invalidRows,
        breakdown: report.breakdown,
        anomalies: report.anomalies,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
