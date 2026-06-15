import 'dotenv/config';
import path from 'node:path';
import { loadPolicyFile } from './infrastructure/adapters/driven/config/load-policy-file.js';
import { parseExpense } from './infrastructure/adapters/driving/parse-expense.js';
import { parseEmployee } from './infrastructure/adapters/driving/parse-employee.js';
import { buildExpenseValidator, buildRateProvider } from './compose.js';
import { presentResult } from './infrastructure/adapters/driving/result-presenter.js';

/**
 * Loads the policy from config, builds the validator with the real exchange-rate
 * provider, and validates one expense end-to-end. The sample expense is in CLP
 * to exercise the live currency conversion.
 */
async function main(): Promise<void> {
  const policyPath = process.env.POLICY_PATH ?? path.join(process.cwd(), 'config', 'policy.json');
  const policy = await loadPolicyFile(policyPath);

  const validator = buildExpenseValidator(policy, buildRateProvider(policy));

  const expense = parseExpense({
    id: 'g_001',
    amount: 90000,
    currency: 'CLP',
    date: '2026-06-01',
    category: 'food',
  });
  const employee = parseEmployee({
    id: 'e_001',
    firstName: 'Ada',
    lastName: 'Lovelace',
    costCenter: 'sales_team',
  });

  const result = await validator.validate(expense, employee);
  const presented = presentResult(result, expense, employee, policy);

  console.log(JSON.stringify(presented, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
